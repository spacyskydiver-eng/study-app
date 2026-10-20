/* Nova: research mode. Ask the orb to "find information on X" and, over whatever page you're on:
   the search types itself in, the textbook results scroll past, the best sections tear out of the
   list as cards (the React Bits DecayCard shader, ported below) and whip across into a stack, then
   one explanation written from them types out beside a deck you can flick through.
   Search and explain use the same book engine the Books page uses (books.js / ask.js). */
(() => {
'use strict';
const B = window.BV;
const { icon, esc, $, $$, h } = B;
const N = window.NovaUI;
const wait = ms => new Promise(r => setTimeout(r, ms));
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;

/* ---------------------------------------------------------------- DecayCard (React Bits, MIT) — shader as published,
   wrapped as one shared renderer that moves between cards, so there's only ever one WebGL context. */
const VERT = `#version 300 es
in vec2 position; out vec2 vUv;
void main() { vUv = vec2(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5); gl_Position = vec4(position, 0.0, 1.0); }`;
const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uImage; uniform vec2 uSize; uniform vec2 uImageSize; uniform float uUnit; uniform float uScale; uniform float uIdle;
uniform float uFrequency; uniform int uOctaves; uniform float uSeed; uniform float uRadius; uniform float uTime; uniform float uFlow;
uniform float uChroma; uniform float uGray; uniform float uReady;
in vec2 vUv; out vec4 fragColor;
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g; vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n = 1.0 / 7.0; vec3 ns = n * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z); vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy; vec4 y = y_ * ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0; vec4 s1 = floor(b1) * 2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x); vec3 p1 = vec3(a0.zw, h.y); vec3 p2 = vec3(a1.xy, h.z); vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0); m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
float turbulence(vec2 p, float z) {
  float sum = 0.0; float amp = 1.0;
  for (int i = 0; i < 8; i++) { if (i >= uOctaves) break; sum += abs(snoise(vec3(p, z))) * amp; p = p * 2.0 + 19.19; amp *= 0.5; }
  return clamp(sum * 0.45 + 0.231, 0.0, 1.0);
}
float roundedBox(vec2 p, vec2 extent, float r) { vec2 q = abs(p) - extent + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
vec3 sampleImage(vec2 view) {
  vec2 uv = view / vec2(600.0, 750.0); float card = 600.0 / 750.0; float image = uImageSize.x / max(1.0, uImageSize.y);
  vec2 scale = card > image ? vec2(1.0, image / card) : vec2(card / image, 1.0);
  return texture(uImage, (uv - 0.5) * scale + 0.5).rgb;
}
void main() {
  vec2 view = vec2(300.0, 375.0) + (vUv * uSize - uSize * 0.5) / uUnit;
  float inside = min(min(view.x, 600.0 - view.x), min(view.y, 750.0 - view.y));
  float rim = 1.0 - smoothstep(0.0, 160.0, inside);
  float drift = snoise(vec3(view * 0.004 + uSeed * 0.37, uTime * 0.12)) * 0.5 + 0.5;
  float idle = uIdle * mix(smoothstep(0.55, 0.95, drift) * 0.5, 0.25 + 0.75 * smoothstep(0.3, 0.8, drift), rim);
  float scale = uScale * mix(0.2, 1.0, rim) + idle * 120.0;
  vec2 offset = vec2(0.0);
  if (scale > 0.01) {
    vec2 p = view * uFrequency + vec2(uSeed * 17.31, uSeed * 9.17);
    float z = uTime * (uFlow * 0.35 + uIdle * 0.5) + uSeed * 3.1;
    float red = turbulence(p, z); float blue = turbulence(p + vec2(31.7, 47.3), z + 5.3);
    offset = scale * (vec2(red, blue) - 0.5);
  }
  vec2 source = view + offset;
  float edge = roundedBox(source - vec2(300.0, 375.0), vec2(300.0, 375.0), uRadius);
  float alpha = (1.0 - smoothstep(-0.75 / uUnit, 0.75 / uUnit, edge)) * uReady;
  vec3 color = sampleImage(source);
  if (uChroma > 0.0) {
    vec2 split = offset * uChroma * 0.08 + vec2(uChroma * min(scale, 200.0) * 0.012, 0.0);
    color.r = sampleImage(source + split).r; color.b = sampleImage(source - split).b;
  }
  color = mix(color, vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), uGray);
  fragColor = vec4(color * alpha, alpha);
}`;
const UNIFORMS = ['uImage', 'uSize', 'uImageSize', 'uUnit', 'uScale', 'uIdle', 'uFrequency', 'uOctaves', 'uSeed', 'uRadius', 'uTime', 'uFlow', 'uChroma', 'uGray', 'uReady'];
const DECAY = { intensity: 0.9, frequency: 0.003 + 0.3 * 0.047, octaves: 5, seed: 4, idle: 0.12, flow: 0.5, chroma: 0.35, radius: 18 };

function makeDecay() {
  const cv = document.createElement('canvas'); cv.className = 'rs-decay'; cv.setAttribute('aria-hidden', 'true');
  const gl = cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.bindAttribLocation(prog, 0, 'position'); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const u = {}; for (const n of UNIFORMS) u[n] = gl.getUniformLocation(prog, n);
  const st = { level: 0, want: 0, time: 0, ready: false, host: null, alive: true };
  let raf = 0, last = 0;
  const draw = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.round(cv.clientWidth * dpr)), hh = Math.max(1, Math.round(cv.clientHeight * dpr));
    if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
    const unit = Math.max(w / 720, hh / 900) / 1.24;
    gl.viewport(0, 0, w, hh); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(u.uImage, 0); gl.uniform2f(u.uSize, w, hh); gl.uniform2f(u.uImageSize, 600, 750); gl.uniform1f(u.uUnit, unit);
    gl.uniform1f(u.uScale, st.level * DECAY.intensity * 440); gl.uniform1f(u.uIdle, DECAY.idle); gl.uniform1f(u.uFrequency, DECAY.frequency);
    gl.uniform1i(u.uOctaves, DECAY.octaves); gl.uniform1f(u.uSeed, DECAY.seed);
    gl.uniform1f(u.uRadius, Math.min(300, (DECAY.radius * (w / Math.max(1, cv.clientWidth))) / unit));
    gl.uniform1f(u.uTime, st.time); gl.uniform1f(u.uFlow, DECAY.flow); gl.uniform1f(u.uChroma, DECAY.chroma); gl.uniform1f(u.uGray, 0); gl.uniform1f(u.uReady, st.ready ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const frame = now => {
    raf = 0; if (!st.alive || !st.host) return;
    const dt = clamp((now - last) / 1000, 0.001, 0.05); last = now; st.time += dt;
    const tau = st.want > st.level ? 0.05 : 0.32;
    st.level += (st.want - st.level) * (1 - Math.exp(-dt / tau));
    draw(); raf = requestAnimationFrame(frame);
  };
  return {
    attach(host, image) {
      st.host = host; host.appendChild(cv);
      gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); gl.generateMipmap(gl.TEXTURE_2D);
      st.ready = true; st.level = st.want = 0;
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    },
    want(v) { st.want = v; },
    burst(v) { st.level = Math.max(st.level, v); },
    detach() { st.host = null; cv.remove(); cancelAnimationFrame(raf); raf = 0; },
    destroy() { st.alive = false; this.detach(); const e = gl.getExtension('WEBGL_lose_context'); if (e) e.loseContext(); },
  };
}

/* ---------------------------------------------------------------- the card face, painted once per section.
   The same painting is the shader's texture in flight and the card in the stack, so nothing swaps visibly. */
const FONT = '"Inter", ui-sans-serif, system-ui, sans-serif';
function paintCard(r, i, terms) {
  const c = document.createElement('canvas'); c.width = 600; c.height = 750;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 750); g.addColorStop(0, '#171A3A'); g.addColorStop(1, '#0A0C1A');
  x.fillStyle = g; x.fillRect(0, 0, 600, 750);
  const glow = x.createRadialGradient(520, -40, 0, 520, -40, 460); glow.addColorStop(0, 'rgba(139,92,246,.42)'); glow.addColorStop(1, 'rgba(139,92,246,0)');
  x.fillStyle = glow; x.fillRect(0, 0, 600, 750);
  const glow2 = x.createRadialGradient(40, 790, 0, 40, 790, 380); glow2.addColorStop(0, 'rgba(34,211,238,.18)'); glow2.addColorStop(1, 'rgba(34,211,238,0)');
  x.fillStyle = glow2; x.fillRect(0, 0, 600, 750);
  x.strokeStyle = 'rgba(167,139,250,.5)'; x.lineWidth = 3; x.beginPath(); x.roundRect(1.5, 1.5, 597, 747, 34); x.stroke();
  x.textBaseline = 'alphabetic';
  x.font = `700 22px ${FONT}`; x.fillStyle = '#67E8F9'; x.fillText(String(i + 1).padStart(2, '0'), 46, 72);
  x.font = `500 22px ${FONT}`; x.fillStyle = '#A6ACD6';
  let cite = B.books.cite(r); while (x.measureText(cite).width > 440 && cite.length > 4) cite = cite.slice(0, -2);
  x.fillText(cite, 92, 72);
  const wrap = (text, font, maxW, maxLines) => {
    x.font = font; const words = String(text).split(/\s+/).filter(Boolean), lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW && line) { lines.push(line); line = w; if (lines.length === maxLines) break; } else line = t; }
    if (lines.length < maxLines && line) lines.push(line);
    return lines;
  };
  let y = 132;
  const head = r.section || r.chapter || '';
  if (head) {
    const hl = wrap(head, `700 32px ${FONT}`, 508, 2);
    x.fillStyle = '#FFFFFF'; hl.forEach(l => { x.fillText(l, 46, y); y += 42; });
    y += 4; x.fillStyle = 'rgba(167,139,250,.35)'; x.fillRect(46, y, 80, 3); y += 42;
  } else y = 120;
  // body, with the topic words lit
  const body = (r.plain || r.text || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  x.font = `400 25px ${FONT}`;
  const lh = 37, maxY = 706, words = body.split(' ');
  let lx = 46, k = 0;
  for (; k < words.length && y <= maxY; k++) {
    const w = words[k], lit = terms.some(t => w.toLowerCase().replace(/[^a-z0-9-]/g, '').startsWith(t));
    x.font = `${lit ? 650 : 400} 25px ${FONT}`;
    const ww = x.measureText(w + ' ').width;
    if (lx + ww > 556 && lx > 46) { lx = 46; y += lh; if (y > maxY) break; }
    x.fillStyle = lit ? '#C4B5FD' : 'rgba(225,228,255,.86)';
    x.fillText(w, lx, y); lx += ww;
  }
  if (k < words.length) { const f = x.createLinearGradient(0, 600, 0, 748); f.addColorStop(0, 'rgba(10,12,26,0)'); f.addColorStop(1, 'rgba(10,12,26,1)'); x.fillStyle = f; x.fillRect(3, 600, 594, 145); }
  return c;
}

/* ---------------------------------------------------------------- overlay */
let open = null;
function close() {
  if (!open) return;
  const o = open; open = null; o.alive = false;
  document.removeEventListener('keydown', onKey, true);
  window.removeEventListener('pointermove', o.onMove);
  if (o.decay) o.decay.destroy();
  if (o.chip) { const c = o.chip; c.classList.add('is-out'); setTimeout(() => c.remove(), 260); }
  o.el.classList.add('is-closing'); setTimeout(() => o.el.remove(), 280);
}
// tuck the deck away into a small stack in the corner; nothing is lost until you close it
function minimise() {
  const o = open; if (!o || o.min) return;
  o.min = true; o.el.classList.add('is-min');
  if (!o.chip) {
    o.chip = h(`<div class="rs-chip" role="button" tabindex="0" title="Show the sections again"><span class="rs-chip-pile"></span><span class="rs-chip-t"><b>${esc(o.topic)}</b><small></small></span><button class="rs-chip-x" title="Close all">${icon('x')}</button></div>`);
    const pile = $('.rs-chip-pile', o.chip);
    (o.faces || []).slice(0, 3).forEach((f, i) => { const c = document.createElement('canvas'); c.width = 60; c.height = 75; c.getContext('2d').drawImage(f, 0, 0, 60, 75); c.style.setProperty('--k', i); pile.appendChild(c); });
    o.chip.addEventListener('click', e => { if (e.target.closest('.rs-chip-x')) { e.stopPropagation(); close(); return; } restore(); });
    o.chip.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); restore(); } });
    document.body.appendChild(o.chip);
  }
  $('small', o.chip).textContent = o.count ? `${o.count} section${o.count > 1 ? 's' : ''}` : 'Searching…';
  o.chip.classList.remove('is-out'); requestAnimationFrame(() => o.chip.classList.add('is-in'));
}
function restore() {
  const o = open; if (!o || !o.min) return;
  o.min = false; o.el.classList.remove('is-min');
  if (o.chip) o.chip.classList.remove('is-in');
}
function onKey(e) {
  if (!open || open.min || e.target.closest && e.target.closest('input, textarea, [contenteditable="true"]')) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); open.go ? minimise() : close(); }
  else if (e.key === 'ArrowRight' && open.go) { e.preventDefault(); open.go(1); }
  else if (e.key === 'ArrowLeft' && open.go) { e.preventDefault(); open.go(-1); }
}

const deckCard = (r, i, topic) => `<article class="rs-card" data-i="${i}">
  <header><b>${String(i + 1).padStart(2, '0')}</b><span>${esc(B.books.cite(r))}</span><button class="rs-card-x" title="Remove this one">${icon('x')}</button></header>
  ${r.section || r.chapter ? `<h3>${esc(r.section || r.chapter)}</h3>` : ''}
  <div class="rs-text">${B.books.hl(r.plain || r.text, topic)}</div>
  ${r.figures && r.figures.length ? `<div class="rs-figs">${r.figures.slice(0, 3).map(f => `<img src="${esc(f.url)}" alt="" loading="lazy" data-full="${esc(f.full || f.url)}">`).join('')}</div>` : ''}
  ${r.page ? `<button class="rs-open">${icon('book-open')}<span>Open in the book</span></button>` : ''}
</article>`;

async function research(topic) {
  topic = String(topic || '').trim().replace(/[?.!]+$/, '');
  if (!topic) return;
  close();
  const terms = topic.toLowerCase().split(/[^a-z0-9-]+/).filter(w => w.length > 3).map(w => w.replace(/(es|s)$/, ''));
  const el = h(`<div class="rs" role="dialog" aria-label="Research: ${esc(topic)}">
    <div class="rs-bar"><span class="rs-q">${icon('search')}<span class="rs-typed"></span><i class="rs-caret"></i></span><span class="rs-status"></span></div>
    <div class="rs-ctl"><button class="rs-min" title="Minimise (Esc)">${icon('minus')}</button><button class="rs-x" title="Close all">${icon('x')}</button></div>
    <div class="rs-reel"><div class="rs-reel-in"></div></div>
    <div class="rs-pile"></div>
    <p class="rs-msg" hidden></p>
    <section class="rs-deck" hidden><div class="rs-deck-cards"></div><div class="rs-deck-bar"><button class="rs-prev" title="Previous (←)">${icon('chevron-left')}</button><span class="rs-count"></span><button class="rs-next" title="Next (→)">${icon('chevron-right')}</button></div></section>
  </div>`);
  document.body.appendChild(el);
  const me = open = { el, topic, alive: true, go: null, decay: null, onMove: null, chip: null, min: false, faces: [], count: 0 };
  document.addEventListener('keydown', onKey, true);
  $('.rs-x', el).onclick = close;
  $('.rs-min', el).onclick = minimise;
  requestAnimationFrame(() => el.classList.add('is-in'));
  const status = t => { const s = $('.rs-status', el); if (s) s.textContent = t; };
  const message = html => { const m = $('.rs-msg', el); m.innerHTML = html; m.hidden = false; el.classList.add('is-done'); };
  const fast = reduced();

  // 1. the search types itself in while the engine is already being asked
  const searchP = B.books.search(topic, { limit: 14 }).then(r => ({ r }), e => ({ e }));
  const typed = $('.rs-typed', el);
  for (let i = 1; i <= topic.length && me.alive; i++) { typed.textContent = topic.slice(0, i); if (!fast) await wait(clamp(500 / topic.length, 10, 30)); }
  status('Searching your textbooks');
  const got = await searchP;
  if (!me.alive) return;
  $('.rs-caret', el).remove();
  if (got.e) {
    status('');
    message(`<span class="rs-err">${esc(got.e.message || 'The book library did not answer.')}</span>${B.ask && B.ask.apiBase() ? ` <a href="${esc(B.ask.apiBase())}" target="_blank" rel="noopener">Sign in to the book library</a>, then ask again.` : ''}`);
    return;
  }
  const seen = new Set();
  const hits = got.r.filter(r => { const k = r.book + r.page; if (seen.has(k) || !(r.plain || r.text)) return false; seen.add(k); return true; }).slice(0, 10);
  if (!hits.length) { status(''); message('Nothing in the textbooks on that.'); return; }
  const books = [...new Set(hits.map(r => r.book))];
  me.count = hits.length;

  // 2. results scroll past
  status(`${hits.length} sections in ${books.join(', ')}`);
  const reel = $('.rs-reel-in', el);
  reel.innerHTML = hits.map((r, i) => `<div class="rs-row" data-i="${i}"><b>${esc(B.books.cite(r))}</b><span>${esc((r.section || r.chapter || '') && (r.section || r.chapter) + ' · ')}${esc((r.plain || r.text).replace(/<[^>]+>/g, '').slice(0, 150))}</span></div>`).join('');
  const rows = $$('.rs-row', reel);
  el.classList.add('is-scanning');
  const faces = me.faces = hits.map((r, i) => paintCard(r, i, terms));
  if (!fast) {
    const box = reel.parentElement, travel = Math.max(0, reel.scrollHeight - box.clientHeight);
    const t0 = performance.now(), dur = 850;
    await new Promise(done => { const step = now => { if (!me.alive) return done(); const t = clamp((now - t0) / dur, 0, 1), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      reel.style.transform = `translate3d(0, ${-travel * e}px, 0)`; const at = Math.floor(t * rows.length); rows.forEach((r, i) => r.classList.toggle('is-scan', i === at));
      if (t < 1) requestAnimationFrame(step); else done(); }; requestAnimationFrame(step); });
    reel.style.transition = 'transform .35s cubic-bezier(.23,1,.32,1)'; reel.style.transform = 'translate3d(0,0,0)'; rows.forEach(r => r.classList.remove('is-scan'));
    await wait(260);
  }
  if (!me.alive) return;

  // 3. the best ones tear out and whip across into the pile
  const pick = hits.slice(0, Math.min(6, hits.length));
  me.decay = fast ? null : makeDecay();
  const pile = $('.rs-pile', el);
  const vw = innerWidth, vh = innerHeight, mobile = vw < 760;
  const W = Math.round(clamp(vw * (mobile ? 0.62 : 0.2), 220, 300)), H = Math.round(W * 1.25);
  const mid = { x: vw * 0.5, y: vh * 0.52, s: 1, r: 0 };
  const slot = i => mobile ? { x: vw / 2 + (i - 2.5) * 8, y: vh - 90, s: 0.36, r: (i - 2.5) * 3 } : { x: vw - 180 + (i % 2 ? 6 : -6), y: vh * 0.5 + i * 6 - 16, s: 0.62, r: (i % 2 ? 1 : -1) * (2 + i) };
  rows.forEach((r, i) => r.classList.toggle('is-pick', i < pick.length));
  el.classList.add('is-ripping');
  for (let i = 0; i < pick.length && me.alive; i++) {
    const row = rows[i], rr = row.getBoundingClientRect();
    const from = mobile ? { x: -W, y: vh * 0.45, s: 0.5, r: -14 } : { x: rr.left + rr.width * 0.5, y: rr.top + rr.height / 2, s: 0.28, r: -10 };
    row.classList.add('is-ripped');
    status(`Pulling ${i + 1} of ${pick.length} · ${B.books.cite(pick[i])}`);
    const card = h(`<div class="rs-fly" style="width:${W}px;height:${H}px"></div>`); el.appendChild(card);
    const to = slot(i);
    if (me.decay && !me.min) {
      me.decay.attach(card, faces[i]); me.decay.burst(1);
      await flight(card, me, [[from, mid, 330, easeOut], [mid, mid, 110, t => t], [mid, to, 290, easeIn]], W, H);
      me.decay.detach();
    }
    if (!me.alive) return;
    card.remove();
    const st = h(`<div class="rs-pile-card" style="width:${W}px;height:${H}px;transform:translate3d(${to.x - W / 2}px,${to.y - H / 2}px,0) scale(${to.s}) rotate(${to.r}deg)"></div>`);
    st.appendChild(faces[i]); pile.appendChild(st);
  }
  if (!me.alive) return;
  if (me.decay) { me.decay.destroy(); me.decay = null; }

  // 4. the deck: every section, flick through, remove any, minimise, open in the book
  el.classList.remove('is-scanning', 'is-ripping'); el.classList.add('is-done');
  status(`${hits.length} sections · ${books.length} book${books.length > 1 ? 's' : ''}`);
  const deckS = $('.rs-deck', el), deck = $('.rs-deck-cards', el);
  deck.innerHTML = hits.map((r, i) => deckCard(r, i, topic)).join('');
  deckS.hidden = false;
  setTimeout(() => pile.remove(), 400);
  let cur = 0, cards = $$('.rs-card', deck);
  const lay = () => {
    cards.forEach((c, i) => {
      const d = i - cur;
      c.style.setProperty('--d', d);
      c.classList.toggle('is-current', d === 0); c.classList.toggle('is-gone', d < 0); c.classList.toggle('is-far', d > 3);
      c.inert = d !== 0;
    });
    me.count = cards.length;
    $('.rs-count', el).textContent = `${cur + 1} / ${cards.length}`;
    status(`${cards.length} section${cards.length > 1 ? 's' : ''} · ${books.length} book${books.length > 1 ? 's' : ''}`);
  };
  me.go = d => { const n = clamp(cur + d, 0, cards.length - 1); if (n !== cur) { cur = n; lay(); } };
  lay();
  $('.rs-prev', el).onclick = () => me.go(-1); $('.rs-next', el).onclick = () => me.go(1);
  const removeCard = c => {
    const i = cards.indexOf(c); if (i < 0) return;
    c.classList.add('is-removing'); c.inert = true;
    cards.splice(i, 1);
    if (!cards.length) { setTimeout(close, 220); return; }
    if (cur >= cards.length) cur = cards.length - 1;
    setTimeout(() => c.remove(), 320);
    lay();
  };
  // DecayCard's drift and tilt toward the pointer, on the card you're reading
  let tx = 0, ty = 0, trot = 0, px = 0, py = 0, tilting = 0;
  const follow = () => {
    tilting = 0; tx += (px * 18 - tx) * 0.16; ty += (py * 12 - ty) * 0.16; trot += (px * 1.2 - trot) * 0.16;
    deck.style.setProperty('--tx', tx.toFixed(2) + 'px'); deck.style.setProperty('--ty', ty.toFixed(2) + 'px'); deck.style.setProperty('--tr', trot.toFixed(2) + 'deg');
    if (Math.abs(px * 18 - tx) + Math.abs(py * 12 - ty) > 0.2) tilting = requestAnimationFrame(follow);
  };
  me.onMove = e => { if (fast || me.min) return; px = clamp(e.clientX / innerWidth * 2 - 1, -1, 1); py = clamp(e.clientY / innerHeight * 2 - 1, -1, 1); if (!tilting) tilting = requestAnimationFrame(follow); };
  window.addEventListener('pointermove', me.onMove, { passive: true });
  let sx = null;
  deck.addEventListener('pointerdown', e => { if (e.target.closest('button, img, a')) return; sx = e.clientX; });
  deck.addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) me.go(dx < 0 ? 1 : -1); });
  el.addEventListener('click', e => {
    const x = e.target.closest('.rs-card-x'); if (x) { removeCard(x.closest('.rs-card')); return; }
    const op = e.target.closest('.rs-open'); if (op) { const r = hits[+op.closest('.rs-card').dataset.i]; minimise(); B.books.open(r); return; }
    const img = e.target.closest('.rs-card img[data-full]'); if (img) { const lb = h(`<div class="lightbox"><img src="${esc(img.dataset.full)}" alt=""></div>`); lb.onclick = () => lb.remove(); document.body.appendChild(lb); return; }
    // clicking the dimmed page around the deck tucks it away
    if (e.target === el) minimise();
  });
}

// move a card through a path of legs [from, to, ms, ease]; the tear follows how fast it's going
function flight(card, me, legs, W, H) {
  return new Promise(done => {
    let leg = 0, t0 = performance.now(), lastX = null, lastY = null, lastT = t0;
    const step = now => {
      if (!me.alive) return done();
      const [a, b, ms, ez] = legs[leg], t = clamp((now - t0) / ms, 0, 1), e = ez(t);
      const x = a.x + (b.x - a.x) * e, y = a.y + (b.y - a.y) * e, s = a.s + (b.s - a.s) * e;
      const dt = Math.max(0.001, (now - lastT) / 1000), vx = lastX == null ? 0 : (x - lastX) / dt, vy = lastY == null ? 0 : (y - lastY) / dt;
      lastX = x; lastY = y; lastT = now;
      const speed = Math.hypot(vx, vy), rot = a.r + (b.r - a.r) * e + clamp(vx * 0.004, -14, 14);
      if (me.decay) me.decay.want(clamp(speed / 2400, 0, 1) ** 1.4);
      card.style.transform = `translate3d(${(x - W / 2).toFixed(1)}px, ${(y - H / 2).toFixed(1)}px, 0) scale(${s.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`;
      if (t >= 1) { leg++; t0 = now; if (leg >= legs.length) return done(); }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

N.research = research;
})();
