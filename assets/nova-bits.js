/* Nova: React Bits ports used around the Outlook pages, in plain DOM + WebGL2 (no React here).
     - sideRays(el, props)  SideRays: light shafts from a corner (shader as published; loop rewritten)
     - counter(el, value)   Counter: rolling digits that spin to each new value
     - dock                 Dock: macOS-style dock with magnification, badges, active dots and hop
     - portal({...})        the orb's "take me there" transition into Mail / Calendar, built on SideRays */
(() => {
'use strict';
const B = window.BV;
const { icon, esc, $, $$, h } = B;
const N = window.NovaUI;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ================================================================ SideRays */
const RAY_VERT = `#version 300 es
const vec2 corners[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() { gl_Position = vec4(corners[gl_VertexID], 0.0, 1.0); }`;
const RAY_FRAG = `#version 300 es
precision highp float;
uniform vec2 uResolution; uniform float uTime; uniform vec3 uColorA; uniform vec3 uColorB; uniform float uBlend;
uniform float uIntensity; uniform float uSpread; uniform float uDensity; uniform float uSharpness; uniform float uFalloff;
uniform float uGlow; uniform float uSaturation; uniform float uDust; uniform float uOpacity; uniform float uReveal;
uniform vec3 uFrame; uniform float uAim; uniform vec3 uFocus; uniform float uSway;
out vec4 fragColor;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) { vec2 i = floor(p); vec2 f = p - i; vec2 w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i); float b = hash(i + vec2(1.0, 0.0)); float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y); }
float shafts(float u, float t, float seed, float aa) {
  float sway = (0.4 * sin(t * 0.31 + seed) + 0.24 * sin(t * 0.17 + seed * 2.3)) * uSway;
  float n = 0.7 * noise(vec2(u + sway + seed, t * 0.3)) + 0.3 * noise(vec2(u * 2.4 + sway * 1.5 + seed * 1.7, t * 0.45 + 3.0));
  float width = mix(0.5, 0.1, uSharpness);
  float s = mix(smoothstep(0.5 - width, 0.5 + width, n), 0.5, aa);
  return mix(0.05, 1.0, s); }
float motes(vec2 p, float cell, float t, float seed) {
  p += vec2(t * 0.021, -t * 0.013) + seed * 7.31; vec2 grid = p / cell; vec2 id = floor(grid); vec2 f = grid - id;
  float h = hash(id + seed); if (h > 0.5) return 0.0;
  vec2 center = 0.25 + 0.5 * vec2(hash(id + 1.7 + seed), hash(id + 3.1 + seed)); center += 0.1 * vec2(sin(t * 0.7 + h * 31.0), cos(t * 0.6 + h * 23.0));
  float size = mix(0.035, 0.09, hash(id + 5.3 + seed)); float edge = length(fwidth(grid)) * 0.7; float twinkle = 0.55 + 0.45 * sin(t * 1.9 + h * 41.0);
  return (1.0 - smoothstep(size - edge, size + edge, length(f - center))) * twinkle; }
void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 q = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  if (uFrame.x > 0.5) q.x = -q.x; if (uFrame.y > 0.5) q.y = -q.y;
  vec2 source = uFrame.z > 0.5 ? vec2(aspect * 0.5 + 0.42, 0.3) : vec2(aspect * 0.5 + 0.1, 0.62);
  float heading = (uFrame.z > 0.5 ? 3.42 : -2.48) + uAim + 0.035 * sin(uTime * 0.21) * uSway;
  vec2 v = q - source; float r = length(v);
  float angle = mod(atan(v.y, v.x) - heading + 3.14159265, 6.28318531) - 3.14159265;
  float t = uTime; float u = angle * uDensity; float aa = smoothstep(0.12, 0.45, fwidth(u));
  float offset = uSpread * 0.22;
  float fanA = exp(-pow((angle + offset) / uSpread, 2.0) * 1.4);
  float fanB = exp(-pow((angle - offset) / (uSpread * 1.15), 2.0) * 1.4);
  float focus = 1.0 + uFocus.z * exp(-pow((angle - uFocus.x) / uFocus.y, 2.0));
  float lightA = fanA * shafts(u, t, 0.0, aa) * focus; float lightB = fanB * shafts(u * 0.83, t * 0.6, 17.0, aa) * focus;
  float reach = 1.0 / (1.0 + pow(r / 0.4, uFalloff));
  vec3 glowColor = mix(uColorA, uColorB, uBlend);
  vec3 light = (uColorA * lightA * (1.0 - uBlend) + uColorB * lightB * uBlend) * 2.0 * reach;
  light += glowColor * uGlow * exp(-pow(r / 0.4, 2.0));
  if (uDust > 0.0) { float sparkle = motes(q, 0.06, t, 0.0) + 0.7 * motes(q, 0.038, t * 0.8, 9.0);
    light += mix(glowColor, vec3(1.0), 0.6) * sparkle * (lightA + lightB) * reach * uDust * 2.5; }
  light *= uIntensity * (1.0 - smoothstep(uReveal * 2.6 - 0.45, uReveal * 2.6, r)) * smoothstep(0.0, 0.35, uReveal);
  float gray = dot(light, vec3(0.2126, 0.7152, 0.0722)); light = max(mix(vec3(gray), light, uSaturation), 0.0);
  float peak = max(light.r, max(light.g, light.b));
  float grain = (fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5) / 255.0;
  float mapped = 1.0 - exp(-peak); vec3 tone = light * (mapped / max(peak, 1e-4));
  tone = mix(tone, vec3(mapped), smoothstep(0.7, 1.0, mapped) * 0.55);
  vec3 shown = clamp(tone * uOpacity, 0.0, 1.0); float alpha = max(shown.r, max(shown.g, shown.b));
  vec3 color = clamp(shown * alpha + grain, 0.0, 1.0);
  fragColor = vec4(min(color, vec3(alpha)), alpha);
}`;
const ORIGINS = { 'top-right': [0, 0, 0], 'top-left': [1, 0, 0], 'bottom-right': [0, 1, 0], 'bottom-left': [1, 1, 0], right: [0, 0, 1], left: [1, 0, 1] };
const rgb = hex => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); return m ? [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16) / 255) : [1, 1, 1]; };
N.sideRays = function sideRays(container, props = {}) {
  const P = Object.assign({ rayColor1: '#FFC46B', rayColor2: '#96c8ff', blend: 0.6, origin: 'top-right', speed: 2.5, intensity: 2, spread: 2, density: 5, sharpness: 0.5, tilt: 0, falloff: 1.6, glow: 1, saturation: 1, dust: 0, followMouse: true, mouseInfluence: 0.5, intro: true, opacity: 1, maxRatio: 1.5, budget: 1.4e6 }, props);
  const wrap = h('<div class="side-rays" aria-hidden="true"><canvas class="side-rays__canvas"></canvas></div>');
  container.appendChild(wrap);
  const canvas = $('canvas', wrap);
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  const none = { set() {}, destroy() { wrap.remove(); }, el: wrap };
  if (!gl) return none;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : (console.warn(gl.getShaderInfoLog(s)), null); };
  const vs = sh(gl.VERTEX_SHADER, RAY_VERT), fs = sh(gl.FRAGMENT_SHADER, RAY_FRAG);
  if (!vs || !fs) return none;
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return none;
  const U = {}; for (let i = 0, n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS); i < n; i++) { const inf = gl.getActiveUniform(prog, i); U[inf.name] = gl.getUniformLocation(prog, inf.name); }
  const vao = gl.createVertexArray();
  const reduced = reducedMotion();
  let time = Math.random() * 100, reveal = P.intro && !reduced ? 0 : 1, raf = 0, last = 0, visible = true, alive = true, w = 1, hgt = 1;
  const ptr = { x: 0, y: 0, inside: false }, aim = { v: 0, vel: 0 }, focus = { a: 0, s: 0 };
  const resize = () => { const r = wrap.getBoundingClientRect(); w = Math.max(1, r.width); hgt = Math.max(1, r.height); const ratio = Math.min(window.devicePixelRatio || 1, P.maxRatio, Math.sqrt(P.budget / (w * hgt))); const cw = Math.round(w * ratio), ch = Math.round(hgt * ratio); if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; } };
  let drawn = 0;
  const frame = now => {
    raf = 0; if (!alive) return;
    // optional frame cap: keep the loop alive but skip drawing between ticks
    if (P.fps && now - drawn < 1000 / P.fps - 2) { raf = requestAnimationFrame(frame); return; }
    drawn = now;
    const dt = clamp((now - last) / 1000 || 0, 0, 0.1); last = now;
    const spread = clamp(P.spread, 0.1, 8) * 0.225, tilt = clamp(P.tilt, -180, 180) * Math.PI / 180, fr = ORIGINS[P.origin] || ORIGINS['top-right'];
    time += dt * Math.max(0, P.speed) * 0.4 * (reduced ? 0.3 : 1);
    if (reveal < 1) reveal = Math.min(1, reveal + dt / 1.6);
    const tracking = P.followMouse && ptr.inside && !reduced;
    let pointed = 0;
    if (tracking) {
      let x = (ptr.x - w / 2) / hgt, y = (hgt / 2 - ptr.y) / hgt; if (fr[0]) x = -x; if (fr[1]) y = -y;
      const src = fr[2] ? [w / hgt * 0.5 + 0.42, 0.3] : [w / hgt * 0.5 + 0.1, 0.62], head = fr[2] ? 3.42 : -2.48;
      pointed = ((Math.atan2(y - src[1], x - src[0]) - head - tilt + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    }
    const target = tracking ? clamp(pointed, -spread, spread) * P.mouseInfluence : 0, ft = tracking ? P.mouseInfluence : 0, ease = 1 - Math.exp(-dt * 6);
    if (tracking) focus.a += (clamp(pointed - aim.v, -spread * 1.5, spread * 1.5) - focus.a) * ease;
    focus.s += (ft - focus.s) * ease;
    aim.vel += ((target - aim.v) * 18 - aim.vel * 2 * Math.sqrt(18)) * dt; aim.v += aim.vel * dt;
    const cA = rgb(P.rayColor1), cB = rgb(P.rayColor2);
    gl.viewport(0, 0, canvas.width, canvas.height); gl.useProgram(prog); gl.bindVertexArray(vao);
    gl.uniform2f(U.uResolution, canvas.width, canvas.height); gl.uniform1f(U.uTime, time);
    gl.uniform3f(U.uColorA, ...cA); gl.uniform3f(U.uColorB, ...cB); gl.uniform1f(U.uBlend, clamp(P.blend, 0, 1));
    gl.uniform1f(U.uIntensity, Math.max(0, P.intensity) * 0.75); gl.uniform1f(U.uSpread, spread); gl.uniform1f(U.uDensity, clamp(P.density, 1, 40));
    gl.uniform1f(U.uSharpness, clamp(P.sharpness, 0, 1)); gl.uniform1f(U.uFalloff, clamp(P.falloff, 0.2, 6)); gl.uniform1f(U.uGlow, Math.max(0, P.glow) * 1.2);
    gl.uniform1f(U.uSaturation, Math.max(0, P.saturation)); gl.uniform1f(U.uDust, clamp(P.dust, 0, 1)); gl.uniform1f(U.uOpacity, clamp(P.opacity, 0, 1));
    gl.uniform1f(U.uReveal, 1 - Math.pow(1 - reveal, 3)); gl.uniform3f(U.uFrame, fr[0], fr[1], fr[2]); gl.uniform1f(U.uAim, tilt + aim.v);
    gl.uniform3f(U.uFocus, focus.a, Math.max(0.06, spread * 0.25), focus.s * 1.4); gl.uniform1f(U.uSway, reduced ? 0 : 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const busy = (P.speed > 0 && !reduced) || reveal < 1 || Math.abs(target - aim.v) > 1e-4 || Math.abs(aim.vel) > 1e-4;
    if (busy && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const wake = () => { if (raf || !alive || !visible || document.hidden) return; last = performance.now(); raf = requestAnimationFrame(frame); };
  const onMove = e => { const r = wrap.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; wake(); };
  window.addEventListener('pointermove', onMove, { passive: true });
  const ro = new ResizeObserver(() => { resize(); wake(); }); ro.observe(wrap);
  const io = new IntersectionObserver(es => { visible = es.some(x => x.isIntersecting); wake(); }); io.observe(wrap);
  const onVis = () => wake(); document.addEventListener('visibilitychange', onVis);
  resize(); wake();
  return {
    el: wrap,
    time: () => time, props: P,
    set(p) { Object.assign(P, p); wake(); },
    destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', onVis); try { gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch (e) { /* gone */ } wrap.remove(); },
  };
};

/* ================================================================ Counter (rolling digits) */
N.counter = function counter(el, value = 0, opts = {}) {
  const o = Object.assign({ duration: 0.75, stagger: 0.04, intro: true, minDigits: 1 }, opts);
  el.classList.add('nb-counter');
  const reduced = reducedMotion();
  let cur = null;
  const render = (v, from) => {
    const s = String(Math.max(0, Math.round(v))).padStart(o.minDigits, '0');
    const f = from == null ? null : String(Math.max(0, Math.round(from))).padStart(s.length, '0').slice(-s.length);
    el.setAttribute('aria-label', s);
    el.innerHTML = `<span class="nb-counter-row" aria-hidden="true">${[...s].map((d, i) => `<span class="nb-digit"><span class="nb-sizer">0</span><span class="nb-strip" style="transform:translateY(${-(f ? +f[i] : +d) * 10}%)">${'0123456789'.split('').map(n => `<span>${n}</span>`).join('')}</span></span>`).join('')}</span>`;
    if (reduced) return;
    const strips = $$('.nb-strip', el);
    requestAnimationFrame(() => requestAnimationFrame(() => strips.forEach((st, i) => {
      const n = strips.length - 1 - i;     // changes ripple in from the right
      st.style.transition = `transform ${o.duration}s cubic-bezier(.34,1.42,.5,1) ${n * o.stagger}s`;
      st.style.transform = `translateY(${-(+s[i]) * 10}%)`;
    })));
  };
  const set = v => { const prev = cur; cur = v; render(v, prev == null ? (o.intro ? 0 : v) : prev); };
  set(value);
  return { set, get value() { return cur; } };
};

/* ================================================================ Dock
   Kept deliberately calm: always in the same place, no hiding, no magnifying wobble. Icons lift a
   little on hover (CSS only), the current page has a dot, Mail / Calendar carry badges. */
function mountDock() {
  if (N.dock || !B.isNova()) return;
  const items = [
    { id: B.V && B.V.home, label: 'Home', ic: 'home' },
    { id: 'mail', label: 'Mail', ic: 'mail' },
    { id: 'calendar', label: 'Calendar', ic: 'calendar' },
    { sep: true },
    { id: 'flashcards', label: 'Flashcards', ic: 'cards' },
    { id: 'exam', label: 'Exam practice', ic: 'clipboard-list' },
    { id: 'glossary', label: 'Key terms', ic: 'book-open' },
    { id: 'books', label: 'Book library', ic: 'library' },
    { map: true, label: 'Neural map', ic: 'graph' },
  ].filter(it => it.sep || it.map || (it.id && B.exists(it.id)));
  const root = h(`<nav class="nb-dock" aria-label="Dock">${items.map((it, i) => it.sep ? '<span class="nb-dock-sep" aria-hidden="true"></span>' : `<button class="nb-dock-item" data-i="${i}" aria-label="${esc(it.label)}">${icon(it.ic)}<span class="nb-dock-badge" hidden></span><span class="nb-dock-label">${esc(it.label)}</span></button>`).join('')}</nav>`);
  document.body.appendChild(root);
  const btns = $$('.nb-dock-item', root);
  root.addEventListener('click', e => {
    const b = e.target.closest('.nb-dock-item'); if (!b) return;
    const it = items[+b.dataset.i];
    if (it.map) { N.map && N.map.open(B.currentId()); return; }
    N.go(it.id);
  });
  let lastId = null;
  const mark = () => { const cur = B.currentId(); if (cur === lastId) return; lastId = cur; btns.forEach(b => { const it = items[+b.dataset.i]; b.classList.toggle('is-active', !!it.id && it.id === cur); }); const ex = $('#explorer'); if (ex && N.navigator) N.navigator(ex); };
  window.addEventListener('hashchange', () => setTimeout(mark, 0));
  const markTimer = setInterval(mark, 1000);
  mark();
  N.dock = {
    el: root,
    badge(id, n) { const i = items.findIndex(it => it.id === id); const b = btns.find(x => +x.dataset.i === i); if (!b) return; const el = $('.nb-dock-badge', b); el.hidden = !n; el.textContent = n > 99 ? '99+' : n || ''; },
    destroy() { clearInterval(markTimer); root.remove(); N.dock = null; },
  };
  refreshBadges();
}
async function refreshBadges() {
  if (!N.dock || !N.outlook || !N.outlook.counts) return;
  const c = await N.outlook.counts();
  if (!c || !N.dock) return;
  N.dock.badge('mail', c.unread); N.dock.badge('calendar', c.today);
}
N.refreshBadges = refreshBadges;
setInterval(refreshBadges, 5 * 60000);
document.addEventListener('bv-uimode', e => { if (e.detail.mode === 'nova') mountDock(); else N.dock && N.dock.destroy(); });
setTimeout(mountDock, 0);

/* ================================================================ page changes
   Plain and quick: the new page zooms in a touch as it appears (CSS on .view-content, see nova.css).
   Nothing animates out, so nothing can get stuck half-way. From the open map, the map closes and
   its own fade brings the page back. */
N.go = function go(id, o = {}) {
  if (!id) return;
  const nav = () => { if (o.then) o.then(); else if (B.currentId() !== id) B.go(id); };
  if (N.map && N.map.isOpen && N.map.isOpen()) { nav(); N.map.close(); return; }
  nav();
};
N.portal = ({ to, then }) => N.go(to, { then });
})();
