/* The live watchlist (Biotech Investing). Prices come from Twelve Data through this Worker, so the key
   stays a Worker secret (TWELVE_DATA_KEY) and never reaches the page. Updates (trial changes, papers,
   news) are collected once a day by the cron in wrangler.toml, and when the page asks for a refresh,
   and kept in D1. The companies and the hand-written key events are in data/watchlist.json. */
import CFG from "../data/watchlist.json";

const TD = "https://api.twelvedata.com";
const UA = "BiomedVault-watchlist/1.0 (personal study site)";
const DAY = 86400000;
const REFRESH_GAP = 15 * 60000;          // a page-triggered refresh at most every 15 minutes
const SYMBOLS = CFG.companies.map(c => c.symbol);

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const today = () => new Date().toISOString().slice(0, 10);

async function tables(env) {
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS inv_cache (k TEXT PRIMARY KEY, v TEXT, at INTEGER)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS inv_events (id TEXT PRIMARY KEY, symbol TEXT, date TEXT, type TEXT, title TEXT, detail TEXT, url TEXT, source TEXT, added INTEGER)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS inv_trials (nct TEXT PRIMARY KEY, symbol TEXT, status TEXT, last_update TEXT, title TEXT)"),
  ]);
}
async function cacheGet(env, k) {
  const r = await env.DB.prepare("SELECT v, at FROM inv_cache WHERE k = ?").bind(k).first();
  return r ? { v: JSON.parse(r.v), at: r.at } : null;
}
const cachePut = (env, k, v) => env.DB.prepare("INSERT OR REPLACE INTO inv_cache (k, v, at) VALUES (?, ?, ?)").bind(k, JSON.stringify(v), Date.now()).run();

/* ------------------------------------------------------------ prices */
async function twelve(env, path, params) {
  const u = new URL(TD + path);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set("apikey", String(env.TWELVE_DATA_KEY).trim());
  const res = await fetch(u.toString(), { headers: { "User-Agent": UA } });
  const body = await res.json().catch(() => ({ status: "error", message: "Bad reply from Twelve Data" }));
  if (!res.ok || body.status === "error") throw Object.assign(new Error(body.message || "Twelve Data error " + res.status), { code: body.code || res.status });
  return body;
}
const num = x => (x == null || x === "" ? null : Number(x));
function quoteOf(q) {
  const w = q.fifty_two_week || {};
  return {
    price: num(q.close), prev: num(q.previous_close), change: num(q.change), pct: num(q.percent_change),
    open: num(q.open), high: num(q.high), low: num(q.low), volume: num(q.volume), avgVolume: num(q.average_volume),
    low52: num(w.low), high52: num(w.high), currency: q.currency || "USD", exchange: q.exchange || "",
    marketOpen: !!q.is_market_open, asOf: q.datetime || "", ts: num(q.timestamp),
  };
}
async function quotes(env) {
  const hit = await cacheGet(env, "quotes");
  const anyOpen = hit && Object.values(hit.v).some(q => q && q.marketOpen);
  const ttl = !hit || anyOpen ? 5 * 60000 : 30 * 60000;
  if (hit && Date.now() - hit.at < ttl) return { quotes: hit.v, at: hit.at };
  try {
    const body = await twelve(env, "/quote", { symbol: SYMBOLS.join(",") });
    const out = {};
    for (const s of SYMBOLS) {
      const q = SYMBOLS.length === 1 ? body : body[s];
      out[s] = q && q.status !== "error" && q.close != null ? quoteOf(q) : null;
    }
    await cachePut(env, "quotes", out);
    return { quotes: out, at: Date.now() };
  } catch (e) {
    if (hit) return { quotes: hit.v, at: hit.at, stale: true, error: e.message };
    throw e;
  }
}
const RANGES = {
  "1d": { interval: "5min", outputsize: 80, ttl: 5 * 60000 },
  "1m": { interval: "1day", outputsize: 23, ttl: 3 * 3600000 },
  "6m": { interval: "1day", outputsize: 128, ttl: 3 * 3600000 },
  "1y": { interval: "1day", outputsize: 253, ttl: 3 * 3600000 },
  "5y": { interval: "1week", outputsize: 262, ttl: 12 * 3600000 },
};
async function series(env, sym, range) {
  const r = RANGES[range];
  const key = `series:${sym}:${range}`;
  const hit = await cacheGet(env, key);
  if (hit && Date.now() - hit.at < r.ttl) return { ...hit.v, at: hit.at };
  try {
    const body = await twelve(env, "/time_series", { symbol: sym, interval: r.interval, outputsize: String(r.outputsize), order: "ASC" });
    const points = (body.values || []).map(v => [v.datetime, Number(v.close)]).filter(p => isFinite(p[1]));
    points.sort((a, b) => (a[0] < b[0] ? -1 : 1));
    const v = { symbol: sym, range, interval: r.interval, tz: (body.meta && body.meta.exchange_timezone) || "", points };
    await cachePut(env, key, v);
    return { ...v, at: Date.now() };
  } catch (e) {
    if (hit) return { ...hit.v, at: hit.at, stale: true, error: e.message };
    throw e;
  }
}

/* ------------------------------------------------------------ updates */
async function hashId(s) {
  const d = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
}
const evStmt = (env, replace, e) => env.DB.prepare(`INSERT OR ${replace ? "REPLACE" : "IGNORE"} INTO inv_events (id, symbol, date, type, title, detail, url, source, added) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .bind(e.id, e.symbol, e.date, e.type, e.title.slice(0, 300), (e.detail || "").slice(0, 1200), e.url || "", e.source || "", Date.now());

// "2026-08", "2026-08-10" or "August 2026" → YYYY-MM-DD
function isoDate(s) {
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{4}-\d{2}$/.test(s)) return s + "-01";
  const d = new Date(s);
  return isNaN(d) ? "" : d.toISOString().slice(0, 10);
}
const STATUS = { RECRUITING: "Recruiting", NOT_YET_RECRUITING: "Not yet recruiting", ACTIVE_NOT_RECRUITING: "Active, not recruiting", COMPLETED: "Completed", TERMINATED: "Terminated", SUSPENDED: "Suspended", WITHDRAWN: "Withdrawn", ENROLLING_BY_INVITATION: "Enrolling by invitation", UNKNOWN: "Unknown" };
const nice = s => STATUS[s] || String(s || "").toLowerCase().replace(/_/g, " ");

async function trialsFor(env, c, first) {
  const u = new URL("https://clinicaltrials.gov/api/v2/studies");
  u.searchParams.set("query.spons", c.sponsor);
  u.searchParams.set("query.cond", "cystic fibrosis");
  u.searchParams.set("pageSize", "40");
  u.searchParams.set("sort", "LastUpdatePostDate:desc");
  const res = await fetch(u.toString(), { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error("ClinicalTrials.gov " + res.status);
  const body = await res.json();
  const known = new Map(((await env.DB.prepare("SELECT nct, status FROM inv_trials WHERE symbol = ?").bind(c.symbol).all()).results || []).map(r => [r.nct, r.status]));
  const stmts = [];
  const minDate = new Date(Date.now() - 8 * 365 * DAY).toISOString().slice(0, 10);
  for (const st of body.studies || []) {
    const p = st.protocolSection || {};
    const idm = p.identificationModule || {}, sm = p.statusModule || {}, dm = p.designModule || {};
    const nct = idm.nctId; if (!nct) continue;
    const title = idm.briefTitle || nct;
    const phase = (dm.phases || []).map(x => x.replace("PHASE", "Phase ").replace("EARLY_", "Early ")).join("/").replace("NA", "") || "";
    const status = sm.overallStatus || "";
    const upd = isoDate(sm.lastUpdatePostDateStruct && sm.lastUpdatePostDateStruct.date) || today();
    const url = `https://clinicaltrials.gov/study/${nct}`;
    const tag = `${nct}${phase ? " · " + phase : ""}`;
    const start = isoDate(sm.startDateStruct && sm.startDateStruct.date);
    if (start && start >= minDate && sm.startDateStruct.type !== "ESTIMATED" && start <= today())
      stmts.push(evStmt(env, true, { id: `ct:${nct}:start`, symbol: c.symbol, date: start, type: "trial", title: `Trial started: ${title}`, detail: tag, url, source: "ClinicalTrials.gov" }));
    const res1 = isoDate(sm.resultsFirstPostDateStruct && sm.resultsFirstPostDateStruct.date);
    if (res1) stmts.push(evStmt(env, true, { id: `ct:${nct}:results`, symbol: c.symbol, date: res1, type: "trial", title: `Results posted: ${title}`, detail: tag, url, source: "ClinicalTrials.gov" }));
    const pc = sm.primaryCompletionDateStruct || {};
    const pcd = isoDate(pc.date);
    if (pcd && pcd > today() && ["RECRUITING", "ACTIVE_NOT_RECRUITING", "NOT_YET_RECRUITING", "ENROLLING_BY_INVITATION"].includes(status))
      stmts.push(evStmt(env, true, { id: `ct:${nct}:pc`, symbol: c.symbol, date: pcd, type: "catalyst", title: `Primary completion${pc.type === "ESTIMATED" ? " (estimated)" : ""}: ${title}`, detail: `${tag}. The main results usually follow some months after this date.`, url, source: "ClinicalTrials.gov" }));
    else stmts.push(env.DB.prepare("DELETE FROM inv_events WHERE id = ?").bind(`ct:${nct}:pc`));
    const was = known.get(nct);
    if (!first && was === undefined)
      stmts.push(evStmt(env, false, { id: `ct:${nct}:new`, symbol: c.symbol, date: upd, type: "trial", title: `New trial listed: ${title}`, detail: `${tag} · ${nice(status)}`, url, source: "ClinicalTrials.gov" }));
    else if (was !== undefined && was !== status)
      stmts.push(evStmt(env, false, { id: `ct:${nct}:${status}`, symbol: c.symbol, date: upd, type: "trial", title: `Trial now ${nice(status).toLowerCase()}: ${title}`, detail: `${tag} · was ${nice(was).toLowerCase()}`, url, source: "ClinicalTrials.gov" }));
    stmts.push(env.DB.prepare("INSERT OR REPLACE INTO inv_trials (nct, symbol, status, last_update, title) VALUES (?, ?, ?, ?, ?)").bind(nct, c.symbol, status, upd, title));
  }
  if (stmts.length) await env.DB.batch(stmts);
  return (body.studies || []).length;
}

async function papersFor(env, c, first) {
  const base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
  const s = new URL(base + "esearch.fcgi");
  for (const [k, v] of Object.entries({ db: "pubmed", term: c.pubmed, retmode: "json", retmax: first ? "20" : "10", sort: "pub_date", datetype: "edat", reldate: first ? "730" : "60", tool: "biomedvault" })) s.searchParams.set(k, v);
  const r1 = await fetch(s.toString(), { headers: { "User-Agent": UA } });
  if (!r1.ok) throw new Error("PubMed " + r1.status);
  const ids = (((await r1.json()).esearchresult || {}).idlist || []);
  if (!ids.length) return 0;
  const m = new URL(base + "esummary.fcgi");
  for (const [k, v] of Object.entries({ db: "pubmed", id: ids.join(","), retmode: "json", tool: "biomedvault" })) m.searchParams.set(k, v);
  const r2 = await fetch(m.toString(), { headers: { "User-Agent": UA } });
  if (!r2.ok) throw new Error("PubMed " + r2.status);
  const res = (await r2.json()).result || {};
  const stmts = [];
  for (const id of res.uids || ids) {
    const a = res[id]; if (!a || !a.title) continue;
    const date = isoDate((a.sortpubdate || "").replace(/\//g, "-").slice(0, 10)) || isoDate(a.pubdate);
    if (!date) continue;
    const au = (a.authors || []).map(x => x.name);
    const who = au.length ? au[0] + (au.length > 1 ? " et al." : "") : "";
    stmts.push(evStmt(env, false, { id: "pm:" + id, symbol: c.symbol, date, type: "paper", title: a.title.replace(/<[^>]+>/g, ""), detail: [who, a.source, a.pubtype && a.pubtype.includes("Review") ? "review" : ""].filter(Boolean).join(" · "), url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`, source: "PubMed" }));
  }
  if (stmts.length) await env.DB.batch(stmts);
  return stmts.length;
}

// shareholder-lawsuit adverts and paid promotions say nothing about the science
const JUNK = /investigat|class action|shareholder (alert|rights)|securities (fraud|claims|litigation)|law firm|pomerantz|rosen law|levi & korsinsky|robbins|bragar|faruqi|glancy|kessler topaz|suewallst|issued on behalf|sponsored|penny stock/i;
const unxml = s => String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ").trim();
const tagOf = (item, t) => { const m = item.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? unxml(m[1]) : ""; };

async function newsFor(env, c, first) {
  const q = c.news + (first ? "" : " when:14d");
  const u = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-GB&gl=GB&ceid=GB:en`;
  const res = await fetch(u, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error("News " + res.status);
  const xml = await res.text();
  const items = xml.split("<item>").slice(1).map(x => x.split("</item>")[0]);
  const stmts = [];
  const seen = new Set();
  for (const it of items.slice(0, 60)) {
    let title = tagOf(it, "title");
    const source = tagOf(it, "source");
    if (source && title.endsWith(" - " + source)) title = title.slice(0, -(source.length + 3));
    const low = title.toLowerCase();
    if (!title || JUNK.test(title) || JUNK.test(source)) continue;
    if (c.newsMust && !c.newsMust.some(w => low.includes(w))) continue;
    const date = isoDate(tagOf(it, "pubDate"));
    if (!date) continue;
    const key = low.replace(/[^a-z0-9]+/g, " ").trim().slice(0, 80);
    if (seen.has(key)) continue; seen.add(key);
    stmts.push(evStmt(env, false, { id: "gn:" + (await hashId(c.symbol + key)), symbol: c.symbol, date, type: "news", title, detail: "", url: tagOf(it, "link"), source: source || "News" }));
    if (stmts.length >= 25) break;
  }
  if (stmts.length) await env.DB.batch(stmts);
  return stmts.length;
}

async function seed(env) {
  const stmts = [];
  for (const e of CFG.events || []) stmts.push(evStmt(env, true, { ...e, id: "key:" + (await hashId(e.symbol + e.date + e.title)), url: e.url || "", source: e.source || "Watchlist notes" }));
  if (stmts.length) await env.DB.batch(stmts);
}

export async function refreshUpdates(env) {
  await tables(env);
  await seed(env);
  const last = await cacheGet(env, "refresh");
  const first = !last || !last.v.done;
  const report = {};
  // one company at a time keeps PubMed's three-a-second limit
  for (const c of CFG.companies) {
    const r = report[c.symbol] = {};
    for (const [k, f] of [["trials", trialsFor], ["papers", papersFor], ["news", newsFor]]) {
      try { r[k] = await f(env, c, first); } catch (e) { r[k] = "error: " + e.message; }
    }
  }
  const ok = Object.values(report).some(r => Object.values(r).some(v => typeof v === "number"));
  await cachePut(env, "refresh", { done: ok || !first, report });
  return report;
}

/* ------------------------------------------------------------ routes */
export async function investApi(request, env, url, ctx) {
  await tables(env);
  const p = url.pathname.slice("/api/invest/".length);
  const hasKey = !!String(env.TWELVE_DATA_KEY || "").trim();
  try {
    if (p === "status") {
      const last = await cacheGet(env, "refresh");
      const n = await env.DB.prepare("SELECT type, COUNT(*) AS n FROM inv_events GROUP BY type").all();
      return json({ hasKey, lastRefresh: last ? last.at : 0, report: last ? last.v.report : null, counts: Object.fromEntries((n.results || []).map(r => [r.type, r.n])) });
    }
    if (p === "quotes") {
      if (!hasKey) return json({ error: "nokey" }, 200);
      return json(await quotes(env));
    }
    if (p === "series") {
      if (!hasKey) return json({ error: "nokey" }, 200);
      const sym = (url.searchParams.get("s") || "").toUpperCase(), range = url.searchParams.get("r") || "1y";
      if (!SYMBOLS.includes(sym) || !RANGES[range]) return json({ error: "bad request" }, 400);
      return json(await series(env, sym, range));
    }
    if (p === "events") {
      const last = await cacheGet(env, "refresh");
      if (!last) { await seed(env); await cachePut(env, "refresh", { running: true }); ctx.waitUntil(refreshUpdates(env).catch(() => {})); }
      const sym = (url.searchParams.get("s") || "").toUpperCase();
      const rows = sym && SYMBOLS.includes(sym)
        ? await env.DB.prepare("SELECT * FROM inv_events WHERE symbol = ? ORDER BY date DESC LIMIT 400").bind(sym).all()
        : await env.DB.prepare("SELECT * FROM inv_events ORDER BY date DESC, added DESC LIMIT 600").all();
      return json({ events: rows.results || [], lastRefresh: last ? last.at : 0, refreshing: !last });
    }
    if (p === "refresh" && request.method === "POST") {
      const last = await cacheGet(env, "refresh");
      if (last && Date.now() - last.at < REFRESH_GAP) return json({ ok: true, skipped: true, lastRefresh: last.at });
      await cachePut(env, "refresh", { ...(last ? last.v : {}), running: true });   // stops a second tap starting another run
      const report = await refreshUpdates(env);
      return json({ ok: true, report, lastRefresh: Date.now() });
    }
    return json({ error: "not found" }, 404);
  } catch (e) {
    const limited = e.code === 429 || /credits|limit/i.test(e.message);
    return json({ error: limited ? "limit" : "upstream", message: e.message }, limited ? 429 : 502);
  }
}
