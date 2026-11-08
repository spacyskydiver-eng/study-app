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
      } else if (a.t === 'pos') {
        // a planned trade, like TradingView's position tool: green from entry up to the target, red from entry down to the stop
        const i0 = barAt(a.d), x1 = c.timeScale().logicalToCoordinate(i0), x2 = c.timeScale().logicalToCoordinate(i0 + (a.k || 15));
        const ye = y(a.entry), ys = y(a.stop), yt = a.target != null ? y(a.target) : null;
        if (x1 == null || x2 == null || ye == null || ys == null) continue;
        const w = Math.max(30, x2 - x1);
        if (yt != null) el('rect', { x: x1, y: Math.min(ye, yt), width: w, height: Math.abs(yt - ye), fill: UP, opacity: .16, stroke: UP, 'stroke-opacity': .5 });
        el('rect', { x: x1, y: Math.min(ye, ys), width: w, height: Math.abs(ys - ye), fill: DOWN, opacity: .16, stroke: DOWN, 'stroke-opacity': .5 });
        el('line', { x1, x2: x1 + w, y1: ye, y2: ye, stroke: '#E5E7EB', 'stroke-width': 1.5 });
        const pct = v => ((v - a.entry) / a.entry * 100);
        later.push(() => {
          label(x1 + w + 4, ye + 9, `${a.entryLabel || 'Buy'} ${usd(a.entry)}`, '#E5E7EB', 'start', true);
          label(x1 + w + 4, ys, `Stop ${usd(a.stop)} (${pc(pct(a.stop))})`, DOWN, 'start', ys < ye);
          if (yt != null) label(x1 + w + 4, yt, `Target ${usd(a.target)} (${pc(pct(a.target))})`, UP, 'start', yt < ye);
        });
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
      c.timeScale().applyOptions({ rightOffset: (view && view.rightOffset) || 3 });
      // a plan box reaches into the future, so leave that much empty space on the right
      if (view && view.from && view.rightOffset > 5) { const f = Math.max(0, days.findIndex(x => x >= view.from)); c.timeScale().setVisibleLogicalRange({ from: f, to: days.length - 1 + view.rightOffset }); }
      else if (view && view.from) c.timeScale().setVisibleRange({ from: view.from, to: view.to || days[days.length - 1] }); else c.timeScale().fitContent();
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

/* ------------------------------------------------------------ trade setups */
// Each setup is a textbook pattern with exact rules for spotting it and for the entry, stop-loss and
// target. The same rules find it in the latest session (today's plan) and in the past two years
// (its track record on this company), so every plan comes with evidence of how it has done.
// Text uses [[term|words]] for tappable explanations.
const NEXT_OPEN = d => { const t = new Date(d + 'T12:00:00Z'); do { t.setUTCDate(t.getUTCDate() + 1); } while (t.getUTCDay() === 0 || t.getUTCDay() === 6); return t.toISOString().slice(0, 10); };
const WEEKDAY = d => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(d + 'T12:00:00Z').getUTCDay()];
const touchesOf = (bars, lvl, a, b, side) => { const out = []; let last = -9; for (let k = Math.max(0, a); k <= b; k++) { const v = side === 'low' ? bars[k][3] : bars[k][2]; if (Math.abs(v - lvl) / lvl < .02 && k - last > 3) { out.push(k); last = k; } } return out; };

const SETUPS = {
  support: {
    name: 'Support bounce', side: 'buy',
    find(bars, i) {
      const r = hiLo(bars, i - 60, i - 1), c = bars[i][4];
      if (!(c >= r.lo && c <= r.lo * 1.03)) return null;
      const t = touchesOf(bars, r.lo, i - 60, i - 1, 'low'); if (t.length < 2) return null;
      const entry = c, stop = r.lo * .97, target = Math.min(r.hi * .97, entry + 2.5 * (entry - stop));
      return { entry, stop, target, lvl: r.lo, top: r.hi, touches: t };
    },
  },
  breakout: {
    name: 'Breakout', side: 'buy',
    find(bars, i) {
      const r = hiLo(bars, i - 60, i - 1), c = bars[i][4], st = stats(bars, i);
      if (!(c > r.hi && st.volRatio >= 1.2)) return null;
      const entry = c, stop = r.hi * .97, target = entry + (r.hi - r.lo);
      return { entry, stop, target, lvl: r.hi, bottom: r.lo, vol: st.volRatio };
    },
  },
  pullback: {
    name: 'Buy the pullback after a jump', side: 'buy',
    find(bars, i) {
      // a big up day within the last 6 sessions, and the price has since come back near the close before the jump
      for (let k = i - 1; k >= i - 6 && k > 21; k--) {
        const st = stats(bars, k);
        if (st.ret > Math.max(2.5 * st.avgAbs, 6) && st.volRatio >= 1.5) {
          const base = bars[k - 1][4], c = bars[i][4];
          if (c <= base + (bars[k][4] - base) * .4 && c > base * .97) {
            let low = Infinity; for (let m = k; m <= i; m++) low = Math.min(low, bars[m][3]);
            const stop = Math.min(base * .96, low * .99), target = bars[k][2];
            return { entry: c, stop, target, jumpDay: day(bars[k]), jump: st.ret, base };
          }
          return null;
        }
      }
      return null;
    },
  },
  trend: {
    name: 'Trend turn (back above the 50-day average)', side: 'buy',
    find(bars, i, m) {
      const ma = m.ma50; if (!ma[i] || !ma[i - 1] || !ma[i - 5]) return null;
      if (!(bars[i - 1][4] < ma[i - 1] && bars[i][4] > ma[i] && ma[i] >= ma[i - 5] * .99)) return null;
      const entry = bars[i][4], stop = Math.min(ma[i] * .95, hiLo(bars, i - 10, i).lo), target = entry + 2 * (entry - stop);
      return { entry, stop, target, ma: ma[i] };
    },
  },
  breakdown: {
    name: 'Breakdown (a warning for holders)', side: 'sell',
    find(bars, i) {
      const r = hiLo(bars, i - 60, i - 1), c = bars[i][4];
      if (!(c < r.lo * .99)) return null;
      return { entry: c, stop: r.lo * 1.03, target: c - (r.hi - r.lo) * .5, lvl: r.lo, top: r.hi };
    },
  },
};

// replays one setup through history: enter at the next session's open, then whichever of stop or target is
// touched first decides it (a gap past the stop fills at the open); after 30 sessions it's closed at the price then
function record(key, bars, m) {
  const S = SETUPS[key], out = [];
  let k = 70;
  while (k < bars.length - 1) {
    const f = S.find(bars, k, m);
    if (!f) { k++; continue; }
    const e = k + 1, long = S.side === 'buy';
    let entry = bars[e][1], res = null, exitK = null;
    // keep the planned distances, measured from the actual fill
    const stop = entry * f.stop / f.entry, target = entry * f.target / f.entry;
    for (let t = e; t < Math.min(bars.length, e + 30); t++) {
      const [, o, h, l, cl] = bars[t];
      if (long) {
        if (o <= stop) { res = { why: 'stop (gapped)', px: o }; } else if (l <= stop) { res = { why: 'stop', px: stop }; } else if (h >= target) { res = { why: 'target', px: target }; }
      } else {
        if (o >= stop) { res = { why: 'stop (gapped)', px: o }; } else if (h >= stop) { res = { why: 'stop', px: stop }; } else if (l <= target) { res = { why: 'target', px: target }; }
      }
      if (res) { exitK = t; break; }
      if (t === Math.min(bars.length, e + 30) - 1) { res = { why: t === bars.length - 1 ? 'still open' : 'time (30 sessions)', px: cl }; exitK = t; }
    }
    if (!res) break;
    const gross = (res.px - entry) / entry * 100 * (long ? 1 : -1), net = gross - 2 * COST;
    out.push({ d: day(bars[k]), entryD: day(bars[e]), exitD: day(bars[exitK]), entry, exit: res.px, why: res.why, net });
    k = exitK + 1;
  }
  const done = out.filter(o => o.why !== 'still open');
  const wins = done.filter(o => o.net > 0);
  return { list: out, n: done.length, wins: wins.length, targets: done.filter(o => o.why === 'target').length, stops: done.filter(o => o.why.startsWith('stop')).length, avg: done.length ? done.reduce((a, o) => a + o.net, 0) / done.length : null, best: done.length ? Math.max(...done.map(o => o.net)) : null, worst: done.length ? Math.min(...done.map(o => o.net)) : null };
}

function setups(sym, name, bars, events) {
  if (!bars || bars.length < 120) return [];
  const m = { ma50: sma(bars, 50), ma200: sma(bars, 200) };
  const N = bars.length, out = [];
  const evOn = d => (events || []).filter(e => e.symbol === sym && e.date === d).map(e => e.title);
  const lines = [{ color: BLUE, data: lineData(bars, m.ma50) }];
  for (let i = N - 1; i >= N - 5; i--) {
    const d = day(bars[i]), when = i === N - 1 ? 'Last session' : `${N - 1 - i} session${N - 1 - i > 1 ? 's' : ''} before the last`;
    const nxt = i === N - 1 ? NEXT_OPEN(d) : day(bars[i + 1]);
    for (const key of Object.keys(SETUPS)) {
      const S = SETUPS[key], f = S.find(bars, i, m); if (!f) continue;
      const rec = record(key, bars.slice(0, i + 1), m);
      const risk = Math.abs(f.entry - f.stop) / f.entry * 100, reward = Math.abs(f.target - f.entry) / f.entry * 100, rr = reward / risk;
      const news = evOn(d);
      const st = stats(bars, i);
      const base = { sym, d, when, key, side: S.side, name: S.name, entry: f.entry, stop: f.stop, target: f.target, risk, reward, rr, rec, nextOpen: nxt, live: i === N - 1,
        view: { from: day(bars[Math.max(0, i - 100)]), lines, rightOffset: 22 },
        anns: [{ t: 'pos', d, k: 16, entry: f.entry, stop: f.stop, target: f.target, entryLabel: S.side === 'buy' ? 'Buy' : 'Sell' }] };
      const timing = i === N - 1
        ? `The next session opens at 14:30 UK time on ${WEEKDAY(nxt)} ${fmtD(nxt)}.`
        : `This signal came on ${fmtD(d)}; the plan would have started at the open on ${fmtD(nxt)}.`;
      const skip = rr < 1.5 ? ` The possible gain (${reward.toFixed(1)}%) is less than 1.5 times the possible loss (${risk.toFixed(1)}%), so a disciplined trader would skip this one: small wins, big losses don't add up.` : '';
      let x;
      if (key === 'support') x = {
        headline: `${name} is sitting on [[support]] at ${usd(f.lvl)}`,
        steps: [`Before 14:30 UK on ${fmtD(nxt)}: place a [[limit order]] to buy at ${usd(f.entry)} (the last [[close]]). If it isn't filled by the end of that day, cancel it.`, `As soon as it fills: set a [[stop-loss]] at ${usd(f.stop)}, 3% under the support level (${pc(-risk)} from entry).`, `Take profit with a limit sell at ${usd(f.target)} (${pc(reward)}), just under the top of the 3-month range at ${usd(f.top)}.`, `If neither happens within 30 sessions, sell at the price then: the idea hasn't worked.`],
        why: [`Over the last 60 sessions the price has dropped to about ${usd(f.lvl)} and bounced ${f.touches.length} times (circled). Buyers keep appearing there, so it acts as a floor.`, `Buying right on the floor means the stop can sit close underneath: if the floor breaks, you're out with a small loss.`, `The target is the other side of the range, where sellers have appeared before (the [[resistance]]).`],
        fail: [`Floors break. If the company has news coming (a readout, results), the level means nothing.`, `The more times a level is tested, the weaker it can get: each bounce uses up buyers.`],
        anns: base.anns.concat([{ t: 'hline', p: f.lvl, d1: day(bars[i - 60]), d2: d, color: UP, label: `Support ${usd(f.lvl)}` }, { t: 'hline', p: f.top, d1: day(bars[i - 60]), d2: d, color: AMBER, label: `Resistance ${usd(f.top)}` }], f.touches.map(k => ({ t: 'dot', d: day(bars[k]), p: 'low', color: UP }))) };
      else if (key === 'breakout') x = {
        headline: `${name} closed above its 3-month high: a [[breakout]]`,
        steps: [`At 14:30 UK on ${fmtD(nxt)}: buy with a limit order at about ${usd(f.entry)}. Don't pay more than 2% above it; if it opens much higher, skip (the move has gone without you).`, `Set the [[stop-loss]] at ${usd(f.stop)}, 3% back under the old high (${pc(-risk)}). Falling back below it would mean the breakout failed.`, `Target ${usd(f.target)} (${pc(reward)}): the height of the old range added on top, a classic "measured move".`, `If neither happens within 30 sessions, sell.`],
        why: [`For 60 sessions sellers stopped every rise at about ${usd(f.lvl)} (the [[resistance]]). On ${fmtD(d)} the price closed above it.`, `[[volume]] was ${f.vol.toFixed(1)}× the usual, so many traders took part: breakouts on heavy volume hold more often.`, `Old resistance often turns into the new [[support]], which is why the stop sits just under it.`],
        fail: [`Many breakouts fail and fall back ("false breakout"); the stop keeps that loss small.`, `In biotech, a breakout before a known readout is mostly hope; check Coming up first.`],
        anns: base.anns.concat([{ t: 'hline', p: f.lvl, d1: day(bars[i - 60]), d2: d, color: AMBER, label: `Old resistance ${usd(f.lvl)}` }]) };
      else if (key === 'pullback') x = {
        headline: `${name} jumped ${pc(f.jump)} on ${fmtD(f.jumpDay)} and has pulled back`,
        steps: [`Before 14:30 UK on ${fmtD(nxt)}: limit buy at ${usd(f.entry)}.`, `Stop-loss at ${usd(f.stop)} (${pc(-risk)}), under where the jump started.`, `Target ${usd(f.target)} (${pc(reward)}): the high of the jump day.`, `Sell after 30 sessions if neither is hit.`],
        why: [`On ${fmtD(f.jumpDay)} the price jumped ${pc(f.jump)} on heavy volume: real buying interest.`, `Chasing it that day would have meant buying at the top. Waiting for the price to drift back towards ${usd(f.base)} (the close before the jump) gets a better price.`, `If the jump was real news, buyers usually return at that level; if the price falls through it, the jump was a false start and the stop gets you out.`],
        fail: [`Sometimes the whole jump disappears, especially when it came from a short-lived rumour.`],
        anns: base.anns.concat([{ t: 'arrow', d: f.jumpDay, dir: 'up', color: UP, label: `Jump ${pc(f.jump)}` }, { t: 'hline', p: f.base, d1: f.jumpDay, d2: d, color: GREY, label: `Close before the jump ${usd(f.base)}` }]) };
      else if (key === 'trend') x = {
        headline: `${name} closed back above its 50-day average (a trend turn)`,
        steps: [`At 14:30 UK on ${fmtD(nxt)}: limit buy at about ${usd(f.entry)}.`, `Stop-loss at ${usd(f.stop)} (${pc(-risk)}), under the [[moving average]] and the recent low.`, `Target ${usd(f.target)} (${pc(reward)}), twice the risk. Trend followers often instead stay in until the price closes back below the average.`],
        why: [`The [[moving average]] (blue line) is the average close of the last 50 sessions: ${usd(f.ma)} now. Above it, the medium-term trend is up.`, `The average itself has stopped falling, so this cross is more likely a real turn than a blip.`],
        fail: [`In a sideways market the price crosses the average back and forth ([[whipsaw]]), and each false signal costs a small loss.`],
        anns: base.anns.concat([{ t: 'dot', d, p: f.ma, color: BLUE, label: `50-day average ${usd(f.ma)}` }]) };
      else x = {
        headline: `${name} broke below its 3-month low (a [[breakdown]])`,
        steps: [`If you own it: your sell rule probably triggers. Sell at the 14:30 UK open on ${fmtD(nxt)} with a limit a little under the last close (${usd(f.entry)}).`, `If you don't own it: don't buy yet. Wait until the price stops making new lows for at least 5 sessions and a new floor forms.`, `The level it broke (${usd(f.lvl)}) is now the line to watch: getting back above ${usd(f.stop)} would cancel the warning.`],
        why: [`For 60 sessions buyers defended about ${usd(f.lvl)} (the [[support]]). On ${fmtD(d)} they didn't, and it closed below.`, `When a floor breaks, people who bought near it start selling to limit losses, which can push the price lower.`, `Professional traders sometimes "sell short" here (betting on a fall); that's risky and not something to do while learning.`],
        fail: [`Some breakdowns reverse fast ("shakeouts"), which is why the cancel level is there.`],
        anns: base.anns.concat([{ t: 'hline', p: f.lvl, d1: day(bars[i - 60]), d2: d, color: AMBER, label: `Broken support ${usd(f.lvl)}` }]) };
      out.push(Object.assign(base, x, { timing, skip, news, vol: st.volRatio }));
    }
  }
  // nothing set up: say what would, with exact levels to watch
  if (!out.length) {
    const i = N - 1, r = hiLo(bars, i - 60, i), d = day(bars[i]), c = bars[i][4], nxt = NEXT_OPEN(d);
    out.push({ sym, d, when: 'Last session', key: 'none', side: 'none', name: 'No setup', live: true, nextOpen: nxt,
      headline: `${name}: no setup today, so no trade`,
      steps: [`Do nothing on ${fmtD(nxt)}. No trade is a position too.`, `Set price alerts in Trading 212: one at ${usd(r.hi)} (a close above it would be a [[breakout]]) and one at ${usd(r.lo * 1.03)} (near [[support]]: the bounce setup).`, `Use the time to read the company's next catalyst in Coming up.`],
      why: [`The last close (${usd(c)}) is in the middle of the 3-month range (${usd(r.lo)} to ${usd(r.hi)}). In the middle, a stop-loss would be far from the entry, so the possible loss is big compared with the possible gain.`, `Most days look like this. Trading them anyway is how beginners pay fees and lose money slowly.`],
      fail: [], timing: `The next session opens at 14:30 UK time on ${WEEKDAY(nxt)} ${fmtD(nxt)}.`, skip: '', news: [],
      view: { from: day(bars[Math.max(0, i - 100)]), lines, rightOffset: 8 },
      anns: [{ t: 'hline', p: r.hi, d1: day(bars[i - 60]), d2: d, color: AMBER, label: `Breakout above ${usd(r.hi)}` }, { t: 'hline', p: r.lo, d1: day(bars[i - 60]), d2: d, color: UP, label: `Support ${usd(r.lo)}` }, { t: 'arrow', d, dir: 'up', color: GREY, label: 'Middle of the range' }] });
  }
  return out;
}

/* ------------------------------------------------------------ plain-English terms with a small picture */
const pic = inner => `<svg viewBox="0 0 120 60" width="120" height="60">${inner}</svg>`;
const cdl = (x, o, c, h, l, col) => `<line x1="${x}" x2="${x}" y1="${h}" y2="${l}" stroke="${col}" stroke-width="1.5"/><rect x="${x - 3}" y="${Math.min(o, c)}" width="6" height="${Math.max(2, Math.abs(c - o))}" fill="${col}"/>`;
const TERMS = {
  'support': ['A price level where the share has stopped falling several times, because buyers keep stepping in there. Like a floor.', pic(`<line x1="5" x2="115" y1="48" y2="48" stroke="${UP}" stroke-dasharray="4 3"/><polyline points="5,15 25,47 40,25 60,47 75,20 95,47 115,22" fill="none" stroke="#9AA3B8" stroke-width="2"/>`)],
  'resistance': ['A price level where the share has stopped rising several times, because sellers keep appearing there. Like a ceiling.', pic(`<line x1="5" x2="115" y1="12" y2="12" stroke="${AMBER}" stroke-dasharray="4 3"/><polyline points="5,45 25,13 40,38 60,13 75,40 95,13 115,35" fill="none" stroke="#9AA3B8" stroke-width="2"/>`)],
  'gap up': ['The share opens noticeably higher than the previous day\'s close, with no trades in between, usually after news released while the market was shut.', pic(cdl(30, 40, 30, 27, 45, UP) + cdl(55, 32, 28, 26, 36, DOWN) + `<rect x="68" y="10" width="44" height="12" fill="${UP}" opacity=".15"/>` + cdl(85, 18, 10, 6, 21, UP) + `<text x="60" y="56" font-size="9" fill="#9AA3B8">gap</text>`)],
  'gap down': ['The share opens noticeably lower than the previous day\'s close, with no trades in between, usually after bad news.', pic(cdl(30, 15, 25, 12, 28, DOWN) + cdl(55, 22, 28, 20, 31, DOWN) + cdl(85, 42, 50, 40, 55, DOWN))],
  'breakout': ['The price closes above a ceiling (resistance) it couldn\'t get past before. Often followed by more rise if lots of shares traded.', pic(`<line x1="5" x2="115" y1="25" y2="25" stroke="${AMBER}" stroke-dasharray="4 3"/><polyline points="5,45 25,26 40,40 60,26 75,38 92,24 115,6" fill="none" stroke="${UP}" stroke-width="2"/>`)],
  'breakdown': ['The price closes below a floor (support) that held before. A warning sign for holders.', pic(`<line x1="5" x2="115" y1="35" y2="35" stroke="${AMBER}" stroke-dasharray="4 3"/><polyline points="5,10 25,34 40,18 60,34 75,20 92,36 115,55" fill="none" stroke="${DOWN}" stroke-width="2"/>`)],
  'stop-loss': ['A sell order you set in advance at a lower price. If the share falls to it, you sell automatically, so one bad trade can\'t lose more than you planned. It can\'t protect you from a gap: it then sells at the next available price.', pic(`<rect x="10" y="30" width="100" height="18" fill="${DOWN}" opacity=".2"/><line x1="10" x2="110" y1="30" y2="30" stroke="#E5E7EB"/><line x1="10" x2="110" y1="48" y2="48" stroke="${DOWN}"/><text x="14" y="27" font-size="9" fill="#E5E7EB">buy</text><text x="14" y="58" font-size="9" fill="${DOWN}">stop</text>`)],
  'target': ['The price where you plan to take your profit, decided before you buy.', pic(`<rect x="10" y="10" width="100" height="20" fill="${UP}" opacity=".2"/><line x1="10" x2="110" y1="30" y2="30" stroke="#E5E7EB"/><line x1="10" x2="110" y1="10" y2="10" stroke="${UP}"/><text x="14" y="22" font-size="9" fill="${UP}">target</text><text x="14" y="40" font-size="9" fill="#E5E7EB">buy</text>`)],
  'limit order': ['An order with a price on it: "buy at $3.25 or less". It only fills at your price or better, so you never pay more than you meant to.', ''],
  'close': ['The last price of the trading day (21:00 UK). Charts, averages and these setups all use closes, because that\'s the price everyone agreed to hold overnight.', ''],
  'volume': ['How many shares changed hands. The bars along the bottom of a chart. A move on several times the usual volume means lots of traders agreed; a move on low volume is less trustworthy.', pic(`${[8, 14, 10, 12, 9, 40, 16].map((h, k) => `<rect x="${8 + k * 15}" y="${55 - h}" width="10" height="${h}" fill="${k === 5 ? UP : '#4B5563'}"/>`).join('')}`)],
  'moving average': ['The average closing price over the last N days (50 here), redrawn every day. It smooths out the noise: above it, the trend is up; below it, down.', pic(`<polyline points="5,40 18,30 30,38 42,25 55,32 68,20 80,28 95,15 115,20" fill="none" stroke="#9AA3B8" stroke-width="1.5"/><polyline points="5,42 30,36 55,30 80,24 115,18" fill="none" stroke="${BLUE}" stroke-width="2"/>`)],
  'whipsaw': ['When the price keeps crossing a line back and forth in a sideways market, so a rule buys and sells repeatedly and loses a little (plus fees) each time.', pic(`<line x1="5" x2="115" y1="30" y2="30" stroke="${BLUE}"/><polyline points="5,30 15,22 25,36 35,24 45,37 55,23 65,38 75,25 85,35 95,26 115,33" fill="none" stroke="#9AA3B8" stroke-width="1.5"/>`)],
};

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

window.WLTeach = { chart, setups, replay, RULES, COST, TERMS, colors: { UP, DOWN, AMBER, BLUE, PURPLE, GREY } };
})();
