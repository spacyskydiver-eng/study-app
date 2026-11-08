/* Live watchlist (Biotech Investing): live prices for the CF companies, a price chart with the
   updates pinned on the day they happened, and one feed of trial changes, papers and news.
   The Worker does the fetching (src/invest.js); the companies are in data/watchlist.json. */
(() => {
'use strict';
const B = window.BV;
const { icon, esc, store } = B;

const TYPES = {
  key: { label: 'Key event', color: '#F59E0B' },
  trial: { label: 'Trial', color: '#22D3EE' },
  paper: { label: 'Paper', color: '#A3E635' },
  news: { label: 'News', color: '#94A3B8' },
  catalyst: { label: 'Coming up', color: '#F472B6' },
};
const RANGE_LABELS = [['1d', '1D'], ['1m', '1M'], ['6m', '6M'], ['1y', '1Y'], ['5y', '5Y']];
const TERMS = ['52-week range', 'Biotech catalyst', 'PDUFA date', 'Phase 2 trial', 'Cash runway', 'Cash burn', 'Market capitalisation', 'Position sizing'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let CFG = null;
const S = { sym: store.get('wl:sym', 'VRTX'), range: store.get('wl:range', '1y'), fSym: 'all', fType: 'all', shown: 40, pin: null };
let quotes = null, quoteErr = null, events = [], series = null, seriesErr = null, status = null;

const api = async (path, opts) => {
  const res = await fetch('/api/invest/' + path, Object.assign({ cache: 'no-store', credentials: 'same-origin' }, opts));
  if (res.status === 401) throw Object.assign(new Error('signed out'), { auth: true });
  return res.json();
};
const co = sym => CFG.companies.find(c => c.symbol === sym);
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = d => { const [y, m, dd] = d.slice(0, 10).split('-'); return `${+dd} ${MON[+m - 1]} ${y}`; };
const money = (v, cur) => v == null ? '–' : (cur === 'USD' || !cur ? '$' : cur + ' ') + (v >= 1000 ? v.toLocaleString('en-GB', { maximumFractionDigits: 0 }) : v.toFixed(2));
const signed = v => v == null ? '–' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2) + '%';
const dir = v => v > 0 ? 'is-up' : v < 0 ? 'is-down' : '';
const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
const termLink = t => { const id = '02 Key Terms/' + t; return B.exists(id) ? `<a class="internal-link" data-note="${esc(id)}" href="${B.hashFor(id)}">${esc(t)}</a>` : ''; };

/* ------------------------------------------------------------ page */
function shell(view) {
  view.innerHTML = `<div class="wl">
    <header class="wl-head">
      <div><h1>Live watchlist</h1><p class="wl-sub">Cystic fibrosis companies. Prices from Twelve Data, updates from ClinicalTrials.gov, PubMed and the news, checked every morning.</p></div>
      <button class="wl-btn" data-refresh title="Check for updates now">${icon('refresh')}<span>Check now</span></button>
    </header>
    <div class="wl-notice" data-notice hidden></div>
    <div class="wl-cards" data-cards></div>
    <section class="wl-panel">
      <div class="wl-chart-top" data-charttop></div>
      <div class="wl-chart" data-chart></div>
      <div class="wl-legend">${Object.entries(TYPES).map(([k, t]) => `<span><i style="--c:${t.color}"${k === 'catalyst' ? ' class="is-ring"' : ''}></i>${t.label}</span>`).join('')}</div>
      <div class="wl-pin" data-pinbox></div>
    </section>
    <section class="wl-panel"><h2>Coming up</h2><div data-upcoming></div></section>
    <section class="wl-panel"><h2>Updates</h2>
      <div class="wl-chips" data-fsym></div><div class="wl-chips" data-ftype></div>
      <div class="wl-feed" data-feed></div>
    </section>
    <p class="wl-foot">${TERMS.map(termLink).filter(Boolean).join(' · ')}${TERMS.some(t => B.exists('02 Key Terms/' + t)) ? '<br>' : ''}Research and learning, not financial advice. A price is as of the time shown on it, and the free plan's prices can lag.</p>
  </div>`;
}
const q = (view, sel) => view.querySelector(sel);

function notice(view) {
  const el = q(view, '[data-notice]');
  let msg = '';
  if (quoteErr === 'nokey') msg = `<b>Prices are off until the Twelve Data key is set.</b> In the study-app folder run <code>npx wrangler secret put TWELVE_DATA_KEY</code>, paste the key from twelvedata.com when it asks, then redeploy. Updates below work without it.`;
  else if (quoteErr === 'limit') msg = `Twelve Data's free limit was reached for the moment, so prices are the last saved ones. Try again in a minute.`;
  else if (quoteErr) msg = `Couldn't get prices just now (${esc(quoteErr)}).`;
  else if (quotes && quotes.stale) msg = `Showing saved prices from ${ago(quotes.at)}. Twelve Data didn't answer.`;
  el.hidden = !msg; el.innerHTML = msg;
}

function cards(view) {
  const el = q(view, '[data-cards]');
  el.innerHTML = CFG.companies.map(c => {
    const x = quotes && quotes.quotes ? quotes.quotes[c.symbol] : null;
    let bar = '';
    if (x && x.low52 != null && x.high52 > x.low52) {
      const pos = Math.max(0, Math.min(100, 100 * (x.price - x.low52) / (x.high52 - x.low52)));
      bar = `<div class="wl-52" title="52-week range"><span>${money(x.low52, x.currency)}</span><div class="wl-52-bar"><i style="left:${pos}%"></i></div><span>${money(x.high52, x.currency)}</span></div>`;
    }
    return `<button class="wl-card${S.sym === c.symbol ? ' is-active' : ''}" data-sym="${c.symbol}" style="--co:${c.color}">
      <div class="wl-card-top"><b class="wl-tick">${c.symbol}</b><span class="wl-name">${esc(c.short)}</span><span class="wl-risk wl-risk-${c.risk.replace(' ', '-')}">${esc(c.risk)} risk</span></div>
      <div class="wl-price">${x ? money(x.price, x.currency) : '<span class="wl-dim">–</span>'}<span class="wl-chg ${x ? dir(x.pct) : ''}">${x ? signed(x.pct) : ''}</span>${x && x.marketOpen ? '<span class="wl-live">live</span>' : ''}</div>
      ${bar}
      <dl><dt>Programme</dt><dd>${esc(c.programme)}</dd><dt>Next</dt><dd>${esc(c.next)}</dd><dt>Runway</dt><dd>${esc(c.runway)}</dd></dl>
    </button>`;
  }).join('');
}

/* ------------------------------------------------------------ chart */
const parseT = s => { const [d, t] = s.split(' '); const [y, m, dd] = d.split('-').map(Number); if (!t) return new Date(Date.UTC(y, m - 1, dd)); const [h, mi] = t.split(':').map(Number); return new Date(Date.UTC(y, m - 1, dd, h, mi)); };

function chartTop(view) {
  const c = co(S.sym), x = quotes && quotes.quotes ? quotes.quotes[S.sym] : null;
  let change = '';
  if (series && series.points && series.points.length > 1 && S.range !== '1d') {
    const a = series.points[0][1], b = series.points[series.points.length - 1][1];
    change = `<span class="wl-chg ${dir(b - a)}">${signed(100 * (b - a) / a)}</span><span class="wl-dim"> over ${RANGE_LABELS.find(r => r[0] === S.range)[1]}</span>`;
  } else if (x) change = `<span class="wl-chg ${dir(x.pct)}">${signed(x.pct)}</span><span class="wl-dim"> today</span>`;
  q(view, '[data-charttop]').innerHTML = `<div class="wl-ct-name" style="--co:${c.color}"><b>${c.symbol}</b> ${esc(c.name)}${c.note && B.exists(c.note) ? ` <a class="internal-link wl-notelink" data-note="${esc(c.note)}" href="${B.hashFor(c.note)}">notes</a>` : ''}</div>
    <div class="wl-ct-price">${x ? money(x.price, x.currency) : ''} ${change}${x && x.asOf ? `<span class="wl-dim wl-asof">as of ${esc(x.asOf.slice(0, 16))} ${x.exchange ? esc(x.exchange) + ' time' : ''}</span>` : ''}</div>
    <div class="wl-seg">${RANGE_LABELS.map(([k, l]) => `<button data-range="${k}" class="${S.range === k ? 'is-active' : ''}">${l}</button>`).join('')}</div>`;
}

function evsFor(sym) { return events.filter(e => e.symbol === sym); }

function drawChart(view) {
  const host = q(view, '[data-chart]');
  const c = co(S.sym);
  if (seriesErr === 'nokey' || (!series && seriesErr)) {
    host.innerHTML = `<div class="wl-empty">${seriesErr === 'nokey' ? 'The chart appears once the Twelve Data key is set.' : seriesErr === 'limit' ? 'Free limit reached for this minute. Tap the range again shortly.' : 'Couldn\'t load the chart.'}</div>`;
    pinList(view, evsFor(S.sym).filter(e => e.date <= today()).slice(0, 8));
    return;
  }
  if (!series) { host.innerHTML = '<div class="wl-empty"><span class="books-spinner"></span> Loading chart…</div>'; return; }
  const pts = series.points.map(p => ({ t: parseT(p[0]), v: p[1], d: p[0].slice(0, 10) }));
  if (pts.length < 2) { host.innerHTML = '<div class="wl-empty">No price data for this range.</div>'; return; }
  const W = host.clientWidth || 600, H = Math.max(220, Math.min(340, Math.round(W * 0.5)));
  const m = { t: 26, r: 12, b: 26, l: 44 };
  const x = d3.scaleTime().domain(d3.extent(pts, p => p.t)).range([m.l, W - m.r]);
  const lo = d3.min(pts, p => p.v), hi = d3.max(pts, p => p.v);
  const y = d3.scaleLinear().domain([lo - (hi - lo) * 0.08, hi + (hi - lo) * 0.08]).nice(5).range([H - m.b, m.t]);
  const line = d3.line().x(p => x(p.t)).y(p => y(p.v)).curve(d3.curveMonotoneX);
  const area = d3.area().x(p => x(p.t)).y0(H - m.b).y1(p => y(p.v)).curve(d3.curveMonotoneX);
  const first = pts[0].d, last = pts[pts.length - 1].d;
  // pins: events inside the range, grouped by the trading day they land on
  const groups = new Map();
  if (S.range !== '1d') for (const e of evsFor(S.sym)) {
    if (e.date < first || e.date > last) continue;
    let i = pts.findIndex(p => p.d >= e.date); if (i < 0) i = pts.length - 1;
    if (!groups.has(i)) groups.set(i, []);
    groups.get(i).push(e);
  }
  const rank = { key: 0, trial: 1, paper: 2, news: 3, catalyst: 4 };
  const pins = [...groups.entries()].map(([i, es]) => { es.sort((a, b) => rank[a.type] - rank[b.type]); return { i, p: pts[i], es, type: es[0].type }; });
  const xt = W < 420 ? 4 : 6;
  const fmtX = S.range === '1d' ? d3.utcFormat('%H:%M') : S.range === '5y' ? d3.utcFormat('%Y') : S.range === '1m' ? d3.utcFormat('%d %b') : d3.utcFormat('%b %y');
  host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="wl-svg" style="--co:${c.color}">
    <defs><linearGradient id="wlg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c.color}" stop-opacity=".28"/><stop offset="1" stop-color="${c.color}" stop-opacity="0"/></linearGradient></defs>
    <g class="wl-grid">${y.ticks(5).map(t => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/><text x="${m.l - 6}" y="${y(t) + 4}" text-anchor="end">${t >= 1000 ? d3.format(',.0f')(t) : d3.format('.2~f')(t)}</text>`).join('')}</g>
    <g class="wl-xaxis">${x.ticks(xt).map(t => `<text x="${x(t)}" y="${H - 6}" text-anchor="middle">${fmtX(t)}</text>`).join('')}</g>
    <path d="${area(pts)}" fill="url(#wlg)"/>
    <path d="${line(pts)}" class="wl-line"/>
    <g class="wl-pins">${pins.map((g, k) => { const cx = x(g.p.t), cy = y(g.p.v), col = TYPES[g.type].color, big = g.type === 'key';
      return `<g class="wl-pinmark${S.pin === g.i ? ' is-sel' : ''}" data-pin="${g.i}"><line x1="${cx}" x2="${cx}" y1="${m.t - 8}" y2="${cy}" stroke="${col}"/><circle cx="${cx}" cy="${cy}" r="${big ? 5.5 : 4}" fill="${col}"/><circle cx="${cx}" cy="${m.t - 10}" r="${big ? 7 : 5.5}" fill="${col}" class="wl-pinhead"/>${g.es.length > 1 ? `<text x="${cx}" y="${m.t - 7}" text-anchor="middle">${g.es.length}</text>` : ''}<rect x="${cx - 11}" y="${m.t - 22}" width="22" height="${cy - m.t + 30}" fill="transparent"/></g>`; }).join('')}</g>
    <g class="wl-cross" style="display:none"><line y1="${m.t}" y2="${H - m.b}"/><circle r="4"/></g>
  </svg><div class="wl-tip" hidden></div>`;
  const svg = host.querySelector('svg'), cross = svg.querySelector('.wl-cross'), tip = host.querySelector('.wl-tip');
  const bis = d3.bisector(p => p.t).center;
  const move = ev => {
    const r = svg.getBoundingClientRect(); const px = (ev.clientX - r.left) * (W / r.width);
    const p = pts[bis(pts, x.invert(px))]; if (!p) return;
    cross.style.display = ''; cross.setAttribute('transform', `translate(${x(p.t)},0)`); cross.querySelector('circle').setAttribute('cy', y(p.v));
    tip.hidden = false; tip.textContent = `${S.range === '1d' ? series.points[pts.indexOf(p)][0].slice(11, 16) : fmtDate(p.d)}  ${money(p.v)}`;
    tip.style.left = Math.min(Math.max(0, (x(p.t) / W) * r.width - 50), r.width - 120) + 'px';
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerleave', () => { cross.style.display = 'none'; tip.hidden = true; });
  svg.addEventListener('click', ev => {
    const g = ev.target.closest('[data-pin]'); if (!g) return;
    S.pin = +g.dataset.pin; drawChart(view);
  });
  const sel = pins.find(g => g.i === S.pin);
  if (sel) pinDetail(view, sel, pts);
  else pinList(view, pins.slice().reverse().flatMap(g => g.es).filter(e => e.type === 'key' || e.type === 'trial').slice(0, 4), pins.length);
}

// how the price moved around an event: the close before it, and a week of trading after (one bar on weekly charts)
function reaction(pts, i, date) {
  const before = pts[i].d > date || i === 0 ? pts[Math.max(0, i - 1)] : pts[i - 1];
  const step = S.range === '5y' ? 1 : 5;
  const after = pts[Math.min(pts.length - 1, i + step - (pts[i].d > date ? 1 : 0))];
  if (!before || !after || after === before || after.d <= date) return '';
  const pct = 100 * (after.v - before.v) / before.v;
  return `<span class="wl-react ${dir(pct)}">${signed(pct)}</span> <span class="wl-dim">from ${money(before.v)} (${fmtDate(before.d)}) to ${money(after.v)} (${fmtDate(after.d)})</span>`;
}
const evRow = (e, extra) => `<div class="wl-ev" style="--tc:${TYPES[e.type].color}">
  <div class="wl-ev-meta"><span class="wl-ev-type">${TYPES[e.type].label}</span><span>${fmtDate(e.date)}</span>${e.source ? `<span>${esc(e.source)}</span>` : ''}</div>
  <div class="wl-ev-title">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)}</a>` : esc(e.title)}</div>
  ${e.detail ? `<div class="wl-ev-detail">${esc(e.detail)}</div>` : ''}${extra || ''}</div>`;
function pinDetail(view, g, pts) {
  const r = reaction(pts, g.i, g.es[0].date);
  q(view, '[data-pinbox]').innerHTML = `<div class="wl-pin-head"><b>${fmtDate(g.es[0].date)}</b>${r ? `<span>Share price around this: ${r}</span>` : ''}<button class="wl-x" data-unpin aria-label="Close">${icon('x')}</button></div>${g.es.map(e => evRow(e)).join('')}`;
}
function pinList(view, list, count) {
  q(view, '[data-pinbox]').innerHTML = count ? `<p class="wl-dim wl-hint">Tap a pin to see what happened that day and how the share price moved around it.</p>` : list.length ? '' : '';
}

/* ------------------------------------------------------------ lists */
function upcoming(view) {
  const t = today();
  const fut = events.filter(e => e.date >= t).sort((a, b) => (a.date < b.date ? -1 : 1));
  const rows = fut.slice(0, 12).map(e => { const c = co(e.symbol); return `<div class="wl-up" style="--co:${c.color}"><span class="wl-up-date">${fmtDate(e.date)}</span><b class="wl-tick-s">${c.symbol}</b><span class="wl-up-title">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)}</a>` : esc(e.title)}</span></div>`; }).join('');
  const notes = CFG.companies.map(c => `<div class="wl-up" style="--co:${c.color}"><span class="wl-up-date">Guided</span><b class="wl-tick-s">${c.symbol}</b><span class="wl-up-title">${esc(c.next)}</span></div>`).join('');
  q(view, '[data-upcoming]').innerHTML = (rows ? `<h3>Dated</h3>${rows}` : '') + `<h3>What each company has said</h3>${notes}`;
}
function chips(view) {
  const counts = {}; for (const e of events) if (e.date <= today()) counts[e.type] = (counts[e.type] || 0) + 1;
  q(view, '[data-fsym]').innerHTML = [['all', 'All companies']].concat(CFG.companies.map(c => [c.symbol, c.symbol])).map(([k, l]) => `<button data-fsym="${k}" class="${S.fSym === k ? 'is-active' : ''}"${k !== 'all' ? ` style="--co:${co(k).color}"` : ''}>${l}</button>`).join('');
  q(view, '[data-ftype]').innerHTML = [['all', 'Everything']].concat(Object.entries(TYPES).filter(([k]) => k !== 'catalyst').map(([k, t]) => [k, t.label])).map(([k, l]) => `<button data-ftype="${k}" class="${S.fType === k ? 'is-active' : ''}">${l}${k !== 'all' && counts[k] ? ` <small>${counts[k]}</small>` : ''}</button>`).join('');
}
function feed(view) {
  const t = today();
  const list = events.filter(e => e.date <= t && (S.fSym === 'all' || e.symbol === S.fSym) && (S.fType === 'all' || e.type === S.fType));
  const el = q(view, '[data-feed]');
  if (!list.length) { el.innerHTML = `<div class="wl-empty">${status && status.refreshing ? '<span class="books-spinner"></span> Collecting the first updates. This takes about a minute; refresh the page after.' : 'Nothing here yet.'}</div>`; return; }
  el.innerHTML = list.slice(0, S.shown).map(e => { const c = co(e.symbol);
    return `<div class="wl-feedrow" style="--co:${c.color}"><button class="wl-tick-s" data-show="${e.symbol}" data-date="${e.date}" title="Show on the chart">${c.symbol}</button>${evRow(e)}</div>`; }).join('') +
    (list.length > S.shown ? `<button class="wl-btn wl-more" data-more>Show more (${list.length - S.shown})</button>` : '');
}

/* ------------------------------------------------------------ data */
async function loadQuotes(view) {
  try { const r = await api('quotes'); if (r.error) { quoteErr = r.error; } else { quotes = r; quoteErr = null; } }
  catch (e) { if (e.auth) return; quoteErr = 'network'; }
  notice(view); cards(view); chartTop(view);
}
async function loadSeries(view) {
  const want = S.sym + S.range;
  series = null; seriesErr = null; drawChart(view);
  try {
    const r = await api(`series?s=${S.sym}&r=${S.range}`);
    if (want !== S.sym + S.range) return;
    if (r.error) seriesErr = r.error; else series = r;
  } catch (e) { seriesErr = 'network'; }
  chartTop(view); drawChart(view);
}
async function loadEvents(view) {
  try { const r = await api('events'); events = r.events || []; status = { refreshing: r.refreshing, lastRefresh: r.lastRefresh }; }
  catch (e) { events = []; }
  stamp(view); upcoming(view); chips(view); feed(view); drawChart(view);
}
function stamp(view) {
  const b = q(view, '[data-refresh] span');
  if (status && status.lastRefresh && !status.refreshing) b.textContent = 'Checked ' + ago(status.lastRefresh);
}

function show(view) {
  view.innerHTML = '<div class="fc-loading"><span class="books-spinner"></span> Loading watchlist…</div>';
  let alive = true, timer = null, ro = null;
  fetch('data/watchlist.json', { cache: 'no-cache' }).then(r => r.json()).then(cfg => {
    if (!alive) return;
    CFG = cfg;
    if (!co(S.sym)) S.sym = CFG.companies[0].symbol;
    shell(view); cards(view); chartTop(view); drawChart(view);
    loadQuotes(view); loadSeries(view); loadEvents(view);
    timer = setInterval(() => { if (!document.hidden) loadQuotes(view); }, 120000);
    let w = 0; ro = new ResizeObserver(() => { const nw = q(view, '[data-chart]').clientWidth; if (Math.abs(nw - w) > 20) { w = nw; drawChart(view); } });
    ro.observe(q(view, '[data-chart]'));
    view.onclick = async e => {
      const t = e.target;
      const card = t.closest('[data-sym]');
      if (card && !t.closest('a')) { S.sym = card.dataset.sym; S.pin = null; store.set('wl:sym', S.sym); cards(view); loadSeries(view); return; }
      const r = t.closest('[data-range]');
      if (r) { S.range = r.dataset.range; S.pin = null; store.set('wl:range', S.range); loadSeries(view); return; }
      if (t.closest('[data-unpin]')) { S.pin = null; drawChart(view); return; }
      const fs = t.closest('[data-fsym]'); if (fs && fs.tagName === 'BUTTON') { S.fSym = fs.dataset.fsym; S.shown = 40; chips(view); feed(view); return; }
      const ft = t.closest('[data-ftype]'); if (ft && ft.tagName === 'BUTTON') { S.fType = ft.dataset.ftype; S.shown = 40; chips(view); feed(view); return; }
      if (t.closest('[data-more]')) { S.shown += 40; feed(view); return; }
      const sh = t.closest('[data-show]');
      if (sh) {
        const d = sh.dataset.date, age = (Date.now() - Date.parse(d)) / 864e5;
        S.sym = sh.dataset.show; store.set('wl:sym', S.sym);
        S.range = age < 25 ? '1m' : age < 170 ? '6m' : age < 360 ? '1y' : '5y';
        S.pin = null; cards(view); await loadSeries(view);
        if (series) { const i = series.points.findIndex(p => p[0].slice(0, 10) >= d); if (i >= 0) { S.pin = i; drawChart(view); } }
        q(view, '.wl-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const rf = t.closest('[data-refresh]');
      if (rf) {
        rf.disabled = true; rf.querySelector('span').textContent = 'Checking…';
        try { await api('refresh', { method: 'POST' }); } catch (err) { /* the page still reloads what there is */ }
        rf.disabled = false; await Promise.all([loadEvents(view), loadQuotes(view)]);
        if (!status || !status.lastRefresh) rf.querySelector('span').textContent = 'Check now';
      }
    };
  }).catch(() => { view.innerHTML = '<div class="pane-empty">Could not load the watchlist.</div>'; });
  return () => { alive = false; clearInterval(timer); if (ro) ro.disconnect(); };
}

B.registerView('watchlist', { title: () => 'Live watchlist', icon: 'trending-up', cls: 'wl-host', show });

// the stylesheet loads with the script, so the page needs nothing else
if (!document.querySelector('link[href^="assets/watchlist.css"]')) {
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'assets/watchlist.css?v=20261108'; document.head.appendChild(l);
}
})();
