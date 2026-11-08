/* Trading 212 link (read-only). The key and secret are Worker secrets (T212_API_KEY, T212_API_SECRET),
   made in the Trading 212 app with only the read permissions ticked, so nothing here can place or
   cancel an order: the site only ever sends GET requests to Trading 212. T212_ENV picks the practice
   ("demo", the default) or the real ("live") account; a key only works on the account it was made in.
   Orders are copied into D1 so the trading journal keeps them, with Alex's own notes beside them. */

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

const envName = env => (String(env.T212_ENV || "demo").trim().toLowerCase() === "live" ? "live" : "demo");
const configured = env => !!String(env.T212_API_KEY || "").trim();

async function tables(env) {
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS t212_cache (k TEXT PRIMARY KEY, v TEXT, at INTEGER)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS t212_orders (id TEXT PRIMARY KEY, env TEXT, at TEXT, data TEXT)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS t212_journal (id TEXT PRIMARY KEY, env TEXT, ticker TEXT, date TEXT, decision TEXT, thesis TEXT, sell_rule TEXT, lesson TEXT, updated INTEGER)"),
  ]);
}
async function cached(env, k, ttl, fetcher) {
  const r = await env.DB.prepare("SELECT v, at FROM t212_cache WHERE k = ?").bind(k).first();
  if (r && Date.now() - r.at < ttl) return { ...JSON.parse(r.v), at: r.at };
  try {
    const v = await fetcher();
    await env.DB.prepare("INSERT OR REPLACE INTO t212_cache (k, v, at) VALUES (?, ?, ?)").bind(k, JSON.stringify(v), Date.now()).run();
    return { ...v, at: Date.now() };
  } catch (e) {
    if (r) return { ...JSON.parse(r.v), at: r.at, stale: true, error: e.message };
    throw e;
  }
}

async function t212(env, path) {
  const key = String(env.T212_API_KEY).trim(), secret = String(env.T212_API_SECRET || "").trim();
  // keys made since 2025 come with a secret (HTTP Basic); older keys are sent on their own
  const auth = secret ? "Basic " + btoa(`${key}:${secret}`) : key;
  const res = await fetch(`https://${envName(env)}.trading212.com${path}`, { headers: { Authorization: auth, Accept: "application/json" } });
  if (res.status === 401) throw Object.assign(new Error(`Trading 212 didn't accept the key. Check it was made in the ${envName(env) === "demo" ? "practice" : "real-money"} account.`), { code: 401 });
  if (res.status === 403) throw Object.assign(new Error("The key is missing a permission. It needs account data, portfolio and history."), { code: 403 });
  if (res.status === 429) throw Object.assign(new Error("Trading 212's rate limit was hit. Try again in a minute."), { code: 429 });
  if (!res.ok) throw Object.assign(new Error("Trading 212 error " + res.status), { code: res.status });
  return res.json();
}

const symOf = t => String(t || "").split("_")[0].replace(/[a-z]+$/, "");
const num = x => (x == null || x === "" || !isFinite(Number(x)) ? null : Number(x));

async function account(env) {
  return cached(env, envName(env) + ":account", 60000, async () => {
    const s = await t212(env, "/api/v0/equity/account/summary");
    const p = await t212(env, "/api/v0/equity/positions");
    const cash = s.cash || {}, inv = s.investments || {};
    return {
      currency: s.currency || "GBP",
      totalValue: num(s.totalValue), cash: num(cash.availableToTrade), reserved: num(cash.reservedForOrders),
      invested: num(inv.currentValue), cost: num(inv.totalCost), realised: num(inv.realizedProfitLoss), unrealised: num(inv.unrealizedProfitLoss),
      positions: (Array.isArray(p) ? p : p.items || []).map(x => {
        const ins = x.instrument || {}, w = x.walletImpact || {};
        return { ticker: ins.ticker || x.ticker, symbol: symOf(ins.ticker || x.ticker), name: ins.name || "", currency: ins.currency || "",
          quantity: num(x.quantity), avgPrice: num(x.averagePricePaid), price: num(x.currentPrice), opened: x.createdAt || "",
          value: num(w.currentValue), cost: num(w.totalCost), pnl: num(w.unrealizedProfitLoss), fx: num(w.fxImpact) };
      }),
    };
  });
}

// newest pages first, stopping at orders already saved; at most 6 pages (300 orders) a call
async function syncOrders(env) {
  const e = envName(env);
  const last = await env.DB.prepare("SELECT at FROM t212_cache WHERE k = ?").bind(e + ":orders-sync").first();
  if (last && Date.now() - last.at < 5 * 60000) return { synced: false };
  const known = new Set(((await env.DB.prepare("SELECT id FROM t212_orders WHERE env = ?").bind(e).all()).results || []).map(r => r.id));
  let path = "/api/v0/equity/history/orders?limit=50", added = 0;
  for (let page = 0; page < 6 && path; page++) {
    const body = await t212(env, path);
    const stmts = [];
    let seenOld = false;
    for (const it of body.items || []) {
      const o = it.order || it, f = it.fill || {};
      const id = String(o.id != null ? o.id : f.id);
      if (known.has(id)) { seenOld = true; continue; }
      const ins = o.instrument || {}, w = f.walletImpact || {};
      const fees = (w.taxes || []).reduce((a, t) => a + (Number(t.quantity) || 0), 0);
      const row = { id, ticker: ins.ticker || o.ticker, symbol: symOf(ins.ticker || o.ticker), name: ins.name || "", type: o.type || "", side: o.side || (Number(o.quantity) < 0 ? "SELL" : "BUY"),
        status: o.status || "", quantity: Math.abs(num(f.quantity) ?? num(o.filledQuantity) ?? num(o.quantity) ?? 0), price: num(f.price) ?? num(o.limitPrice), currency: ins.currency || "",
        value: num(w.netValue), fees: Math.round(fees * 100) / 100, pnl: num(w.realisedProfitLoss), at: f.filledAt || o.createdAt || "" };
      stmts.push(env.DB.prepare("INSERT OR REPLACE INTO t212_orders (id, env, at, data) VALUES (?, ?, ?, ?)").bind(id, e, row.at, JSON.stringify(row)));
      added++;
    }
    if (stmts.length) await env.DB.batch(stmts);
    if (seenOld) break;
    path = body.nextPagePath || null;
  }
  await env.DB.prepare("INSERT OR REPLACE INTO t212_cache (k, v, at) VALUES (?, ?, ?)").bind(e + ":orders-sync", "{}", Date.now()).run();
  return { synced: true, added };
}

export async function t212Api(request, env, url) {
  await tables(env);
  const p = url.pathname.slice("/api/t212/".length), e = envName(env);
  try {
    if (p === "status") return json({ configured: configured(env), env: e });
    if (!configured(env)) return json({ error: "nokey", env: e });
    if (p === "account") return json(await account(env));
    if (p === "orders") {
      let sync = null, syncError = null;
      try { sync = await syncOrders(env); } catch (err) { syncError = err.message; }
      const rows = (await env.DB.prepare("SELECT data FROM t212_orders WHERE env = ? ORDER BY at DESC LIMIT 1000").bind(e).all()).results || [];
      return json({ orders: rows.map(r => JSON.parse(r.data)), sync, syncError });
    }
    if (p === "journal" && request.method === "GET") {
      const rows = (await env.DB.prepare("SELECT * FROM t212_journal WHERE env = ? ORDER BY date DESC, updated DESC").bind(e).all()).results || [];
      return json({ entries: rows });
    }
    if (p === "journal" && (request.method === "PUT" || request.method === "POST")) {
      const b = await request.json().catch(() => ({}));
      const clip = (s, n) => String(s || "").slice(0, n);
      const id = clip(b.id, 60) || "m-" + Date.now();
      if (b.delete) { await env.DB.prepare("DELETE FROM t212_journal WHERE id = ? AND env = ?").bind(id, e).run(); return json({ ok: true }); }
      await env.DB.prepare("INSERT OR REPLACE INTO t212_journal (id, env, ticker, date, decision, thesis, sell_rule, lesson, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(id, e, clip(b.ticker, 20).toUpperCase(), clip(b.date, 10), clip(b.decision, 20), clip(b.thesis, 2000), clip(b.sell_rule, 1000), clip(b.lesson, 2000), Date.now()).run();
      return json({ ok: true, id });
    }
    return json({ error: "not found" }, 404);
  } catch (err) {
    return json({ error: "upstream", message: err.message, code: err.code || 0 }, 502);
  }
}
