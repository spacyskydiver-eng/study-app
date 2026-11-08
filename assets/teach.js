/* Teaching chart for the live watchlist: a second price chart with lessons drawn on it (arrows, zones,
   lines, labels), plus the code that finds lessons in the latest trading days and replays simple
   trading rules over past prices. Everything here is worked out from real daily prices; nothing is
   a forecast. Used by assets/watchlist.js. */
(() => {
'use strict';
const UP = '#10B981', DOWN = '#F43F5E', AMBER = '#F59E0B', BLUE = '#60A5FA', PURPLE = '#C084FC', GREY = '#94A3B8';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtD = d => { const [y, m, dd] = d.slice(0, 10).split('-'); return `${+dd} ${MON[+m - 1]} ${y}`; };
const usd = v => '$' + (v >= 1000 ? Math.round(v).toLocaleString('en-GB') : v.toFixed(2));
const pc = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '%';
const day = b => b[0].slice(0, 10);
const css = n => getComputedStyle(document.body).getPropertyValue(n).trim();

/* ------------------------------------------------------------ the chart with drawings */
function chart(host, opts = {}) {
  const L = window.LightweightCharts;
  host.innerHTML = '';
  host.classList.add('tc-host');
  const box = document.createElement('div'); box.className = 'tc-chart'; host.appendChild(box);
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('class', 'tc-svg'); host.appendChild(svg);
  const grid = css('--background-modifier-border') || 'rgba(128,128,128,.2)';
  const c = L.createChart(box, {
    autoSize: true,
    layout: { background: { type: 'solid', color: 'transparent' }, textColor: css('--text-muted') || '#9aa', fontFamily: getComputedStyle(document.body).fontFamily, fontSize: 11 },
    grid: { vertLines: { color: grid, style: 2 }, horzLines: { color: grid, style: 2 } },
    rightPriceScale: { borderColor: grid, scaleMargins: { top: 0.14, bottom: 0.08 } },
    timeScale: { borderColor: grid, rightOffset: 3 },
    localization: { priceFormatter: v => (v < 0 ? '' : v >= 1000 ? v.toFixed(0) : v.toFixed(2)) },
    handleScale: { axisPressedMouseMove: { time: true, price: true } },
  });
  const candles = c.addCandlestickSeries({ upColor: UP, downColor: DOWN, wickUpColor: UP, wickDownColor: DOWN, borderVisible: false, priceLineVisible: false, lastValueVisible: true });
  let extra = [], bars = [], anns = [], days = [];
  const barAt = d => { let i = days.findIndex(x => x >= d); if (i < 0) i = days.length - 1; return i; };
  const priceOf = (p, d) => {
    if (typeof p === 'number') return p;
    if (p && typeof p === 'object') { const b = bars[barAt(p.d)]; return (b ? b[{ open: 1, high: 2, low: 3, close: 4 }[p.ref || 'close']] : 0) * (p.k || 1); }
    const b = bars[barAt(d)]; if (!b) return 0;
    return b[{ open: 1, high: 2, low: 3, close: 4 }[p || 'close']];
  };
  const x = d => c.timeScale().timeToCoordinate(days[barAt(d)]);
  const y = p => candles.priceToCoordinate(p);
  const el = (tag, attrs, text) => { const e = document.createElementNS(svgNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; svg.appendChild(e); return e; };
  function label(px, py, text, color, align = 'middle', above = true) {
    if (!text || px == null || py == null) return;
    const lines = String(text).split('\n');
    const w = Math.max(...lines.map(l => l.length)) * 6.1 + 12, h = lines.length * 14 + 6;
    let lx = align === 'start' ? px : align === 'end' ? px - w : px - w / 2;
    const W = host.clientWidth - 60; lx = Math.max(2, Math.min(lx, W - w));
    const H = box.clientHeight;
    let ly = above ? py - h - 6 : py + 6;
    ly = Math.max(2, Math.min(ly, H - h - 30));   // labels stay inside the chart
    el('rect', { x: lx, y: ly, width: w, height: h, rx: 6, fill: 'rgba(10,12,24,.88)', stroke: color, 'stroke-width': 1 });
    lines.forEach((l, i) => el('text', { x: lx + 6, y: ly + 15 + i * 14, fill: '#E5E7EB', 'font-size': 11, 'font-weight': i === 0 ? 600 : 400 }, l));
  }
  function draw() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const H = box.clientHeight, W = box.clientWidth;
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    el('defs', {}).innerHTML = [UP, DOWN, AMBER, BLUE, PURPLE, GREY].map((col, i) => `<marker id="tc-ah${i}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${col}"/></marker>`).join('');
    const mk = col => `url(#tc-ah${Math.max(0, [UP, DOWN, AMBER, BLUE, PURPLE, GREY].indexOf(col))})`;
    const later = [];
    for (const a of anns) {
      const col = a.color || BLUE;
      if (a.t === 'zone') {
        const x1 = x(a.d1), x2 = x(a.d2); if (x1 == null || x2 == null) continue;
        el('rect', { x: Math.min(x1, x2) - 3, y: 0, width: Math.abs(x2 - x1) + 6, height: H - 28, fill: col, opacity: .1 });
        el('line', { x1: x1 - 3, x2: x1 - 3, y1: 0, y2: H - 28, stroke: col, 'stroke-dasharray': '3 4', opacity: .6 });
        later.push(() => label((x1 + x2) / 2, 22, a.label, col, 'middle', false));
      } else if (a.t === 'hline') {
        const py = y(priceOf(a.p, a.d1)); if (py == null) continue;
        const x1 = a.d1 ? x(a.d1) : 0, x2 = a.d2 ? x(a.d2) : W - 60;
        el('line', { x1: x1 == null ? 0 : x1, x2: x2 == null ? W - 60 : x2, y1: py, y2: py, stroke: col, 'stroke-width': 1.5, 'stroke-dasharray': a.dash === false ? '' : '6 4' });
        later.push(() => label(x2 == null ? W - 60 : x2, py, a.label, col, 'end', true));
      } else if (a.t === 'seg') {
        const x1 = x(a.d1), x2 = x(a.d2), y1 = y(priceOf(a.p1, a.d1)), y2 = y(priceOf(a.p2, a.d2)); if ([x1, x2, y1, y2].some(v => v == null)) continue;
        el('line', { x1, y1, x2, y2, stroke: col, 'stroke-width': 2, 'marker-end': a.arrow ? mk(col) : '' });
        later.push(() => label((x1 + x2) / 2, Math.min(y1, y2), a.label, col));
      } else if (a.t === 'arrow') {
        const px = x(a.d); if (px == null) continue;
        const up = a.dir === 'up', p = priceOf(a.p || (up ? 'low' : 'high'), a.d), py = y(p); if (py == null) continue;
        const H = box.clientHeight, len = a.short ? 26 : 42;
        const tip = up ? py + 6 : py - 6, tail = Math.max(4, Math.min(H - 32, up ? tip + len : tip - len));
        el('line', { x1: px, y1: tail, x2: px, y2: tip, stroke: col, 'stroke-width': 2.5, 'marker-end': mk(col) });
        later.push(() => label(px, tail, a.label, col, 'middle', !up));
      } else if (a.t === 'dot') {
        const px = x(a.d), py = y(priceOf(a.p, a.d)); if (px == null || py == null) continue;
        el('circle', { cx: px, cy: py, r: 5, fill: 'none', stroke: col, 'stroke-width': 2 });
        if (a.label) later.push(() => label(px, py, a.label, col));
      } else if (a.t === 'box') {
        const x1 = x(a.d1), x2 = x(a.d2), y1 = y(priceOf(a.p1, a.d1)), y2 = y(priceOf(a.p2, a.d2)); if ([x1, x2, y1, y2].some(v => v == null)) continue;
        el('rect', { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1), fill: col, opacity: .08, stroke: col, 'stroke-dasharray': '4 4' });
        later.push(() => label(Math.min(x1, x2), Math.min(y1, y2), a.label, col, 'start'));
      }
    }
    later.forEach(f => f());
  }
  let raf = 0; const redraw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
  c.timeScale().subscribeVisibleLogicalRangeChange(redraw);
  const ro = new ResizeObserver(redraw); ro.observe(box);
  return {
    set(b, a, view) {
      bars = b; anns = a || []; days = b.map(day);
      candles.setData(b.map(r => ({ time: day(r), open: r[1], high: r[2], low: r[3], close: r[4] })));
      for (const s of extra) c.removeSeries(s); extra = [];
      for (const ln of (view && view.lines) || []) { const s = c.addLineSeries({ color: ln.color, lineWidth: ln.width || 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false, lineStyle: ln.style || 0 }); s.setData(ln.data); extra.push(s); }
      if (view && view.from) c.timeScale().setVisibleRange({ from: view.from, to: view.to || days[days.length - 1] }); else c.timeScale().fitContent();
      redraw(); setTimeout(redraw, 60);
    },
    destroy() { ro.disconnect(); cancelAnimationFrame(raf); c.remove(); host.innerHTML = ''; },
  };
}

/* ------------------------------------------------------------ indicators */
function sma(bars, n) { const out = new Array(bars.length).fill(null); let s = 0; for (let i = 0; i < bars.length; i++) { s += bars[i][4]; if (i >= n) s -= bars[i - n][4]; if (i >= n - 1) out[i] = s / n; } return out; }
const lineData = (bars, arr) => arr.map((v, i) => v == null ? null : { time: day(bars[i]), value: v }).filter(Boolean);
function stats(bars, i) {
  const r = k => (bars[k][4] - bars[k - 1][4]) / bars[k - 1][4] * 100;
  const look = Math.min(20, i - 1), abs = []; for (let k = i - look; k < i; k++) abs.push(Math.abs(r(k)));
  const vols = bars.slice(Math.max(0, i - 20), i).map(b => b[5]);
  return { ret: r(i), avgAbs: abs.reduce((a, b) => a + b, 0) / abs.length, volRatio: bars[i][5] / (vols.reduce((a, b) => a + b, 0) / vols.length || 1), gap: (bars[i][1] - bars[i - 1][4]) / bars[i - 1][4] * 100 };
}
const hiLo = (bars, a, b) => { let hi = -Infinity, lo = Infinity, hd = '', ld = ''; for (let k = Math.max(0, a); k <= b; k++) { if (bars[k][2] > hi) { hi = bars[k][2]; hd = day(bars[k]); } if (bars[k][3] < lo) { lo = bars[k][3]; ld = day(bars[k]); } } return { hi, lo, hd, ld }; };

/* ------------------------------------------------------------ lessons from recent trading days */
// Looks at each of the last few sessions and explains the most useful thing in it. All of it is hindsight
// reading of real prices, written the way a disciplined trader would think about it.
function daily(sym, name, bars, events) {
  if (!bars || bars.length < 80) return [];
  const out = [], ma50 = sma(bars, 50), ma200 = sma(bars, 200), N = bars.length;
  const evOn = d => (events || []).filter(e => e.symbol === sym && e.date >= d && e.date <= d).map(e => e.title);
  for (let i = N - 1; i >= N - 5 && i > 60; i--) {
    const b = bars[i], d = day(b), st = stats(bars, i), prev = bars[i - 1][4];
    const r60 = hiLo(bars, i - 61, i - 1), news = evOn(d), from = day(bars[Math.max(0, i - 90)]);
    const when = i === N - 1 ? 'Last session' : `${N - 1 - i} session${N - 1 - i > 1 ? 's' : ''} earlier`;
    const lines = [{ color: BLUE, data: lineData(bars, ma50) }, { color: PURPLE, data: lineData(bars, ma200) }];
    const view = { from, lines };
    const big = Math.abs(st.ret) > Math.max(2 * st.avgAbs, 4);
    const newsTxt = news.length ? ` That day's news on the watchlist: "${news[0]}".` : ' There was no company news on the watchlist that day, so the move was probably market-wide or a reaction to sector news.';
    if (Math.abs(st.gap) > 3) {
      const up = st.gap > 0, filled = up ? b[3] <= prev : b[2] >= prev;
      out.push({ sym, d, when, kind: up ? 'Gap up' : 'Gap down', score: Math.abs(st.gap) + 5,
        title: `${name}: ${up ? 'gapped up' : 'gapped down'} ${pc(st.gap)} at the open`,
        what: `On ${fmtD(d)} ${sym} opened at ${usd(b[1])}, ${pc(st.gap)} from the previous close of ${usd(prev)}, then closed at ${usd(b[4])} (${pc(st.ret)} on the day) on ${st.volRatio.toFixed(1)}× its usual volume.${newsTxt}`,
        read: `A gap means news or orders arrived while the market was shut. ${filled ? 'The price came back to the previous close during the day ("gap filled"): the opening reaction was overdone.' : `The gap didn't fill: buyers and sellers accepted the new level${st.volRatio > 1.5 ? ', and the high volume says many agreed' : ''}.`}`,
        act: up ? 'Chasing a gap up at the open is how people buy the top of the day. A disciplined buyer waits a session or two to see whether the new level holds, then decides using the news, not the excitement.' : 'Selling into a gap down locks in the worst price of the day. A holder re-checks the reason they bought: if the news broke it, sell calmly; if not, a gap on no real news often recovers.',
        anns: [{ t: 'hline', p: prev, d1: day(bars[i - 8]), d2: d, color: GREY, label: `Previous close ${usd(prev)}` }, { t: 'arrow', d, dir: up ? 'up' : 'down', color: up ? UP : DOWN, label: `Gap ${pc(st.gap)}` }], view });
    }
    if (big) {
      const up = st.ret > 0, conv = st.volRatio >= 1.5;
      out.push({ sym, d, when, kind: up ? 'Big up day' : 'Big down day', score: Math.abs(st.ret) / Math.max(st.avgAbs, .5) + (conv ? 2 : 0),
        title: `${name}: ${pc(st.ret)} in one day on ${st.volRatio.toFixed(1)}× normal volume`,
        what: `On ${fmtD(d)} ${sym} closed at ${usd(b[4])}, ${pc(st.ret)}. Its usual daily move over the previous month was about ${st.avgAbs.toFixed(1)}%, so this was ${(Math.abs(st.ret) / st.avgAbs).toFixed(1)}× a normal day.${newsTxt}`,
        read: conv ? 'Volume well above normal confirms the move: many traders acted, so it reflects real information or a real change of mind.' : 'Volume was not much above normal, so fewer traders took part. Moves on light volume reverse more often.',
        act: up ? 'Don\'t buy just because it jumped. Ask what changed in the company\'s value. If you already hold, check whether the position has grown past your one-company limit and trim back if so.' : 'Don\'t panic-sell, and don\'t buy just because it\'s cheaper. If you hold, ask whether the reason you bought is broken. If you were waiting to buy, wait for the price to stop falling (a few days without new lows).',
        anns: [{ t: 'arrow', d, dir: up ? 'up' : 'down', color: up ? UP : DOWN, label: `${pc(st.ret)}\n${st.volRatio.toFixed(1)}× volume` }, { t: 'hline', p: prev, d1: day(bars[i - 10]), d2: d, color: GREY, label: `Close before ${usd(prev)}` }], view });
    }
    if (b[4] > r60.hi) out.push({ sym, d, when, kind: 'Breakout', score: 6,
      title: `${name}: closed above its 3-month high`,
      what: `${sym} closed at ${usd(b[4])}, above the highest price of the previous 60 sessions (${usd(r60.hi)} on ${fmtD(r60.hd)}) on ${st.volRatio.toFixed(1)}× usual volume.`,
      read: 'A breakout through resistance means sellers who had been capping the price have been absorbed. Breakouts on high volume hold more often than on low volume, and an old resistance often turns into support.',
      act: 'Trend traders buy breakouts, with a sell rule just below the old resistance. For a biotech, check first whether a readout is near: a breakout before a binary event is mostly hope.',
      anns: [{ t: 'hline', p: r60.hi, d1: r60.hd, d2: d, color: AMBER, label: `Old resistance ${usd(r60.hi)}` }, { t: 'arrow', d, dir: 'up', color: UP, label: 'Breakout' }], view });
    if (b[4] < r60.lo) out.push({ sym, d, when, kind: 'Breakdown', score: 6,
      title: `${name}: closed below its 3-month low`,
      what: `${sym} closed at ${usd(b[4])}, below the lowest price of the previous 60 sessions (${usd(r60.lo)} on ${fmtD(r60.ld)}).`,
      read: 'Support broke: the buyers who had stepped in at that level didn\'t this time. Old support often becomes resistance on the way back up.',
      act: 'Many traders treat a close below support as their sell signal ("the reason the floor held has gone"). Buyers looking for value usually wait for a new floor to form rather than catching a falling price.',
      anns: [{ t: 'hline', p: r60.lo, d1: r60.ld, d2: d, color: AMBER, label: `Old support ${usd(r60.lo)}` }, { t: 'arrow', d, dir: 'down', color: DOWN, label: 'Breakdown' }], view });
    if (ma50[i] && ma50[i - 1] && (bars[i - 1][4] - ma50[i - 1]) * (b[4] - ma50[i]) < 0) {
      const up = b[4] > ma50[i];
      out.push({ sym, d, when, kind: up ? 'Crossed above MA50' : 'Crossed below MA50', score: 4,
        title: `${name}: closed ${up ? 'above' : 'below'} its 50-day average`,
        what: `${sym} closed at ${usd(b[4])}, ${up ? 'above' : 'below'} its 50-day average of ${usd(ma50[i])} (blue line); the day before it was on the other side.`,
        read: `The 50-day average is the medium-term trend. Crossing it ${up ? 'upwards suggests the downtrend may be ending' : 'downwards suggests the uptrend may be ending'}. In a sideways market the price crosses it back and forth ("whipsaw"), so one cross means little on its own.`,
        act: 'Trend-following rules buy above the average and sell below it. Use the Rule replays tab to see how often that would have worked for this company.',
        anns: [{ t: 'dot', d, p: ma50[i], color: BLUE, label: `MA50 ${usd(ma50[i])}` }, { t: 'arrow', d, dir: up ? 'up' : 'down', color: up ? UP : DOWN, label: up ? 'Above trend' : 'Below trend' }], view });
    }
    const near = (b[4] - r60.lo) / r60.lo * 100;
    if (near >= 0 && near < 3 && !big) {
      const touches = []; for (let k = i - 60; k < i; k++) if (Math.abs(bars[k][3] - r60.lo) / r60.lo < .02) touches.push(day(bars[k]));
      out.push({ sym, d, when, kind: 'Testing support', score: 3 + touches.length,
        title: `${name}: sitting just above its 3-month support`,
        what: `${sym} closed at ${usd(b[4])}, ${near.toFixed(1)}% above the 60-session low of ${usd(r60.lo)}, a level it has bounced from ${touches.length} time${touches.length === 1 ? '' : 's'}.`,
        read: 'Support is a floor where buyers have appeared before. The more times it holds, the more traders watch it, and the bigger the move when it finally breaks.',
        act: 'Range traders buy near support with a sell rule just below it (e.g. 5% under), so a wrong call costs little. A close below the level is the signal the floor has gone.',
        anns: [{ t: 'hline', p: r60.lo, d1: day(bars[i - 60]), d2: d, color: UP, label: `Support ${usd(r60.lo)}` }].concat(touches.slice(-3).map(t => ({ t: 'dot', d: t, p: 'low', color: UP }))), view });
    }
  }
  // nothing notable: the most useful lesson is that most days are quiet
  if (!out.length) {
    const i = N - 1, r20 = hiLo(bars, N - 21, N - 1), st = stats(bars, i);
    out.push({ sym, d: day(bars[i]), when: 'Last session', kind: 'Quiet', score: 1,
      title: `${name}: a normal day (${pc(st.ret)})`,
      what: `${sym} closed at ${usd(bars[i][4])}, ${pc(st.ret)}, on ${st.volRatio.toFixed(1)}× normal volume. Over the last 20 sessions it has stayed between ${usd(r20.lo)} and ${usd(r20.hi)}.`,
      read: 'Most trading days carry no information: prices drift with the market. Reading meaning into every small move is how people overtrade and pay fees for nothing.',
      act: 'On quiet days the useful work is preparation: check Coming up, update your journal, and decide in advance what you would do if the price reached the top or bottom of its range.',
      anns: [{ t: 'box', d1: r20.ld < r20.hd ? r20.ld : r20.hd, d2: day(bars[i]), p1: r20.hi, p2: r20.lo, color: GREY, label: '20-day range' }], view: { from: day(bars[Math.max(0, N - 90)]), lines: [{ color: BLUE, data: lineData(bars, ma50) }] } });
  }
  return out;
}

/* ------------------------------------------------------------ rule replays */
const COST = 0.4;   // % per buy or sell: Trading 212's 0.15% currency fee plus a typical small-cap spread
const RULES = {
  hold: { name: 'Buy and hold', short: 'Hold', text: 'Buy on the first day and never sell. Every other rule is judged against this.' },
  ma50: { name: 'Follow the 50-day trend', short: 'Trend', text: 'Own the share while it closes above its 50-day average; sell the day it closes below; buy back when it closes above again.' },
  cross: { name: 'Golden cross / death cross', short: 'Cross', text: 'Buy when the 50-day average crosses above the 200-day; sell when it crosses back below.' },
  range: { name: 'Buy support, sell resistance', short: 'Range', text: 'Buy when the price closes within 3% of its 60-day low; sell when it reaches within 3% of its 60-day high, or if it falls 10% below the buy price.' },
  events: { name: 'Hold, but step aside for readouts', short: 'Events', text: 'Hold the share, but sell 5 trading days before each key readout or FDA decision and buy back 2 days after it.' },
};
function replay(rule, bars, events, sym, startDay) {
  let s0 = bars.findIndex(b => day(b) >= startDay); if (s0 < 1) s0 = 1;
  const ma50 = sma(bars, 50), ma200 = sma(bars, 200);
  const keyDays = (events || []).filter(e => e.symbol === sym && e.type === 'key' && /data|readout|topline|phase|fda|pdufa|approv|trial|result/i.test(e.title) && !/financial|quarter|results:/i.test(e.title)).map(e => e.date);
  const evIdx = keyDays.map(d => bars.findIndex(b => day(b) >= d)).filter(i => i > 0);
  let inPos = false, entry = 0, cash = 1, shares = 0, peak = 1, maxDD = 0;
  const trades = [], holds = [];
  let holdFrom = null;
  const buy = i => { shares = cash * (1 - COST / 100) / bars[i][4]; cash = 0; inPos = true; entry = bars[i][4]; trades.push({ d: day(bars[i]), side: 'BUY', px: bars[i][4] }); holdFrom = day(bars[i]); };
  const sell = (i, why) => { cash = shares * bars[i][4] * (1 - COST / 100); shares = 0; inPos = false; trades.push({ d: day(bars[i]), side: 'SELL', px: bars[i][4], why, pnl: (bars[i][4] - entry) / entry * 100 }); holds.push([holdFrom, day(bars[i])]); };
  for (let i = s0; i < bars.length; i++) {
    const c = bars[i][4];
    if (rule === 'hold') { if (!inPos && i === s0) buy(i); }
    else if (rule === 'ma50' && ma50[i]) { if (!inPos && c > ma50[i]) buy(i); else if (inPos && c < ma50[i]) sell(i, 'closed below MA50'); }
    else if (rule === 'cross' && ma200[i] && ma200[i - 1]) { const up = ma50[i] > ma200[i], was = ma50[i - 1] > ma200[i - 1]; if (!inPos && up && (!was || i === s0)) buy(i); else if (inPos && !up && was) sell(i, 'death cross'); }
    else if (rule === 'range') { const r = hiLo(bars, i - 60, i - 1); if (!inPos && c <= r.lo * 1.03) buy(i); else if (inPos && c >= r.hi * .97) sell(i, 'reached resistance'); else if (inPos && c <= entry * .9) sell(i, '10% stop'); }
    else if (rule === 'events') {
      const soon = evIdx.some(e => e - i > 0 && e - i <= 5), just = evIdx.some(e => i - e >= 0 && i - e < 2);
      if (inPos && soon) sell(i, 'readout within 5 days'); else if (!inPos && !soon && !just) buy(i);
    }
    const val = inPos ? shares * c : cash; peak = Math.max(peak, val); maxDD = Math.max(maxDD, (peak - val) / peak * 100);
  }
  const last = bars[bars.length - 1][4], val = inPos ? shares * last : cash;
  if (inPos) holds.push([holdFrom, day(bars[bars.length - 1])]);
  const holdRet = (last - bars[s0][4]) / bars[s0][4] * 100;
  const done = trades.filter(t => t.side === 'SELL'), wins = done.filter(t => t.pnl > 0).length;
  // with many trades, full labels would cover the chart: short B/S tags, the details go in the table
  const many = trades.length > 8;
  const anns = holds.map(([a, b]) => ({ t: 'zone', d1: a, d2: b, color: UP })).concat(trades.map(t => ({ t: 'arrow', d: t.d, dir: t.side === 'BUY' ? 'up' : 'down', color: t.side === 'BUY' ? UP : DOWN, short: many, label: many ? (t.side === 'BUY' ? 'B' : 'S') : `${t.side === 'BUY' ? 'Buy' : 'Sell'} ${usd(t.px)}${t.pnl != null ? `\n${pc(t.pnl)}` : ''}` })));
  for (const d of keyDays) if (d >= day(bars[s0])) anns.push({ t: 'zone', d1: d, d2: d, color: AMBER, label: 'readout' });
  const lines = rule === 'ma50' ? [{ color: BLUE, data: lineData(bars, ma50) }] : rule === 'cross' ? [{ color: BLUE, data: lineData(bars, ma50) }, { color: PURPLE, data: lineData(bars, ma200) }] : [];
  return { trades, anns, lines, ret: (val - 1) * 100, holdRet, maxDD, n: trades.length, wins, closed: done.length, inPos, from: day(bars[s0]) };
}

window.WLTeach = { chart, daily, replay, RULES, COST, colors: { UP, DOWN, AMBER, BLUE, PURPLE, GREY } };
})();
