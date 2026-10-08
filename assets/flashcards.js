/* Flashcards: spaced repetition over every question and key term in the vault, with XP, levels,
   streaks, badges, a 60-second sprint, and a specimen that evolves as you level up.
   Cards come from data/cards.json (built by tools/build_site.py). Progress is kept in this browser. */
(() => {
'use strict';
const B = window.BV;
const { icon, esc, $, $$, h, store, clamp } = B;
const KEY = 'fc2';
const DAY = 864e5, MIN = 6e4;
const STEPS = [1, 10];            // learning steps in minutes
const GRADE_XP = [2, 6, 10, 12];  // again, hard, good, easy

/* ---------------------------------------------------------------- state */
let D = null;           // { decks, cards, byId, deckById }
let S = load();
function blank() { return { v: 1, xp: 0, name: '', cards: {}, days: {}, best: { sprint: 0, combo: 0 }, badges: {}, newPerDay: 20, goal: 40, created: Date.now() }; }
function load() { const s = store.get(KEY, null); return s && s.v === 1 ? Object.assign(blank(), s) : blank(); }
function save() { store.set(KEY, S); }
const today = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dayRec = () => (S.days[today()] = S.days[today()] || { n: 0, xp: 0, ok: 0, fresh: 0 });

async function loadCards() {
  if (D) return D;
  const res = await fetch('data/cards.json', { cache: 'no-cache' });
  const d = await res.json();
  d.byId = new Map(d.cards.map(c => [c.id, c]));
  d.deckById = new Map(d.decks.map(x => [x.id, x]));
  D = d;
  return D;
}

/* ---------------------------------------------------------------- levels and stages */
const need = L => 80 + 25 * (L - 1);             // XP to go from level L to L+1
function levelOf(xp) { let L = 1, x = xp; while (x >= need(L)) { x -= need(L); L++; } return { L, into: x, need: need(L) }; }
const STAGES = [
  { at: 1, name: 'Protocell', line: 'A membrane and some ambition.' },
  { at: 3, name: 'Bacterium', line: 'Has a flagellum now. Getting around.' },
  { at: 6, name: 'Eukaryote', line: 'Nucleus acquired. Things are getting organised.' },
  { at: 10, name: 'Colony', line: 'Turns out there is strength in numbers.' },
  { at: 15, name: 'Organoid', line: 'Thinking at tissue level.' },
  { at: 21, name: 'Medusa', line: 'Bell, tentacles and a nerve net.' },
  { at: 28, name: 'Siphonophore', line: 'A colony that moves as one animal. Top of the culture.' },
];
const stageOf = L => { let i = 0; STAGES.forEach((s, k) => { if (L >= s.at) i = k; }); return i; };

/* ---------------------------------------------------------------- scheduling */
function cs(id) { return S.cards[id]; }
function isNew(id) { return !S.cards[id]; }
function isDue(id, now = Date.now()) { const c = S.cards[id]; return c && c.due <= now; }
const mastered = id => { const c = S.cards[id]; return c && c.step < 0 && c.ivl >= 21; };
function fmtIvl(ms) {
  if (ms < 60 * MIN) return Math.max(1, Math.round(ms / MIN)) + 'm';
  if (ms < DAY) return Math.round(ms / 36e5) + 'h';
  const d = ms / DAY; if (d < 30) return Math.round(d) + 'd'; if (d < 365) return Math.round(d / 30) + 'mo'; return (d / 365).toFixed(1) + 'y';
}
function schedule(prev, g, now = Date.now()) {
  const c = prev ? Object.assign({}, prev) : { ivl: 0, ease: 2.5, reps: 0, lapses: 0, step: 0, due: now };
  c.reps++; c.last = now;
  if (c.step >= 0) {                            // learning or relearning
    if (g === 0) { c.step = 0; c.due = now + STEPS[0] * MIN; }
    else if (g === 1) { c.due = now + STEPS[Math.min(c.step, STEPS.length - 1)] * MIN * 1.5; }
    else if (g === 2) {
      c.step++;
      if (c.step >= STEPS.length) { c.step = -1; c.ivl = Math.max(1, c.ivl || 1); c.due = now + c.ivl * DAY; }
      else c.due = now + STEPS[c.step] * MIN;
    } else { c.step = -1; c.ivl = Math.max(4, (c.ivl || 0) * 1.5); c.due = now + c.ivl * DAY; }
  } else {
    if (g === 0) { c.lapses++; c.ease = Math.max(1.3, c.ease - 0.2); c.ivl = Math.max(1, c.ivl * 0.5); c.step = 0; c.due = now + STEPS[1] * MIN; }
    else {
      if (g === 1) { c.ivl = Math.max(c.ivl + 1, c.ivl * 1.2); c.ease = Math.max(1.3, c.ease - 0.15); }
      if (g === 2) c.ivl = Math.max(c.ivl + 1, c.ivl * c.ease);
      if (g === 3) { c.ivl = Math.max(c.ivl + 2, c.ivl * c.ease * 1.3); c.ease += 0.15; }
      const fuzz = 1 + (Math.random() - 0.5) * 0.08;
      c.due = now + c.ivl * fuzz * DAY;
    }
  }
  return c;
}
const preview = (id, g) => { const now = Date.now(); return fmtIvl(schedule(S.cards[id], g, now).due - now); };

/* ---------------------------------------------------------------- streak, badges */
function streak() {
  let n = 0, t = Date.now();
  if (!(S.days[today(t)] || {}).n) t -= DAY;           // today not started yet: count up to yesterday
  while ((S.days[today(t)] || {}).n) { n++; t -= DAY; }
  return n;
}
const totalReviews = () => Object.values(S.days).reduce((s, d) => s + (d.n || 0), 0);
const BADGES = [
  { id: 'first', name: 'First contact', desc: 'Review your first card', test: () => totalReviews() >= 1 },
  { id: 'c100', name: 'Century', desc: '100 reviews', test: () => totalReviews() >= 100 },
  { id: 'c500', name: 'Five hundred', desc: '500 reviews', test: () => totalReviews() >= 500 },
  { id: 'c2000', name: 'Two thousand', desc: '2,000 reviews', test: () => totalReviews() >= 2000 },
  { id: 'streak3', name: 'Three in a row', desc: '3-day streak', test: () => streak() >= 3 },
  { id: 'streak7', name: 'Week of work', desc: '7-day streak', test: () => streak() >= 7 },
  { id: 'streak30', name: 'Habit formed', desc: '30-day streak', test: () => streak() >= 30 },
  { id: 'combo10', name: 'On a roll', desc: '10 correct in a row', test: () => S.best.combo >= 10 },
  { id: 'combo30', name: 'Unbroken', desc: '30 correct in a row', test: () => S.best.combo >= 30 },
  { id: 'sprint15', name: 'Quick study', desc: '15 in one sprint', test: () => S.best.sprint >= 15 },
  { id: 'sprint30', name: 'Lightning', desc: '30 in one sprint', test: () => S.best.sprint >= 30 },
  { id: 'deck', name: 'Deck cleared', desc: 'Master every card in a deck', test: () => D && D.decks.some(d => deckCards(d.id).every(mastered)) },
  { id: 'seenall', name: 'Full survey', desc: 'See every card once', test: () => D && D.cards.every(c => S.cards[c.id]) },
  { id: 'lv10', name: 'Colonist', desc: 'Reach level 10', test: () => levelOf(S.xp).L >= 10 },
  { id: 'lv21', name: 'Deep water', desc: 'Reach level 21', test: () => levelOf(S.xp).L >= 21 },
];
function checkBadges() {
  const got = [];
  for (const b of BADGES) if (!S.badges[b.id] && b.test()) { S.badges[b.id] = Date.now(); got.push(b); }
  if (got.length) save();
  return got;
}

/* ---------------------------------------------------------------- decks */
const deckCards = deckId => D.cards.filter(c => c.deck === deckId).map(c => c.id);
function scopeCards(scope) {
  if (!scope || scope === 'all') return D.cards.map(c => c.id);
  if (scope.startsWith('subject:')) { const s = scope.slice(8); return D.cards.filter(c => (D.deckById.get(c.deck) || {}).subject === s).map(c => c.id); }
  return deckCards(scope);
}
function counts(ids) {
  const now = Date.now(); let due = 0, fresh = 0, mast = 0;
  for (const id of ids) { if (isNew(id)) fresh++; else if (isDue(id, now)) due++; if (mastered(id)) mast++; }
  return { due, fresh, mast, total: ids.length };
}
const newLeftToday = () => Math.max(0, S.newPerDay - (dayRec().fresh || 0));

/* ---------------------------------------------------------------- the specimen */
function specimen(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  let raf = 0, alive = true, t0 = performance.now(), react = { kind: null, at: 0 }, stageIdx = opts.stage || 0, glowBoost = 0;
  const pal = [
    ['#34D399', '#A7F3D0'], ['#38BDF8', '#BAE6FD'], ['#A78BFA', '#DDD6FE'], ['#34D399', '#FDE68A'],
    ['#F472B6', '#FBCFE8'], ['#818CF8', '#C7D2FE'], ['#FBBF24', '#FDE68A'],
  ];
  const size = () => { const r = canvas.getBoundingClientRect(); const d = window.devicePixelRatio || 1; canvas.width = Math.max(1, r.width * d); canvas.height = Math.max(1, r.height * d); return { w: r.width, h: r.height, d }; };
  let dim = size();
  const blob = (cx, cy, r, t, seed, wob = 0.06, n = 56) => {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = i / n * Math.PI * 2;
      const rr = r * (1 + wob * Math.sin(3 * a + t * 1.3 + seed) + wob * 0.6 * Math.sin(5 * a - t * 0.9 + seed * 2));
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  };
  const cellFill = (cx, cy, r, c1, a = 0.22) => {
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r * 1.1);
    g.addColorStop(0, hexA(c1, a + 0.12)); g.addColorStop(1, hexA(c1, a * 0.35));
    ctx.fillStyle = g; ctx.fill();
  };
  const glowStroke = (c, w, blur) => { ctx.shadowColor = c; ctx.shadowBlur = blur * (1 + glowBoost); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke(); ctx.shadowBlur = 0; };
  const dot = (x, y, r, c, blur = 6) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.shadowColor = c; ctx.shadowBlur = blur; ctx.fillStyle = c; ctx.fill(); ctx.shadowBlur = 0; };
  function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
  function nucleus(cx, cy, r, t, c1, c2) { blob(cx, cy, r, t * 0.8, 3, 0.05, 40); cellFill(cx, cy, r, c2, 0.3); glowStroke(c2, 1.4, 6); dot(cx + r * 0.25, cy - r * 0.2, r * 0.28, hexA(c1, .9), 8); }
  function mito(cx, cy, len, ang, c) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.beginPath(); ctx.ellipse(0, 0, len, len * 0.42, 0, 0, Math.PI * 2); ctx.fillStyle = hexA(c, .18); ctx.fill(); glowStroke(c, 1.2, 4);
    ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(i * len * 0.32, -len * 0.3); ctx.quadraticCurveTo(i * len * 0.32 + len * 0.12, 0, i * len * 0.32, len * 0.3); } ctx.strokeStyle = hexA(c, .7); ctx.lineWidth = 0.9; ctx.stroke();
    ctx.restore();
  }
  const draw = {
    0(t, w, hgt, c1, c2) { // protocell
      const cx = w / 2, cy = hgt / 2, r = Math.min(w, hgt) * 0.26;
      blob(cx, cy, r, t, 1, 0.07); cellFill(cx, cy, r, c1); glowStroke(c1, 2, 14);
      for (let i = 0; i < 6; i++) { const a = t * 0.3 + i * 1.7, rr = r * (0.25 + 0.45 * ((i * 37) % 10) / 10); dot(cx + Math.cos(a) * rr, cy + Math.sin(a * 1.3) * rr * 0.8, 1.6 + (i % 3), hexA(c2, .8)); }
    },
    1(t, w, hgt, c1, c2) { // bacterium
      const cx = w / 2 + Math.sin(t * 0.7) * 4, cy = hgt / 2, L = Math.min(w, hgt) * 0.32, R = L * 0.42;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.25 + Math.sin(t * 0.5) * 0.06);
      // flagellum
      ctx.beginPath(); for (let i = 0; i <= 40; i++) { const x = L + i * L * 0.04, y = Math.sin(i * 0.45 - t * 6) * (3 + i * 0.25); i ? ctx.lineTo(x, y) : ctx.moveTo(x - 2, 0); } glowStroke(c2, 1.6, 6);
      // body
      ctx.beginPath(); ctx.moveTo(-L + R, -R); ctx.lineTo(L - R, -R); ctx.arc(L - R, 0, R, -Math.PI / 2, Math.PI / 2); ctx.lineTo(-L + R, R); ctx.arc(-L + R, 0, R, Math.PI / 2, Math.PI * 1.5); ctx.closePath();
      cellFill(0, 0, L, c1); glowStroke(c1, 2, 14);
      // pili
      for (let i = 0; i < 9; i++) { const x = -L + R + i * (2 * L - 2 * R) / 8; ctx.beginPath(); ctx.moveTo(x, -R); ctx.lineTo(x + Math.sin(t + i) * 2, -R - 6); ctx.moveTo(x, R); ctx.lineTo(x - Math.sin(t + i) * 2, R + 6); ctx.strokeStyle = hexA(c1, .5); ctx.lineWidth = 1; ctx.stroke(); }
      // nucleoid and plasmid
      ctx.beginPath(); for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2; const x = Math.cos(a) * L * 0.42 + Math.sin(a * 5 + t) * 4, y = Math.sin(a) * R * 0.45 + Math.cos(a * 4 - t) * 3; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } glowStroke(c2, 1.2, 5);
      ctx.beginPath(); ctx.arc(-L * 0.6, R * 0.2, R * 0.22, 0, Math.PI * 2); glowStroke(c2, 1.2, 5);
      ctx.restore();
    },
    2(t, w, hgt, c1, c2) { // eukaryote
      const cx = w / 2, cy = hgt / 2, r = Math.min(w, hgt) * 0.32;
      blob(cx, cy, r, t, 2, 0.05); cellFill(cx, cy, r, c1); glowStroke(c1, 2, 14);
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(cx - r * 0.05, cy + r * 0.02, r * (0.42 + k * 0.08), -0.4 + k * 0.2, 1.6 + k * 0.3); ctx.strokeStyle = hexA(c2, .35); ctx.lineWidth = 1; ctx.stroke(); }
      nucleus(cx - r * 0.05, cy, r * 0.33, t, c1, c2);
      mito(cx + r * 0.52, cy - r * 0.3, r * 0.17, 0.6 + Math.sin(t * 0.4) * 0.2, c2);
      mito(cx - r * 0.5, cy + r * 0.42, r * 0.15, -0.4, c2);
      mito(cx + r * 0.35, cy + r * 0.55, r * 0.13, 1.2, c2);
      for (let i = 0; i < 5; i++) { const a = t * 0.25 + i * 1.25; dot(cx + Math.cos(a) * r * 0.75, cy + Math.sin(a) * r * 0.7, 2, hexA(c2, .8)); }
    },
    3(t, w, hgt, c1, c2) { // colony
      const cx = w / 2, cy = hgt / 2, R = Math.min(w, hgt) * 0.16;
      const spots = [[0, 0], [1.75, 0.2], [-1.7, 0.35], [0.85, 1.55], [-0.9, -1.5], [0.95, -1.5], [-0.85, 1.6]];
      spots.forEach(([dx, dy], i) => {
        const x = cx + dx * R + Math.sin(t * 0.8 + i) * 2.5, y = cy + dy * R + Math.cos(t * 0.7 + i * 2) * 2.5, r = R * (i ? 0.92 : 1.05);
        blob(x, y, r, t, i * 1.3, 0.05, 40); cellFill(x, y, r, i % 2 ? c1 : c2, 0.2); glowStroke(i % 2 ? c1 : c2, 1.6, 10);
        dot(x + r * 0.1, y - r * 0.05, r * 0.28, hexA(c2, .75), 8);
      });
    },
    4(t, w, hgt, c1, c2) { // organoid
      const cx = w / 2, cy = hgt / 2, R = Math.min(w, hgt) * 0.3, n = 12;
      const lum = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.62); lum.addColorStop(0, hexA(c2, .35)); lum.addColorStop(1, hexA(c2, 0));
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.62, 0, Math.PI * 2); ctx.fillStyle = lum; ctx.fill();
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2 + t * 0.08, pulse = 1 + 0.04 * Math.sin(t * 2 + i);
        const x = cx + Math.cos(a) * R * pulse, y = cy + Math.sin(a) * R * pulse, r = R * 0.27;
        blob(x, y, r, t, i, 0.06, 36); cellFill(x, y, r, c1, 0.22); glowStroke(c1, 1.4, 9);
        dot(cx + Math.cos(a) * R * 1.08 * pulse, cy + Math.sin(a) * R * 1.08 * pulse, r * 0.22, hexA(c2, .8), 6);
      }
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.42, 0, Math.PI * 2); ctx.strokeStyle = hexA(c1, .18); ctx.lineWidth = 1; ctx.setLineDash([3, 6]); ctx.stroke(); ctx.setLineDash([]);
    },
    5(t, w, hgt, c1, c2) { // medusa
      const cx = w / 2, top = hgt * 0.24 + Math.sin(t * 1.2) * 4, R = Math.min(w, hgt) * 0.3;
      const squeeze = 1 + 0.08 * Math.sin(t * 2.4);
      const n = 9;
      for (let i = 0; i < n; i++) {
        const bx = cx + (i - (n - 1) / 2) / ((n - 1) / 2) * R * 0.85 / squeeze;
        ctx.beginPath(); ctx.moveTo(bx, top + R * 0.62);
        for (let s = 1; s <= 20; s++) { const y = top + R * 0.62 + s * R * 0.07, x = bx + Math.sin(s * 0.45 - t * 2.4 + i) * (2 + s * 0.45); ctx.lineTo(x, y); }
        ctx.strokeStyle = hexA(i % 2 ? c2 : c1, .55); ctx.lineWidth = 1.1; ctx.shadowColor = c1; ctx.shadowBlur = 5; ctx.stroke(); ctx.shadowBlur = 0;
      }
      ctx.beginPath(); ctx.ellipse(cx, top + R * 0.62, R * 1.0 / squeeze, R * 0.75 * squeeze, 0, Math.PI, 0); ctx.closePath();
      cellFill(cx, top + R * 0.3, R, c1, 0.24); glowStroke(c1, 2, 16);
      for (let i = 0; i < 6; i++) { const a = Math.PI + (i + 0.5) / 6 * Math.PI; ctx.beginPath(); ctx.moveTo(cx, top + R * 0.62); ctx.lineTo(cx + Math.cos(a) * R * 0.92 / squeeze, top + R * 0.62 + Math.sin(a) * R * 0.7 * squeeze); ctx.strokeStyle = hexA(c2, .35); ctx.lineWidth = 1; ctx.stroke(); }
      for (let i = 0; i < 12; i++) { const a = Math.PI + i / 11 * Math.PI, on = (Math.sin(t * 3 - i * 0.6) + 1) / 2; dot(cx + Math.cos(a) * R / squeeze, top + R * 0.62 + Math.sin(a) * R * 0.75 * squeeze, 1.3 + on * 1.2, hexA(c2, .4 + on * .6), 4 + on * 8); }
    },
    6(t, w, hgt, c1, c2) { // siphonophore
      const cx = w / 2, top = hgt * 0.1, R = Math.min(w, hgt) * 0.075;
      const sway = s => Math.sin(t * 0.9 - s * 0.35) * (3 + s * 2.2);
      ctx.beginPath(); for (let s = 0; s <= 30; s++) { const y = top + R * 1.4 + s * hgt * 0.027; const x = cx + sway(s / 3); s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } glowStroke(c1, 1.4, 6);
      ctx.beginPath(); ctx.ellipse(cx, top + R * 0.7, R * 0.75, R * 1.1, 0, 0, Math.PI * 2); cellFill(cx, top + R * 0.7, R, c2, 0.3); glowStroke(c2, 1.6, 10);
      for (let k = 0; k < 4; k++) {
        const y = top + R * 2.6 + k * R * 1.55, x = cx + sway(k * 0.6), side = k % 2 ? 1 : -1, pulse = 1 + 0.08 * Math.sin(t * 3 + k);
        ctx.beginPath(); ctx.ellipse(x + side * R * 0.9, y, R * 1.05 * pulse, R * 0.7, side * 0.5, 0, Math.PI * 2); cellFill(x + side * R * 0.9, y, R, c1, 0.22); glowStroke(c1, 1.5, 10);
      }
      for (let k = 0; k < 7; k++) {
        const s = 12 + k * 2.6, y = top + R * 1.4 + s * hgt * 0.027, x = cx + sway(s / 3);
        ctx.beginPath(); ctx.moveTo(x, y); for (let j = 1; j <= 12; j++) ctx.lineTo(x + (k % 2 ? 1 : -1) * j * 1.6 + Math.sin(t * 2 + j * 0.5 + k) * 2, y + j * 4.2); ctx.strokeStyle = hexA(c2, .45); ctx.lineWidth = 1; ctx.stroke();
        const on = (Math.sin(t * 2.5 - k) + 1) / 2; dot(x, y, 2 + on * 1.5, hexA(k % 2 ? c2 : c1, .5 + on * .5), 6 + on * 10);
      }
    },
  };
  function frame(now) {
    raf = 0; if (!alive || !canvas.isConnected) return;
    const t = (now - t0) / 1000;
    const { w, h: hh, d } = dim;
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, w, hh);
    const age = (now - react.at) / 1000;
    let sx = 1, ox = 0;
    glowBoost = 0;
    if (react.kind === 'good' && age < 0.6) { sx = 1 + 0.08 * Math.sin(age / 0.6 * Math.PI); glowBoost = 1.2 * (1 - age / 0.6); }
    if (react.kind === 'bad' && age < 0.45) ox = Math.sin(age * 60) * 5 * (1 - age / 0.45);
    if (react.kind === 'level' && age < 1.4) { sx = 1 + 0.12 * Math.sin(age / 1.4 * Math.PI); glowBoost = 2 * (1 - age / 1.4); }
    ctx.translate(w / 2 + ox, hh / 2); ctx.scale(sx, sx); ctx.translate(-w / 2, -hh / 2);
    const [c1, c2] = pal[stageIdx % pal.length];
    // soft halo
    const halo = ctx.createRadialGradient(w / 2, hh / 2, 0, w / 2, hh / 2, Math.min(w, hh) * 0.55);
    halo.addColorStop(0, hexA(c1, 0.12 + glowBoost * 0.05)); halo.addColorStop(1, hexA(c1, 0));
    ctx.fillStyle = halo; ctx.fillRect(0, 0, w, hh);
    if (opts.locked) { ctx.globalAlpha = 0.18; }
    draw[stageIdx](t, w, hh, opts.locked ? '#8B93B8' : c1, opts.locked ? '#8B93B8' : c2);
    ctx.globalAlpha = 1;
    if (!opts.still) raf = requestAnimationFrame(frame);
  }
  const ro = new ResizeObserver(() => { dim = size(); if (opts.still) frame(performance.now()); }); ro.observe(canvas);
  raf = requestAnimationFrame(frame);
  return {
    react(kind) { react = { kind, at: performance.now() }; },
    stage(i) { stageIdx = i; },
    stop() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); },
  };
}

/* ---------------------------------------------------------------- view */
let root = null, liveSpecs = [];
function stopSpecs() { liveSpecs.forEach(s => s.stop()); liveSpecs = []; }
function mountSpec(canvas, opts) { const s = specimen(canvas, opts); liveSpecs.push(s); return s; }

B.registerView('flashcards', {
  title: () => 'Flashcards', icon: 'cards', cls: 'fc-host',
  show(view) {
    root = view;
    view.innerHTML = `<div class="fc-loading"><span class="books-spinner"></span> Loading cards…</div>`;
    loadCards().then(() => { if (root === view) dashboard(); }).catch(() => { view.innerHTML = '<div class="pane-empty">Could not load the flashcards.</div>'; });
    const onKey = e => keyHandler && keyHandler(e);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); stopSpecs(); root = null; keyHandler = null; clearInterval(sprintTimer); };
  },
});
let keyHandler = null;

function ring(frac, label, sub) {
  const r = 34, c = 2 * Math.PI * r, f = clamp(frac, 0, 1);
  return `<div class="fc-ring"><svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="${r}" class="track"/><circle cx="42" cy="42" r="${r}" class="fill" style="stroke-dasharray:${c};stroke-dashoffset:${c * (1 - f)}"/></svg><div class="fc-ring-label"><b>${label}</b><span>${sub}</span></div></div>`;
}

function dashboard() {
  stopSpecs(); keyHandler = null;
  const lv = levelOf(S.xp), st = stageOf(lv.L), stage = STAGES[st], next = STAGES[st + 1];
  const day = dayRec(), stk = streak();
  const all = counts(scopeCards('all'));
  const newToday = Math.min(all.fresh, newLeftToday());
  const subjects = [...new Set(D.decks.map(d => d.subject))];
  const newBadges = checkBadges();
  root.innerHTML = `<div class="fc-view">
    <section class="fc-hero">
      <div class="fc-spec"><canvas class="fc-spec-canvas"></canvas></div>
      <div class="fc-hero-main">
        <div class="fc-kicker">Specimen · stage ${st + 1} of ${STAGES.length}</div>
        <div class="fc-name"><span class="fc-name-text">${esc(S.name || stage.name)}</span><button class="clickable-icon fc-rename" title="Name your specimen">${icon('pencil')}</button></div>
        <div class="fc-stage">${esc(S.name ? stage.name + '. ' : '')}${esc(stage.line)}</div>
        <div class="fc-level"><span class="fc-lv">Level ${lv.L}</span><div class="fc-xpbar"><div style="width:${(lv.into / lv.need * 100).toFixed(1)}%"></div></div><span class="fc-xpnum">${lv.into} / ${lv.need} XP</span></div>
        <div class="fc-next">${next ? `Evolves into a ${esc(next.name)} at level ${next.at}` : 'Final form reached'}</div>
      </div>
      <div class="fc-hero-side">
        ${ring(day.n / S.goal, day.n, `of ${S.goal} today`)}
        <div class="fc-streak${stk ? ' is-on' : ''}">${icon('flame')}<b>${stk}</b><span>day streak</span></div>
      </div>
    </section>
    <section class="fc-actions">
      <button class="fc-big mod-cta" data-study="all"${all.due + newToday ? '' : ' disabled'}>${icon('play')}<span><b>Study now</b><small>${all.due} due · ${newToday} new</small></span></button>
      <button class="fc-big" data-sprint>${icon('timer')}<span><b>Sprint</b><small>60 seconds · best ${S.best.sprint}</small></span></button>
      <div class="fc-stats"><div><b>${all.total}</b><span>cards</span></div><div><b>${all.total - all.fresh}</b><span>seen</span></div><div><b>${all.mast}</b><span>mastered</span></div><div><b>${totalReviews()}</b><span>reviews</span></div></div>
    </section>
    <section class="fc-decks">${subjects.map(sub => {
      const decks = D.decks.filter(d => d.subject === sub);
      const sc = counts(scopeCards('subject:' + sub));
      return `<div class="fc-subject"><div class="fc-subject-head"><span>${esc(sub)}</span><button class="fc-mini" data-study="subject:${esc(sub)}"${sc.due + Math.min(sc.fresh, newLeftToday()) ? '' : ' disabled'}>Study all · ${sc.due} due</button></div>
        ${decks.map(d => { const c = counts(deckCards(d.id)); const pct = c.total ? c.mast / c.total * 100 : 0; const seen = c.total ? (c.total - c.fresh) / c.total * 100 : 0;
          return `<div class="fc-deck" data-study="${esc(d.id)}"><div class="fc-deck-name">${esc(d.name)}<span>${c.total} cards</span></div>
            <div class="fc-deck-bar" title="${Math.round(seen)}% seen, ${Math.round(pct)}% mastered"><i style="width:${seen}%"></i><b style="width:${pct}%"></b></div>
            <div class="fc-deck-due">${c.due ? `<span class="due">${c.due} due</span>` : ''}${c.fresh ? `<span class="new">${c.fresh} new</span>` : ''}${!c.due && !c.fresh ? `<span class="done">${icon('check')}</span>` : ''}</div></div>`; }).join('')}</div>`;
    }).join('')}</section>
    <section class="fc-cabinet"><div class="fc-section-title">Evolution</div><div class="fc-evo">${STAGES.map((s, i) => `<div class="fc-evo-item${i <= st ? ' is-unlocked' : ''}${i === st ? ' is-current' : ''}"><canvas data-stage="${i}"></canvas><b>${i <= st ? esc(s.name) : '???'}</b><span>Level ${s.at}</span></div>`).join('')}</div></section>
    <section class="fc-cabinet"><div class="fc-section-title">Badges <span>${Object.keys(S.badges).length} of ${BADGES.length}</span></div><div class="fc-badges">${BADGES.map(b => `<div class="fc-badge${S.badges[b.id] ? ' is-earned' : ''}" title="${esc(b.desc)}">${icon(S.badges[b.id] ? 'trophy' : 'lock')}<b>${esc(b.name)}</b><span>${esc(b.desc)}</span></div>`).join('')}</div></section>
    <section class="fc-footer">
      <label>New cards a day <input type="number" min="0" max="200" value="${S.newPerDay}" data-set="newPerDay"></label>
      <label>Daily goal <input type="number" min="5" max="500" value="${S.goal}" data-set="goal"></label>
      <span class="spacer"></span>
      <button class="fc-mini" data-export>${icon('download')} Export progress</button>
      <label class="fc-mini fc-import">${icon('upload')} Import<input type="file" accept="application/json" hidden></label>
      <button class="fc-mini fc-danger" data-reset>Reset</button>
    </section>
    <div class="fc-note">Progress is saved in this browser. Export it to move it to another device.</div>
  </div>`;
  const spec = mountSpec($('.fc-spec-canvas', root), { stage: st });
  $$('.fc-evo canvas', root).forEach(cv => { const i = +cv.dataset.stage; mountSpec(cv, { stage: i, locked: i > st, still: i !== st }); });
  if (newBadges.length) B.toast('Badge earned: ' + newBadges.map(b => b.name).join(', '));
  root.onclick = e => {
    const sb = e.target.closest('[data-study]'); if (sb && !sb.disabled) return startSession(sb.dataset.study);
    if (e.target.closest('[data-sprint]')) return startSprint();
    if (e.target.closest('.fc-rename')) {
      const span = $('.fc-name-text', root); const inp = h(`<input class="fc-name-input" maxlength="28" value="${esc(S.name)}" placeholder="${esc(stage.name)}">`);
      span.replaceWith(inp); inp.focus(); inp.select();
      const done = () => { S.name = inp.value.trim(); save(); dashboard(); };
      inp.onblur = done; inp.onkeydown = ev => { if (ev.key === 'Enter') inp.blur(); if (ev.key === 'Escape') { inp.value = S.name; inp.blur(); } };
      return;
    }
    if (e.target.closest('[data-export]')) {
      const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `flashcards-progress-${today()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); return;
    }
    const rs = e.target.closest('[data-reset]');
    if (rs) { if (rs.dataset.armed) { S = blank(); save(); dashboard(); B.toast('Progress reset'); } else { rs.dataset.armed = '1'; rs.textContent = 'Tap again to reset'; setTimeout(() => { if (rs.isConnected) { delete rs.dataset.armed; rs.textContent = 'Reset'; } }, 3000); } }
  };
  $$('[data-set]', root).forEach(inp => inp.onchange = () => { S[inp.dataset.set] = clamp(parseInt(inp.value, 10) || 0, +inp.min, +inp.max); save(); dashboard(); });
  $('.fc-import input', root).onchange = async ev => {
    const f = ev.target.files[0]; if (!f) return;
    try { const d = JSON.parse(await f.text()); if (d.v !== 1 || typeof d.cards !== 'object') throw new Error(); S = Object.assign(blank(), d); save(); dashboard(); B.toast('Progress imported'); }
    catch (e) { B.toast('That file is not a progress export'); }
  };
  return spec;
}

/* ---------------------------------------------------------------- study session */
function buildQueue(scope) {
  const ids = scopeCards(scope), now = Date.now();
  const due = ids.filter(id => !isNew(id) && S.cards[id].due <= now).sort((a, b) => S.cards[a].due - S.cards[b].due).slice(0, 200);
  const fresh = ids.filter(isNew).slice(0, newLeftToday());
  // interleave: one new card every three reviews
  const q = []; let i = 0, j = 0;
  while (i < due.length || j < fresh.length) { for (let k = 0; k < 3 && i < due.length; k++) q.push(due[i++]); if (j < fresh.length) q.push(fresh[j++]); }
  return q;
}
function sessionHeader() {
  return `<div class="fc-session-top">
    <button class="clickable-icon" data-quit title="End session">${icon('x')}</button>
    <div class="fc-progress"><div></div></div>
    <div class="fc-combo"><span class="fc-combo-n">0</span><span>combo</span></div>
    <div class="fc-mini-spec"><canvas></canvas></div>
  </div>`;
}
function floatXP(x, msg, cls = '') {
  const card = $('.fc-stage-area', root); if (!card) return;
  const f = h(`<div class="fc-float ${cls}">${esc(msg)}</div>`); card.appendChild(f); setTimeout(() => f.remove(), 1100);
}
function award(base, ok) {
  const mult = 1 + Math.min(sess.combo, 20) * 0.05 + Math.min(streak(), 10) * 0.02;
  const gain = Math.round(base * (ok ? mult : 1));
  const before = levelOf(S.xp);
  S.xp += gain; sess.xp += gain; dayRec().xp += gain;
  const after = levelOf(S.xp);
  if (after.L > before.L) { sess.levels.push(after.L); sess.spec && sess.spec.react('level'); B.toast(`Level ${after.L}`); }
  return gain;
}
let sess = null;
function startSession(scope) {
  const queue = buildQueue(scope);
  if (!queue.length) { B.toast('Nothing due here right now'); return; }
  stopSpecs();
  const lv = levelOf(S.xp);
  sess = { scope, queue, total: queue.length, done: 0, right: 0, combo: 0, xp: 0, levels: [], startStage: stageOf(lv.L), startedAt: Date.now(), seen: new Set() };
  root.onclick = null;
  root.innerHTML = `<div class="fc-session">${sessionHeader()}<div class="fc-stage-area"></div><div class="fc-controls"></div></div>`;
  sess.spec = mountSpec($('.fc-mini-spec canvas', root), { stage: stageOf(lv.L) });
  $('[data-quit]', root).onclick = finishSession;
  nextCard();
}
function updateTop() {
  $('.fc-progress div', root).style.width = (sess.done / Math.max(1, sess.done + sess.queue.length) * 100) + '%';
  const cb = $('.fc-combo', root); $('.fc-combo-n', cb).textContent = sess.combo; cb.classList.toggle('is-hot', sess.combo >= 5);
}
function nextCard() {
  updateTop();
  if (!sess.queue.length) return finishSession();
  const id = sess.queue[0], card = D.byId.get(id); if (!card) { sess.queue.shift(); return nextCard(); }
  const deck = D.deckById.get(card.deck) || { name: '', subject: '' };
  const fresh = isNew(id);
  const area = $('.fc-stage-area', root), ctr = $('.fc-controls', root);
  const meta = `<div class="fc-card-meta"><span>${esc(deck.subject)} › ${esc(deck.name)}</span>${fresh ? '<span class="fc-tag-new">New</span>' : ''}</div>`;
  const source = `<a class="fc-source" data-note="${esc(card.note)}">${icon('file')} ${esc(B.titleOf(card.note))}</a>`;
  if (card.type === 'mcq') {
    const letters = 'ABCDEFGH';
    area.innerHTML = `<div class="fc-card is-mcq">${meta}<div class="fc-front">${card.front}</div><div class="fc-options">${card.options.map((o, i) => `<button class="fc-opt" data-o="${i}"><b>${letters[i]}</b><span>${o}</span></button>`).join('')}</div><div class="fc-back fc-mcq-back" hidden>${card.back || ''}${source}</div></div>`;
    ctr.innerHTML = `<div class="fc-hint">Pick an answer · keys 1–${card.options.length}</div>`;
    const choose = i => {
      if (area.dataset.answered) return; area.dataset.answered = '1';
      const ok = i === card.answer;
      $$('.fc-opt', area).forEach((b, k) => { b.disabled = true; b.classList.toggle('is-right', k === card.answer); b.classList.toggle('is-wrong', k === i && !ok); });
      $('.fc-mcq-back', area).hidden = false;
      grade(id, ok ? 2 : 0, fresh);
      ctr.innerHTML = `<button class="fc-continue mod-cta">Continue <kbd>Space</kbd></button>`;
      $('.fc-continue', ctr).onclick = advance;
      keyHandler = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance(); } };
    };
    area.onclick = e => { const b = e.target.closest('.fc-opt'); if (b) choose(+b.dataset.o); clickSource(e); };
    keyHandler = e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= card.options.length) choose(n - 1); };
  } else {
    const front = card.type === 'term' ? `<div class="fc-term">${card.front}</div><div class="fc-prompt">Define this term</div>` : `<div class="fc-front">${card.front}</div>`;
    area.innerHTML = `<div class="fc-card fc-flip"><div class="fc-face fc-face-front">${meta}${front}<div class="fc-tap">Tap to reveal</div></div><div class="fc-face fc-face-back">${meta}${card.type === 'term' ? `<div class="fc-term small">${card.front}</div>` : `<div class="fc-front small">${card.front}</div>`}<div class="fc-back">${card.back}</div>${source}</div></div>`;
    const flipEl = $('.fc-flip', area);
    const reveal = () => {
      if (flipEl.classList.contains('is-flipped')) return;
      flipEl.classList.add('is-flipped');
      const labels = ['Again', 'Hard', 'Good', 'Easy'];
      ctr.innerHTML = `<div class="fc-grades">${labels.map((l, g) => `<button class="fc-grade g${g}" data-g="${g}"><b>${l}</b><span>${preview(id, g)}</span><kbd>${g + 1}</kbd></button>`).join('')}</div>`;
      ctr.onclick = e => { const b = e.target.closest('[data-g]'); if (b) { grade(id, +b.dataset.g, fresh); advance(); } };
      keyHandler = e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 4) { grade(id, n - 1, fresh); advance(); } };
    };
    flipEl.onclick = e => { if (clickSource(e)) return; reveal(); };
    ctr.innerHTML = `<button class="fc-continue mod-cta">Show answer <kbd>Space</kbd></button>`; ctr.onclick = null;
    $('.fc-continue', ctr).onclick = reveal;
    keyHandler = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); reveal(); } };
  }
}
function clickSource(e) {
  const s = e.target.closest('.fc-source, a.internal-link');
  if (!s) return false;
  e.preventDefault(); e.stopPropagation();
  B.go(s.dataset.note, null, true);
  return true;
}
function grade(id, g, fresh) {
  const ok = g >= 2;
  S.cards[id] = schedule(S.cards[id], g);
  const d = dayRec(); d.n++; if (ok) d.ok++; if (fresh && !sess.seen.has(id)) d.fresh++;
  sess.seen.add(id);
  sess.done++; if (ok) sess.right++;
  if (g === 0) sess.combo = 0; else if (g >= 2) sess.combo++;
  S.best.combo = Math.max(S.best.combo, sess.combo);
  const gain = award(GRADE_XP[g] + (fresh ? 4 : 0), ok);
  floatXP(0, `+${gain} XP`, ok ? 'ok' : 'bad');
  sess.spec && sess.spec.react(ok ? 'good' : g === 0 ? 'bad' : null);
  const c = S.cards[id];
  sess.queue.shift();
  if (c.step >= 0) sess.queue.splice(Math.min(sess.queue.length, 3 + c.step * 4), 0, id);   // learning: see it again soon
  save();
}
function advance() { keyHandler = null; nextCard(); }
function finishSession() {
  keyHandler = null;
  if (!sess) return dashboard();
  const s = sess; sess = null;
  stopSpecs();
  const lv = levelOf(S.xp), st = stageOf(lv.L);
  const evolved = st > s.startStage;
  const badges = checkBadges();
  const acc = s.done ? Math.round(s.right / s.done * 100) : 0;
  root.innerHTML = `<div class="fc-summary">
    <div class="fc-sum-spec${evolved ? ' is-evolving' : ''}"><canvas></canvas></div>
    ${evolved ? `<div class="fc-evolved">${icon('sparkles')} Evolved into a ${esc(STAGES[st].name)}</div>` : ''}
    <h2>${s.done ? 'Session complete' : 'Session ended'}</h2>
    <div class="fc-sum-grid"><div><b>${s.done}</b><span>reviews</span></div><div><b>${acc}%</b><span>correct</span></div><div><b>+${s.xp}</b><span>XP</span></div><div><b>${Math.round((Date.now() - s.startedAt) / 60000)}m</b><span>time</span></div></div>
    <div class="fc-level"><span class="fc-lv">Level ${lv.L}</span><div class="fc-xpbar"><div style="width:${(lv.into / lv.need * 100).toFixed(1)}%"></div></div><span class="fc-xpnum">${lv.into} / ${lv.need}</span></div>
    ${badges.length ? `<div class="fc-sum-badges">${badges.map(b => `<span>${icon('trophy')} ${esc(b.name)}</span>`).join('')}</div>` : ''}
    <div class="fc-sum-actions"><button class="mod-cta" data-again>Keep going</button><button data-home>Back to decks</button></div>
  </div>`;
  const spec = mountSpec($('.fc-sum-spec canvas', root), { stage: evolved ? s.startStage : st });
  if (evolved) setTimeout(() => { spec.stage(st); spec.react('level'); }, 900);
  else if (s.levels.length) spec.react('level');
  root.onclick = e => { if (e.target.closest('[data-again]')) startSession(s.scope); else if (e.target.closest('[data-home]')) dashboard(); };
}

/* ---------------------------------------------------------------- sprint */
let sprintTimer = null;
function sprintPool() {
  const terms = D.cards.filter(c => c.type === 'term');
  const mcqs = D.cards.filter(c => c.type === 'mcq');
  return { terms, mcqs };
}
function sprintQuestion(pool) {
  const strip = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (pool.mcqs.length && Math.random() < 0.15) { const c = pool.mcqs[Math.floor(Math.random() * pool.mcqs.length)]; return { prompt: c.front, options: c.options, answer: c.answer, kind: 'mcq' }; }
  const c = pool.terms[Math.floor(Math.random() * pool.terms.length)];
  const subj = (D.deckById.get(c.deck) || {}).subject;
  const same = pool.terms.filter(x => x !== c && (D.deckById.get(x.deck) || {}).subject === subj);
  const others = (same.length >= 3 ? same : pool.terms.filter(x => x !== c)).slice();
  const picks = [];
  while (picks.length < 3 && others.length) picks.push(others.splice(Math.floor(Math.random() * others.length), 1)[0]);
  const opts = [c, ...picks].sort(() => Math.random() - 0.5);
  let def = strip(c.back);
  const name = strip(c.front);
  def = def.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '▢▢▢');
  return { prompt: `<div class="fc-sprint-def">${esc(def.length > 260 ? def.slice(0, 257) + '…' : def)}</div>`, options: opts.map(o => o.front), answer: opts.indexOf(c), kind: 'term' };
}
function startSprint() {
  stopSpecs();
  const pool = sprintPool();
  if (pool.terms.length < 4) { B.toast('Not enough key terms for a sprint'); return; }
  const lv = levelOf(S.xp);
  sess = null;
  root.onclick = null;
  const sp = { score: 0, wrong: 0, combo: 0, xp: 0, end: Date.now() + 60000, startLevel: lv.L };
  root.innerHTML = `<div class="fc-session is-sprint">
    <div class="fc-session-top"><button class="clickable-icon" data-quit title="Stop">${icon('x')}</button><div class="fc-timer"><div></div></div><div class="fc-sprint-score"><b>0</b><span>score</span></div><div class="fc-mini-spec"><canvas></canvas></div></div>
    <div class="fc-stage-area"></div><div class="fc-controls"><div class="fc-hint">Keys 1–4 · a wrong answer costs 2 seconds</div></div></div>`;
  const spec = mountSpec($('.fc-mini-spec canvas', root), { stage: stageOf(lv.L) });
  const area = $('.fc-stage-area', root);
  let q = null, locked = false;
  const show = () => {
    q = sprintQuestion(pool); locked = false;
    area.innerHTML = `<div class="fc-card is-mcq is-sprint">${q.kind === 'term' ? '<div class="fc-card-meta"><span>Name the term</span></div>' : '<div class="fc-card-meta"><span>Multiple choice</span></div>'}<div class="fc-front">${q.prompt}</div><div class="fc-options">${q.options.map((o, i) => `<button class="fc-opt" data-o="${i}"><b>${i + 1}</b><span>${o}</span></button>`).join('')}</div></div>`;
  };
  const pick = i => {
    if (locked || !q) return; locked = true;
    const ok = i === q.answer;
    $$('.fc-opt', area).forEach((b, k) => { b.classList.toggle('is-right', k === q.answer); b.classList.toggle('is-wrong', k === i && !ok); });
    if (ok) { sp.score++; sp.combo++; const g = Math.round(4 * (1 + Math.min(sp.combo, 20) * 0.05)); sp.xp += g; floatXP(0, `+${g}`, 'ok'); spec.react('good'); }
    else { sp.wrong++; sp.combo = 0; spec.react('bad'); sp.end -= 2000; floatXP(0, '−2s', 'bad'); }
    $('.fc-sprint-score b', root).textContent = sp.score;
    setTimeout(show, ok ? 260 : 650);
  };
  area.onclick = e => { const b = e.target.closest('.fc-opt'); if (b) pick(+b.dataset.o); };
  keyHandler = e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 4) pick(n - 1); };
  const stop = () => {
    clearInterval(sprintTimer); sprintTimer = null; keyHandler = null;
    const best = sp.score > S.best.sprint; S.best.sprint = Math.max(S.best.sprint, sp.score);
    const before = levelOf(S.xp).L; S.xp += sp.xp; dayRec().xp += sp.xp; save();
    const after = levelOf(S.xp).L;
    const badges = checkBadges();
    stopSpecs();
    root.innerHTML = `<div class="fc-summary"><div class="fc-sum-spec"><canvas></canvas></div><h2>${best && sp.score ? 'New best' : 'Time'}</h2>
      <div class="fc-sum-grid"><div><b>${sp.score}</b><span>correct</span></div><div><b>${sp.wrong}</b><span>missed</span></div><div><b>+${sp.xp}</b><span>XP</span></div><div><b>${S.best.sprint}</b><span>best</span></div></div>
      ${after > before ? `<div class="fc-evolved">${icon('sparkles')} Level ${after}</div>` : ''}
      ${badges.length ? `<div class="fc-sum-badges">${badges.map(b => `<span>${icon('trophy')} ${esc(b.name)}</span>`).join('')}</div>` : ''}
      <div class="fc-sum-actions"><button class="mod-cta" data-again>Again</button><button data-home>Back to decks</button></div></div>`;
    const s2 = mountSpec($('.fc-sum-spec canvas', root), { stage: stageOf(after) }); if (after > before) s2.react('level');
    root.onclick = e => { if (e.target.closest('[data-again]')) startSprint(); else if (e.target.closest('[data-home]')) dashboard(); };
  };
  $('[data-quit]', root).onclick = stop;
  sprintTimer = setInterval(() => {
    if (!root || !root.isConnected) { clearInterval(sprintTimer); return; }
    const left = sp.end - Date.now();
    $('.fc-timer div', root).style.width = clamp(left / 60000 * 100, 0, 100) + '%';
    $('.fc-timer', root).classList.toggle('is-low', left < 10000);
    if (left <= 0) stop();
  }, 100);
  show();
}
})();
