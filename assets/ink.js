/* Handwriting layer for exam papers: Apple Pencil (or mouse, with the pen switched on) writes anywhere
   on the page, margins included; fingers still scroll. Strokes are anchored to the question they start
   in and stored in units of the paper's width, so they stay with that question on any screen size.
   A ruler can be laid over the page: drag it with a finger or mouse, turn it by the round handles,
   and pen strokes that start along an edge are drawn straight against it.
   window.BVInk.attach(host, wrap, { strokes, save(strokes) }) returns { detach() }. */
(() => {
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const COLORS = { k: 'var(--text-normal)', r: '#ef4444', b: '#3b82f6', g: '#10b981', y: '#facc15' };
const TOOLS = { pen: { w: 2.6, o: 1 }, hi: { w: 16, o: .32 }, er: null };
const ui = { tool: 'pen', color: 'k', mousePen: false, ruler: null };
/* working space: 'side' gives the right part of the page to blank writing room, 'below' opens a gap under
   every question, 'auto' picks side when the paper is wide (landscape) and below when narrow (portrait) */
const SPACES = ['auto', 'side', 'below', 'off'];
const SPACE_LABEL = { auto: 'Auto', side: 'Side', below: 'Below', off: 'Off' };
let spaceMode = 'auto';
try { spaceMode = JSON.parse(localStorage.getItem('bv:ink:space')) || 'auto'; } catch (e) { /* default */ }
if (!SPACES.includes(spaceMode)) spaceMode = 'auto';   // ruler: { x, y, a } in content px, kept across redraws

const isField = el => !!(el && el.closest && el.closest('input, textarea, select, button, a, label.exam-opt, .ink-bar'));

function attach(host, wrap, opts) {
  let strokes = (opts.strokes || []).slice();
  const layer = document.createElementNS(NS, 'svg');
  layer.setAttribute('class', 'ink-layer');
  host.appendChild(layer);
  const bar = document.createElement('div');
  bar.className = 'ink-bar';
  document.body.appendChild(bar);   // outside the scrolling pane, so iPad scrolling can't drag or shake it
  let rulerEl = null;

  /* ---------- geometry: content px <-> stored units (1000 = paper width, y from the anchor's top) */
  const hostBox = () => host.getBoundingClientRect();
  const contentPt = e => { const r = hostBox(); return { x: e.clientX - r.left + host.scrollLeft, y: e.clientY - r.top + host.scrollTop }; };
  const topOf = el => el.getBoundingClientRect().top - hostBox().top + host.scrollTop;
  const anchors = () => [wrap, ...wrap.querySelectorAll('.exam-q, .exam-submit')];
  const frame = () => { const r = wrap.getBoundingClientRect(), hb = hostBox(); return { left: r.left - hb.left + host.scrollLeft, w: r.width || 1 }; };
  function anchorFor(y) { const list = anchors(); let i = 0; list.forEach((el, j) => { if (topOf(el) <= y) i = j; }); return i; }
  const toUnits = (p, a, f, top) => [Math.round((p.x - f.left) / f.w * 1000), Math.round((p.y - top) / f.w * 1000)];
  const geo = () => ({ f: frame(), tops: anchors().map(topOf) });
  function toPx(s, g = geo()) {
    const top = g.tops[Math.min(s.a, g.tops.length - 1)] || 0, out = [];
    for (let i = 0; i < s.p.length; i += 2) out.push({ x: g.f.left + s.p[i] / 1000 * g.f.w, y: top + s.p[i + 1] / 1000 * g.f.w });
    return out;
  }
  let fw = 1;   // paper width in px at the last render
  const widthPx = s => Math.max(1, s.w / 1000 * fw);

  /* ---------- drawing */
  function pathD(pts) {
    if (!pts.length) return '';
    if (pts.length < 3) return `M${pts[0].x} ${pts[0].y}` + pts.slice(1).map(p => `L${p.x} ${p.y}`).join('') + (pts.length === 1 ? 'l.01 0' : '');
    let d = `M${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2; d += `Q${pts[i].x} ${pts[i].y} ${mx} ${my}`; }
    const l = pts[pts.length - 1];
    return d + `L${l.x} ${l.y}`;
  }
  function pathEl(s, pts) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', pathD(pts));
    p.setAttribute('stroke', COLORS[s.c] || COLORS.k);
    p.setAttribute('stroke-width', widthPx(s));
    if (s.o < 1) p.setAttribute('stroke-opacity', s.o);
    return p;
  }
  function render() {
    layer.setAttribute('width', host.clientWidth);
    layer.setAttribute('height', Math.max(host.scrollHeight, wrap.offsetTop + wrap.offsetHeight));
    const g = geo(); fw = g.f.w;
    layer.replaceChildren(...strokes.map(s => pathEl(s, toPx(s, g))));
    placeRuler();
  }
  const persist = () => opts.save(strokes.slice());

  /* ---------- ruler */
  const RW = () => Math.min(520, frame().w * .8), RH = 54;
  function rulerEdges() {
    const r = ui.ruler; if (!r) return [];
    const c = Math.cos(r.a), s = Math.sin(r.a), half = RW() / 2;
    const ux = { x: c, y: s }, nx = { x: -s, y: c };
    return [-1, 1].map(side => ({ o: { x: r.x + nx.x * side * RH / 2, y: r.y + nx.y * side * RH / 2 }, u: ux, n: { x: nx.x * side, y: nx.y * side }, half }));
  }
  function snapEdge(p) {
    for (const e of rulerEdges()) {
      const dx = p.x - e.o.x, dy = p.y - e.o.y, along = dx * e.u.x + dy * e.u.y, out = dx * e.n.x + dy * e.n.y;
      if (Math.abs(along) <= e.half && out > -8 && out < 26) return e;
    }
    return null;
  }
  const onEdge = (e, p) => { const along = (p.x - e.o.x) * e.u.x + (p.y - e.o.y) * e.u.y; return { x: e.o.x + e.u.x * along + e.n.x * 2, y: e.o.y + e.u.y * along + e.n.y * 2 }; };
  function placeRuler() {
    if (!ui.ruler) { if (rulerEl) { rulerEl.remove(); rulerEl = null; } return; }
    if (!rulerEl) {
      rulerEl = document.createElement('div');
      rulerEl.className = 'ink-ruler';
      rulerEl.innerHTML = '<div class="ink-ruler-scale"></div><span class="ink-ruler-deg"></span><span class="ink-ruler-rot l"></span><span class="ink-ruler-rot r"></span><button class="ink-ruler-x" title="Put the ruler away">×</button>';
      host.appendChild(rulerEl);
      wireRuler();
    }
    const w = RW(), r = ui.ruler;
    rulerEl.style.width = w + 'px';
    rulerEl.style.height = RH + 'px';
    rulerEl.style.transform = `translate(${r.x - w / 2}px, ${r.y - RH / 2}px) rotate(${r.a}rad)`;
    let deg = Math.round(((r.a * 180 / Math.PI) % 180 + 180) % 180);
    if (deg > 90) deg = 180 - deg;
    rulerEl.querySelector('.ink-ruler-deg').textContent = deg + '°';
  }
  function wireRuler() {
    rulerEl.querySelector('.ink-ruler-x').onclick = () => { ui.ruler = null; placeRuler(); drawBar(); };
    let drag = null;
    rulerEl.addEventListener('pointerdown', e => {
      if (e.target.closest('.ink-ruler-x')) return;
      if (e.pointerType === 'pen' && !e.target.classList.contains('ink-ruler-rot')) return;   // the pen writes along it
      e.preventDefault(); e.stopPropagation();
      try { rulerEl.setPointerCapture(e.pointerId); } catch (err) { /* not a live pointer */ }
      const p = contentPt(e);
      drag = e.target.classList.contains('ink-ruler-rot') ? { rot: true } : { dx: p.x - ui.ruler.x, dy: p.y - ui.ruler.y };
    });
    rulerEl.addEventListener('pointermove', e => {
      if (!drag) return;
      const p = contentPt(e);
      if (drag.rot) {
        let a = Math.atan2(p.y - ui.ruler.y, p.x - ui.ruler.x);
        if (e.target.classList.contains('l') || p.x < ui.ruler.x) a += Math.PI;
        const deg = a * 180 / Math.PI, snap = Math.round(deg / 45) * 45;
        ui.ruler.a = Math.abs(deg - snap) < 3 ? snap * Math.PI / 180 : a;   // clicks into 0, 45, 90°
      } else { ui.ruler.x = p.x - drag.dx; ui.ruler.y = p.y - drag.dy; }
      placeRuler();
    });
    const end = () => { drag = null; };
    rulerEl.addEventListener('pointerup', end);
    rulerEl.addEventListener('pointercancel', end);
  }

  /* ---------- pen input */
  let cur = null;
  const draws = e => e.pointerType === 'pen' || (e.pointerType === 'mouse' && ui.mousePen && e.button === 0);
  let pxCache = null;   // stroke points in px, built once per eraser gesture
  function eraseAt(p) {
    if (!pxCache) { const g = geo(); pxCache = new Map(strokes.map(s => [s, toPx(s, g)])); }
    const r = 12, before = strokes.length;
    strokes = strokes.filter(s => !pxCache.get(s).some(q => Math.abs(q.x - p.x) < r + widthPx(s) / 2 && Math.abs(q.y - p.y) < r + widthPx(s) / 2));
    if (strokes.length !== before) { render(); return true; }
    return false;
  }
  const alive = () => { if (layer.isConnected) return true; api.detach(); return false; };   // the page was redrawn without us
  function down(e) {
    if (!alive() || !draws(e) || isField(e.target)) return;
    e.preventDefault();
    try { host.setPointerCapture(e.pointerId); } catch (err) { /* not a live pointer */ }
    const p = contentPt(e);
    if (ui.tool === 'er') { pxCache = null; cur = { erase: true, hit: eraseAt(p) }; return; }
    const t = TOOLS[ui.tool], a = anchorFor(p.y), f = frame(), list = anchors();
    const edge = ui.tool === 'pen' || ui.tool === 'hi' ? snapEdge(p) : null;
    const q = edge ? onEdge(edge, p) : p;
    cur = { s: { a, c: ui.tool === 'hi' && ui.color === 'k' ? 'y' : ui.color, w: Math.round(t.w / f.w * 1000 * 10) / 10, o: t.o, p: [] }, pts: [q], edge, start: q, top: topOf(list[a]), f };
    cur.el = pathEl(cur.s, cur.pts);
    layer.appendChild(cur.el);
  }
  function move(e) {
    if (!cur) return;
    e.preventDefault();
    let evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    if (!evs.length) evs = [e];
    if (cur.erase) { for (const ev of evs) if (eraseAt(contentPt(ev))) cur.hit = true; return; }
    for (const ev of evs) {
      let p = contentPt(ev);
      if (cur.edge) { cur.pts = [cur.start, onEdge(cur.edge, p)]; continue; }
      const l = cur.pts[cur.pts.length - 1];
      if (Math.hypot(p.x - l.x, p.y - l.y) >= 1.5) cur.pts.push(p);
    }
    cur.el.setAttribute('d', pathD(cur.pts));
  }
  function up() {
    if (!cur) return;
    const c = cur; cur = null;
    if (c.erase) { if (c.hit) persist(); return; }
    for (const p of c.pts) c.s.p.push(...toUnits(p, c.s.a, c.f, c.top));
    strokes.push(c.s);
    persist();
  }
  host.addEventListener('pointerdown', down);
  host.addEventListener('pointermove', move);
  host.addEventListener('pointerup', up);
  host.addEventListener('pointercancel', up);
  // iPad: a Pencil touch would otherwise scroll the page (and fingers must keep scrolling)
  const stopPencilScroll = e => { if (!alive()) return; if ([...e.touches].some(t => t.touchType === 'stylus') && !isField(e.target)) e.preventDefault(); };
  host.addEventListener('touchstart', stopPencilScroll, { passive: false });
  host.addEventListener('touchmove', stopPencilScroll, { passive: false });

  /* ---------- toolbar */
  let clearArmed = false;
  function drawBar() {
    const btn = (attr, label, on, inner) => `<button ${attr} class="ink-btn${on ? ' is-on' : ''}" title="${label}" aria-label="${label}">${inner}</button>`;
    bar.innerHTML =
      btn('data-mouse', 'Draw with the mouse or trackpad (the Apple Pencil always draws)', ui.mousePen, '<svg viewBox="0 0 24 24"><path d="M3 21l3.5-1 11-11-2.5-2.5-11 11zM14 6l2.5-2.5 2.5 2.5L16.5 8.5"/></svg>') +
      '<span class="ink-sep"></span>' +
      btn('data-tool="pen"', 'Pen', ui.tool === 'pen', '<svg viewBox="0 0 24 24"><path d="M4 20c4-1 6-6 9-9s5-4 7-6"/></svg>') +
      btn('data-tool="hi"', 'Highlighter', ui.tool === 'hi', '<svg viewBox="0 0 24 24"><path d="M5 19h6M9 15l-3 4M9 15l8-8 3 3-8 8z"/></svg>') +
      btn('data-tool="er"', 'Eraser: touch a stroke to remove it', ui.tool === 'er', '<svg viewBox="0 0 24 24"><path d="M16 4l5 5-10 10H6l-3-3zM9 9l6 6M11 19h10"/></svg>') +
      '<span class="ink-sep"></span>' +
      Object.keys(COLORS).filter(c => c !== 'y' || ui.tool === 'hi').map(c => `<button data-color="${c}" class="ink-dot${ui.color === c ? ' is-on' : ''}" style="--c:${COLORS[c]}" aria-label="Colour"></button>`).join('') +
      '<span class="ink-sep"></span>' +
      btn('data-ruler', 'Ruler', !!ui.ruler, '<svg viewBox="0 0 24 24"><path d="M3 15l12-12 6 6-12 12zM7 11l2 2M10 8l2 2M13 5l2 2M9 17l-1.5-1.5"/></svg>') +
      `<button data-space class="ink-btn ink-space" title="Working space: ${SPACE_LABEL[spaceMode]}. Tap to switch between beside the questions, below each question, automatic and off."><svg viewBox="0 0 24 24"><path d="M4 5h16v14H4zM13 5v14M15.5 9h2M15.5 12h2M15.5 15h2"/></svg><small>${SPACE_LABEL[spaceMode]}</small></button>` +
      btn('data-undo', 'Undo the last stroke', false, '<svg viewBox="0 0 24 24"><path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3"/></svg>') +
      `<button data-clear class="ink-btn ink-clear${clearArmed ? ' is-armed' : ''}" title="Clear all writing on this page">${clearArmed ? 'Clear all?' : '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>'}</button>`;
  }
  bar.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (!b.hasAttribute('data-clear') && clearArmed) clearArmed = false;
    if (b.hasAttribute('data-mouse')) ui.mousePen = !ui.mousePen;
    else if (b.dataset.tool) { ui.tool = b.dataset.tool; if (ui.tool !== 'hi' && ui.color === 'y') ui.color = 'k'; }
    else if (b.dataset.color) { ui.color = b.dataset.color; if (ui.tool === 'er') ui.tool = 'pen'; }
    else if (b.hasAttribute('data-ruler')) {
      if (ui.ruler) ui.ruler = null;
      else { const hb = hostBox(), f = frame(); ui.ruler = { x: f.left + f.w / 2, y: host.scrollTop + hb.height * .45, a: 0 }; }
      placeRuler();
    }
    else if (b.hasAttribute('data-space')) {
      spaceMode = SPACES[(SPACES.indexOf(spaceMode) + 1) % SPACES.length];
      try { localStorage.setItem('bv:ink:space', JSON.stringify(spaceMode)); } catch (err) { /* ignore */ }
      applySpace();
    }
    else if (b.hasAttribute('data-undo')) { if (strokes.length) { strokes.pop(); render(); persist(); } }
    else if (b.hasAttribute('data-clear')) {
      if (!clearArmed) { clearArmed = true; setTimeout(() => { if (clearArmed) { clearArmed = false; drawBar(); } }, 3000); }
      else { clearArmed = false; strokes = []; render(); persist(); }
    }
    host.classList.toggle('ink-mouse', ui.mousePen);
    drawBar();
  });
  host.classList.toggle('ink-mouse', ui.mousePen);
  drawBar();

  // layout changes (images loading, window resizing, marks adjusted) move the questions; strokes follow
  let raf = 0;
  const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); });
  ro.observe(wrap);
  // the toolbar is a column pinned to the top right of the paper's pane, so it is always in reach
  function applySpace() {
    const eff = spaceMode === 'auto' ? (host.clientWidth >= 900 ? 'side' : 'below') : spaceMode;
    host.classList.toggle('ink-space-side', eff === 'side');
    host.classList.toggle('ink-space-below', eff === 'below');
  }
  applySpace();
  window.addEventListener('resize', applySpace);
  const placeBar = () => { const r = hostBox(); bar.style.top = (r.top + 10) + 'px'; bar.style.right = Math.max(6, window.innerWidth - r.right + 10) + 'px'; bar.style.maxHeight = Math.max(120, r.height - 20) + 'px'; };
  const pro = new ResizeObserver(() => { placeBar(); applySpace(); });   // panels folding away or the iPad turning changes the width
  pro.observe(host);
  window.addEventListener('resize', placeBar);
  host.classList.add('ink-on');
  placeBar();
  render();

  const api = {
    detach() {
      ro.disconnect(); pro.disconnect(); window.removeEventListener('resize', placeBar); window.removeEventListener('resize', applySpace); host.classList.remove('ink-on', 'ink-space-side', 'ink-space-below');
      host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerup', up); host.removeEventListener('pointercancel', up);
      host.removeEventListener('touchstart', stopPencilScroll); host.removeEventListener('touchmove', stopPencilScroll);
      host.classList.remove('ink-mouse');
      layer.remove(); bar.remove(); if (rulerEl) rulerEl.remove();
    },
  };
  return api;
}
window.BVInk = { attach };
})();
