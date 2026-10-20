/* Nova map: the vault's 3D graph (the same brain layout as the Free graph view) drawn with plain
   WebGL as the background of every Nova page.
   - background: dim, slowly turning, ignores the mouse, drawn at ~30 fps and paused when hidden
   - map mode (NovaUI.map.open): the pages fade away and the map becomes interactive with a HUD;
     drag to turn, scroll to zoom, click a note to fly into it and open it, Esc to return
   - flyTo(ids, { open, caption }): highlight notes, fly the camera to them, then open one;
     the assistant uses this to "bring up" a lecture
   - warp({ caption, then }): rush through the map, then run `then` (used to open a book page)
   The layout is computed once in small slices (no long freeze) and cached per vault build. */
(() => {
'use strict';
const B = window.BV;
const { esc, icon, store } = B;
const N = window.NovaUI;

const MOD_COLORS = {
  'Molecular Biology and Genetics': '#34D399', 'Introduction to Biomedicine': '#A78BFA', 'Biological Chemistry': '#FBBF24',
  'Cell Biology and Physiology': '#38BDF8', 'Professional Skills for Biosciences': '#FB7185',
};
const hex = c => { const n = parseInt(c.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------- graph data */
function buildData() {
  const V = B.V, nodes = [], index = new Map();
  for (const [id, n] of Object.entries(V.notes)) {
    const p = n.props || {};
    if (id === V.home || /Revision tracker$/.test(id) || /^Further reading/i.test(n.title.replace(/^\d+\s+/, '')) || /mind map/i.test(id) || id === 'Finance') continue;
    const top = id.split('/');
    const subject = id.startsWith('01 Year 1/') ? top[1] : '';
    const isTerm = id.startsWith('02 Key Terms/');
    const type = p.type || '';
    const color = isTerm ? '#E9D58A' : MOD_COLORS[subject] || '#A78BFA';
    const size = type === 'subject hub' ? 5.2 : type === 'hub' ? 3.6 : isTerm ? 1.5 : 2.2;
    const node = { id, title: (p.title || n.title).replace(/^\d+\s+/, ''), color, size, type, isTerm, group: isTerm ? 9 : Object.keys(MOD_COLORS).indexOf(subject), folder: id.slice(0, id.lastIndexOf('/')), deg: 0, x: NaN, y: NaN, z: NaN };
    index.set(id, nodes.length); nodes.push(node);
  }
  const links = [], seen = new Set();
  for (const nd of nodes) for (const t of (V.notes[nd.id].links || [])) {
    if (!index.has(t) || t === nd.id) continue;
    const a = index.get(nd.id), b = index.get(t), k = a < b ? a + ':' + b : b + ':' + a;
    if (seen.has(k)) continue; seen.add(k);
    links.push({ source: nodes[a], target: nodes[b], a, b });
    nodes[a].deg++; nodes[b].deg++;
  }
  return { nodes, links, index };
}
function layout(data, onProgress) {
  const key = 'novaMapLayout';
  const cached = store.get(key, null);
  if (cached && cached.built === B.V.built && cached.n === data.nodes.length) {
    data.nodes.forEach(n => { const p = cached.pos[n.id]; if (p) [n.x, n.y, n.z] = p; });
    if (data.nodes.every(n => Number.isFinite(n.x))) return Promise.resolve();
  }
  const G = window.BVGraph3D;
  const gcfg = B.V.graph || {};
  const cfg = { repel: gcfg.repel ?? 10, linkStrength: gcfg.linkStrength ?? 1, linkDistance: gcfg.linkDistance ?? 120, nodeSize: gcfg.nodeSize ?? 1.2, center: gcfg.center ?? .4 };
  const sim = new G.BrainSimulation(data, cfg);
  return new Promise(res => {
    const slice = () => {
      const t0 = performance.now();
      let more = true;
      while (more && performance.now() - t0 < 10) more = sim.tick();
      onProgress && onProgress();
      if (more) setTimeout(slice, 16);
      else {
        const pos = {}; data.nodes.forEach(n => { pos[n.id] = [Math.round(n.x * 10) / 10, Math.round(n.y * 10) / 10, Math.round(n.z * 10) / 10]; });
        store.set(key, { built: B.V.built, n: data.nodes.length, pos });
        res();
      }
    };
    slice();
  });
}

/* ---------------------------------------------------------------- tiny matrix helpers */
function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}
function lookAt(e, c, up) {
  let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2]; let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
  let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx; l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  return [xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0, -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1];
}
function mul(a, b) {
  const o = new Array(16);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; }
  return o;
}

/* ---------------------------------------------------------------- shaders */
const PV = `#version 300 es
in vec3 aPos; in vec3 aCol; in float aSize; in float aHi;
uniform mat4 uMVP; uniform float uScale; uniform float uTime; uniform float uDim; uniform float uAny;
out vec3 vCol; out float vA; out float vHi;
void main() {
  vec4 p = uMVP * vec4(aPos, 1.0);
  gl_Position = p;
  float d = max(p.w, 1.0);
  float tw = 0.78 + 0.22 * sin(uTime * 1.1 + aPos.x * 0.05 + aPos.z * 0.04);
  float pulse = aHi * (0.5 + 0.5 * sin(uTime * 4.0));
  gl_PointSize = clamp(aSize * uScale / d * (1.0 + aHi * (1.6 + pulse)), 1.2, 90.0);
  vCol = aCol; vHi = aHi;
  vA = tw * uDim * mix(1.0, 0.28, uAny * (1.0 - aHi)) + aHi * 0.8;
}`;
const PF = `#version 300 es
precision mediump float;
in vec3 vCol; in float vA; in float vHi; out vec4 o;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r > 1.0) discard;
  float glow = pow(1.0 - r, 2.2);
  float core = smoothstep(0.42, 0.0, r);
  vec3 c = vCol * glow + vec3(1.0) * core * (0.45 + vHi * 0.5);
  c *= vA;
  o = vec4(c, max(c.r, max(c.g, c.b)));
}`;
const LV = `#version 300 es
in vec3 aPos; in vec3 aCol; in float aHi;
uniform mat4 uMVP; uniform float uAlpha; uniform float uAny;
out vec3 vCol; out float vA;
void main() { gl_Position = uMVP * vec4(aPos, 1.0); vCol = aCol; vA = uAlpha * mix(1.0, 0.25, uAny * (1.0 - aHi)) + aHi * 0.5; }`;
const LF = `#version 300 es
precision mediump float;
in vec3 vCol; in float vA; out vec4 o;
void main() { vec3 c = vCol * vA; o = vec4(c, max(c.r, max(c.g, c.b))); }`;
function program(gl, vs, fs) {
  const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh)); return sh; };
  const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  return p;
}

/* ---------------------------------------------------------------- the map */
let M = null;
function mount() {
  if (M || !B.isNova() || !B.V) return;
  const host = document.createElement('div');
  host.className = 'nova-bg nova-map'; host.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(host, document.body.firstChild);
  const canvas = document.createElement('canvas'); host.appendChild(canvas);
  const hud = document.createElement('div'); hud.className = 'nmap-hud'; document.body.appendChild(hud);
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true, depth: false });
  M = { host, canvas, hud, gl, data: null, ready: false, mode: 'bg', hi: new Set(), raf: 0, last: 0, t: 0, alive: true,
    cam: { yaw: 0.6, pitch: 0.18, dist: 900, tx: 0, ty: 0, tz: 0, fov: 0.95 }, goal: null, spin: 0.035, dim: 0.55, dimGoal: 0.55,
    pointer: { x: -1, y: -1, down: false, moved: 0 }, hover: null, timers: [] };
  M.goal = { ...M.cam };
  if (!gl) { host.classList.add('no-gl'); console.warn('Nova map: WebGL2 is not available in this browser'); return; }
  M.data = buildData();
  M.pProg = program(gl, PV, PF); M.lProg = program(gl, LV, LF);
  const nodes = M.data.nodes, links = M.data.links;
  M.pos = new Float32Array(nodes.length * 3); M.col = new Float32Array(nodes.length * 3); M.size = new Float32Array(nodes.length); M.hiArr = new Float32Array(nodes.length);
  nodes.forEach((n, i) => { M.col.set(hex(n.color), i * 3); M.size[i] = n.size; });
  M.lpos = new Float32Array(links.length * 6); M.lcol = new Float32Array(links.length * 6); M.lhi = new Float32Array(links.length * 2);
  links.forEach((l, i) => { const ca = hex(l.source.color), cb = hex(l.target.color); M.lcol.set(ca, i * 6); M.lcol.set(cb, i * 6 + 3); });
  const buf = (data, usage) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, usage); return b; };
  M.bPos = buf(M.pos, gl.DYNAMIC_DRAW); M.bCol = buf(M.col, gl.STATIC_DRAW); M.bSize = buf(M.size, gl.STATIC_DRAW); M.bHi = buf(M.hiArr, gl.DYNAMIC_DRAW);
  M.bLPos = buf(M.lpos, gl.DYNAMIC_DRAW); M.bLCol = buf(M.lcol, gl.STATIC_DRAW); M.bLHi = buf(M.lhi, gl.DYNAMIC_DRAW);
  const attr = (prog, name, b, size) => { const loc = gl.getAttribLocation(prog, name); if (loc < 0) return; gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); };
  M.vaoP = gl.createVertexArray(); gl.bindVertexArray(M.vaoP);
  attr(M.pProg, 'aPos', M.bPos, 3); attr(M.pProg, 'aCol', M.bCol, 3); attr(M.pProg, 'aSize', M.bSize, 1); attr(M.pProg, 'aHi', M.bHi, 1);
  M.vaoL = gl.createVertexArray(); gl.bindVertexArray(M.vaoL);
  attr(M.lProg, 'aPos', M.bLPos, 3); attr(M.lProg, 'aCol', M.bLCol, 3); attr(M.lProg, 'aHi', M.bLHi, 1);
  gl.bindVertexArray(null);
  M.u = {}; for (const [p, names] of [[M.pProg, ['uMVP', 'uScale', 'uTime', 'uDim', 'uAny']], [M.lProg, ['uMVP', 'uAlpha', 'uAny']]]) { M.u[p === M.pProg ? 'p' : 'l'] = Object.fromEntries(names.map(n => [n, gl.getUniformLocation(p, n)])); }
  const sync = () => { nodes.forEach((n, i) => { M.pos[i * 3] = n.x; M.pos[i * 3 + 1] = n.y; M.pos[i * 3 + 2] = n.z; });
    links.forEach((l, i) => { M.lpos.set([l.source.x, l.source.y, l.source.z, l.target.x, l.target.y, l.target.z], i * 6); });
    gl.bindBuffer(gl.ARRAY_BUFFER, M.bPos); gl.bufferSubData(gl.ARRAY_BUFFER, 0, M.pos);
    gl.bindBuffer(gl.ARRAY_BUFFER, M.bLPos); gl.bufferSubData(gl.ARRAY_BUFFER, 0, M.lpos); };
  host.classList.add('is-loading');
  layout(M.data, () => { if (Number.isFinite(nodes[0].x)) { sync(); fitGoal(true); kick(); } }).then(() => {
    if (!M) return;
    sync(); M.ready = true; fitGoal(true); host.classList.remove('is-loading'); kick();
  });
  resize();
  M.ro = new ResizeObserver(() => { resize(); kick(); }); M.ro.observe(host);
  document.addEventListener('visibilitychange', kick);
  wireInput();
  kick();
}
function unmount() {
  if (!M) return;
  exitMap(true);
  M.alive = false; cancelAnimationFrame(M.raf); M.ro && M.ro.disconnect();
  M.timers.forEach(clearTimeout); clearTimeout(M.idle);
  document.removeEventListener('visibilitychange', kick);
  try { M.gl && M.gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch (e) { /* gone */ }
  M.host.remove(); M.hud.remove(); M = null;
}
function resize() {
  if (!M) return;
  const dpr = M.mode === 'map' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
  const w = Math.max(1, M.host.clientWidth), h = Math.max(1, M.host.clientHeight);
  M.w = w; M.h = h;
  M.canvas.width = Math.round(w * dpr); M.canvas.height = Math.round(h * dpr); M.dpr = dpr;
}
function bounds() {
  const ns = M.data.nodes.filter(n => Number.isFinite(n.x));
  if (!ns.length) return { c: [0, 0, 0], r: 400 };
  const c = [0, 1, 2].map(k => ns.reduce((s, n) => s + [n.x, n.y, n.z][k], 0) / ns.length);
  const r = Math.max(...ns.map(n => Math.hypot(n.x - c[0], n.y - c[1], n.z - c[2])));
  return { c, r };
}
function fitGoal(immediate) {
  const { c, r } = bounds();
  // background: close enough that the notes spread across the screen like a star field
  Object.assign(M.goal, { tx: c[0], ty: c[1], tz: c[2], dist: r * (M.mode === 'map' ? 2.6 : 1.25), pitch: 0.18 });
  if (immediate) Object.assign(M.cam, { tx: M.goal.tx, ty: M.goal.ty, tz: M.goal.tz, dist: M.goal.dist });
}
function eye() {
  const c = M.cam, cp = Math.cos(c.pitch);
  return [c.tx + Math.sin(c.yaw) * cp * c.dist, c.ty + Math.sin(c.pitch) * c.dist, c.tz + Math.cos(c.yaw) * cp * c.dist];
}
function mvp() {
  const proj = perspective(M.cam.fov, M.w / M.h, 2, 20000);
  const view = lookAt(eye(), [M.cam.tx, M.cam.ty, M.cam.tz], [0, 1, 0]);
  return mul(proj, view);
}
function project(m, n) {
  const x = n.x, y = n.y, z = n.z;
  const cx = m[0] * x + m[4] * y + m[8] * z + m[12], cy = m[1] * x + m[5] * y + m[9] * z + m[13], cw = m[3] * x + m[7] * y + m[11] * z + m[15];
  if (cw <= 2) return null;
  return { x: (cx / cw * 0.5 + 0.5) * M.w, y: (1 - (cy / cw * 0.5 + 0.5)) * M.h, w: cw };
}
function kick() { if (M && !M.raf && M.alive && !document.hidden) { clearTimeout(M.idle); M.last = performance.now(); M.raf = requestAnimationFrame(frame); } }
function frame(now) {
  M.raf = 0;
  if (!M.alive || document.hidden) return;
  const dt = Math.min(0.05, (now - M.last) / 1000); M.last = now;
  M.t += dt;
  const active = M.mode !== 'bg' || M.flying;
  // ease camera
  const k = 1 - Math.exp(-dt / (M.flying ? M.flyTau || 0.45 : 0.6));
  let moving = false;
  for (const key of ['yaw', 'pitch', 'dist', 'tx', 'ty', 'tz', 'fov']) {
    const d = M.goal[key] - M.cam[key];
    if (Math.abs(d) > (key === 'dist' ? 0.05 : 0.0002)) { M.cam[key] += d * k; moving = true; } else M.cam[key] = M.goal[key];
  }
  if (!M.dragging && !reduced) { M.goal.yaw += M.spin * dt; M.cam.yaw += M.spin * dt; }
  M.dim += (M.dimGoal - M.dim) * (1 - Math.exp(-dt / 0.35));
  draw();
  if (M.mode === 'map') hudFrame();
  // the background only needs ~30 fps; map mode and flights run at full rate
  const next = () => { M.raf = requestAnimationFrame(frame); };
  if (active || moving) next();
  else { clearTimeout(M.idle); M.idle = setTimeout(() => { if (M && M.alive && !M.raf) M.raf = requestAnimationFrame(frame); }, 1000 / 30); }
}
function draw() {
  const gl = M.gl; if (!gl || !M.data) return;
  gl.viewport(0, 0, M.canvas.width, M.canvas.height);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE);
  const m = mvp(); M.m = m;
  const any = M.hi.size ? 1 : 0;
  gl.useProgram(M.lProg); gl.bindVertexArray(M.vaoL);
  gl.uniformMatrix4fv(M.u.l.uMVP, false, m); gl.uniform1f(M.u.l.uAlpha, (M.mode === 'map' ? 0.16 : 0.05) * M.dim / 0.55); gl.uniform1f(M.u.l.uAny, any);
  gl.drawArrays(gl.LINES, 0, M.data.links.length * 2);
  gl.useProgram(M.pProg); gl.bindVertexArray(M.vaoP);
  gl.uniformMatrix4fv(M.u.p.uMVP, false, m); gl.uniform1f(M.u.p.uScale, M.h * M.dpr * 1.6); gl.uniform1f(M.u.p.uTime, M.t); gl.uniform1f(M.u.p.uDim, M.dim); gl.uniform1f(M.u.p.uAny, any);
  gl.drawArrays(gl.POINTS, 0, M.data.nodes.length);
  gl.bindVertexArray(null);
}
function setHighlight(ids) {
  M.hi = new Set(ids.filter(id => M.data.index.has(id)));
  M.hiArr.fill(0); M.lhi.fill(0);
  M.hi.forEach(id => { M.hiArr[M.data.index.get(id)] = 1; });
  M.data.links.forEach((l, i) => { if (M.hi.has(l.source.id) || M.hi.has(l.target.id)) { M.lhi[i * 2] = M.lhi[i * 2 + 1] = 1; } });
  const gl = M.gl;
  gl.bindBuffer(gl.ARRAY_BUFFER, M.bHi); gl.bufferSubData(gl.ARRAY_BUFFER, 0, M.hiArr);
  gl.bindBuffer(gl.ARRAY_BUFFER, M.bLHi); gl.bufferSubData(gl.ARRAY_BUFFER, 0, M.lhi);
  kick();
}

/* ---------------------------------------------------------------- map mode + HUD */
function hudShell() {
  M.hud.innerHTML = `<div class="nmap-top"><div class="nmap-brand"><i></i>Neural map</div><div class="nmap-status"></div></div>
    <div class="nmap-legend">${Object.entries(MOD_COLORS).map(([t, c]) => `<span style="--c:${c}"><i></i>${esc(t)}</span>`).join('')}<span style="--c:#E9D58A"><i></i>Key terms</span></div>
    <div class="nmap-hint">Drag to turn · scroll to zoom · click a note to open it · Esc to go back</div>
    <button class="nmap-exit">${icon('arrow-left')}<span>Back to notes</span></button>
    <div class="nmap-marks"></div><div class="nmap-tip" hidden></div>`;
  M.hud.querySelector('.nmap-exit').addEventListener('click', () => exitMap());
}
function status(text) {
  const el = M && M.hud.querySelector('.nmap-status'); if (!el) return;
  el.textContent = '';
  let i = 0; clearInterval(M.typer);
  M.typer = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(M.typer); }, 18);
}
function enterMap() {
  if (!M || !M.gl) return false;
  if (M.mode === 'map') return true;
  M.mode = 'map'; hudShell(); resize();
  document.body.classList.add('nova-map-on');
  M.dimGoal = 1; M.spin = 0.02;
  document.addEventListener('keydown', onMapKey, true);
  kick(); return true;
}
function exitMap(silent) {
  if (!M || M.mode !== 'map') return;
  M.mode = 'bg'; M.flying = false; resize();
  document.body.classList.remove('nova-map-on');
  M.hud.innerHTML = ''; clearInterval(M.typer);
  M.dimGoal = 0.55; M.spin = 0.035; M.goal.fov = 0.95;
  setHighlight([]); fitGoal(false);
  document.removeEventListener('keydown', onMapKey, true);
  if (!silent) kick();
}
function onMapKey(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); exitMap(); } }
function hudFrame() {
  const marks = M.hud.querySelector('.nmap-marks'); if (!marks || !M.m) return;
  const want = [...M.hi].slice(0, 8);
  if (marks.childElementCount !== want.length || marks.dataset.k !== want.join('|')) {
    marks.dataset.k = want.join('|');
    marks.innerHTML = want.map((id, i) => `<div class="nmap-mark${i === 0 ? ' is-main' : ''}"><i></i><b>${esc(M.data.nodes[M.data.index.get(id)].title)}</b></div>`).join('');
  }
  want.forEach((id, i) => {
    const p = project(M.m, M.data.nodes[M.data.index.get(id)]); const el = marks.children[i];
    if (!p) { el.style.opacity = 0; return; }
    el.style.opacity = 1; el.style.transform = `translate(${p.x}px, ${p.y}px)`;
  });
}
function pick(x, y) {
  if (!M.m) return null;
  let best = null, bd = 18 * 18;
  for (const n of M.data.nodes) { const p = project(M.m, n); if (!p) continue; const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = n; } }
  return best;
}
function wireInput() {
  const c = M.canvas;
  c.addEventListener('pointerdown', e => { if (!M || M.mode !== 'map' || M.flying) return; M.dragging = true; M.pointer = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: 0 }; c.setPointerCapture(e.pointerId); });
  c.addEventListener('pointermove', e => {
    if (!M || M.mode !== 'map') return;
    if (M.dragging) {
      const dx = e.clientX - M.pointer.x, dy = e.clientY - M.pointer.y; M.pointer.moved += Math.abs(dx) + Math.abs(dy);
      M.goal.yaw -= dx * 0.005; M.goal.pitch = Math.max(-1.3, Math.min(1.3, M.goal.pitch + dy * 0.005));
      M.pointer.x = e.clientX; M.pointer.y = e.clientY; kick(); return;
    }
    const n = pick(e.clientX, e.clientY), tip = M.hud.querySelector('.nmap-tip');
    if (!tip) return;
    if (n) { tip.hidden = false; tip.textContent = n.title; tip.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 10}px)`; tip.style.setProperty('--c', n.color); c.style.cursor = 'pointer'; }
    else { tip.hidden = true; c.style.cursor = 'grab'; }
  });
  const up = e => {
    if (!M || !M.dragging) return; M.dragging = false;
    if (M.pointer.moved < 6) { const n = pick(e.clientX, e.clientY); if (n) flyTo([n.id], { open: n.id, caption: n.title, dwell: 200 }); }
  };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  c.addEventListener('wheel', e => { if (!M || M.mode !== 'map') return; e.preventDefault(); M.goal.dist = Math.max(40, Math.min(6000, M.goal.dist * Math.exp(e.deltaY * 0.0012))); kick(); }, { passive: false });
}

/* ---------------------------------------------------------------- public moves */
function focusGoal(ids) {
  const ns = ids.map(id => M.data.nodes[M.data.index.get(id)]).filter(Boolean);
  if (!ns.length) return;
  const c = [0, 1, 2].map(k => ns.reduce((s, n) => s + [n.x, n.y, n.z][k], 0) / ns.length);
  const r = Math.max(30, ...ns.map(n => Math.hypot(n.x - c[0], n.y - c[1], n.z - c[2])));
  Object.assign(M.goal, { tx: c[0], ty: c[1], tz: c[2], dist: Math.max(170, r * 3.2) });
}
function open(focusId) {
  if (!enterMap()) return;
  const ids = focusId && M.data.index.has(focusId) ? [focusId] : [];
  setHighlight(ids);
  // pull right out so the whole map is in view first, then glide to where you are
  fitGoal(false); M.goal.yaw = M.cam.yaw - 0.5;
  status('Everything in your notes · ' + M.data.nodes.length + ' notes');
  if (ids.length) {
    M.timers.forEach(clearTimeout); M.timers = [];
    M.timers.push(setTimeout(() => { if (!M || M.mode !== 'map') return; focusGoal(ids); M.goal.dist = Math.max(M.goal.dist, 320); status('You are here · ' + M.data.nodes[M.data.index.get(focusId)].title); }, reduced ? 0 : 1600));
  }
}
/** Highlight notes, fly to them, then (optionally) dive into `open` and show it. */
function flyTo(ids, opts = {}) {
  if (!M || !M.ready || !enterMap()) { if (opts.open) B.go(opts.open, opts.heading || null); return; }
  ids = ids.filter(id => M.data.index.has(id));
  if (!ids.length) { if (opts.open) B.go(opts.open, opts.heading || null); return; }
  M.timers.forEach(clearTimeout); M.timers = [];
  setHighlight(ids);
  M.flying = true; M.flyTau = 0.55;
  // pull back a little first, then sweep in to the group
  fitGoal(false);
  status(opts.caption ? 'Locating · ' + opts.caption : 'Locating');
  const t1 = setTimeout(() => { if (!M) return; focusGoal(ids); M.goal.yaw = M.cam.yaw + 0.6; status(opts.caption || 'Found'); }, reduced ? 0 : 1100);
  M.timers.push(t1);
  if (!opts.open) { M.timers.push(setTimeout(() => { if (M) M.flying = false; }, 1800)); return; }
  const dwell = opts.dwell ?? 1500;
  M.timers.push(setTimeout(() => {
    if (!M) return;
    const n = M.data.nodes[M.data.index.get(opts.open)] || M.data.nodes[M.data.index.get(ids[0])];
    if (n) Object.assign(M.goal, { tx: n.x, ty: n.y, tz: n.z, dist: 26, fov: 0.75 });
    M.flyTau = 0.35;
    document.body.classList.add('nova-map-dive');
    status('Opening · ' + (n ? n.title : ''));
  }, (reduced ? 0 : 1100) + dwell));
  M.timers.push(setTimeout(() => {
    if (!M) return;
    B.go(opts.open, opts.heading || null);
    document.body.classList.remove('nova-map-dive');
    exitMap();
  }, (reduced ? 0 : 1100) + dwell + 850));
}
/** Rush through the map (no node to aim at), then run `then`. Used for opening a book page. */
function warp(opts = {}) {
  if (!M || !M.ready || !enterMap()) { opts.then && opts.then(); return; }
  M.timers.forEach(clearTimeout); M.timers = [];
  setHighlight([]);
  M.flying = true; M.flyTau = 0.5;
  status(opts.caption || 'Opening the library');
  const { c } = bounds();
  Object.assign(M.goal, { tx: c[0], ty: c[1], tz: c[2], dist: 8, fov: 1.5 });
  M.spin = 0.4;
  document.body.classList.add('nova-map-warp');
  M.timers.push(setTimeout(() => {
    if (!M) return;
    document.body.classList.remove('nova-map-warp');
    opts.then && opts.then();
    exitMap();
  }, reduced ? 50 : 1300));
}

/* ---------------------------------------------------------------- lifecycle */
document.addEventListener('bv-uimode', e => { if (e.detail.mode === 'nova') setTimeout(mount, 0); else unmount(); });
B.onBoot && B.onBoot(() => setTimeout(mount, 0));
if (B.V) setTimeout(mount, 0);
N.map = { open, flyTo, warp, close: () => exitMap(), isOpen: () => !!(M && M.mode === 'map') };
})();
