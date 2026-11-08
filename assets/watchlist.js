/* Live watchlist (Biotech Investing): live prices for the CF companies, a trading chart (TradingView's
   open-source Lightweight Charts: candles, zoom, pan, volume, moving averages) with the updates marked
   on the day they happened, and one feed of key events, trial changes, papers and news.
   The Worker does the fetching (src/invest.js); the companies are in data/watchlist.json. */
(() => {
'use strict';
const B = window.BV;
const { icon, esc, store } = B;

const TYPES = {
  key: { label: 'Key event', color: '#F59E0B', short: 'K' },
  trial: { label: 'Trial', color: '#22D3EE', short: 'T' },
  paper: { label: 'Paper', color: '#A3E635', short: 'P' },
  news: { label: 'News', color: '#94A3B8', short: 'N' },
  catalyst: { label: 'Coming up', color: '#F472B6', short: 'C' },
};
const INTERVALS = [['5min', '5m'], ['1h', '1H'], ['1day', '1D'], ['1week', '1W']];
const ZOOMS = [['1m', '1M', 31], ['3m', '3M', 92], ['6m', '6M', 183], ['1y', '1Y', 366], ['5y', '5Y', 1830], ['all', 'All', 0]];
const TERMS = ['52-week range', 'Biotech catalyst', 'PDUFA date', 'Phase 2 trial', 'Cash runway', 'Cash burn', 'Market capitalisation', 'Position sizing'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const UP = '#10B981', DOWN = '#F43F5E';

let CFG = null;
const S = {
  sym: store.get('wl:sym', 'VRTX'), iv: store.get('wl:iv', '1day'), zoom: store.get('wl:zoom', '1y'),
  style: store.get('wl:style', 'candles'), ma: store.get('wl:ma', true), show: store.get('wl:show', { key: true, trial: true, paper: true, news: true }),
  fSym: 'all', fType: 'all', shown: 40, sel: null,
};
let quotes = null, quoteErr = null, events = [], bars = null, barsErr = null, jobs = null, checking = null;
let gen = 0;          // bumped each time the page opens, so a check started by an earlier visit stops
let chart = null, mainSeries = null, volSeries = null, ma50 = null, ma200 = null, groups = new Map();

const api = async (path, opts) => {
  const res = await fetch('/api/invest/' + path, Object.assign({ cache: 'no-store', credentials: 'same-origin' }, opts));
  if (res.status === 401) throw Object.assign(new Error('signed out'), { auth: true });
  return res.json();
};
const co = sym => CFG.companies.find(c => c.symbol === sym);
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = d => { const [y, m, dd] = d.slice(0, 10).split('-'); return `${+dd} ${MON[+m - 1]} ${y}`; };
const money = (v, cur) => v == null ? '–' : (cur === 'USD' || !cur ? '$' : cur + ' ') + (v >= 1000 ? v.toLocaleString('en-GB', { maximumFractionDigits: 0 }) : v.toFixed(2));
const signed = v => v == null || !isFinite(v) ? '–' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2) + '%';
const dir = v => v > 0 ? 'is-up' : v < 0 ? 'is-down' : '';
const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
const vol = v => v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : String(v);
const termLink = t => { const id = '02 Key Terms/' + t; return B.exists(id) ? `<a class="internal-link" data-note="${esc(id)}" href="${B.hashFor(id)}">${esc(t)}</a>` : ''; };
const q = (view, sel) => view.querySelector(sel);
const intraday = () => S.iv === '5min' || S.iv === '1h';

let libLoading = null;
function lib() {
  if (window.LightweightCharts) return Promise.resolve();
  if (!libLoading) libLoading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'assets/vendor/lightweight-charts.js?v=4.2.3'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  return libLoading;
}

/* ------------------------------------------------------------ page */
function shell(view) {
  view.innerHTML = `<div class="wl">
    <header class="wl-head">
      <div><h1>Live watchlist</h1><p class="wl-sub">Cystic fibrosis companies. Prices from Twelve Data; trials, papers and news collected by the site every few hours.</p></div>
      <button class="wl-btn" data-refresh title="Check every source now">${icon('refresh')}<span>Check now</span></button>
    </header>
    <div class="wl-notice" data-notice hidden></div>
    <div class="wl-cards" data-cards></div>
    <section class="wl-panel wl-chartpanel">
      <div class="wl-chart-top" data-charttop></div>
      <div class="wl-tools" data-tools></div>
      <div class="wl-chartwrap"><div class="wl-ohlc" data-ohlc></div><div class="wl-chart" data-chart></div></div>
      <div class="wl-hint wl-dim">Drag to move, scroll or pinch to zoom, double-click to reset. Tap a marker to see what happened that day.</div>
      <div class="wl-pin" data-pinbox></div>
    </section>
    <section class="wl-panel"><h2>Coming up</h2><div data-upcoming></div></section>
    <section class="wl-panel"><h2>Updates</h2>
      <div class="wl-chips" data-fsym></div><div class="wl-chips" data-ftype></div>
      <div class="wl-feed" data-feed></div>
      <details class="wl-sources" data-sources></details>
    </section>
    <p class="wl-foot">${TERMS.map(termLink).filter(Boolean).join(' · ')}${TERMS.some(t => B.exists('02 Key Terms/' + t)) ? '<br>' : ''}Research and learning, not financial advice. Each price is as of the time shown on it, and the free plan's prices can lag.</p>
  </div>`;
}

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
  q(view, '[data-cards]').innerHTML = CFG.companies.map(c => {
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
function chartTop(view) {
  const c = co(S.sym), x = quotes && quotes.quotes ? quotes.quotes[S.sym] : null;
  q(view, '[data-charttop]').innerHTML = `<div class="wl-ct-name" style="--co:${c.color}"><b>${c.symbol}</b> ${esc(c.name)}${c.note && B.exists(c.note) ? ` <a class="internal-link wl-notelink" data-note="${esc(c.note)}" href="${B.hashFor(c.note)}">notes</a>` : ''}</div>
    <div class="wl-ct-price">${x ? money(x.price, x.currency) : ''}${x ? ` <span class="wl-chg ${dir(x.pct)}">${signed(x.pct)}</span><span class="wl-dim"> today</span>` : ''}${x && x.asOf ? `<span class="wl-dim wl-asof">as of ${esc(x.asOf.slice(0, 16))} ${x.exchange ? esc(x.exchange) + ' time' : ''}</span>` : ''}</div>`;
}
function tools(view) {
  const seg = (attr, list, cur) => `<div class="wl-seg">${list.map(([k, l]) => `<button data-${attr}="${k}" class="${cur === k ? 'is-active' : ''}">${l}</button>`).join('')}</div>`;
  q(view, '[data-tools]').innerHTML = `
    ${seg('iv', INTERVALS, S.iv)}
    ${intraday() ? '' : seg('zoom', ZOOMS.map(z => [z[0], z[1]]), S.zoom)}
    <div class="wl-seg">${[['candles', 'Candles'], ['line', 'Line']].map(([k, l]) => `<button data-style="${k}" class="${S.style === k ? 'is-active' : ''}">${l}</button>`).join('')}<button data-ma class="${S.ma ? 'is-active' : ''}" title="50 and 200 bar moving averages">MA</button></div>
    <div class="wl-marks">${Object.entries(TYPES).filter(([k]) => k !== 'catalyst').map(([k, t]) => `<button data-mark="${k}" class="${S.show[k] ? 'is-active' : ''}" style="--c:${t.color}"><i></i>${t.label}</button>`).join('')}</div>`;
}

const css = name => getComputedStyle(document.body).getPropertyValue(name).trim();
// bar time: a 'YYYY-MM-DD' day for daily and weekly bars, seconds for intraday ones (the Worker asks for UTC)
const timeOf = b => intraday() ? Date.UTC(+b[0].slice(0, 4), +b[0].slice(5, 7) - 1, +b[0].slice(8, 10), +b[0].slice(11, 13), +b[0].slice(14, 16)) / 1000 : b[0].slice(0, 10);
const keyOf = t => typeof t === 'object' ? `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}` : String(t);
const london = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function destroyChart() { if (chart) { chart.remove(); chart = null; mainSeries = volSeries = ma50 = ma200 = null; } }

function sma(data, n) {
  const out = []; let sum = 0;
  for (let i = 0; i < data.length; i++) { sum += data[i][4]; if (i >= n) sum -= data[i - n][4]; if (i >= n - 1) out.push({ time: timeOf(data[i]), value: sum / n }); }
  return out;
}

// which bar each event lands on: the first bar on or after its day (weekly bars: the week it falls in)
function markerGroups() {
  groups = new Map();
  if (!bars || !bars.length) return [];
  const days = bars.map(b => b[0].slice(0, 10));
  const first = days[0], last = days[days.length - 1];
  for (const e of events) {
    if (e.symbol !== S.sym || !S.show[e.type] || e.date < first || e.date > last) continue;
    let i;
    if (S.iv === '1week') { i = days.findIndex(d => d > e.date); i = i < 0 ? days.length - 1 : Math.max(0, i - 1); }
    else { i = days.findIndex(d => d >= e.date); if (i < 0) continue; }
    const k = keyOf(timeOf(bars[i]));
    if (!groups.has(k)) groups.set(k, { i, es: [] });
    groups.get(k).es.push(e);
  }
  const rank = { key: 0, trial: 1, paper: 2, news: 3 };
  const marks = [];
  for (const [k, g] of groups) {
    g.es.sort((a, b) => rank[a.type] - rank[b.type]);
    const top = g.es[0].type, n = g.es.length;
    marks.push({ time: timeOf(bars[g.i]), position: top === 'key' || top === 'news' ? 'aboveBar' : 'belowBar', color: TYPES[top].color,
      shape: top === 'key' ? 'arrowDown' : top === 'paper' ? 'square' : 'circle', text: n > 1 ? String(n) : TYPES[top].short, size: top === 'key' ? 1.4 : 1, id: k });
  }
  marks.sort((a, b) => (keyOf(a.time) < keyOf(b.time) ? -1 : 1));
  return marks;
}

function applyZoom() {
  if (!chart || !bars || !bars.length) return;
  const z = ZOOMS.find(x => x[0] === S.zoom);
  if (intraday() || !z || !z[2]) { chart.timeScale().fitContent(); return; }
  const lastD = bars[bars.length - 1][0].slice(0, 10);
  const from = new Date(Date.parse(lastD) - z[2] * 864e5).toISOString().slice(0, 10);
  const firstD = bars[0][0].slice(0, 10);
  chart.timeScale().setVisibleRange({ from: from < firstD ? firstD : from, to: lastD });
}

function legend(view, i) {
  const el = q(view, '[data-ohlc]');
  if (!bars || !bars.length) { el.innerHTML = ''; return; }
  if (i == null || i < 0) i = bars.length - 1;
  const b = bars[i], prev = i > 0 ? bars[i - 1][4] : b[1];
  const when = intraday() ? london.format(new Date(timeOf(b) * 1000)) : fmtDate(b[0]);
  el.innerHTML = `<span>${when}</span><span>O <b>${b[1].toFixed(2)}</b></span><span>H <b>${b[2].toFixed(2)}</b></span><span>L <b>${b[3].toFixed(2)}</b></span><span>C <b>${b[4].toFixed(2)}</b></span><span class="wl-chg ${dir(b[4] - prev)}">${signed(100 * (b[4] - prev) / prev)}</span><span>Vol <b>${vol(b[5])}</b></span>${S.ma ? '<span class="wl-ma50">MA50</span><span class="wl-ma200">MA200</span>' : ''}`;
}

function drawChart(view, keepRange) {
  const host = q(view, '[data-chart]');
  const msg = t => { destroyChart(); q(view, '[data-ohlc]').innerHTML = ''; host.innerHTML = `<div class="wl-empty">${t}</div>`; };
  if (barsErr === 'nokey') return msg('The chart appears once the Twelve Data key is set.');
  if (barsErr === 'limit') return msg('Twelve Data\'s free limit was reached for this minute. Pick the interval again shortly.');
  if (barsErr) return msg('Couldn\'t load the chart.');
  if (!bars) return msg('<span class="books-spinner"></span> Loading chart…');
  if (bars.length < 2) return msg('No price data for this interval.');
  if (!window.LightweightCharts) return msg('<span class="books-spinner"></span> Loading chart…');
  const L = window.LightweightCharts, c = co(S.sym);
  const range = keepRange && chart ? chart.timeScale().getVisibleLogicalRange() : null;
  destroyChart(); host.innerHTML = '';
  const text = css('--text-muted') || '#9aa', grid = css('--background-modifier-border') || 'rgba(128,128,128,.2)';
  chart = L.createChart(host, {
    autoSize: true,
    layout: { background: { type: 'solid', color: 'transparent' }, textColor: text, fontFamily: getComputedStyle(document.body).fontFamily, fontSize: 11 },
    grid: { vertLines: { color: grid, style: 2 }, horzLines: { color: grid, style: 2 } },
    rightPriceScale: { borderColor: grid, scaleMargins: { top: 0.12, bottom: 0.24 } },
    timeScale: { borderColor: grid, timeVisible: intraday(), secondsVisible: false, rightOffset: 4, minBarSpacing: 0.4 },
    crosshair: { mode: L.CrosshairMode.Normal },
    // the space kept under the candles for volume would otherwise be labelled with negative prices
    localization: Object.assign({ priceFormatter: v => (v < 0 ? '' : v >= 1000 ? v.toFixed(0) : v.toFixed(2)) }, intraday() ? { timeFormatter: t => london.format(new Date(t * 1000)) } : {}),
    handleScale: { axisPressedMouseMove: { time: true, price: true } },
  });
  const ohlc = bars.map(b => ({ time: timeOf(b), open: b[1], high: b[2], low: b[3], close: b[4] }));
  if (S.style === 'candles') {
    mainSeries = chart.addCandlestickSeries({ upColor: UP, downColor: DOWN, wickUpColor: UP, wickDownColor: DOWN, borderVisible: false, priceLineVisible: true });
    mainSeries.setData(ohlc);
  } else {
    mainSeries = chart.addAreaSeries({ lineColor: c.color, topColor: c.color + '55', bottomColor: c.color + '00', lineWidth: 2 });
    mainSeries.setData(ohlc.map(x => ({ time: x.time, value: x.close })));
  }
  volSeries = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'vol', lastValueVisible: false, priceLineVisible: false });
  chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
  volSeries.setData(bars.map((b, i) => ({ time: timeOf(b), value: b[5], color: (b[4] >= (i ? bars[i - 1][4] : b[1]) ? UP : DOWN) + '55' })));
  if (S.ma) {
    ma50 = chart.addLineSeries({ color: '#60A5FA', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    ma200 = chart.addLineSeries({ color: '#C084FC', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    ma50.setData(sma(bars, 50)); ma200.setData(sma(bars, 200));
  }
  mainSeries.setMarkers(markerGroups());
  if (range) chart.timeScale().setVisibleLogicalRange(range); else applyZoom();
  const index = new Map(bars.map((b, i) => [keyOf(timeOf(b)), i]));
  chart.subscribeCrosshairMove(p => legend(view, p && p.time != null ? index.get(keyOf(p.time)) : null));
  chart.subscribeClick(p => {
    if (!p || p.time == null) return;
    const k = keyOf(p.time);
    if (!groups.has(k)) { // a tap near a marker still counts: look one bar either side
      const i = index.get(k); const near = [i - 1, i + 1].map(j => bars[j] && keyOf(timeOf(bars[j]))).find(x => x && groups.has(x));
      if (!near) return; S.sel = near;
    } else S.sel = k;
    pinDetail(view);
  });
  legend(view);
  if (S.sel && groups.has(S.sel)) pinDetail(view); else pinHint(view);
}

// how the price moved around an event: the close before it, and about a week of trading after
function reaction(i, date) {
  const before = bars[i][0].slice(0, 10) >= date && i > 0 ? bars[i - 1] : bars[i];
  const step = S.iv === '1week' ? 1 : S.iv === '1day' ? 5 : 0;
  if (!step) return '';
  const after = bars[Math.min(bars.length - 1, i + step - (bars[i] === before ? 0 : 1))];
  if (!before || !after || after === before) return '';
  const pct = 100 * (after[4] - before[4]) / before[4];
  return `<span class="wl-react ${dir(pct)}">${signed(pct)}</span> <span class="wl-dim">from ${money(before[4])} (${fmtDate(before[0])}) to ${money(after[4])} (${fmtDate(after[0])})</span>`;
}
const evRow = (e) => `<div class="wl-ev" style="--tc:${(TYPES[e.type] || TYPES.news).color}">
  <div class="wl-ev-meta"><span class="wl-ev-type">${(TYPES[e.type] || TYPES.news).label}</span><span>${fmtDate(e.date)}</span>${e.source ? `<span>${esc(e.source)}</span>` : ''}</div>
  <div class="wl-ev-title">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)}</a>` : esc(e.title)}</div>
  ${e.detail ? `<div class="wl-ev-detail">${esc(e.detail)}</div>` : ''}</div>`;
function pinDetail(view) {
  const g = groups.get(S.sel); if (!g) return pinHint(view);
  const r = reaction(g.i, g.es[0].date);
  q(view, '[data-pinbox]').innerHTML = `<div class="wl-pin-head"><b>${fmtDate(g.es[0].date)}</b>${r ? `<span>Share price around this: ${r}</span>` : '<span></span>'}<button class="wl-x" data-unpin aria-label="Close">${icon('x')}</button></div>${g.es.map(evRow).join('')}`;
}
function pinHint(view) { q(view, '[data-pinbox]').innerHTML = ''; }

/* ------------------------------------------------------------ lists */
function upcoming(view) {
  const t = today();
  const fut = events.filter(e => e.date >= t).sort((a, b) => (a.date < b.date ? -1 : 1));
  const rows = fut.slice(0, 15).map(e => { const c = co(e.symbol); return `<div class="wl-up" style="--co:${c.color}"><span class="wl-up-date">${fmtDate(e.date)}</span><b class="wl-tick-s">${c.symbol}</b><span class="wl-up-title">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)}</a>` : esc(e.title)}</span></div>`; }).join('');
  const notes = CFG.companies.map(c => `<div class="wl-up" style="--co:${c.color}"><span class="wl-up-date">Guided</span><b class="wl-tick-s">${c.symbol}</b><span class="wl-up-title">${esc(c.next)}</span></div>`).join('');
  q(view, '[data-upcoming]').innerHTML = (rows ? `<h3>Dated</h3>${rows}` : '') + `<h3>What each company has said</h3>${notes}`;
}
function chips(view) {
  const t = today(), counts = {}, per = {};
  for (const e of events) if (e.date <= t) { counts[e.type] = (counts[e.type] || 0) + 1; per[e.symbol] = (per[e.symbol] || 0) + 1; }
  q(view, '[data-fsym]').innerHTML = [['all', 'All companies']].concat(CFG.companies.map(c => [c.symbol, c.symbol])).map(([k, l]) => `<button data-fsym="${k}" class="${S.fSym === k ? 'is-active' : ''}"${k !== 'all' ? ` style="--co:${co(k).color}"` : ''}>${l}${k !== 'all' && per[k] ? ` <small>${per[k]}</small>` : ''}</button>`).join('');
  q(view, '[data-ftype]').innerHTML = [['all', 'Everything']].concat(Object.entries(TYPES).filter(([k]) => k !== 'catalyst').map(([k, x]) => [k, x.label])).map(([k, l]) => `<button data-ftype="${k}" class="${S.fType === k ? 'is-active' : ''}">${l}${k !== 'all' && counts[k] ? ` <small>${counts[k]}</small>` : ''}</button>`).join('');
}
function feed(view) {
  const t = today();
  const list = events.filter(e => e.date <= t && (S.fSym === 'all' || e.symbol === S.fSym) && (S.fType === 'all' || e.type === S.fType));
  const el = q(view, '[data-feed]');
  if (!list.length) { el.innerHTML = `<div class="wl-empty">${checking ? '<span class="books-spinner"></span> Collecting updates…' : 'Nothing here yet.'}</div>`; return; }
  el.innerHTML = list.slice(0, S.shown).map(e => { const c = co(e.symbol);
    return `<div class="wl-feedrow" style="--co:${c.color}"><button class="wl-tick-s" data-showev="${e.symbol}" data-date="${e.date}" title="Show on the chart">${c.symbol}</button>${evRow(e)}</div>`; }).join('') +
    (list.length > S.shown ? `<button class="wl-btn wl-more" data-more>Show more (${list.length - S.shown})</button>` : '');
}
const SRC = { trials: 'ClinicalTrials.gov', papers: 'PubMed', news: 'News' };
function sources(view) {
  const el = q(view, '[data-sources]');
  if (!el) return;
  if (!jobs) { el.hidden = true; return; }
  const bad = jobs.filter(j => /^error/.test(j.result)), never = jobs.filter(j => !j.at);
  const last = Math.max(0, ...jobs.map(j => j.okAt || 0));
  el.hidden = false;
  el.innerHTML = `<summary>${checking ? `Checking ${checking}…` : `Sources: ${jobs.length - bad.length - never.length} of ${jobs.length} working${last ? ', last update collected ' + ago(last) : ''}`}${bad.length ? ` <span class="wl-bad">${bad.length} failing</span>` : ''}</summary>
    <div class="wl-srclist">${jobs.map(j => { const [s, k] = j.job.split(':'); const err = /^error/.test(j.result);
      return `<div class="${err ? 'is-err' : ''}"><b>${s}</b> ${SRC[k]}<span>${!j.at ? 'not checked yet' : err ? esc(j.result.slice(7)) : `${esc(j.result)} found, ${ago(j.at)}`}</span></div>`; }).join('')}</div>`;
}

/* ------------------------------------------------------------ data */
async function loadQuotes(view) {
  try { const r = await api('quotes'); if (r.error) quoteErr = r.error; else { quotes = r; quoteErr = null; } }
  catch (e) { if (e.auth) return; quoteErr = 'network'; }
  notice(view); cards(view); chartTop(view);
}
async function loadBars(view) {
  const want = S.sym + S.iv;
  bars = null; barsErr = null; drawChart(view);
  try {
    const [r] = await Promise.all([api(`series?s=${S.sym}&i=${S.iv}`), lib()]);
    if (want !== S.sym + S.iv) return;
    if (r.error) barsErr = r.error; else bars = r.bars || [];
  } catch (e) { barsErr = 'network'; }
  drawChart(view);
}
async function loadEvents(view) {
  try { const r = await api('events'); events = r.events || []; } catch (e) { events = []; }
  upcoming(view); chips(view); feed(view);
  if (chart && mainSeries) { mainSeries.setMarkers(markerGroups()); if (S.sel && groups.has(S.sel)) pinDetail(view); }
}
async function loadStatus(view) {
  try { const r = await api('status'); jobs = r.jobs; } catch (e) { /* the list just stays hidden */ }
  sources(view);
}
// runs each source one at a time (each is a small, quick request); only stale ones unless forced
async function check(view, force) {
  if (checking) return;
  const mine = gen;
  await loadStatus(view);
  if (!jobs) return;
  const todo = jobs.filter(j => force || !j.at || Date.now() - j.at > 3 * 3600000).map(j => j.job);
  if (!todo.length) return;
  const btn = q(view, '[data-refresh]'); if (btn) btn.disabled = true;
  for (let n = 0; n < todo.length; n++) {
    if (mine !== gen) { checking = null; return; }
    checking = `${n + 1} of ${todo.length}`;
    if (btn) btn.querySelector('span').textContent = `Checking ${checking}`;
    sources(view);
    try { await api('refresh?job=' + encodeURIComponent(todo[n]), { method: 'POST' }); } catch (e) { if (e.auth) break; }
    if ((n + 1) % 6 === 0) loadEvents(view);
  }
  checking = null;
  if (btn) { btn.disabled = false; btn.querySelector('span').textContent = 'Check now'; }
  await Promise.all([loadEvents(view), loadStatus(view)]);
}

function show(view) {
  view.innerHTML = '<div class="fc-loading"><span class="books-spinner"></span> Loading watchlist…</div>';
  let alive = true, timer = null;
  gen++; checking = null;
  fetch('data/watchlist.json', { cache: 'no-cache' }).then(r => r.json()).then(cfg => {
    if (!alive) return;
    CFG = cfg;
    if (!co(S.sym)) S.sym = CFG.companies[0].symbol;
    shell(view); cards(view); chartTop(view); tools(view); drawChart(view);
    loadQuotes(view); loadBars(view);
    loadEvents(view).then(() => alive && check(view, false));
    timer = setInterval(() => { if (!document.hidden) loadQuotes(view); }, 120000);
    const save = () => { store.set('wl:sym', S.sym); store.set('wl:iv', S.iv); store.set('wl:zoom', S.zoom); store.set('wl:style', S.style); store.set('wl:ma', S.ma); store.set('wl:show', S.show); };
    view.ondblclick = e => { if (e.target.closest('[data-chart]')) applyZoom(); };
    view.onclick = async e => {
      const t = e.target;
      const card = t.closest('[data-sym]');
      if (card && !t.closest('a')) { S.sym = card.dataset.sym; S.sel = null; save(); cards(view); chartTop(view); loadBars(view); return; }
      const iv = t.closest('[data-iv]'); if (iv) { S.iv = iv.dataset.iv; S.sel = null; save(); tools(view); loadBars(view); return; }
      const z = t.closest('[data-zoom]'); if (z) { S.zoom = z.dataset.zoom; save(); tools(view); applyZoom(); return; }
      const st = t.closest('[data-style]'); if (st) { S.style = st.dataset.style; save(); tools(view); drawChart(view, true); return; }
      if (t.closest('[data-ma]')) { S.ma = !S.ma; save(); tools(view); drawChart(view, true); return; }
      const mk = t.closest('[data-mark]'); if (mk) { S.show[mk.dataset.mark] = !S.show[mk.dataset.mark]; save(); tools(view); if (mainSeries) mainSeries.setMarkers(markerGroups()); if (!groups.has(S.sel)) pinHint(view); return; }
      if (t.closest('[data-unpin]')) { S.sel = null; pinHint(view); return; }
      const fs = t.closest('[data-fsym]'); if (fs && fs.tagName === 'BUTTON') { S.fSym = fs.dataset.fsym; S.shown = 40; chips(view); feed(view); return; }
      const ft = t.closest('[data-ftype]'); if (ft && ft.tagName === 'BUTTON') { S.fType = ft.dataset.ftype; S.shown = 40; chips(view); feed(view); return; }
      if (t.closest('[data-more]')) { S.shown += 40; feed(view); return; }
      const sh = t.closest('[data-showev]');
      if (sh) {
        const d = sh.dataset.date;
        const changed = S.sym !== sh.dataset.showev || S.iv !== '1day';
        S.sym = sh.dataset.showev; S.iv = '1day'; save(); cards(view); chartTop(view); tools(view);
        if (changed) await loadBars(view);
        if (bars && chart) {
          const ev = events.find(x => x.symbol === S.sym && x.date === d && S.show[x.type]);
          if (ev) { const k = [...groups.entries()].find(([, g]) => g.es.includes(ev)); if (k) { S.sel = k[0]; pinDetail(view); } }
          const from = new Date(Date.parse(d) - 75 * 864e5).toISOString().slice(0, 10), to = new Date(Date.parse(d) + 75 * 864e5).toISOString().slice(0, 10);
          chart.timeScale().setVisibleRange({ from, to: to > bars[bars.length - 1][0] ? bars[bars.length - 1][0] : to });
        }
        q(view, '.wl-chartpanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (t.closest('[data-refresh]')) { check(view, true); }
    };
  }).catch(() => { view.innerHTML = '<div class="pane-empty">Could not load the watchlist.</div>'; });
  return () => { alive = false; clearInterval(timer); destroyChart(); };
}

B.registerView('watchlist', { title: () => 'Live watchlist', icon: 'trending-up', cls: 'wl-host', show });

// the stylesheet loads with the script, so the page needs nothing else
if (!document.querySelector('link[href^="assets/watchlist.css"]')) {
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'assets/watchlist.css?v=20261109'; document.head.appendChild(l);
}
})();
