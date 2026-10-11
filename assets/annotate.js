/* Per-note annotation layer: permanent notes and whiteboard drawings on top of (or beside) any
   note, saved to the private book engine (POST/GET/PUT /annotate, POST /annotate-draw) behind the
   same PIN session the book library uses. The SVG overlay lives inside #view (the note's own scroll
   container), so it scrolls with the content instead of needing viewport math. */
(() => {
'use strict';
const B = window.BV;
const { esc, $, $$, h, store } = B;
const SVGNS = 'http://www.w3.org/2000/svg';

let API = '';
B.onBoot(V => { const c = ((V.config || {}).books) || {}; API = String(c.api || '').replace(/\/+$/, ''); });

/* ---------- a small local icon set, since the shared ICON map has no shape glyphs */
const WICON = {
  select: '<path d="M4 3l7 17 2-7 7-2z"/>',
  pen: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  highlight: '<rect x="3" y="14" width="18" height="6" rx="1"/><path d="m7 14 7-11 3 2-7 11z"/>',
  rect: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
  ellipse: '<ellipse cx="12" cy="12" rx="9" ry="7"/>',
  diamond: '<path d="M12 3 21 12 12 21 3 12Z"/>',
  triangle: '<path d="M12 3 22 20H2Z"/>',
  star: '<path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.7 6.9L12 17.3 5.7 20.8l1.7-6.9-5.4-4.7 7.1-.6Z"/>',
  line: '<path d="M4 20 20 4"/>',
  arrow: '<path d="M4 20 20 4M20 4h-6M20 4v6"/>',
  arrow2: '<path d="M4 20 20 4M4 20h6M4 20v-6M20 4h-6M20 4v6"/>',
  polygon: '<path d="m12 2 9 6-3 10H6L3 8Z"/>',
  callout: '<path d="M4 4h16v11H9l-4 4v-4H4Z"/>',
  text: '<path d="M5 5h14M12 5v14"/>',
  undo: '<path d="M3 10h10a5 5 0 0 1 0 10H9"/><path d="M8 5 3 10l5 5"/>',
  redo: '<path d="M21 10H11a5 5 0 0 0 0 10h4"/><path d="M16 5l5 5-5 5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
};
const wicon = (n) => `<svg class="svg-icon" viewBox="0 0 24 24">${WICON[n] || ''}</svg>`;

/* ---------- shapes: creation, geometry, rendering */
const BOX = new Set(['rect', 'ellipse', 'diamond', 'triangle', 'star', 'highlight', 'text', 'callout']);
const LINE = new Set(['line', 'arrow', 'arrow2']);
const POINTS = new Set(['path', 'polygon']);
const COLORS = ['#8b9cff', '#f87171', '#34d399', '#fbbf24', '#f472b6', '#38bdf8', '#e5e7eb', '#111827'];

function uid() { return 's' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
function newShape(type, color, strokeWidth) {
  const base = { id: uid(), type, color, fill: 'none', strokeWidth, opacity: type === 'highlight' ? 0.35 : 1 };
  if (type === 'highlight') { base.fill = color; base.color = color; }
  if (BOX.has(type)) return { ...base, x: 0, y: 0, w: 1, h: 1 };
  if (LINE.has(type)) return { ...base, x1: 0, y1: 0, x2: 0, y2: 0 };
  if (POINTS.has(type)) return { ...base, points: [] };
  return base;
}
function bboxPoints(type, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2;
  if (type === 'diamond') return [[cx, y], [x + w, cy], [cx, y + h], [x, cy]];
  if (type === 'triangle') return [[cx, y], [x + w, y + h], [x, y + h]];
  if (type === 'star') {
    const pts = []; const r1 = Math.min(w, h) / 2, r2 = r1 * 0.45;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? r1 : r2, a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push([cx + r * Math.cos(a) * (w / (2 * r1 || 1)), cy + r * Math.sin(a) * (h / (2 * r1 || 1))]);
    }
    return pts;
  }
  return null;
}
function ptsAttr(pts) { return pts.map((p) => p[0] + ',' + p[1]).join(' '); }
// Freehand pen points connected straight (M...L...L...) look faceted on curves like a circle,
// since consecutive pointermove samples are joined by hard corners. Drawing a quadratic curve
// through each pair's midpoint instead rounds those corners into a smooth stroke.
function pathD(pts) {
  if (pts.length === 0) return '';
  if (pts.length < 3) return 'M ' + pts.map((p) => p[0] + ',' + p[1]).join(' L ');
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q ${pts[i][0]},${pts[i][1]} ${mx},${my}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last[0]},${last[1]}`;
  return d;
}

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVGNS, tag);
  for (const k in attrs) if (attrs[k] != null) el.setAttribute(k, attrs[k]);
  return el;
}
function strokeAttrs(s) { return { stroke: s.color, 'stroke-width': s.strokeWidth, opacity: s.opacity, fill: s.fill }; }

function renderShapeEl(s) {
  let el;
  if (s.type === 'rect' || s.type === 'highlight') el = svgEl('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: s.type === 'highlight' ? 3 : 4, ...strokeAttrs(s) });
  else if (s.type === 'ellipse') el = svgEl('ellipse', { cx: s.x + s.w / 2, cy: s.y + s.h / 2, rx: Math.max(1, s.w / 2), ry: Math.max(1, s.h / 2), ...strokeAttrs(s) });
  else if (s.type === 'diamond' || s.type === 'triangle' || s.type === 'star') el = svgEl('polygon', { points: ptsAttr(bboxPoints(s.type, s.x, s.y, s.w, s.h)), ...strokeAttrs(s) });
  else if (s.type === 'polygon') el = svgEl('polygon', { points: ptsAttr(s.points), ...strokeAttrs(s) });
  else if (s.type === 'path') el = svgEl('path', { d: pathD(s.points), fill: 'none', stroke: s.color, 'stroke-width': s.strokeWidth, opacity: s.opacity, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  else if (LINE.has(s.type)) {
    el = svgEl('line', { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, stroke: s.color, 'stroke-width': s.strokeWidth, opacity: s.opacity });
    if (s.type === 'arrow' || s.type === 'arrow2') el.setAttribute('marker-end', 'url(#ann-arrowhead)');
    if (s.type === 'arrow2') el.setAttribute('marker-start', 'url(#ann-arrowhead)');
  } else if (s.type === 'text' || s.type === 'callout') {
    const g = svgEl('g', {});
    if (s.type === 'callout') {
      g.appendChild(svgEl('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: 8, fill: 'var(--background-primary)', stroke: s.color, 'stroke-width': s.strokeWidth, opacity: s.opacity }));
      g.appendChild(svgEl('polygon', { points: `${s.x + 16},${s.y + s.h} ${s.x + 32},${s.y + s.h} ${s.x + 12},${s.y + s.h + 14}`, fill: 'var(--background-primary)', stroke: s.color, 'stroke-width': s.strokeWidth }));
    }
    const fo = svgEl('foreignObject', { x: s.x, y: s.y, width: s.w, height: s.h });
    const div = document.createElement('div');
    div.className = 'ann-text-box'; div.style.color = s.color; div.style.fontSize = (s.fontSize || 16) + 'px';
    div.textContent = s.text || '';
    fo.appendChild(div); g.appendChild(fo);
    el = g;
  } else el = svgEl('g', {});
  el.dataset.id = s.id; el.dataset.type = s.type; el.classList.add('ann-shape');
  return el;
}

/* ---------- per-note state */
const state = new Map(); // id -> { scene, loaded }
function sceneOf(id) { if (!state.has(id)) state.set(id, { scene: { shapes: [] }, loaded: false }); return state.get(id); }

let editing = false;
let tool = 'select';
let color = COLORS[0];
let strokeWidth = 2;
let selectedId = null;
let activeId = null; // the note currently showing an overlay
let toolbar = null;
let history = []; // scene JSON strings for the active note, for undo
let future = [];
let saveTimer = null;

function pushHistory() {
  const s = sceneOf(activeId);
  history.push(JSON.stringify(s.scene)); if (history.length > 60) history.shift();
  future = [];
}
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveScene(activeId), 1200);
}
async function saveScene(id) {
  if (!API || !id) return;
  const s = state.get(id); if (!s) return;
  try {
    await fetch(API + '/annotate', { method: 'PUT', credentials: 'include', mode: 'cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: id, scene: s.scene }) });
  } catch (e) { /* offline or signed out: next save attempt will retry */ }
}
async function loadScene(id) {
  const s = sceneOf(id);
  if (!API) { s.loaded = true; return s; }
  try {
    const res = await fetch(API + '/annotate?note=' + encodeURIComponent(id), { credentials: 'include', mode: 'cors', headers: { Accept: 'application/json' } });
    s.authFailed = res.status === 401 || res.status === 403;
    if (res.ok) { const d = await res.json(); s.scene = (d && d.scene) || { shapes: [] }; }
  } catch (e) { /* network/CORS failure: leave authFailed as-is, don't assume signed-out */ }
  s.loaded = true;
  return s;
}

/* ---------- overlay: one fresh SVG per hydrate, sized to the scroll container */
function buildOverlay(root, id) {
  const svg = svgEl('svg', { class: 'ann-layer', id: 'ann-layer' });
  svg.appendChild(svgEl('defs', {})).appendChild(
    Object.assign(svgEl('marker', { id: 'ann-arrowhead', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }),
      { innerHTML: '<path d="M0,0 L10,5 L0,10 z" fill="context-stroke"></path>' }));
  root.appendChild(svg);
  const resize = () => { svg.setAttribute('width', root.scrollWidth); svg.setAttribute('height', root.scrollHeight); svg.setAttribute('viewBox', `0 0 ${root.scrollWidth} ${root.scrollHeight}`); };
  resize();
  // root itself (.view-content) is a fixed-size overflow:auto box, so its own border-box never
  // changes size as content loads — watch the content it scrolls instead, which does.
  const content = root.querySelector('.markdown-preview-view') || root.firstElementChild;
  const ro = new ResizeObserver(resize);
  ro.observe(root);
  if (content) ro.observe(content);
  $$('img', root).forEach((img) => { if (!img.complete) img.addEventListener('load', resize, { once: true }); });
  svg.__ro = ro;
  return svg;
}
function renderScene(svg, scene) {
  $$('.ann-shape', svg).forEach((el) => el.remove());
  for (const s of scene.shapes) svg.appendChild(renderShapeEl(s));
}

B.onHydrate((root, id) => {
  if (root !== $('#view') || !id || !B.exists(id)) return;
  activeId = id;
  const svg = buildOverlay(root, id);
  svg.classList.toggle('is-editing', editing);
  loadScene(id).then((s) => { renderScene(svg, s.scene); if (editing) wireEditing(svg, id); });
});

/* ---------- toolbar + ribbon toggle */
function ensureRibbonButton() {
  const header = $('.view-header');
  if (!header || $('[data-act="annotate"]', header)) return;
  const btn = h(`<button class="clickable-icon" data-act="annotate" title="Annotate this note">${B.icon('pencil')}</button>`);
  const before = $('[data-act="local-graph"]', header);
  if (before) header.insertBefore(btn, before); else header.appendChild(btn);
  btn.addEventListener('click', toggleEdit);
}
function lockedPrompt() {
  const p = h(`<div class="ann-toolbar ann-locked"><div class="books-auth">
    <div class="books-auth-icon">${B.icon('lock')}</div>
    <div class="books-auth-title">Sign in to annotate</div>
    <div class="books-auth-text">Annotations are saved to your account, behind the same sign-in as the book library.</div>
    <div class="books-auth-actions"><a class="mod-cta" href="${esc(API)}" target="_blank" rel="noopener">${B.icon('link-out')} Sign in</a></div>
  </div></div>`);
  document.body.appendChild(p);
  setTimeout(() => { document.addEventListener('pointerdown', function close(e) { if (!p.contains(e.target)) { p.remove(); document.removeEventListener('pointerdown', close, true); } }, true); }, 0);
}
async function toggleEdit() {
  if (!editing) {
    if (!API) { lockedPrompt(); return; }
    const s = sceneOf(activeId);
    if (!s.loaded) await loadScene(activeId);
    if (s.authFailed) { lockedPrompt(); return; }
  }
  editing = !editing;
  $('[data-act="annotate"]').classList.toggle('is-active', editing);
  const svg = $('#ann-layer');
  if (svg) { svg.classList.toggle('is-editing', editing); if (editing) wireEditing(svg, activeId); }
  if (editing) openToolbar(); else { closeToolbar(); saveScene(activeId); }
}
function openToolbar() {
  closeToolbar();
  const shapeTools = ['rect', 'ellipse', 'diamond', 'triangle', 'star', 'line', 'arrow', 'arrow2', 'polygon', 'callout', 'text'];
  toolbar = h(`<div class="ann-toolbar">
    <div class="ann-row ann-tools">
      <button class="ann-tool is-active" data-tool="select" title="Select / move">${wicon('select')}</button>
      <button class="ann-tool" data-tool="pen" title="Pen">${wicon('pen')}</button>
      <button class="ann-tool" data-tool="highlight" title="Highlighter">${wicon('highlight')}</button>
      ${shapeTools.map((t) => `<button class="ann-tool" data-tool="${t}" title="${t}">${wicon(t)}</button>`).join('')}
    </div>
    <div class="ann-row ann-opts">
      <div class="ann-colors">${COLORS.map((c) => `<button class="ann-color${c === color ? ' is-active' : ''}" data-color="${c}" style="background:${c}"></button>`).join('')}</div>
      <input type="range" min="1" max="12" value="${strokeWidth}" class="ann-width" title="Stroke width">
      <input type="number" min="8" max="96" step="1" value="16" class="ann-fontsize" title="Text size" hidden>
      <button class="ann-tool" data-act="undo" title="Undo (⌘Z)">${wicon('undo')}</button>
      <button class="ann-tool" data-act="redo" title="Redo (⌘⇧Z)">${wicon('redo')}</button>
      <button class="ann-tool" data-act="delete" title="Delete selected">${wicon('trash')}</button>
    </div>
    <div class="ann-row ann-draw">
      <input type="text" class="ann-draw-input" placeholder="Ask AI to draw something…" maxlength="300">
      <button class="ann-draw-go mod-cta">${B.icon('sparkles')}</button>
    </div>
    <div class="ann-row ann-done"><button class="mod-cta ann-finish">${wicon('check')} Done</button></div>
  </div>`);
  document.body.appendChild(toolbar);
  toolbar.style.right = '18px'; toolbar.style.top = '70px';
  enableDragToolbar(toolbar);
  $$('.ann-tool[data-tool]', toolbar).forEach((b) => b.onclick = () => { tool = b.dataset.tool; $$('.ann-tool[data-tool]', toolbar).forEach((x) => x.classList.toggle('is-active', x === b)); selectShape(null); });
  $$('.ann-color', toolbar).forEach((b) => b.onclick = () => { color = b.dataset.color; $$('.ann-color', toolbar).forEach((x) => x.classList.toggle('is-active', x === b)); applyStyleToSelected(); });
  $('.ann-width', toolbar).oninput = (e) => { strokeWidth = +e.target.value; applyStyleToSelected(); };
  $('.ann-fontsize', toolbar).oninput = (e) => applyFontSize(+e.target.value);
  $('[data-act="undo"]', toolbar).onclick = undo;
  $('[data-act="redo"]', toolbar).onclick = redo;
  $('[data-act="delete"]', toolbar).onclick = deleteSelected;
  $('.ann-finish', toolbar).onclick = toggleEdit;
  $('.ann-draw-go', toolbar).onclick = () => runAiDraw($('.ann-draw-input', toolbar).value);
  $('.ann-draw-input', toolbar).addEventListener('keydown', (e) => { if (e.key === 'Enter') runAiDraw(e.target.value); });
  document.addEventListener('keydown', onToolbarKey, true);
}
function closeToolbar() { if (toolbar) { toolbar.remove(); toolbar = null; } document.removeEventListener('keydown', onToolbarKey, true); selectShape(null); }
function onToolbarKey(e) {
  const typing = e.target.closest('input,textarea,[contenteditable]');
  if ((e.key === 'Backspace' || e.key === 'Delete') && selectedId && !typing) { e.preventDefault(); deleteSelected(); }
  if (e.key === 'Escape') { toggleEdit(); return; }
  if ((e.metaKey || e.ctrlKey) && !typing && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) redo(); else undo();
  }
  if ((e.metaKey || e.ctrlKey) && !typing && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
}
function enableDragToolbar(panel) {
  const handle = panel;
  let dragging = false, sx = 0, sy = 0, sl = 0, st = 0;
  panel.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, input')) return;
    dragging = true; sx = e.clientX; sy = e.clientY;
    const r = panel.getBoundingClientRect(); sl = r.left; st = r.top;
    panel.setPointerCapture(e.pointerId); e.preventDefault();
  });
  panel.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    panel.style.right = 'auto';
    panel.style.left = Math.max(8, Math.min(sl + (e.clientX - sx), window.innerWidth - panel.offsetWidth - 8)) + 'px';
    panel.style.top = Math.max(8, Math.min(st + (e.clientY - sy), window.innerHeight - panel.offsetHeight - 8)) + 'px';
  });
  panel.addEventListener('pointerup', () => dragging = false);
}

/* ---------- selection, styling, undo/redo, delete */
function selectShape(id) {
  selectedId = id;
  $$('.ann-shape').forEach((el) => el.classList.toggle('is-selected', el.dataset.id === id));
  drawHandles();
  syncOptsToSelection();
}
function currentShape() { const s = sceneOf(activeId).scene; return s.shapes.find((x) => x.id === selectedId); }
function applyStyleToSelected() {
  const sh = currentShape(); if (!sh) return;
  pushHistory();
  sh.color = color; sh.strokeWidth = strokeWidth; if (sh.type === 'highlight') sh.fill = color;
  renderScene($('#ann-layer'), sceneOf(activeId).scene); selectShape(sh.id); scheduleSave();
}
function applyFontSize(size) {
  const sh = currentShape(); if (!sh || (sh.type !== 'text' && sh.type !== 'callout')) return;
  pushHistory();
  sh.fontSize = size;
  renderScene($('#ann-layer'), sceneOf(activeId).scene); selectShape(sh.id); scheduleSave();
}
function syncOptsToSelection() {
  if (!toolbar) return;
  const sh = currentShape();
  const isText = sh && (sh.type === 'text' || sh.type === 'callout');
  const fs = $('.ann-fontsize', toolbar);
  if (fs) { fs.hidden = !isText; if (isText) fs.value = sh.fontSize || 16; }
}

/* ---------- resize handles: 4 corners + 4 edge midpoints for box/points shapes, 2 endpoints for lines */
const HANDLE_SIZE = 9;
const HANDLE_CURSOR = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', p1: 'crosshair', p2: 'crosshair' };
function shapeBBox(sh) {
  if (BOX.has(sh.type)) return { x: sh.x, y: sh.y, w: sh.w, h: sh.h };
  if (LINE.has(sh.type)) return { x: Math.min(sh.x1, sh.x2), y: Math.min(sh.y1, sh.y2), w: Math.abs(sh.x2 - sh.x1), h: Math.abs(sh.y2 - sh.y1) };
  if (POINTS.has(sh.type) && sh.points.length) {
    const xs = sh.points.map((p) => p[0]), ys = sh.points.map((p) => p[1]);
    const x = Math.min(...xs), y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x || 1, h: Math.max(...ys) - y || 1 };
  }
  return { x: 0, y: 0, w: 0, h: 0 };
}
function drawHandles() {
  const svg = $('#ann-layer'); if (!svg) return;
  const old = svg.querySelector('#ann-handles'); if (old) old.remove();
  const sh = currentShape(); if (!sh || tool !== 'select') return;
  const g = svgEl('g', { id: 'ann-handles' });
  const mk = (x, y, key) => svgEl('rect', { x: x - HANDLE_SIZE / 2, y: y - HANDLE_SIZE / 2, width: HANDLE_SIZE, height: HANDLE_SIZE, class: 'ann-handle', 'data-handle': key, style: `cursor:${HANDLE_CURSOR[key]}` });
  if (LINE.has(sh.type)) {
    g.appendChild(mk(sh.x1, sh.y1, 'p1'));
    g.appendChild(mk(sh.x2, sh.y2, 'p2'));
  } else {
    const b = shapeBBox(sh);
    const pts = { nw: [b.x, b.y], n: [b.x + b.w / 2, b.y], ne: [b.x + b.w, b.y], w: [b.x, b.y + b.h / 2], e: [b.x + b.w, b.y + b.h / 2], sw: [b.x, b.y + b.h], s: [b.x + b.w / 2, b.y + b.h], se: [b.x + b.w, b.y + b.h] };
    for (const [k, [x, y]] of Object.entries(pts)) g.appendChild(mk(x, y, k));
  }
  svg.appendChild(g);
}
// Anchors the edge/corner opposite the dragged handle, so e.g. dragging the SE corner keeps the
// NW corner fixed. A handle naming only one axis ("n", "e"...) leaves the other axis unanchored,
// giving a pure horizontal/vertical resize.
function resizeBox(orig, handle, nx, ny) {
  let left = orig.x, top = orig.y, right = orig.x + orig.w, bottom = orig.y + orig.h;
  if (handle.includes('w')) left = nx;
  if (handle.includes('e')) right = nx;
  if (handle.includes('n')) top = ny;
  if (handle.includes('s')) bottom = ny;
  return { x: Math.min(left, right), y: Math.min(top, bottom), w: Math.max(1, Math.abs(right - left)), h: Math.max(1, Math.abs(bottom - top)) };
}
function applyResize(sh, origSh, handle, nx, ny) {
  if (LINE.has(sh.type)) { if (handle === 'p1') { sh.x1 = nx; sh.y1 = ny; } else { sh.x2 = nx; sh.y2 = ny; } return; }
  const origBBox = shapeBBox(origSh);
  const nb = resizeBox(origBBox, handle, nx, ny);
  if (POINTS.has(sh.type)) {
    const sx = nb.w / (origBBox.w || 1), sy = nb.h / (origBBox.h || 1);
    sh.points = origSh.points.map((p) => [nb.x + (p[0] - origBBox.x) * sx, nb.y + (p[1] - origBBox.y) * sy]);
  } else { sh.x = nb.x; sh.y = nb.y; sh.w = nb.w; sh.h = nb.h; }
}
function deleteSelected() {
  if (!selectedId) return;
  pushHistory();
  const s = sceneOf(activeId).scene; s.shapes = s.shapes.filter((x) => x.id !== selectedId);
  selectShape(null); renderScene($('#ann-layer'), s); scheduleSave();
}
function undo() {
  if (!history.length) return;
  future.push(JSON.stringify(sceneOf(activeId).scene));
  sceneOf(activeId).scene = JSON.parse(history.pop());
  renderScene($('#ann-layer'), sceneOf(activeId).scene); selectShape(null); scheduleSave();
}
function redo() {
  if (!future.length) return;
  history.push(JSON.stringify(sceneOf(activeId).scene));
  sceneOf(activeId).scene = JSON.parse(future.pop());
  renderScene($('#ann-layer'), sceneOf(activeId).scene); selectShape(null); scheduleSave();
}

/* ---------- AI draw */
async function runAiDraw(prompt) {
  prompt = (prompt || '').trim(); if (!prompt || !API) return;
  const btn = $('.ann-draw-go', toolbar); const input = $('.ann-draw-input', toolbar);
  btn.disabled = true; btn.innerHTML = '<span class="books-spinner"></span>';
  try {
    const res = await fetch(API + '/annotate-draw', { method: 'POST', credentials: 'include', mode: 'cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: activeId, prompt, scene: sceneOf(activeId).scene }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { B.toast(d.error === 'daily limit' ? "Today's drawing limit is reached." : 'The AI could not draw that.'); return; }
    if (!d.shapes || !d.shapes.length) { B.toast('Nothing came back — try rephrasing.'); return; }
    pushHistory();
    sceneOf(activeId).scene.shapes.push(...d.shapes);
    renderScene($('#ann-layer'), sceneOf(activeId).scene);
    scheduleSave();
    input.value = ''; B.toast('Added — drag any shape to adjust it.');
  } catch (e) { B.toast('The book library did not answer. Sign in, then try again.'); }
  finally { btn.disabled = false; btn.innerHTML = B.icon('sparkles'); }
}

/* ---------- drawing / moving / resizing on the SVG while editing */
function wireEditing(svg, id) {
  if (svg.__wired) return; svg.__wired = true;
  let mode = null, startX = 0, startY = 0, orig = null, pts = [], resizeHandle = null;
  const pt = (e) => { const r = svg.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

  svg.addEventListener('pointerdown', (e) => {
    if (!editing) return;
    const [x, y] = pt(e);
    const handleEl = e.target.closest('.ann-handle');
    if (tool === 'select' && handleEl && selectedId) {
      orig = JSON.parse(JSON.stringify(currentShape()));
      mode = 'resize'; resizeHandle = handleEl.dataset.handle;
      svg.setPointerCapture(e.pointerId); e.stopPropagation();
      return;
    }
    const shapeEl = e.target.closest('.ann-shape');
    if (tool === 'select') {
      if (shapeEl) { selectShape(shapeEl.dataset.id); orig = JSON.parse(JSON.stringify(currentShape())); mode = 'move'; startX = x; startY = y; svg.setPointerCapture(e.pointerId); }
      else selectShape(null);
      return;
    }
    if (tool === 'text' || tool === 'callout') {
      pushHistory();
      const sh = newShape(tool, color, strokeWidth); sh.x = x; sh.y = y; sh.w = tool === 'callout' ? 160 : 140; sh.h = tool === 'callout' ? 70 : 32; sh.fontSize = 16; sh.text = '';
      sceneOf(id).scene.shapes.push(sh); renderScene(svg, sceneOf(id).scene);
      editText(sh); return;
    }
    pushHistory();
    if (tool === 'pen') { pts = [[x, y]]; mode = 'pen'; svg.setPointerCapture(e.pointerId); return; }
    const sh = newShape(tool, color, strokeWidth);
    if (BOX.has(sh.type)) { sh.x = x; sh.y = y; sh.w = 1; sh.h = 1; }
    else if (LINE.has(sh.type)) { sh.x1 = x; sh.y1 = y; sh.x2 = x; sh.y2 = y; }
    else if (sh.type === 'polygon') { sh.points = [[x, y]]; }
    sceneOf(id).scene.shapes.push(sh); orig = sh; mode = 'draw'; startX = x; startY = y;
    svg.setPointerCapture(e.pointerId); renderScene(svg, sceneOf(id).scene); selectShape(sh.id);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!mode) return;
    const [x, y] = pt(e);
    if (mode === 'pen') { pts.push([x, y]); if (pts.length > 2000) return; const tmp = { ...newShape('path', color, strokeWidth), points: pts }; svg.querySelectorAll('.ann-pen-preview').forEach((n) => n.remove()); const el = renderShapeEl(tmp); el.classList.add('ann-pen-preview'); svg.appendChild(el); return; }
    if (mode === 'move' && orig) {
      const dx = x - startX, dy = y - startY, sh = currentShape(); if (!sh) return;
      if (BOX.has(sh.type)) { sh.x = orig.x + dx; sh.y = orig.y + dy; }
      else if (LINE.has(sh.type)) { sh.x1 = orig.x1 + dx; sh.y1 = orig.y1 + dy; sh.x2 = orig.x2 + dx; sh.y2 = orig.y2 + dy; }
      else if (POINTS.has(sh.type)) { sh.points = orig.points.map((p) => [p[0] + dx, p[1] + dy]); }
      renderScene(svg, sceneOf(id).scene); selectShape(sh.id); return;
    }
    if (mode === 'draw' && orig) {
      if (BOX.has(orig.type)) { orig.x = Math.min(startX, x); orig.y = Math.min(startY, y); orig.w = Math.max(1, Math.abs(x - startX)); orig.h = Math.max(1, Math.abs(y - startY)); }
      else if (LINE.has(orig.type)) { orig.x2 = x; orig.y2 = y; }
      else if (orig.type === 'polygon') { orig.points = orig.points.slice(0, 1).concat([[x, y]]); }
      renderScene(svg, sceneOf(id).scene); selectShape(orig.id);
    }
    if (mode === 'resize' && orig) {
      const sh = currentShape(); if (!sh) return;
      applyResize(sh, orig, resizeHandle, x, y);
      renderScene(svg, sceneOf(id).scene); selectShape(sh.id);
    }
  });
  svg.addEventListener('pointerup', () => {
    if (mode === 'pen') {
      svg.querySelectorAll('.ann-pen-preview').forEach((n) => n.remove());
      if (pts.length > 1) { const sh = { ...newShape('path', color, strokeWidth), points: pts }; sceneOf(id).scene.shapes.push(sh); }
      renderScene(svg, sceneOf(id).scene); scheduleSave();
    } else if (mode === 'move' || mode === 'draw' || mode === 'resize') scheduleSave();
    mode = null; orig = null; pts = []; resizeHandle = null;
    if (tool !== 'select' && tool !== 'pen' && tool !== 'highlight') { tool = 'select'; const b = $('.ann-tool[data-tool="select"]'); if (b) $$('.ann-tool[data-tool]').forEach((x) => x.classList.toggle('is-active', x === b)); }
  });
  svg.addEventListener('dblclick', (e) => {
    const shapeEl = e.target.closest('.ann-shape'); if (!shapeEl) return;
    const sh = sceneOf(id).scene.shapes.find((x) => x.id === shapeEl.dataset.id);
    if (sh && (sh.type === 'text' || sh.type === 'callout')) editText(sh);
  });
}
// A real HTML <textarea> laid directly over the shape, rather than trying to focus a
// contenteditable div inside an SVG foreignObject — the latter is unreliable to focus/select
// across browsers. The overlay's coordinates match the shape's 1:1, since the SVG's viewBox
// equals its pixel width/height (no scaling) and both live in the same #view coordinate space.
function editText(sh) {
  const root = $('#view');
  const ta = document.createElement('textarea');
  ta.className = 'ann-edit-box';
  ta.value = sh.text || '';
  ta.style.left = sh.x + 'px'; ta.style.top = sh.y + 'px';
  ta.style.width = sh.w + 'px'; ta.style.height = sh.h + 'px';
  ta.style.color = sh.color; ta.style.fontSize = (sh.fontSize || 16) + 'px';
  root.appendChild(ta);
  // deferred: focusing synchronously inside the pointerdown handler that creates this box loses
  // to the browser's own default focus handling once the click gesture finishes
  setTimeout(() => { ta.focus(); ta.select(); }, 0);
  const commit = () => {
    sh.text = ta.value; ta.remove();
    renderScene($('#ann-layer'), sceneOf(activeId).scene);
    scheduleSave();
  };
  ta.addEventListener('blur', commit, { once: true });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ta.blur(); }
    if (e.key === 'Escape') { e.preventDefault(); ta.blur(); }
  });
}

/* boot: add the ribbon button once the shell exists */
const tryAddBtn = () => { if ($('.workspace-ribbon')) ensureRibbonButton(); else setTimeout(tryAddBtn, 200); };
tryAddBtn();
})();
