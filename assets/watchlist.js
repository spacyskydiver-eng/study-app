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
  mine: { label: 'My trades', color: '#E5E7EB', short: 'B' },
};
const INTERVALS = [['5min', '5m'], ['1h', '1H'], ['1day', '1D'], ['1week', '1W']];
const ZOOMS = [['1m', '1M', 31], ['3m', '3M', 92], ['6m', '6M', 183], ['1y', '1Y', 366], ['5y', '5Y', 1830], ['all', 'All', 0]];
const TERMS = ['52-week range', 'Biotech catalyst', 'PDUFA date', 'Phase 2 trial', 'Cash runway', 'Cash burn', 'Market capitalisation', 'Position sizing'];
const GUIDE = '03 Biotech Investing/03 Reading Charts and Trading/Reading Charts and Trading';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const UP = '#10B981', DOWN = '#F43F5E';

let CFG = null;
const S = {
  sym: store.get('wl:sym', 'VRTX'), iv: store.get('wl:iv', '1day'), zoom: store.get('wl:zoom', '1y'),
  style: store.get('wl:style', 'candles'), ma: store.get('wl:ma', true), show: store.get('wl:show', { key: true, trial: true, paper: true, news: true }),
  fSym: 'all', fType: 'all', shown: 40, sel: null, explain: store.get('wl:explain', true),
};
let tz = { status: null, account: null, accErr: null, orders: [], journal: [], mine: [] };   // Trading 212
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
  view.innerHTML = `<div class="wl${S.explain ? ' is-explain' : ''}">
    <header class="wl-head">
      <div><h1>Live watchlist</h1><p class="wl-sub">Cystic fibrosis companies. Prices from Twelve Data; trials, papers and news collected by the site every few hours.${B.exists(GUIDE) ? ` <a class="internal-link" data-note="${esc(GUIDE)}" href="${B.hashFor(GUIDE)}">How to read all of this</a>` : ''}</p></div>
      <div class="wl-headbtns"><button class="wl-btn${S.explain ? ' is-on' : ''}" data-explain title="Show or hide the explanations">${icon('book-open')}<span>Explanations</span></button>
      <button class="wl-btn" data-refresh title="Check every source now">${icon('refresh')}<span>Check now</span></button></div>
    </header>
    <div class="wl-notice" data-notice hidden></div>
    <p class="wl-ex">Each card is one company. The big number is the latest share price in US dollars, then today's change since yesterday's close (green up, red down). "Live" means the US market is open now (14:30 to 21:00 UK time). The bar shows the 52-week range: lowest price of the past year on the left, highest on the right, and the dot is today. Stage is the furthest point the company's most advanced CF drug has reached. Next is the next milestone the company has given. Runway is how long its cash lasts at the current spending rate. Risk is a rough label from the company notes: how much of the company rides on unproven drugs. Tap a card to chart it and see its pipeline and decision check.</p>
    <div class="wl-cards" data-cards></div>
    <section class="wl-panel wl-chartpanel">
      <div class="wl-chart-top" data-charttop></div>
      <div class="wl-tools" data-tools></div>
      <div class="wl-chartwrap"><div class="wl-ohlc" data-ohlc></div><div class="wl-chart" data-chart></div></div>
      <div class="wl-hint wl-dim">Drag to move, scroll or pinch to zoom, double-click to reset. Tap a marker to see what happened that day.</div>
      <p class="wl-ex">Each candle is one period (one day on 1D): the thick body runs from the opening to the closing price, the thin wicks reach the highest and lowest prices. Green means it closed higher than it opened, red lower. The bars along the bottom are volume, the number of shares traded. The top line reads out open (O), high (H), low (L), close (C), the change and volume for whichever candle you point at. MA draws the 50-day (blue) and 200-day (purple) averages, which show the medium and long-term trend. The 5m/1H/1D/1W buttons set how long each candle covers; 1M to All set how much history is on screen. Markers: K key event, T trial, P paper, N news, B and S your own buys and sells. The full guide is under Reading Charts and Trading.</p>
      <div class="wl-pin" data-pinbox></div>
    </section>
    <section class="wl-panel wl-decide" data-decide></section>
    <section class="wl-panel wl-t212" data-t212></section>
    <section class="wl-panel"><h2>Coming up</h2><p class="wl-ex">Dated events still ahead: FDA decision dates, investor conferences and the dates trials are expected to finish collecting their main results (primary completion). Below them, what each company itself says is next. These are the moments a price is most likely to move sharply.</p><div data-upcoming></div></section>
    <section class="wl-panel"><h2>Updates</h2><p class="wl-ex">Everything that has happened, newest first: key events (results, FDA decisions, trial readouts, researched by hand), trial registry changes from ClinicalTrials.gov, new papers from PubMed and news stories. Filter by company or type; tap a ticker to see that day on the chart. New items are collected automatically every few hours.</p>
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
      <dl><dt>Stage</dt><dd>${esc(c.stage || '')}</dd><dt>Programme</dt><dd>${esc(c.programme)}</dd><dt>Next</dt><dd>${esc(c.next)}</dd><dt>Runway</dt><dd>${esc(c.runway)}</dd></dl>
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
    <div class="wl-marks">${Object.entries(TYPES).filter(([k]) => k !== 'catalyst' && (k !== 'mine' || (tz.status && tz.status.configured))).map(([k, t]) => `<button data-mark="${k}" class="${S.show[k] ? 'is-active' : ''}" style="--c:${t.color}"><i></i>${t.label}</button>`).join('')}</div>`;
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
  for (const e of events.concat(tz.mine)) {
    if (e.symbol !== S.sym || !S.show[e.type] || e.date < first || e.date > last) continue;
    let i;
    if (S.iv === '1week') { i = days.findIndex(d => d > e.date); i = i < 0 ? days.length - 1 : Math.max(0, i - 1); }
    else { i = days.findIndex(d => d >= e.date); if (i < 0) continue; }
    const k = keyOf(timeOf(bars[i]));
    if (!groups.has(k)) groups.set(k, { i, es: [] });
    groups.get(k).es.push(e);
  }
  const rank = { mine: -1, key: 0, trial: 1, paper: 2, news: 3 };
  const marks = [];
  for (const [k, g] of groups) {
    g.es.sort((a, b) => rank[a.type] - rank[b.type]);
    // your own buys and sells get their own arrows, under the bar for a buy and over it for a sell
    for (const m of g.es.filter(e => e.type === 'mine')) marks.push({ time: timeOf(bars[g.i]), position: m.side === 'SELL' ? 'aboveBar' : 'belowBar', color: m.side === 'SELL' ? DOWN : UP, shape: m.side === 'SELL' ? 'arrowDown' : 'arrowUp', text: m.side === 'SELL' ? 'S' : 'B', size: 1.2, id: 'mine:' + k + m.id });
    const others = g.es.filter(e => e.type !== 'mine');
    if (!others.length) continue;
    const top = others[0].type, n = others.length;
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
  if (!groups.get(S.sel)) return pinHint(view);
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
  q(view, '[data-ftype]').innerHTML = [['all', 'Everything']].concat(Object.entries(TYPES).filter(([k]) => k !== 'catalyst' && k !== 'mine').map(([k, x]) => [k, x.label])).map(([k, l]) => `<button data-ftype="${k}" class="${S.fType === k ? 'is-active' : ''}">${l}${k !== 'all' && counts[k] ? ` <small>${counts[k]}</small>` : ''}</button>`).join('');
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

/* ------------------------------------------------------------ Trading 212 */
const gbp = (v, cur) => v == null ? '–' : (v < 0 ? '−' : '') + ({ GBP: '£', USD: '$', EUR: '€' }[cur] || (cur ? cur + ' ' : '£')) + Math.abs(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pnlCls = v => v > 0 ? 'is-up' : v < 0 ? 'is-down' : '';
function tzSetup() {
  const live = tz.status && tz.status.env === 'live';
  return `<h2>My Trading 212</h2>
    <p class="wl-dim">Link your Trading 212 ${live ? 'real-money' : 'practice'} account to see your holdings here, your buys and sells on the chart, and a trading journal filled in from your orders. The link is read-only: the site can't place or cancel trades.</p>
    <ol class="wl-steps">
      <li>In the Trading 212 app, switch to the <b>practice</b> Invest account (☰ menu, switch at the bottom).</li>
      <li>☰ → <b>Settings</b> → <b>API (Beta)</b> → accept the risk warning → <b>Generate API key</b>.</li>
      <li>Tick only <b>Account data</b>, <b>Portfolio</b> and <b>History</b>. Leave <b>Orders</b> unticked.</li>
      <li>Name it "study site". IP access: <b>unrestricted</b> (the site has no fixed address; the missing Orders permission is what keeps it safe).</li>
      <li>Copy the API key and the secret (the secret is shown once). Don't paste them anywhere but the terminal.</li>
      <li>In the study-app folder run <code>npx wrangler secret put T212_API_KEY</code> and paste the key, then <code>npx wrangler secret put T212_API_SECRET</code> and paste the secret. The site uses them straight away.</li>
    </ol>`;
}
function tzPanel(view) {
  const el = q(view, '[data-t212]'); if (!el) return;
  if (!tz.status) { el.innerHTML = '<h2>My Trading 212</h2><div class="wl-empty"><span class="books-spinner"></span></div>'; return; }
  if (!tz.status.configured) { el.innerHTML = tzSetup(); return; }
  const a = tz.account, cur = a ? a.currency : 'GBP';
  const tag = `<span class="wl-tag">${tz.status.env === 'live' ? 'Real money' : 'Practice'}</span>`;
  if (tz.accErr && !a) { el.innerHTML = `<h2>My Trading 212 ${tag}</h2><div class="wl-notice">${esc(tz.accErr)}</div>`; return; }
  if (!a) { el.innerHTML = `<h2>My Trading 212 ${tag}</h2><div class="wl-empty"><span class="books-spinner"></span> Loading your account…</div>`; return; }
  const ret = a.cost ? 100 * (a.unrealised || 0) / a.cost : null;
  const stat = (k, v, cls = '') => `<div class="wl-stat"><span>${k}</span><b class="${cls}">${v}</b></div>`;
  const pos = a.positions.slice().sort((x, y) => (y.value || 0) - (x.value || 0)).map(x => {
    const watched = co(x.symbol), pct = x.cost ? 100 * (x.pnl || 0) / x.cost : null;
    return `<div class="wl-pos"${watched ? ` style="--co:${watched.color}"` : ''}>
      <div class="wl-pos-name">${watched ? `<button class="wl-tick-s" data-sym="${x.symbol}">${esc(x.symbol)}</button>` : `<b class="wl-tick-s">${esc(x.symbol)}</b>`}<span>${esc(x.name)}</span></div>
      <div class="wl-pos-num"><span>${x.quantity != null ? +x.quantity.toFixed(4) : '–'} @ ${money(x.avgPrice, x.currency)}</span><span>now ${money(x.price, x.currency)}</span></div>
      <div class="wl-pos-val"><b>${gbp(x.value, cur)}</b><span class="${pnlCls(x.pnl)}">${x.pnl != null ? (x.pnl > 0 ? '+' : '') + gbp(x.pnl, cur) : ''}${pct != null ? ` (${signed(pct)})` : ''}</span></div>
    </div>`; }).join('');
  el.innerHTML = `<h2>My Trading 212 ${tag}${tz.account.stale ? '<span class="wl-dim wl-asof">saved copy, Trading 212 didn\'t answer</span>' : ''}</h2>
    <div class="wl-stats">${stat('Account value', gbp(a.totalValue, cur))}${stat('Cash free', gbp(a.cash, cur))}${stat('Invested', gbp(a.invested, cur))}${stat('Open profit/loss', (a.unrealised > 0 ? '+' : '') + gbp(a.unrealised, cur) + (ret != null ? ` <small>${signed(ret)}</small>` : ''), pnlCls(a.unrealised))}${stat('Banked profit/loss', (a.realised > 0 ? '+' : '') + gbp(a.realised, cur), pnlCls(a.realised))}</div>
    <p class="wl-ex">Account value is cash plus everything invested, at today's prices. Cash free is money not yet invested. Invested is the current value of your shares. Open profit/loss is the gain or loss on shares you still hold (it only becomes real when you sell). Banked profit/loss is what you've actually made or lost on shares already sold. In holdings, "48.2 @ $4.05" means 48.2 shares bought at an average of $4.05 each; the £ figure is their value now, and the line under it the profit or loss in pounds and percent, after currency changes.</p>
    ${pos ? `<h3>Holdings</h3><div class="wl-positions">${pos}</div>` : '<p class="wl-dim">No open positions.</p>'}
    <h3>Trading journal</h3>
    <p class="wl-ex">Every order you place appears here by itself. Fill in why you did it and what would make you sell, before or right after you trade; come back 2 to 4 weeks later and write the lesson. Use "Add note" for shares you looked at and decided to skip: those teach as much as trades.</p>
    <form class="wl-jadd" data-jadd>
      <input type="date" name="date" value="${today()}" aria-label="Date">
      <input name="ticker" placeholder="Ticker" maxlength="10" aria-label="Ticker" list="wl-syms">
      <datalist id="wl-syms">${CFG.companies.map(c => `<option value="${c.symbol}">`).join('')}</datalist>
      <select name="decision" aria-label="Decision"><option>Skip</option><option>Watch</option><option>Idea</option></select>
      <input name="thesis" placeholder="Why (one sentence)" maxlength="400" aria-label="Why">
      <button class="wl-btn" type="submit">Add note</button>
    </form>
    <div class="wl-journal" data-journal>${journalRows(cur)}</div>`;
}
function journalRows(cur) {
  const notes = new Map(tz.journal.map(j => [j.id, j]));
  const rows = tz.orders.filter(o => !o.status || o.status === 'FILLED' || o.quantity).map(o => ({ o, j: notes.get(o.id) || {}, date: (o.at || '').slice(0, 10) }));
  for (const j of tz.journal) if (!tz.orders.some(o => o.id === j.id)) rows.push({ o: null, j, date: j.date });
  rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  if (!rows.length) return '<p class="wl-dim">Your orders appear here once you trade in the linked account. Add notes for things you decided not to buy, too.</p>';
  const field = (id, k, label, v, ph) => `<label><span>${label}</span><textarea data-jid="${esc(id)}" data-jk="${k}" rows="2" placeholder="${ph}">${esc(v || '')}</textarea></label>`;
  return rows.slice(0, 80).map(({ o, j, date }) => {
    const id = o ? o.id : j.id, sym = o ? o.symbol : j.ticker, c = co(sym);
    const head = o
      ? `<b class="${o.side === 'SELL' ? 'is-down' : 'is-up'}">${o.side === 'SELL' ? 'Sold' : 'Bought'}</b> ${o.quantity != null ? +(+o.quantity).toFixed(4) : ''} ${esc(sym)} at ${money(o.price, o.currency)}${o.value != null ? ` · ${gbp(Math.abs(o.value), cur)}` : ''}${o.fees ? ` · fees ${gbp(o.fees, cur)}` : ''}${o.pnl ? ` · <span class="${pnlCls(o.pnl)}">${o.pnl > 0 ? '+' : ''}${gbp(o.pnl, cur)} banked</span>` : ''}`
      : `<b>${esc(j.decision || 'Note')}</b> ${esc(sym || '')}`;
    const done = j.thesis || j.lesson;
    return `<details class="wl-jrow"${c ? ` style="--co:${c.color}"` : ''}${!done && o ? ' open' : ''}>
      <summary><span class="wl-up-date">${date ? fmtDate(date) : ''}</span><span>${head}</span>${!done ? '<em class="wl-dim">add notes</em>' : ''}</summary>
      <div class="wl-jfields">${field(id, 'thesis', 'Why', j.thesis, 'The reason, in one sentence')}${field(id, 'sell_rule', 'Sell rule', j.sell_rule, 'What would make you sell?')}${field(id, 'lesson', 'Lesson (later)', j.lesson, 'Fill in 2 to 4 weeks later')}
      ${o ? '' : `<button class="wl-x" data-jdel="${esc(id)}" title="Delete note">${icon('x')}</button>`}</div>
      <input type="hidden" data-jmeta="${esc(id)}" data-ticker="${esc(sym || '')}" data-date="${esc(date || '')}" data-decision="${esc(o ? o.side : j.decision || '')}">
    </details>`;
  }).join('');
}
async function saveJournal(view, id) {
  const meta = q(view, `[data-jmeta="${CSS.escape(id)}"]`); if (!meta) return;
  const val = k => { const t = q(view, `textarea[data-jid="${CSS.escape(id)}"][data-jk="${k}"]`); return t ? t.value : ''; };
  const body = { id, ticker: meta.dataset.ticker, date: meta.dataset.date, decision: meta.dataset.decision, thesis: val('thesis'), sell_rule: val('sell_rule'), lesson: val('lesson') };
  try { await api('../t212/journal', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); } catch (e) { return; }
  const i = tz.journal.findIndex(j => j.id === id);
  if (i >= 0) tz.journal[i] = Object.assign(tz.journal[i], body); else tz.journal.push(body);
}
async function loadT212(view) {
  try { tz.status = await api('../t212/status'); } catch (e) { tz.status = { configured: false }; }
  tools(view); tzPanel(view);
  if (!tz.status.configured) return;
  const [acc, ord, jr] = await Promise.all([api('../t212/account').catch(() => null), api('../t212/orders').catch(() => null), api('../t212/journal').catch(() => null)]);
  if (acc && !acc.error) { tz.account = acc; tz.accErr = null; } else tz.accErr = (acc && acc.message) || 'Couldn\'t reach Trading 212.';
  if (ord && ord.orders) {
    tz.orders = ord.orders;
    tz.mine = ord.orders.filter(o => o.at && o.quantity).map(o => ({ id: o.id, symbol: o.symbol, side: o.side, date: o.at.slice(0, 10), type: 'mine', source: tz.status.env === 'live' ? 'Trading 212' : 'Trading 212 practice',
      title: `${o.side === 'SELL' ? 'You sold' : 'You bought'} ${+(+o.quantity).toFixed(4)} at ${money(o.price, o.currency)}`, detail: o.value != null ? `${gbp(Math.abs(o.value), tz.account ? tz.account.currency : 'GBP')} including fees of ${gbp(o.fees || 0, tz.account ? tz.account.currency : 'GBP')}` : '' }));
  }
  if (jr && jr.entries) tz.journal = jr.entries;
  tzPanel(view);
  if (chart && mainSeries) mainSeries.setMarkers(markerGroups());
}

/* ------------------------------------------------------------ pipeline and decision check */
const PHASES = ['Preclinical', 'Phase 1', 'Phase 1/2', 'Phase 2', 'Phase 2/3', 'Phase 3', 'Filed', 'Approved'];
const PHASE_EX = { 'Preclinical': 'tested in cells and animals only', 'Phase 1': 'first human tests: safety and dose', 'Phase 1/2': 'safety plus a first look at whether it works', 'Phase 2': 'does it work in patients (often a biomarker)', 'Phase 2/3': 'combined: activity then proof of benefit', 'Phase 3': 'large trial proving benefit; supports approval', 'Filed': 'submitted to a regulator for approval', 'Approved': 'on sale' };
const DEFAULT_RULES = { accountGBP: 1000, useT212: false, satellitePct: 20, perCompanyPct: 20, maxPositions: 5, binaryDays: 30, binaryCut: 50, minRunwayMonths: 18, runupPct: 30, worstLossPct: 90, coreTickers: 'VWRP,VWRL,VUAG,VUSA,SWDA,VHVG' };
let PIPE = null, metricsData = null, rules = Object.assign({}, DEFAULT_RULES), cfOnly = store.get('wl:cfonly', false);
const RULE_FIELDS = [
  ['accountGBP', 'Account size (£), used when Trading 212 isn\'t linked', 'The total money you invest or practise with.'],
  ['satellitePct', 'Satellite share of the account (%)', 'The part for individual biotech shares. The rest is the core index fund. The guides use 20%.'],
  ['perCompanyPct', 'Most in one company (% of satellite)', 'Caps how much one company can hurt you. 20% of a £200 satellite is £40.'],
  ['maxPositions', 'Most companies held at once', 'Spreads the risk across several bets; core index funds don\'t count.'],
  ['binaryDays', 'Binary event warning window (days)', 'How close to a big readout or FDA decision counts as "right before" it.'],
  ['binaryCut', 'Cut size before a binary event by (%)', 'Before a coin-flip event, a smaller position limits the overnight loss if it fails.'],
  ['minRunwayMonths', 'Minimum cash runway (months)', 'Below this, the company will probably sell new shares soon, usually at a discount.'],
  ['runupPct', 'Flag a 3-month rise above (%)', 'A big run-up means high hopes are already in the price ("sell the news" risk).'],
  ['worstLossPct', 'Assume a failed readout costs (%)', 'Used for the worst-case figure. Single-drug biotechs often fall 70 to 90% on a failure.'],
  ['coreTickers', 'Core fund tickers (not counted as positions)', 'Your index funds, separated by commas.'],
];
const monthsUntil = ym => { if (!ym) return null; const [y, m] = ym.split('-').map(Number); const n = new Date(); return (y - n.getUTCFullYear()) * 12 + (m - 1 - n.getUTCMonth()); };
const daysUntil = d => Math.round((Date.parse(d) - Date.parse(today())) / 864e5);
const usdShort = v => v == null ? '–' : v >= 1e9 ? '$' + (v / 1e9).toFixed(2) + 'B' : '$' + (v / 1e6).toFixed(0) + 'M';

function evaluate(sym) {
  const c = co(sym), P = PIPE && PIPE.companies[sym] || {}, f = P.finance || {}, r = rules;
  const x = quotes && quotes.quotes ? quotes.quotes[sym] : null, m = metricsData && metricsData[sym];
  const linked = r.useT212 && tz.account && tz.account.totalValue != null;
  const account = linked ? tz.account.totalValue : +r.accountGBP;
  const sat = account * r.satellitePct / 100, cap = sat * r.perCompanyPct / 100;
  const pos = linked ? tz.account.positions : [];
  const held = (pos.find(p => p.symbol === sym) || {}).value || 0;
  const core = String(r.coreTickers || '').toUpperCase().split(/[\s,]+/).filter(Boolean);
  const others = pos.filter(p => p.symbol !== sym && !core.includes(p.symbol)).length;
  const rows = [], change = [];
  let factor = 1;
  const add = (state, title, result, why, link) => rows.push({ state, title, result, why, link });
  // 1 binary event
  const upcomingEv = (P.binary_events || []).filter(e => e.window_start && daysUntil(e.window_start) >= -200).sort((a, b) => (a.window_start < b.window_start ? -1 : 1));
  const next = upcomingEv[0];
  if (next) {
    const d = daysUntil(next.window_start), exact = /^\d{4}-\d{2}-\d{2}$/.test(next.window_text || '') || /\d{1,2} [A-Z][a-z]+ \d{4}/.test(next.window_text || '');
    const near = d <= r.binaryDays;
    if (near) { factor *= 1 - r.binaryCut / 100; change.push(`After ${next.label} (${next.window_text}) the binary-event cut no longer applies.`); }
    add(near ? 'wait' : 'ok', 'Binary event', `${next.label}: ${next.window_text}${d > 0 ? ` (${exact ? '' : 'earliest '}${d} days away)` : d === 0 ? ' (today)' : ' (may happen any day)'}. ${near ? `Inside your ${r.binaryDays}-day window, so the size is cut by ${r.binaryCut}%.` : `Outside your ${r.binaryDays}-day window.`}`,
      'A readout or FDA decision can move a small biotech 30 to 90% overnight, and stop-losses don\'t protect you because the price gaps. Your rule keeps positions small right before one. Dates given as a period (like "H1 2027") are counted from the earliest day of that period.' + (upcomingEv.length > 1 ? ' Also ahead: ' + upcomingEv.slice(1).map(e => `${e.label} (${e.window_text})`).join('; ') + '.' : ''), 'Binary event');
  } else add('info', 'Binary event', 'No dated readout or FDA decision found in the research.', 'Without a scheduled coin-flip event, the price moves more on results, news and the market.', 'Binary event');
  // a going-concern warning in the filings is the company's own auditors doubting it can keep operating
  if (f.note && /going concern/i.test(f.note)) add('wait', 'Going-concern warning', f.note, 'Companies must say when there is "substantial doubt" they can keep going for the next 12 months without new money. It usually means a share sale, a deal or cuts are coming soon, and existing shareholders often lose out. This is a built-in check, not one of your rules.', 'Share dilution');
  else if (f.note) add('info', 'From the latest filing', f.note, 'Context from the company\'s own results and filings.', null);
  // 2 runway
  const months = f.runway_until ? monthsUntil(f.runway_until) : null;
  if (f.runway_guidance && /profit/i.test(f.runway_guidance)) add('ok', 'Cash runway', 'Profitable: it funds itself from sales.', 'A profitable company doesn\'t need to sell new shares to keep going.', 'Cash runway');
  else if (months != null) {
    const short = months < r.minRunwayMonths;
    if (short) change.push('A share sale or partnership that extends the runway would clear the runway rule.');
    add(short ? 'wait' : 'ok', 'Cash runway', `Company says: "${f.runway_guidance}" (about ${months} months). ${short ? `Under your ${r.minRunwayMonths}-month minimum.` : `Above your ${r.minRunwayMonths}-month minimum.`}`,
      'When cash runs low, biotechs sell new shares, usually at a discount, which makes each existing share worth less (dilution). Buying just before that means buying high.', 'Cash runway');
  } else add('info', 'Cash runway', 'No runway figure in the research.', 'Runway is how long the cash lasts at the current spending rate.', 'Cash runway');
  // 3 run-up
  if (m && m.ch3m != null) {
    const hot = m.ch3m > r.runupPct;
    if (hot) change.push(`A 3-month change back under ${r.runupPct}% clears the run-up flag.`);
    add(hot ? 'wait' : 'ok', 'Run-up', `${signed(m.ch3m)} over 3 months (1 month ${signed(m.ch1m)}, 1 year ${signed(m.ch1y)}). ${hot ? `Above your ${r.runupPct}% flag.` : `Below your ${r.runupPct}% flag.`}`,
      'A share that has already risen a lot has good news priced in: it needs better-than-hoped news to keep rising, and often falls on merely good news.', 'Run-up');
  } else add('info', 'Run-up', 'Price history not loaded yet.', 'Shows how much hope is already in the price.', 'Run-up');
  // 4 valuation vs cash
  if (x && f.shares_outstanding && f.cash_and_investments_usd) {
    const mc = x.price * f.shares_outstanding, ev = mc - f.cash_and_investments_usd;
    add('info', 'Value vs cash', `Market cap about ${usdShort(mc)} (price ${money(x.price)} × ${(f.shares_outstanding / 1e6).toFixed(1)}M shares); cash ${usdShort(f.cash_and_investments_usd)} at ${f.as_of}. ${ev < 0 ? `The market values the company at ${usdShort(-ev)} less than its cash.` : `So the market values the drugs and pipeline at about ${usdShort(ev)} (enterprise value).`}`,
      ev < 0 ? 'Worth less than its cash means the market expects much of that cash to be spent on programmes that fail. That can be a bargain or a trap.' : 'Enterprise value (market cap minus cash) is what the market is paying for the science itself. Compare it with what the pipeline could earn.', 'Enterprise value');
  }
  // 5 trend
  if (m && m.ma200 && x) add('info', 'Long-term trend', `Price ${money(x.price)} is ${x.price >= m.ma200 ? 'above' : 'below'} its 200-day average (${money(m.ma200)}).`, 'Above a rising 200-day average is a long-term uptrend; below a falling one, a downtrend. It lags, so it says little straight after big news.', 'Moving average');
  // 6 diversification and cap
  if (linked && others >= r.maxPositions && !held) add('block', 'Number of positions', `You hold ${others} other satellite companies; your limit is ${r.maxPositions}.`, 'More positions than you can follow properly means decisions get lazy. Sell one before adding another.', 'Position sizing');
  else if (linked) add('ok', 'Number of positions', `${others} other satellite ${others === 1 ? 'company' : 'companies'} held; your limit is ${r.maxPositions}.`, 'Several smaller bets beat one big one in biotech, because most single bets lose.', 'Position sizing');
  if (held >= cap && cap > 0) add('block', 'Company limit', `You already hold ${gbp(held)} here, at or above your ${gbp(cap)} limit for one company.`, 'Adding more to one company raises how much a single bad readout can take from you.', 'Position sizing');
  const room = Math.max(0, cap - held), size = Math.floor(room * factor);
  const state = rows.some(r => r.state === 'block') ? 'block' : rows.some(r => r.state === 'wait') ? 'wait' : 'ok';
  const math = [`${linked ? 'Account value from Trading 212' : 'Account size you set'}: ${gbp(account)}`, `Satellite (${r.satellitePct}%): ${gbp(sat)}`, `One-company limit (${r.perCompanyPct}% of satellite): ${gbp(cap)}`]
    .concat(held ? [`Already held: ${gbp(held)}, leaving ${gbp(room)}`] : [])
    .concat(factor < 1 ? [`Binary event cut (−${r.binaryCut}%): ${gbp(room)} × ${factor.toFixed(2)} = ${gbp(size)}`] : []);
  return { c, P, rows, state, size, worst: size * r.worstLossPct / 100, math, change, linked };
}

const STATE = { ok: ['✓', 'Your rules: OK to consider', 'Every rule you set is met. That only means the rules are met; it isn\'t a prediction that the share will rise.'],
  wait: ['!', 'Your rules say: wait or go smaller', 'At least one rule flags a risk right now. The lines below say which and what would change it.'],
  block: ['✕', 'Your rules say: not allowed', 'A hard limit (company or position count) is already reached.'] };
function decidePanel(view) {
  const el = q(view, '[data-decide]'); if (!el) return;
  if (!PIPE) { el.innerHTML = '<h2>Pipeline and decision check</h2><div class="wl-empty"><span class="books-spinner"></span></div>'; return; }
  const e = evaluate(S.sym), st = STATE[e.state], c = e.c, P = e.P;
  el.style.setProperty('--co', c.color);
  const tl = t => B.exists('02 Key Terms/' + t) ? ` ${termLink(t)}` : '';
  const pipe = (P.pipeline || []).filter(p => !cfOnly || p.cf);
  const track = p => { const i = PHASES.indexOf(p.phase); return `<div class="wl-track${p.status === 'stopped' ? ' is-stopped' : ''}" title="${esc(p.phase || '')}: ${esc(PHASE_EX[p.phase] || '')}">${PHASES.map((_, j) => `<i class="${j <= i ? 'on' : ''}"></i>`).join('')}</div>`; };
  el.innerHTML = `<h2>Pipeline and decision check <span class="wl-dim wl-asof">${esc(c.name)}${PIPE.asOf ? ' · researched ' + esc(fmtDate(PIPE.asOf)) : ''}</span></h2>
    <p class="wl-ex">The pipeline is every drug the company is developing and how far each has got. The decision check runs your own rules (editable below) against live prices, the pipeline and your Trading 212 account. It shows what your rules allow and why; it doesn't predict the price.</p>
    <div class="wl-pipehead"><h3>Pipeline</h3><label class="wl-check"><input type="checkbox" data-cfonly ${cfOnly ? 'checked' : ''}> CF only</label></div>
    <div class="wl-phaselegend">${PHASES.map(p => `<span title="${esc(PHASE_EX[p])}">${p}</span>`).join('')}</div>
    <p class="wl-ex">Each bar has 8 steps, from Preclinical (left) to Approved (right); filled steps show how far a drug has got. Only about 8% of drugs entering Phase 1 reach approval, so drugs further right are much more likely to make money. Greyed bars are stopped programmes.</p>
    <div class="wl-pipe">${pipe.length ? pipe.map(p => `<div class="wl-prog${p.status === 'stopped' ? ' is-stopped' : ''}">
      <div class="wl-prog-name"><b>${esc(p.drug || p.name || '')}</b>${p.cf ? '<span class="wl-cf">CF</span>' : ''}${p.status === 'partnered' ? '<span class="wl-cf wl-partner">partnered</span>' : ''}${p.status === 'stopped' ? '<span class="wl-cf wl-stop">stopped</span>' : ''}<span>${esc(p.disease || '')}${p.approach ? ' · ' + esc(p.approach) : ''}</span></div>
      <div class="wl-prog-phase">${track(p)}<small>${esc(p.phase || 'Stage not disclosed')}</small></div>
      <div class="wl-prog-next">${p.next ? `<b>Next:</b> ${esc(p.next)}` : ''}${p.note ? `<span>${esc(p.note)}</span>` : ''}</div></div>`).join('') : '<p class="wl-dim">No pipeline researched for this company yet.</p>'}</div>
    <h3>Decision check</h3>
    <div class="wl-verdict is-${e.state}"><b>${st[0]}</b><div><strong>${st[1]}</strong><span>${st[2]}</span></div></div>
    <div class="wl-rules">${e.rows.map(r => `<details class="wl-rule is-${r.state}"><summary><i>${{ ok: '✓', wait: '!', block: '✕', info: 'i' }[r.state]}</i><b>${r.title}</b><span>${esc(r.result)}</span></summary><p>${esc(r.why)}${r.link ? tl(r.link) : ''}</p></details>`).join('')}</div>
    <div class="wl-size">
      <div><span>Most your rules allow in ${esc(c.symbol)} now</span><b>${gbp(e.size)}</b><small>Worst realistic case on a failed readout: −${gbp(e.worst)} (${rules.worstLossPct}%)</small></div>
      <ol>${e.math.map(l => `<li>${esc(l)}</li>`).join('')}</ol>
    </div>
    <p class="wl-ex">This is the ceiling from your rules, not a target: buying less, or nothing, is always allowed. If you do buy, write the reason and a sell rule in the journal first.</p>
    ${e.change.length ? `<h3>What would change this</h3><ul class="wl-change">${e.change.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    <details class="wl-rulesedit"><summary>Your rules</summary>
      <p class="wl-ex">These are the numbers the check uses. They start as the examples from the Event playbook and How money is actually made guides. Change them as you learn what suits you; they're saved on the site, so phone and laptop share them.</p>
      <div class="wl-rulegrid">${RULE_FIELDS.map(([k, label, ex]) => `<label><span>${label}</span><input data-rule="${k}" ${k === 'coreTickers' ? 'type="text"' : 'type="number" min="0" step="any"'} value="${esc(rules[k])}"><small>${ex}</small></label>`).join('')}
      <label class="wl-check"><input type="checkbox" data-rule="useT212" ${rules.useT212 ? 'checked' : ''}> Use the Trading 212 account value instead</label><small class="wl-dim">Leave this off while practising: the practice account's huge virtual balance would make every limit unrealistically big. Turn it on once the linked account holds your real amount.</small></div>
      <button class="wl-btn" data-rulesreset>Back to the guide examples</button>
    </details>
    ${PIPE.companies[S.sym] && PIPE.companies[S.sym].sources ? `<details class="wl-src"><summary>Sources for this company</summary>${PIPE.companies[S.sym].sources.map(u => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https?:\/\/(www\.)?/, '').slice(0, 80))}</a>`).join('')}</details>` : ''}`;
}
async function loadDecide(view) {
  const [pp, mm, rr] = await Promise.all([fetch('data/pipeline.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : { companies: {} }).catch(() => ({ companies: {} })), api('metrics').catch(() => null), api('rules').catch(() => null)]);
  PIPE = pp; metricsData = mm && !mm.error ? mm : null;
  if (rr && rr.rules) rules = Object.assign({}, DEFAULT_RULES, rr.rules);
  decidePanel(view); cards(view);
}
let rulesTimer = null;
function saveRules() { clearTimeout(rulesTimer); rulesTimer = setTimeout(() => api('rules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rules) }).catch(() => {}), 600); }

/* ------------------------------------------------------------ data */
async function loadQuotes(view) {
  try { const r = await api('quotes'); if (r.error) quoteErr = r.error; else { quotes = r; quoteErr = null; } }
  catch (e) { if (e.auth) return; quoteErr = 'network'; }
  notice(view); cards(view); chartTop(view); decidePanel(view);
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
    if (S.show.mine === undefined) S.show.mine = true;
    loadT212(view).then(() => decidePanel(view));
    loadDecide(view);
    timer = setInterval(() => { if (!document.hidden) loadQuotes(view); }, 120000);
    const save = () => { store.set('wl:sym', S.sym); store.set('wl:iv', S.iv); store.set('wl:zoom', S.zoom); store.set('wl:style', S.style); store.set('wl:ma', S.ma); store.set('wl:show', S.show); };
    view.addEventListener('change', e => {
      const t = e.target;
      if (t.matches('[data-cfonly]')) { cfOnly = t.checked; store.set('wl:cfonly', cfOnly); decidePanel(view); return; }
      if (t.matches('[data-rule]')) {
        const k = t.dataset.rule;
        rules[k] = t.type === 'checkbox' ? t.checked : t.type === 'number' ? (t.value === '' ? DEFAULT_RULES[k] : Math.max(0, +t.value)) : t.value;
        saveRules(); const open = q(view, '.wl-rulesedit').open; decidePanel(view); if (open) q(view, '.wl-rulesedit').open = true;
      }
    });
    view.addEventListener('focusout', e => { const t = e.target; if (t.matches && t.matches('textarea[data-jid]')) saveJournal(view, t.dataset.jid); });
    view.addEventListener('submit', async e => {
      const f = e.target.closest('[data-jadd]'); if (!f) return;
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      if (!d.ticker && !d.thesis) return;
      try { const r = await api('../t212/journal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticker: d.ticker, date: d.date, decision: d.decision, thesis: d.thesis }) });
        tz.journal.push({ id: r.id, ticker: (d.ticker || '').toUpperCase(), date: d.date, decision: d.decision, thesis: d.thesis }); tzPanel(view); } catch (err) { /* stays in the form */ }
    });
    view.ondblclick = e => { if (e.target.closest('[data-chart]')) applyZoom(); };
    view.onclick = async e => {
      const t = e.target;
      const card = t.closest('[data-sym]');
      if (card && !t.closest('a')) { S.sym = card.dataset.sym; S.sel = null; save(); cards(view); chartTop(view); decidePanel(view); loadBars(view); return; }
      if (t.closest('[data-explain]')) { S.explain = !S.explain; store.set('wl:explain', S.explain); q(view, '.wl').classList.toggle('is-explain', S.explain); t.closest('[data-explain]').classList.toggle('is-on', S.explain); return; }
      if (t.closest('[data-rulesreset]')) { rules = Object.assign({}, DEFAULT_RULES); saveRules(); decidePanel(view); return; }
      const iv = t.closest('[data-iv]'); if (iv) { S.iv = iv.dataset.iv; S.sel = null; save(); tools(view); loadBars(view); return; }
      const z = t.closest('[data-zoom]'); if (z) { S.zoom = z.dataset.zoom; save(); tools(view); applyZoom(); return; }
      const st = t.closest('[data-style]'); if (st) { S.style = st.dataset.style; save(); tools(view); drawChart(view, true); return; }
      if (t.closest('[data-ma]')) { S.ma = !S.ma; save(); tools(view); drawChart(view, true); return; }
      const mk = t.closest('[data-mark]'); if (mk) { S.show[mk.dataset.mark] = !S.show[mk.dataset.mark]; save(); tools(view); if (mainSeries) mainSeries.setMarkers(markerGroups()); if (!groups.has(S.sel)) pinHint(view); return; }
      const jd = t.closest('[data-jdel]');
      if (jd) { const id = jd.dataset.jdel; try { await api('../t212/journal', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, delete: true }) }); } catch (err) { return; } tz.journal = tz.journal.filter(j => j.id !== id); tzPanel(view); return; }
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
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'assets/watchlist.css?v=20261111'; document.head.appendChild(l);
}
})();
