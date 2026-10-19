/* Free-shape neural map. True XYZ forces and perspective, without a WebGL dependency.
   Kept separate from the 2D graph so Cell, Helix and local graphs stay unchanged. */
(function (root) {
'use strict';
const TAU = Math.PI * 2;
const FOV = Math.PI / 3;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };

// Two gently folded hemispheres; related folders occupy neighbouring regions.
function brainPoint(i, count, seed) {
  const side = i % 2 ? 1 : -1;
  const u = Math.floor(i / 2), total = Math.ceil(count / 2);
  const y = 1 - 2 * (u + .5) / Math.max(1, total);
  const theta = u * Math.PI * (3 - Math.sqrt(5));
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const fold = 1 + .07 * Math.sin(theta * 5 + y * 9);
  const shell = .72 + .28 * seed;
  return {
    x: side * (34 + (1 + Math.cos(theta) * r) * 225 * fold * shell),
    y: y * 325 * shell + 30,
    z: Math.sin(theta) * r * 470 * fold * shell,
  };
}

class BrainSimulation {
  constructor(data, cfg) {
    this.data = data; this.cfg = cfg; this.alpha = 1;
    const ordered = data.nodes.slice().sort((a, b) => (a.group - b.group) || (a.folder || '').localeCompare(b.folder || '') || a.id.localeCompare(b.id));
    ordered.forEach((n, i) => {
      n.anchor = brainPoint(i, ordered.length, hash(n.id));
      if (!Number.isFinite(n.z) || !Number.isFinite(n.x) || !Number.isFinite(n.y)) Object.assign(n, n.anchor);
      n.vx = n.vy = n.vz = 0;
    });
  }
  tick() {
    const { nodes, links } = this.data, cfg = this.cfg, a = this.alpha;
    if (a < .006) return false;
    const charge = (55 + cfg.repel * 18) * a;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const m = nodes[j];
        let dx = n.x - m.x, dy = n.y - m.y, dz = n.z - m.z;
        if (dx === 0 && dy === 0 && dz === 0) dx = .01;
        const d2 = dx * dx + dy * dy + dz * dz + 16;
        const d = Math.sqrt(d2);
        const collision = Math.max(0, (12 + cfg.nodeSize * 9) - d) * .025;
        const f = Math.min(2, charge / d2 + collision) / d;
        n.vx += dx * f; n.vy += dy * f; n.vz += dz * f;
        m.vx -= dx * f; m.vy -= dy * f; m.vz -= dz * f;
      }
    }
    for (const { source: s, target: t } of links) {
      const dx = t.x - s.x, dy = t.y - s.y, dz = t.z - s.z;
      const d = Math.hypot(dx, dy, dz) || 1;
      const f = (d - (50 + cfg.linkDistance * .4)) / d * cfg.linkStrength * .022 * a;
      const ws = 1 / Math.sqrt(Math.max(1, s.deg)), wt = 1 / Math.sqrt(Math.max(1, t.deg));
      s.vx += dx * f * ws; s.vy += dy * f * ws; s.vz += dz * f * ws;
      t.vx -= dx * f * wt; t.vy -= dy * f * wt; t.vz -= dz * f * wt;
    }
    for (const n of nodes) {
      // A soft anatomical envelope, not a fixed layout: links and repulsion remain live.
      const pull = (.018 + cfg.center * .055) * a;
      n.vx = (n.vx + (n.anchor.x - n.x) * pull) * .68;
      n.vy = (n.vy + (n.anchor.y - n.y) * pull) * .68;
      n.vz = (n.vz + (n.anchor.z - n.z) * pull) * .68;
      n.x += n.vx; n.y += n.vy; n.z += n.vz;
    }
    this.alpha *= .976;
    return true;
  }
  reheat() { this.alpha = .7; }
}

class MapCamera {
  constructor() {
    this.current = { yaw: .5, pitch: .24, distance: 1600, x: 0, y: 0, z: 0 };
    this.goal = { ...this.current };
  }
  basis() {
    const { yaw, pitch } = this.current;
    const sy = Math.sin(yaw), cy = Math.cos(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
    return { right: { x: cy, y: 0, z: -sy }, up: { x: -sy * sp, y: cp, z: -cy * sp }, forward: { x: sy * cp, y: sp, z: cy * cp } };
  }
  step(dt, immediate) {
    const f = immediate ? 1 : 1 - Math.exp(-dt / 95);
    let busy = false;
    for (const k of Object.keys(this.current)) {
      const delta = this.goal[k] - this.current[k], epsilon = k === 'yaw' || k === 'pitch' ? .0001 : .02;
      if (Math.abs(delta) > epsilon) { this.current[k] += delta * f; busy = true; }
      else this.current[k] = this.goal[k];
    }
    return busy;
  }
  orbit(dx, dy) {
    this.goal.yaw -= dx * .005;
    this.goal.pitch = clamp(this.goal.pitch + dy * .005, -Math.PI / 2 + .04, Math.PI / 2 - .04);
  }
  pan(dx, dy, height) {
    const { right, up } = this.basis();
    const scale = 2 * this.current.distance * Math.tan(FOV / 2) / Math.max(1, height);
    this.goal.x += (-right.x * dx + up.x * dy) * scale;
    this.goal.y += (-right.y * dx + up.y * dy) * scale;
    this.goal.z += (-right.z * dx + up.z * dy) * scale;
  }
  zoom(amount) { this.goal.distance = clamp(this.goal.distance * Math.exp(amount), 45, 14000); }
  project(n, width, height) {
    const { right, up, forward } = this.basis(), c = this.current;
    const p = { x: n.x - c.x, y: n.y - c.y, z: n.z - c.z };
    const depth = c.distance - dot(p, forward);
    if (depth < 8) return null;
    const scale = height / (2 * Math.tan(FOV / 2) * depth);
    return { x: width / 2 + dot(p, right) * scale, y: height / 2 - dot(p, up) * scale, depth, scale };
  }
  fit(nodes, width, height, reset) {
    if (reset) { this.goal.yaw = .5; this.goal.pitch = .24; }
    if (!nodes.length) { this.goal.x = this.goal.y = this.goal.z = 0; this.goal.distance = 1600; return; }
    const bounds = axis => [Math.min(...nodes.map(n => n[axis])), Math.max(...nodes.map(n => n[axis]))];
    const [x0, x1] = bounds('x'), [y0, y1] = bounds('y'), [z0, z1] = bounds('z');
    this.goal.x = (x0 + x1) / 2; this.goal.y = (y0 + y1) / 2; this.goal.z = (z0 + z1) / 2;
    const radius = Math.max(100, ...nodes.map(n => Math.hypot(n.x - this.goal.x, n.y - this.goal.y, n.z - this.goal.z)));
    const halfFov = Math.atan(Math.tan(FOV / 2) * Math.min(1, width / Math.max(1, height)));
    this.goal.distance = clamp(radius / Math.sin(halfFov) * 1.15, 180, 14000);
  }
}

function create(host, options) {
  const { cfg, getData, titleOf, onOpen, icon, esc } = options;
  const reduced = root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'graph-canvas graph-3d-canvas'; canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '3D free graph. Drag to orbit, Shift-drag or right-drag to pan, scroll to zoom. WASD to pan, Q and E to move vertically, arrow keys to orbit, Home to reset.');
  canvas.setAttribute('aria-keyshortcuts', 'W A S D Q E ArrowUp ArrowDown ArrowLeft ArrowRight Home Enter Escape');
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const hud = document.createElement('div'); hud.className = 'graph-3d-hud';
  hud.innerHTML = `<div class="graph-3d-kicker">${icon('orbit')}<span>NEURAL MAP <b>3D</b></span></div>
    <div class="graph-3d-status">Free shape · spatial connections</div>
    <div class="graph-3d-actions"><button data-map="reset" title="Reset camera (Home)">${icon('rotate')}<span>Reset</span></button><button data-map="help" aria-expanded="false" title="Camera controls">${icon('help-circle')}<span>Controls</span></button></div>`;
  host.appendChild(hud);
  const help = document.createElement('div'); help.className = 'graph-3d-help'; help.hidden = true;
  help.innerHTML = `<strong>Galaxy-map controls</strong><dl><dt>Orbit</dt><dd>Drag / arrow keys</dd><dt>Pan</dt><dd>Right-drag / Shift-drag / WASD</dd><dt>Zoom</dt><dd>Scroll / + and −</dd><dt>Vertical travel</dt><dd>Q / E</dd><dt>Faster travel</dt><dd>Hold Shift</dd><dt>Focus a note</dt><dd>Click, then Focus / double-click</dd><dt>Open a note</dt><dd>Open note / Enter</dd><dt>Reset / deselect</dt><dd>Home / Escape</dd><dt>Touch</dt><dd>One finger orbits; two pan and pinch</dd></dl><p>Click the map to use keyboard controls.</p>`;
  host.appendChild(help);
  const card = document.createElement('div'); card.className = 'graph-3d-selection'; card.hidden = true;
  card.setAttribute('aria-live', 'polite'); host.appendChild(card);
  const empty = document.createElement('div'); empty.className = 'graph-3d-empty'; empty.textContent = 'No notes match these filters.'; host.appendChild(empty);
  const camera = new MapCamera();
  let data, simulation, neighbours, width = 0, height = 0, dpr = 1, alive = true, raf = 0, last = 0;
  let hovered = null, selected = null, projected = [], colors, gesture = null, momentum = null, autoUntil = 0;
  const pointers = new Map(), keys = new Set(), disposers = [];
  const listen = (el, type, fn, opts) => { el.addEventListener(type, fn, opts); disposers.push(() => el.removeEventListener(type, fn, opts)); };
  function readColors() {
    const cs = getComputedStyle(document.body), light = document.body.classList.contains('theme-light');
    colors = { light, node: cs.getPropertyValue('--graph-node').trim() || '#9AA6D8', text: cs.getPropertyValue('--graph-text').trim() || (light ? '#1B2040' : '#DDE2FA'), accent: cs.getPropertyValue('--interactive-accent').trim() || '#34D399', line: light ? '60,70,120' : '150,170,255' };
  }
  function rebuild() {
    const old = new Map((data ? data.nodes : []).map(n => [n.id, n]));
    data = getData();
    data.nodes.forEach(n => { const o = old.get(n.id); if (o) { n.x = o.x; n.y = o.y; n.z = o.z; } });
    simulation = new BrainSimulation(data, cfg);
    neighbours = new Map(data.nodes.map(n => [n.id, new Set()]));
    data.links.forEach(l => { neighbours.get(l.source.id).add(l.target.id); neighbours.get(l.target.id).add(l.source.id); });
    selected = selected ? data.nodes.find(n => n.id === selected.id) || null : null;
    hovered = null; momentum = null; pointers.clear(); gesture = null;
    empty.hidden = data.nodes.length > 0;
    updateCard(); camera.fit(data.nodes, width, height, false); kick();
  }
  function updateCard() {
    card.hidden = !selected;
    if (!selected) { card.innerHTML = ''; return; }
    card.innerHTML = `<div class="graph-3d-selection-title"><span class="color-dot" style="background:${selected.color || colors.node};color:${selected.color || colors.node}"></span><strong>${esc(titleOf(selected.id))}</strong><button data-map="clear" title="Deselect (Escape)" aria-label="Deselect">${icon('x')}</button></div><p>${selected.deg} connection${selected.deg === 1 ? '' : 's'}</p><div class="graph-3d-actions"><button data-map="focus">${icon('maximize')}<span>Focus</span></button><button data-map="open">${icon('book-open')}<span>Open note</span></button></div>`;
  }
  function focusNode(n) {
    selected = n; updateCard(); momentum = null;
    camera.goal.x = n.x; camera.goal.y = n.y; camera.goal.z = n.z;
    const near = data.nodes.filter(m => neighbours.get(n.id).has(m.id));
    const span = near.length ? Math.max(...near.map(m => Math.hypot(m.x - n.x, m.y - n.y, m.z - n.z))) : 180;
    camera.goal.distance = clamp(span * 2.3, 220, 1500);
    autoUntil = performance.now() + 8000; kick();
  }
  function reset() { selected = hovered = null; momentum = null; keys.clear(); updateCard(); camera.fit(data.nodes, width, height, true); autoUntil = performance.now() + 3000; kick(); }
  const buttonAction = e => {
    const b = e.target.closest('[data-map]'); if (!b) return;
    if (b.dataset.map === 'reset') reset();
    if (b.dataset.map === 'help') { help.hidden = !help.hidden; b.setAttribute('aria-expanded', String(!help.hidden)); }
    if (b.dataset.map === 'clear') { selected = null; updateCard(); kick(); }
    if (b.dataset.map === 'focus' && selected) focusNode(selected);
    if (b.dataset.map === 'open' && selected) onOpen(selected.id, e.ctrlKey || e.metaKey);
  };
  listen(hud, 'click', buttonAction); listen(card, 'click', buttonAction);
  function resize() {
    const r = host.getBoundingClientRect(), first = !width;
    width = r.width; height = r.height; dpr = Math.min(root.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * dpr)); canvas.height = Math.max(1, Math.round(height * dpr));
    if (data && first) { camera.fit(data.nodes, width, height, false); camera.step(0, true); }
    kick();
  }
  function kick() { if (!raf && alive && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function travel(dt) {
    if (!keys.size) return false;
    const speed = dt * (keys.has('shift') ? 1.1 : .32);
    const dx = (keys.has('d') ? -speed : 0) + (keys.has('a') ? speed : 0);
    const dy = (keys.has('w') ? speed : 0) + (keys.has('s') ? -speed : 0);
    camera.pan(dx, dy, height);
    camera.goal.y += ((keys.has('e') ? 1 : 0) - (keys.has('q') ? 1 : 0)) * speed * camera.current.distance / 650;
    camera.orbit(((keys.has('arrowright') ? 1 : 0) - (keys.has('arrowleft') ? 1 : 0)) * speed, ((keys.has('arrowdown') ? 1 : 0) - (keys.has('arrowup') ? 1 : 0)) * speed);
    if (keys.has('+') || keys.has('=')) camera.zoom(-dt * .0015);
    if (keys.has('-') || keys.has('_')) camera.zoom(dt * .0015);
    return true;
  }
  function frame(now) {
    raf = 0; if (!alive || document.hidden) return;
    const dt = Math.min(50, now - last || 16); last = now;
    let busy = simulation.tick();
    busy = travel(dt) || busy;
    if (momentum) {
      const decay = Math.exp(-dt / 170); momentum.dx *= decay; momentum.dy *= decay;
      if (Math.hypot(momentum.dx, momentum.dy) < .006) momentum = null;
      else { if (momentum.pan) camera.pan(momentum.dx * dt, momentum.dy * dt, height); else camera.orbit(momentum.dx * dt, momentum.dy * dt); busy = true; }
    }
    if (data.nodes.length > 1 && cfg.animate && !reduced && !gesture && !selected && !hovered && !keys.size) {
      if (now > autoUntil) camera.goal.yaw += dt * .000035;
      busy = true;
    }
    busy = camera.step(dt, reduced) || busy;
    draw();
    if (busy) raf = requestAnimationFrame(frame);
  }
  const radius = n => (3.8 + Math.sqrt(n.deg) * 1.65) * cfg.nodeSize;
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
    projected = [];
    for (const n of data.nodes) {
      n.screen = camera.project(n, width, height);
      if (n.screen) {
        n.screen.r = clamp(radius(n) * n.screen.scale, 1.4, 42);
        if (n.screen.x > -60 && n.screen.x < width + 60 && n.screen.y > -60 && n.screen.y < height + 60) projected.push(n);
      }
    }
    projected.sort((a, b) => b.screen.depth - a.screen.depth);
    const focus = hovered || selected, near = focus && neighbours.get(focus.id);
    const fog = p => clamp(camera.current.distance / p.depth * .58, .15, 1);
    // Navigation plane gives spatial orientation without decorative fake nodes.
    ctx.lineWidth = .6; ctx.strokeStyle = `rgba(${colors.line},.075)`;
    const gridY = -385;
    ctx.beginPath();
    for (let i = -800; i <= 800; i += 160) {
      for (const pair of [[{ x: i, y: gridY, z: -800 }, { x: i, y: gridY, z: 800 }], [{ x: -800, y: gridY, z: i }, { x: 800, y: gridY, z: i }]]) {
        const a = camera.project(pair[0], width, height), b = camera.project(pair[1], width, height);
        if (a && b) { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
      }
    }
    ctx.stroke();
    for (const l of data.links) {
      const a = l.source.screen, b = l.target.screen; if (!a || !b) continue;
      const lit = focus && (l.source === focus || l.target === focus);
      ctx.globalAlpha = lit ? .82 : (focus ? .04 : .2) * Math.min(fog(a), fog(b));
      ctx.strokeStyle = lit ? (focus.color || colors.accent) : `rgb(${colors.line})`;
      ctx.lineWidth = lit ? cfg.lineSize * 1.35 : Math.max(.35, cfg.lineSize * .65);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (const n of projected) {
      const p = n.screen, lit = !focus || n === focus || near.has(n.id);
      ctx.globalAlpha = (lit ? 1 : .16) * fog(p);
      const color = n.color || colors.node;
      // A halo is painted, rather than applying an expensive blur per node.
      if (lit && !colors.light) { ctx.fillStyle = color; ctx.globalAlpha *= .12; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.2, 0, TAU); ctx.fill(); ctx.globalAlpha = fog(p); }
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
      if (n === selected || n === hovered) { ctx.globalAlpha = 1; ctx.strokeStyle = n === selected ? colors.accent : colors.text; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 4, 0, TAU); ctx.stroke(); }
    }
    // Perspective-aware labels with collision avoidance, capped for readable close-ups.
    const boxes = []; let labels = 0;
    const labelOrder = projected.slice().sort((a, b) => (b === focus ? 1 : 0) - (a === focus ? 1 : 0) || b.deg - a.deg);
    ctx.font = '500 12px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const n of labelOrder) {
      if (labels >= 42 && n !== focus) continue;
      const p = n.screen;
      if (n !== focus && (focus || p.scale < .72 - cfg.textFade * .13)) continue;
      const text = titleOf(n.id), w = Math.min(260, ctx.measureText(text).width), x = p.x - w / 2, y = p.y + p.r + 7;
      if (n !== focus && boxes.some(b => x < b.x + b.w && x + w > b.x && y < b.y + 19 && y + 19 > b.y)) continue;
      boxes.push({ x, y, w }); labels++;
      ctx.globalAlpha = n === focus ? 1 : fog(p); ctx.fillStyle = colors.light ? 'rgba(250,250,253,.9)' : 'rgba(5,7,15,.82)';
      ctx.fillRect(x - 4, y - 2, w + 8, 18); ctx.fillStyle = colors.text; ctx.fillText(text, p.x, y, 260);
    }
    ctx.globalAlpha = 1;
    drawCompass();
  }
  function drawCompass() {
    const { right, up, forward } = camera.basis(), x = width - 44, y = height - 48;
    ctx.font = '600 10px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const axes = [{ v: { x: 1, y: 0, z: 0 }, c: '#FB7185', t: 'X' }, { v: { x: 0, y: 1, z: 0 }, c: '#34D399', t: 'Y' }, { v: { x: 0, y: 0, z: 1 }, c: '#8B9CFF', t: 'Z' }].sort((a, b) => dot(a.v, forward) - dot(b.v, forward));
    for (const a of axes) { const dx = dot(a.v, right) * 24, dy = -dot(a.v, up) * 24; ctx.strokeStyle = a.c; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke(); ctx.fillStyle = a.c; ctx.fillText(a.t, x + dx * 1.35, y + dy * 1.35); }
  }
  function nodeAt(x, y) {
    // Frontmost visible node wins even if a distant node projects to the same pixel.
    for (let i = projected.length - 1; i >= 0; i--) { const n = projected[i], p = n.screen; if (Math.hypot(p.x - x, p.y - y) < Math.max(7, p.r + 3)) return n; }
    return null;
  }
  const point = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const touchPair = () => { const ps = [...pointers.values()]; return { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2, distance: Math.max(1, Math.hypot(ps[1].x - ps[0].x, ps[1].y - ps[0].y)) }; };
  listen(canvas, 'pointerdown', e => {
    if (e.button !== 0 && e.button !== 1 && e.button !== 2) return;
    e.preventDefault(); canvas.focus({ preventScroll: true }); momentum = null; hovered = null; autoUntil = performance.now() + 5000;
    const p = point(e); pointers.set(e.pointerId, p); canvas.setPointerCapture(e.pointerId);
    if (pointers.size === 1) gesture = { start: p, last: p, time: performance.now(), moved: false, pan: e.shiftKey || e.button !== 0, node: nodeAt(p.x, p.y), dx: 0, dy: 0, button: e.button };
    else if (pointers.size === 2) { gesture = { ...gesture, moved: true, pair: touchPair(), dx: 0, dy: 0 }; }
    canvas.classList.add('is-dragging'); kick();
  });
  listen(canvas, 'pointermove', e => {
    const p = point(e);
    if (!pointers.has(e.pointerId)) { if (e.pointerType !== 'touch' && !gesture) { const n = nodeAt(p.x, p.y); if (n !== hovered) { hovered = n; canvas.style.cursor = n ? 'pointer' : ''; kick(); } } return; }
    pointers.set(e.pointerId, p);
    if (!gesture) return;
    if (pointers.size >= 2) {
      const pair = touchPair(), prev = gesture.pair || pair;
      camera.pan(pair.x - prev.x, pair.y - prev.y, height); camera.zoom(Math.log(prev.distance / pair.distance)); gesture.pair = pair; gesture.moved = true;
    } else {
      if (!gesture.moved && Math.hypot(p.x - gesture.start.x, p.y - gesture.start.y) < 4) return;
      gesture.moved = true;
      const dx = p.x - gesture.last.x, dy = p.y - gesture.last.y, now = performance.now(), dt = Math.max(8, now - gesture.time);
      if (gesture.pan) camera.pan(dx, dy, height); else camera.orbit(dx, dy);
      gesture.dx = dx / dt; gesture.dy = dy / dt; gesture.last = p; gesture.time = now;
    }
    kick();
  });
  const release = e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (pointers.size) { const p = [...pointers.values()][0]; gesture = { ...gesture, start: p, last: p, time: performance.now(), pair: null, moved: true, dx: 0, dy: 0 }; return; }
    if (gesture && e.type === 'pointerup') {
      if (!gesture.moved && gesture.button === 0) {
        selected = gesture.node; updateCard();
        if (selected && (e.ctrlKey || e.metaKey)) onOpen(selected.id, true);
      } else if (gesture.moved && !reduced && performance.now() - gesture.time < 65 && !gesture.pair) momentum = { dx: gesture.dx, dy: gesture.dy, pan: gesture.pan };
    }
    gesture = null; canvas.classList.remove('is-dragging'); kick();
  };
  listen(canvas, 'pointerup', release); listen(canvas, 'pointercancel', release);
  listen(canvas, 'lostpointercapture', release);
  listen(canvas, 'pointerleave', () => { if (!gesture) { hovered = null; canvas.style.cursor = ''; kick(); } });
  listen(canvas, 'dblclick', e => { e.preventDefault(); const p = point(e), n = nodeAt(p.x, p.y); if (n) focusNode(n); });
  listen(canvas, 'contextmenu', e => e.preventDefault());
  listen(canvas, 'wheel', e => { e.preventDefault(); momentum = null; const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? height : 1; camera.zoom(clamp(e.deltaY * unit * .0015, -.5, .5)); autoUntil = performance.now() + 5000; kick(); }, { passive: false });
  const movementKeys = new Set(['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', '+', '=', '-', '_', 'shift']);
  listen(canvas, 'keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (movementKeys.has(k)) { e.preventDefault(); e.stopPropagation(); keys.add(k); autoUntil = performance.now() + 5000; momentum = null; kick(); }
    else if (k === 'home') { e.preventDefault(); e.stopPropagation(); reset(); }
    else if (k === 'enter' && selected) { e.preventDefault(); onOpen(selected.id, false); }
    else if (k === 'escape') { e.preventDefault(); e.stopPropagation(); selected = hovered = null; help.hidden = true; hud.querySelector('[data-map="help"]').setAttribute('aria-expanded', 'false'); updateCard(); kick(); }
  });
  listen(root, 'keyup', e => keys.delete(e.key.toLowerCase()));
  const clearInput = () => { keys.clear(); momentum = null; pointers.clear(); gesture = null; canvas.classList.remove('is-dragging'); };
  listen(canvas, 'blur', clearInput); listen(root, 'blur', clearInput);
  listen(document, 'visibilitychange', () => { clearInput(); if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else kick(); });
  const ro = new ResizeObserver(resize); ro.observe(host);
  readColors(); resize(); rebuild(); camera.step(0, true); kick();
  const debug = { nodes: () => data.nodes, toScreen: n => { const p = camera.project(n, width, height); return p ? [p.x, p.y] : [NaN, NaN]; }, camera: () => ({ ...camera.current }), mode: '3d' };
  root.__graph = debug;
  return {
    cfg, data: () => data,
    update(changes) {
      if ('search' in changes || 'showOrphans' in changes) rebuild();
      else if (['center', 'repel', 'linkStrength', 'linkDistance', 'nodeSize'].some(k => k in changes)) simulation.reheat();
      kick();
    },
    fit() { momentum = null; camera.fit(data.nodes, width, height, false); autoUntil = performance.now() + 3000; kick(); },
    restyle() { readColors(); updateCard(); kick(); },
    destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); clearInput(); disposers.forEach(fn => fn()); if (root.__graph === debug) delete root.__graph; host.replaceChildren(); },
  };
}
const api = { create, brainPoint, BrainSimulation, MapCamera };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
else root.BVGraph3D = api;
})(typeof window !== 'undefined' ? window : globalThis);
