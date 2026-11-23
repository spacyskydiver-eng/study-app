/* SEC EDGAR: each company's newest filings and the key numbers from them, refreshed by the cron.
   Two jobs per company, run like the other watchlist jobs (a few per 15-minute tick):
   - filings: the company's filing list (data.sec.gov/submissions) → links to the latest 10-Q, 10-K,
     prospectus and 8-Ks, plus a feed event for each new report
   - facts:   a handful of XBRL figures (data.sec.gov/api/xbrl/companyconcept) → cash and investments,
     operating cash burn, latest quarter's net income and revenue, shares outstanding
   Small per-tag requests keep each job well inside the free plan's CPU limit. The SEC asks automated
   clients to name themselves and a contact in the User-Agent and to stay under 10 requests a second. */

const DAY = 86400000;
const ua = env => `BiomedVault personal study site ${String(env.SEC_CONTACT || "admin@alexbiomedstuff.bid").trim()}`;
const pad = cik => String(cik).replace(/\D/g, "").padStart(10, "0");

async function sec(env, url) {
  const res = await fetch(url, { headers: { "User-Agent": ua(env), Accept: "application/json,text/xml;q=0.9,*/*;q=0.5" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("SEC " + res.status);
  return res;
}
async function get(env, k) { const r = await env.DB.prepare("SELECT v, at FROM inv_cache WHERE k = ?").bind(k).first(); return r ? { v: JSON.parse(r.v), at: r.at } : null; }
const put = (env, k, v) => env.DB.prepare("INSERT OR REPLACE INTO inv_cache (k, v, at) VALUES (?, ?, ?)").bind(k, JSON.stringify(v), Date.now()).run();

// the company's CIK: from watchlist.json if given, otherwise looked up once by ticker and kept
export async function cikFor(env, c) {
  if (c.cik) return pad(c.cik);
  const hit = await get(env, "sec:cik:" + c.symbol);
  if (hit) return hit.v;
  const res = await sec(env, `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${encodeURIComponent(c.symbol)}&type=10-Q&dateb=&owner=include&count=1&output=atom`);
  const m = res && (await res.text()).match(/<cik>\s*(\d+)\s*<\/cik>/i);
  if (!m) throw new Error("no CIK for " + c.symbol);
  await put(env, "sec:cik:" + c.symbol, pad(m[1]));
  return pad(m[1]);
}

const KEEP = new Set(["10-Q", "10-K", "10-Q/A", "10-K/A", "20-F", "6-K", "8-K", "S-1", "S-1/A", "F-1", "F-1/A", "424B4", "DEF 14A"]);
const ABOUT = {
  "10-Q": "Quarterly report: financial statements, cash and spending, and recent developments",
  "10-K": "Annual report: the full year, with the business, pipeline and risk factors in full",
  "20-F": "Annual report of a non-US company",
  "6-K": "Report from a non-US company (results, news)",
  "8-K": "Current report: a major event (results, trial data, deals, management changes) filed within days",
  "S-1": "Registration statement (draft prospectus) for selling shares",
  "F-1": "Registration statement of a non-US company",
  "424B4": "Final prospectus with the share price, filed when shares are sold",
  "DEF 14A": "Proxy statement: pay, board and shareholder votes",
};
const about = f => ABOUT[f.replace("/A", "")] ? ABOUT[f.replace("/A", "")] + (f.endsWith("/A") ? " (amended)" : "") : "";

export async function filingsFor(env, c, first) {
  const cik = await cikFor(env, c);
  const res = await sec(env, `https://data.sec.gov/submissions/CIK${cik}.json`);
  if (!res) throw new Error("no filings");
  const r = (await res.json()).filings.recent;
  const list = [];
  for (let i = 0; i < r.form.length && list.length < 60; i++) {
    if (!KEEP.has(r.form[i])) continue;
    const acc = r.accessionNumber[i];
    list.push({ form: r.form[i], date: r.filingDate[i], period: r.reportDate[i] || "", acc, desc: r.primaryDocDescription[i] || "",
      url: `https://www.sec.gov/Archives/edgar/data/${+cik}/${acc.replace(/-/g, "")}/${r.primaryDocument[i]}` });
  }
  await put(env, "sec:filings:" + c.symbol, { cik, list });
  // feed events: reports and prospectuses from the past ~13 months (8-Ks too: they carry results and trial news)
  const since = new Date(Date.now() - 400 * DAY).toISOString().slice(0, 10);
  const stmts = list.filter(f => f.date >= since && !["DEF 14A", "6-K"].includes(f.form) || (f.form === "6-K" && f.date >= since && /result|financial/i.test(f.desc))).map(f => {
    const per = f.period ? ` for the period to ${f.period}` : "";
    return env.DB.prepare("INSERT OR IGNORE INTO inv_events (id, symbol, date, type, title, detail, url, source, added) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind("sec:" + f.acc, c.symbol, f.date, "filing", `${f.form} filed${f.form.startsWith("8-K") ? "" : per}`, about(f.form), f.url, "SEC EDGAR", Date.now());
  });
  if (stmts.length) await env.DB.batch(stmts);
  return list.length;
}

// one XBRL tag's values, or [] if the company doesn't report it
async function tag(env, cik, name, tax = "us-gaap") {
  const res = await sec(env, `https://data.sec.gov/api/xbrl/companyconcept/CIK${cik}/${tax}/${name}.json`);
  if (!res) return [];
  const u = (await res.json()).units || {};
  return u.USD || u.shares || Object.values(u)[0] || [];
}
const REPORT = /^(10-Q|10-K|20-F|6-K|8-K|S-1|F-1|424B4)/;
const instant = vals => vals.filter(x => !x.start && REPORT.test(x.form || "")).sort((a, b) => a.end < b.end ? 1 : a.end > b.end ? -1 : (a.filed < b.filed ? 1 : -1))[0] || null;
const days = x => (Date.parse(x.end) - Date.parse(x.start)) / DAY;
// latest period's flow figure: newest end date, longest period ending then (the year-to-date figure)
const flow = vals => {
  const v = vals.filter(x => x.start && REPORT.test(x.form || ""));
  if (!v.length) return null;
  const end = v.reduce((m, x) => x.end > m ? x.end : m, "");
  return v.filter(x => x.end === end).sort((a, b) => days(b) - days(a))[0];
};
const quarter = vals => {
  const v = vals.filter(x => x.start && days(x) > 80 && days(x) < 100 && REPORT.test(x.form || ""));
  return v.sort((a, b) => a.end < b.end ? 1 : -1)[0] || null;
};
async function firstAt(env, cik, names, end) {
  for (const n of names) {
    const hit = (await tag(env, cik, n)).filter(x => !x.start && x.end === end).sort((a, b) => a.filed < b.filed ? 1 : -1)[0];
    if (hit) return { tag: n, val: hit.val };
  }
  return null;
}

export async function factsFor(env, c) {
  const cik = await cikFor(env, c);
  let cashTag = "CashAndCashEquivalentsAtCarryingValue", cash = instant(await tag(env, cik, cashTag));
  if (!cash) { cashTag = "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"; cash = instant(await tag(env, cik, cashTag)); }
  if (!cash) throw new Error("no cash figure in XBRL");
  const cur = await firstAt(env, cik, ["MarketableSecuritiesCurrent", "AvailableForSaleSecuritiesDebtSecuritiesCurrent", "ShortTermInvestments"], cash.end);
  const non = await firstAt(env, cik, ["MarketableSecuritiesNoncurrent", "AvailableForSaleSecuritiesDebtSecuritiesNoncurrent", "LongTermInvestments"], cash.end);
  const ocf = flow(await tag(env, cik, "NetCashProvidedByUsedInOperatingActivities"));
  const ni = quarter(await tag(env, cik, "NetIncomeLoss"));
  let rev = quarter(await tag(env, cik, "RevenueFromContractWithCustomerExcludingAssessedTax"));
  if (!rev) rev = quarter(await tag(env, cik, "Revenues"));
  const sh = instant(await tag(env, cik, "EntityCommonStockSharesOutstanding", "dei"));
  const total = cash.val + (cur ? cur.val : 0) + (non ? non.val : 0);
  const burnQ = ocf ? -ocf.val / (days(ocf) / 91.31) : null;          // positive = cash going out each quarter
  const out = {
    asOf: cash.end, form: cash.form, filed: cash.filed, accn: cash.accn,
    cash: cash.val, investments: (cur ? cur.val : 0) + (non ? non.val : 0), total,
    ocf: ocf ? { val: ocf.val, start: ocf.start, end: ocf.end } : null,
    burnQ, runwayMonths: burnQ && burnQ > 0 ? Math.round(total / burnQ * 3) : null,
    netIncomeQ: ni ? { val: ni.val, end: ni.end } : null, revenueQ: rev ? { val: rev.val, end: rev.end } : null,
    shares: sh ? { val: sh.val, end: sh.end } : null,
  };
  const prev = await get(env, "sec:facts:" + c.symbol);
  await put(env, "sec:facts:" + c.symbol, out);
  return `${out.asOf} cash ${Math.round(total / 1e6)}m${prev && prev.v.asOf !== out.asOf ? " (new quarter)" : ""}`;
}

// everything the page shows, from the cache
export async function secAll(env, symbols) {
  const out = {};
  for (const s of symbols) {
    const f = await get(env, "sec:filings:" + s), x = await get(env, "sec:facts:" + s);
    out[s] = { filings: f ? f.v.list.slice(0, 25) : null, cik: f ? f.v.cik : null, facts: x ? x.v : null, filingsAt: f ? f.at : 0, factsAt: x ? x.at : 0 };
  }
  return out;
}
