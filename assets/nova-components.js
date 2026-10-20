/* Nova mode components, ported from the React Bits specs to plain DOM (no React, no build
   step, matching the rest of this site). Lazy-loaded only once Nova mode is switched on, so
   Classic-mode visitors never fetch this file. See assets/nova.css for the matching styles. */
(() => {
'use strict';
window.NovaUI = window.NovaUI || {};

/* ---------------------------------------------------------------- Lattice Loader */
const LL_PATTERNS = {
  orbit: { 3: { cells: [0, 1, 2, 7, null, 3, 6, 5, 4], loop: 8, scale: 1.2 } },
  dots: { 3: { cells: [0, 1, 2, 0, 1, 2, 0, 1, 2], loop: 3, scale: 2.4 } },
  ripple: { 3: { cells: [2, 1, 2, 1, 0, 1, 2, 1, 2], loop: 4.8, scale: 1.5 } },
  snake: { 3: { cells: [0, 1, 2, 5, 4, 3, 6, 7, 8], loop: 9, scale: 1 } },
};
const LL_MARKS = { 3: { done: [2, 3, 5, 7], error: [0, 2, 4, 6, 8] } };

function latticeCreate(opts = {}) {
  const {
    label = 'Thinking', doneLabel = 'Done', errorLabel = 'Failed',
    pattern = 'orbit', shape = 'round', cellSize = 5, gap = 2, fontSize = 13,
    step = 90, showTimer = false,
  } = opts;
  const pat = (LL_PATTERNS[pattern] || LL_PATTERNS.orbit)[3];
  const cycle = Math.round(pat.loop * step * pat.scale);

  const root = document.createElement('span');
  root.className = 'lattice-loader';
  root.setAttribute('role', 'status');
  root.dataset.status = 'working';
  root.dataset.shape = shape;
  root.style.setProperty('--ll-cell', cellSize + 'px');
  root.style.setProperty('--ll-gap', gap + 'px');
  root.style.setProperty('--ll-font', fontSize + 'px');
  root.style.setProperty('--ll-cycle', cycle + 'ms');

  const grid = document.createElement('span');
  grid.className = 'lattice-loader__grid'; grid.setAttribute('aria-hidden', 'true');

  const run = document.createElement('span');
  run.className = 'lattice-loader__layer lattice-loader__run';
  pat.cells.forEach((unit, i) => {
    const cell = document.createElement('span');
    cell.className = 'lattice-loader__cell';
    if (unit == null) cell.dataset.hole = '';
    else cell.style.animationDelay = Math.round(unit * step * pat.scale) + 'ms';
    run.appendChild(cell);
  });

  const mark = document.createElement('span');
  mark.className = 'lattice-loader__layer lattice-loader__mark';
  const marks = LL_MARKS[3];
  pat.cells.forEach((_, i) => {
    const cell = document.createElement('span');
    cell.className = 'lattice-loader__cell';
    cell.dataset.i = i;
    mark.appendChild(cell);
  });

  grid.appendChild(run); grid.appendChild(mark);
  root.appendChild(grid);

  // icon-only mode (no label text) for tight spots like a 36px square button
  const textEls = {};
  if (label) {
    const labelEl = document.createElement('span');
    labelEl.className = 'lattice-loader__label'; labelEl.setAttribute('aria-hidden', 'true');
    const texts = { working: label, done: doneLabel, error: errorLabel };
    for (const k in texts) {
      const t = document.createElement('span');
      t.className = 'lattice-loader__text'; t.textContent = texts[k];
      if (k === 'working') t.dataset.active = '';
      textEls[k] = t; labelEl.appendChild(t);
    }
    root.appendChild(labelEl);
  }

  let timerEl = null;
  if (showTimer) {
    timerEl = document.createElement('span');
    timerEl.className = 'lattice-loader__timer'; timerEl.textContent = '0.0s';
    root.appendChild(timerEl);
  }

  let startedAt = performance.now(), timerId = null;
  function paint() {
    if (!timerEl) return;
    const ds = Math.floor((performance.now() - startedAt) / 100);
    timerEl.textContent = (ds < 600 ? (ds / 10).toFixed(1) + 's' : Math.floor(ds / 600) + 'm ' + ((ds % 600) / 10).toFixed(1) + 's');
  }
  if (showTimer) timerId = setInterval(paint, 100);

  function setStatus(status) {
    root.dataset.status = status;
    for (const k in textEls) textEls[k].toggleAttribute('data-active', k === status);
    const onSet = new Set(marks[status === 'error' ? 'error' : 'done'] || []);
    $$cells(mark).forEach((cell, i) => cell.toggleAttribute('data-on', onSet.has(i)));
    if (status !== 'working' && timerId) { clearInterval(timerId); timerId = null; }
  }
  function $$cells(layer) { return Array.from(layer.children); }

  return { el: root, setStatus, destroy() { if (timerId) clearInterval(timerId); } };
}

/** Convenience: a static "working" lattice + label, for call sites that just swap it out
    wholesale on completion rather than transitioning it to done/error in place. */
function latticeSpinner(label) {
  const inst = latticeCreate({ label });
  return inst.el;
}

window.NovaUI.lattice = { create: latticeCreate, spinner: latticeSpinner };

/* ---------------------------------------------------------------- Magic Bento
   Port of the React Bits <MagicBento /> effect engine (border glow that follows the cursor
   across a whole grid, per-card spotlight, press spring and a click wave), applied to the
   card grids the site already has instead of rendering its own demo cards. Each card gets
   three overlay layers and a set of --mb-* variables written once per animation frame. */
const BENTO_SURFACES = [
  ['.exam-grid', '.exam-paper-card'],
  ['.fc-plan-grid', '.fc-plan'],
  ['.fc-decks', '.fc-deck'],
  ['.exam-review-grid', ':scope > *'],
  ['.nv-timeline', '.nv-lec'],
];
const MB_LAYERS = ['magic-bento__light', 'magic-bento__rim', 'magic-bento__border'];

function bento(root, opts = {}) {
  const s = Object.assign({ cards: ':scope > *', borderGlow: true, spotlight: true, spotlightRadius: 300,
    tilt: false, magnet: false, clickEffect: true }, opts);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = !reduced;
  root.classList.add('magic-bento');
  root.style.setProperty('--mb-spot-size', s.spotlightRadius + 'px');
  root.style.setProperty('--mb-border-size', Math.round(s.spotlightRadius * 0.75) + 'px');

  const pointer = { x: -1e5, y: -1e5, inside: false, down: null };
  const light = { x: -1e5, y: -1e5, near: 0, ready: false };
  const wave = { x: 0, y: 0, t: -1, duration: 1.1, reach: 800 };
  const states = new WeakMap();
  let cards = [], rects = [], bounds = null, dirty = true, raf = 0, last = 0, visible = true;

  const stateFor = card => {
    let st = states.get(card);
    if (!st) states.set(card, st = { hot: 0, rx: 0, ry: 0, tx: 0, ty: 0, vrx: 0, vry: 0, vtx: 0, vty: 0, press: 1, vpress: 0, written: {} });
    return st;
  };
  const write = (el, st, name, value) => { if (st.written[name] !== value) { st.written[name] = value; el.style.setProperty(name, value); } };

  const dress = card => {
    if (card.dataset.mb != null) return;
    card.dataset.mb = '';
    card.classList.add('magic-bento__card');
    for (const c of MB_LAYERS) { const l = document.createElement('span'); l.className = c; l.setAttribute('aria-hidden', 'true'); card.appendChild(l); }
  };
  const measure = () => {
    dirty = false;
    cards = Array.from(root.querySelectorAll(s.cards));
    cards.forEach(dress);
    bounds = root.getBoundingClientRect();
    rects = cards.map(c => c.getBoundingClientRect());
  };
  const startWave = (x, y, duration) => {
    if (!motion || !bounds) return;
    Object.assign(wave, { x, y, t: 0, duration });
    wave.reach = Math.max(Math.hypot(x - bounds.left, y - bounds.top), Math.hypot(x - bounds.right, y - bounds.top),
      Math.hypot(x - bounds.left, y - bounds.bottom), Math.hypot(x - bounds.right, y - bounds.bottom)) + 140;
  };

  const frame = now => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (dirty) measure();
    let busy = false;
    const margin = s.spotlightRadius * 0.5;
    const near = pointer.inside && bounds && pointer.x > bounds.left - margin && pointer.x < bounds.right + margin &&
      pointer.y > bounds.top - margin && pointer.y < bounds.bottom + margin ? 1 : 0;
    if (!light.ready && near) { light.x = pointer.x; light.y = pointer.y; light.ready = true; }
    const follow = 1 - Math.exp(-dt / 0.05);
    light.x += (pointer.x - light.x) * follow;
    light.y += (pointer.y - light.y) * follow;
    light.near += (near - light.near) * (1 - Math.exp(-dt / (near > light.near ? 0.12 : 0.4)));
    if (Math.abs(near - light.near) < 0.002) light.near = near; else busy = true;
    if (Math.abs(pointer.x - light.x) + Math.abs(pointer.y - light.y) > 0.3) busy = true;

    let wr = 0, wa = 0;
    if (wave.t >= 0) {
      wave.t += dt;
      const p = Math.min(1, wave.t / wave.duration);
      wr = wave.reach * (1 - Math.pow(1 - p, 2.2));
      wa = Math.pow(1 - p, 1.3);
      if (p >= 1) { wave.t = -1; wa = 0; } else busy = true;
    }
    const steps = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / steps;
    cards.forEach((card, i) => {
      const r = rects[i]; if (!r) return;
      const st = stateFor(card);
      const lx = light.x - r.left, ly = light.y - r.top, px = pointer.x - r.left, py = pointer.y - r.top;
      const inside = pointer.inside && px >= 0 && py >= 0 && px <= r.width && py <= r.height;
      card.toggleAttribute('data-active', inside);
      const hotT = inside && s.spotlight ? 1 : 0;
      st.hot += (hotT - st.hot) * (1 - Math.exp(-dt / (hotT > st.hot ? 0.14 : 0.32)));
      if (Math.abs(hotT - st.hot) < 0.002) st.hot = hotT; else busy = true;
      const u = Math.min(1, Math.max(0, px / Math.max(1, r.width))) - 0.5;
      const v = Math.min(1, Math.max(0, py / Math.max(1, r.height))) - 0.5;
      const tilt = inside && s.tilt && motion, mag = inside && s.magnet && motion;
      const targets = [tilt ? -v * 12 : 0, tilt ? u * 12 : 0, mag ? u * 12 : 0, mag ? v * 12 : 0];
      [['rx', 'vrx'], ['ry', 'vry'], ['tx', 'vtx'], ['ty', 'vty']].forEach(([k, vk], j) => {
        for (let n = 0; n < steps; n++) { st[vk] += (170 * (targets[j] - st[k]) - 20 * st[vk]) * h; st[k] += st[vk] * h; }
        if (Math.abs(targets[j] - st[k]) < 0.002 && Math.abs(st[vk]) < 0.01) { st[k] = targets[j]; st[vk] = 0; } else busy = true;
      });
      const pressT = pointer.down === card && s.clickEffect && motion ? 0.985 : 1;
      for (let n = 0; n < steps; n++) { st.vpress += (420 * (pressT - st.press) - 28 * st.vpress) * h; st.press += st.vpress * h; }
      if (Math.abs(pressT - st.press) < 0.0002 && Math.abs(st.vpress) < 0.001) { st.press = pressT; st.vpress = 0; } else busy = true;
      write(card, st, '--mb-x', lx.toFixed(1) + 'px');
      write(card, st, '--mb-y', ly.toFixed(1) + 'px');
      write(card, st, '--mb-near', (s.borderGlow ? light.near : 0).toFixed(3));
      write(card, st, '--mb-hot', st.hot.toFixed(3));
      write(card, st, '--mb-rx', st.rx.toFixed(3) + 'deg');
      write(card, st, '--mb-ry', st.ry.toFixed(3) + 'deg');
      write(card, st, '--mb-tx', st.tx.toFixed(2) + 'px');
      write(card, st, '--mb-ty', st.ty.toFixed(2) + 'px');
      write(card, st, '--mb-press', st.press.toFixed(4));
      write(card, st, '--mb-wx', (wave.x - r.left).toFixed(1) + 'px');
      write(card, st, '--mb-wy', (wave.y - r.top).toFixed(1) + 'px');
      write(card, st, '--mb-wr', wr.toFixed(1) + 'px');
      write(card, st, '--mb-wa', wa.toFixed(3));
    });
    if (busy && visible) raf = requestAnimationFrame(frame);
  };
  const wake = () => { if (raf || !visible) return; last = performance.now(); raf = requestAnimationFrame(frame); };
  const cardOf = t => (t instanceof Element ? t.closest('.magic-bento__card') : null);
  const onMove = e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.inside = true; wake(); };
  const onOut = e => { if (e.relatedTarget) return; pointer.inside = false; pointer.down = null; wake(); };
  const onDown = e => { onMove(e); const c = cardOf(e.target); pointer.down = c && root.contains(c) ? c : null; };
  const onUp = () => { if (pointer.down) { pointer.down = null; wake(); } };
  const onClick = e => {
    const c = cardOf(e.target); if (!c || !root.contains(c) || !s.clickEffect) return;
    if (dirty) measure();
    if (e.detail === 0) { const r = c.getBoundingClientRect(); startWave(r.left + r.width / 2, r.top + r.height / 2, 1.1); }
    else startWave(e.clientX, e.clientY, 1.1);
    wake();
  };
  const onScroll = () => { dirty = true; wake(); };
  const ro = new ResizeObserver(onScroll); ro.observe(root);
  const io = new IntersectionObserver(es => { visible = es.some(x => x.isIntersecting); if (visible) onScroll(); });
  io.observe(root);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointercancel', onUp, { passive: true });
  document.addEventListener('pointerout', onOut, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true, capture: true });
  root.addEventListener('click', onClick);
  measure();
  return {
    root,
    refresh() { dirty = true; wake(); },
    destroy() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
      document.removeEventListener('pointerout', onOut);
      window.removeEventListener('scroll', onScroll, { capture: true }); root.removeEventListener('click', onClick);
      root.classList.remove('magic-bento');
      root.querySelectorAll('[data-mb]').forEach(c => {
        delete c.dataset.mb; c.removeAttribute('data-active'); c.classList.remove('magic-bento__card');
        c.querySelectorAll(':scope > .' + MB_LAYERS.join(', :scope > .')).forEach(l => l.remove());
        for (const k of [...c.style]) if (k.startsWith('--mb-')) c.style.removeProperty(k);
      });
    },
  };
}

/* ---------------------------------------------------------------- Electric Logo
   WebGL2 port of the React Bits <ElectricLogo /> and the other WebGL ports live in assets/vendor/nova-gl.js
   (bundled with ogl, ~70 KB) and is only fetched the first time a surface needs it. */
let glLoad = null;
function loadGL() {
  if (window.NovaUI.ditherVeil) return Promise.resolve();
  return glLoad || (glLoad = new Promise((res, rej) => {
    const sc = document.createElement('script');
    sc.src = 'assets/vendor/nova-gl.js?v=20261025'; sc.onload = res; sc.onerror = () => { glLoad = null; rej(); };
    document.head.appendChild(sc);
  }));
}
function mountElectric(el) {
  if (el._elogo) return;
  el._elogo = 'loading';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  loadGL().then(() => {
    if (!el.isConnected || !document.body.classList.contains('ui-nova')) { el._elogo = null; return; }
    el._elogo = window.NovaUI.electricLogo(el, {
      color: '#E9DDFF', glowColor: '#8B5CF6', scale: 0.62, speed: reduced ? 0.4 : 2.2,
      strands: 4, arcs: 1, cursorRadius: 90,
    });
  }).catch(() => { el._elogo = null; });
}

/* ---------------------------------------------------------------- auto-attach
   Views re-render with innerHTML, so one observer keeps every surface dressed while Nova is
   on, tears down effects whose elements left the page, and undoes everything on leaving Nova. */
const live = new Set();
let scanQueued = false;
function scan() {
  scanQueued = false;
  const on = document.body.classList.contains('ui-nova');
  for (const inst of live) {
    const el = inst.root;
    if (!on || !el.isConnected) { inst.destroy(); live.delete(inst); if (el._bento === inst) el._bento = null; if (el._elogo === inst) el._elogo = null; }
  }
  if (!on) { document.querySelectorAll('.nova-elogo').forEach(e => e.remove()); return; }
  for (const [grid, sel] of BENTO_SURFACES) {
    document.querySelectorAll(grid).forEach(g => {
      if (!g._bento) { g._bento = bento(g, { cards: sel }); live.add(g._bento); }
      else g._bento.refresh();
    });
  }
  document.querySelectorAll('.is-newtab .empty-state-container').forEach(c => {
    if (c.querySelector('.nova-elogo')) return;
    const box = document.createElement('div');
    box.className = 'nova-elogo'; box.setAttribute('aria-hidden', 'true');
    c.prepend(box);
  });
  document.querySelectorAll('.fc-stage-area').forEach(el => {
    if (el._eborder) return;
    el._eborder = 'loading';
    loadGL().then(() => {
      if (!el.isConnected || !document.body.classList.contains('ui-nova')) { el._eborder = null; return; }
      const inst = window.NovaUI.electricBorder(el, { color: '#A78BFA', glowColor: '#8B5CF6', borderRadius: 22, strands: 2, chaos: 0.35, spread: 0.45, glow: 0.5, intensity: 0.7, arcs: 0.6 });
      el._eborder = inst;
      live.add({ root: el, destroy() { inst.destroy(); el._eborder = null; } });
    }).catch(() => { el._eborder = null; });
  });
  document.querySelectorAll('.nova-elogo').forEach(el => {
    if (el._elogo) return;
    mountElectric(el);
    const watch = { root: el, destroy() { if (el._elogo && el._elogo.destroy) el._elogo.destroy(); el._elogo = null; } };
    live.add(watch);
  });
}
function queueScan() { if (!scanQueued) { scanQueued = true; requestAnimationFrame(scan); } }
new MutationObserver(muts => {
  for (const m of muts) {
    // ignore the overlay layers this file adds itself
    if (m.target.closest && m.target.closest('.nova-elogo')) continue;
    if (!m.removedNodes.length && [...m.addedNodes].every(n => n.nodeType === 1 && MB_LAYERS.some(c => n.classList.contains(c)))) continue;
    queueScan(); return;
  }
}).observe(document.body, { childList: true, subtree: true });
document.addEventListener('bv-uimode', queueScan);
queueScan();

/* ---------------------------------------------------------------- persistent background
   One React Bits Galaxy canvas sits behind the whole app while Nova is on. It is mounted once and
   never torn down on navigation, so it carries on smoothly from page to page. */
let bgEl = null, bgInst = null;
function mountBg() {
  if (bgEl || !document.body.classList.contains('ui-nova')) return;
  bgEl = document.createElement('div');
  bgEl.className = 'nova-bg'; bgEl.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(bgEl, document.body.firstChild);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  loadGL().then(() => {
    if (!bgEl || !window.NovaUI.galaxy) return;
    bgInst = window.NovaUI.galaxy(bgEl, {
      hueShift: 250, saturation: 0.45, density: 0.75, glowIntensity: 0.22, starSpeed: 0.18, speed: 0.6,
      rotationSpeed: 0.02, twinkleIntensity: 0.35, mouseRepulsion: true, repulsionStrength: 1.1,
      clickWarp: false, transparent: true, dpr: 1, disableAnimation: reduced,
    });
  }).catch(() => {});
}
function unmountBg() { if (bgInst) { bgInst.destroy(); bgInst = null; } if (bgEl) { bgEl.remove(); bgEl = null; } }
// (replaced by the 3D map background in nova-map.js; kept callable for testing)
document.addEventListener('bv-uimode', e => { if (e.detail.mode !== 'nova') unmountBg(); });

window.NovaUI.bento = bento;
window.NovaUI.mountElectric = mountElectric;
window.NovaUI.loadGL = loadGL;
})();
