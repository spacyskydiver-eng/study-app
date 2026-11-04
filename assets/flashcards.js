/* Flashcards: spaced repetition over every question and key term in the vault, with XP, levels,
   streaks, badges, a 60-second sprint, and a specimen that evolves as you level up.
   Cards come from data/cards.json (built by tools/build_site.py). Progress is kept in this browser
   and, once signed in, merged with a copy on the server so it follows to other devices. */
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
function blank() { return { v: 1, xp: 0, name: '', cards: {}, days: {}, best: { sprint: 0, combo: 0 }, badges: {}, optional: {}, optionalAt: {}, habits: {}, undone: {}, plansGone: {}, newPerDay: 20, goal: 40, plans: [], created: Date.now() }; }
function load() { const s = store.get(KEY, null); return s && s.v === 1 ? Object.assign(blank(), s) : blank(); }
function save() { store.set(KEY, S); dirty = true; schedulePush(); }
const today = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dayRec = () => (S.days[today()] = S.days[today()] || { n: 0, xp: 0, ok: 0, fresh: 0 });

/* ---------------------------------------------------------------- sign-in and sync
   Signed in, progress is merged with a server copy (never overwritten either way) and every save is
   pushed. Offline pushes fail quietly and the next save tries again. Signing out keeps local progress. */
const account = { user: store.get('fcUser', null), lastSync: 0, base: null };   // base: the server copy last merged with
let dirty = false, pushTimer = null, syncing = null;
const maxFields = (a = {}, b = {}) => { const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = Math.max(a[k] || 0, b[k] || 0); return o; };
const PLAN_EDITS = ['name', 'decks', 'prio', 'terms', 'due', 'edited'];
function mergeProgress(local, remote) {
  const out = Object.assign({}, local);
  out.undone = maxFields(local.undone, remote.undone);
  out.cards = {};
  for (const id of new Set([...Object.keys(local.cards), ...Object.keys(remote.cards)])) {
    const l = local.cards[id], r = remote.cards[id];
    const c = !l ? r : !r ? l : l.reps !== r.reps ? (l.reps > r.reps ? l : r) : (r.due > l.due ? r : l);
    if (!(c.reps <= (out.undone[id] || 0))) out.cards[id] = c;    // an undone first rating stays undone
  }
  out.days = {};
  for (const d of new Set([...Object.keys(local.days), ...Object.keys(remote.days)])) out.days[d] = maxFields(local.days[d], remote.days[d]);
  out.xp = Math.max(local.xp || 0, remote.xp || 0);
  out.best = maxFields(local.best, remote.best);
  out.badges = Object.assign({}, remote.badges, local.badges);
  // plans: local objects are kept (an open plan session holds a reference); their logs take the max per day
  const localIds = new Set(local.plans.map(p => p.id));
  for (const p of local.plans) {
    const r = remote.plans.find(x => x.id === p.id);
    if (!r) continue;
    for (const d of new Set([...Object.keys(p.log || {}), ...Object.keys(r.log || {})])) (p.log = p.log || {})[d] = maxFields(p.log[d], (r.log || {})[d]);
    if ((r.edited || 0) > (p.edited || 0)) for (const k of PLAN_EDITS) { if (k in r) p[k] = r[k]; else delete p[k]; }    // the latest edit wins
  }
  out.plansGone = maxFields(local.plansGone, remote.plansGone);
  out.plans = local.plans.concat(remote.plans.filter(p => !localIds.has(p.id))).filter(p => !out.plansGone[p.id]);
  // optional: the newest change to a card wins; cards with no time yet (older data) stay optional
  out.optional = {}; out.optionalAt = maxFields(local.optionalAt, remote.optionalAt);
  for (const id of new Set([...Object.keys(local.optional), ...Object.keys(remote.optional), ...Object.keys(out.optionalAt)])) {
    const lt = (local.optionalAt || {})[id] || 0, rt = (remote.optionalAt || {})[id] || 0;
    if (lt === rt ? local.optional[id] || remote.optional[id] : (lt > rt ? local : remote).optional[id]) out.optional[id] = true;
  }
  // habits: each tick is a time, negative once cleared, so the newest change wins either way
  out.habits = {};
  for (const h of new Set([...Object.keys(local.habits), ...Object.keys(remote.habits)])) {
    const a = local.habits[h] || {}, b = remote.habits[h] || {}, o = out.habits[h] = {};
    for (const d of new Set([...Object.keys(a), ...Object.keys(b)])) o[d] = Math.abs(b[d] || 0) > Math.abs(a[d] || 0) ? b[d] : a[d];
  }
  return out;   // newPerDay, goal, name, created come from local
}
async function api(path, opts = {}) {
  const res = await fetch(path, Object.assign({ credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } }, opts));
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data, gate: res.headers.get('X-Site-Gate') === 'pin' };
}
// fetch the server copy, merge it in, save locally, upload the result
function sync() {
  if (!account.user) return Promise.resolve();
  if (syncing) return syncing;
  syncing = (async () => {
    try {
      for (let tries = 0; tries < 3; tries++) {     // 409: another device saved in between, so merge that too
        const got = await api('/api/fc/progress');
        if (got.gate) { dirty = true; return; }     // the PIN has run out; the flashcard sign-in is still good
        if (got.status === 401) { account.user = null; store.set('fcUser', null); refreshAccountBar(); return; }
        if (!got.ok) { dirty = true; return; }
        let remote = null;
        try { remote = got.data.data ? JSON.parse(got.data.data) : null; } catch (e) { remote = null; }
        if (remote && remote.v === 1) { S = mergeProgress(S, Object.assign(blank(), remote)); store.set(KEY, S); }
        account.base = got.data.updated || 0;
        dirty = false;
        const put = await api('/api/fc/progress', { method: 'PUT', body: JSON.stringify({ data: JSON.stringify(S), base: account.base }) });
        if (put.status === 409) { dirty = true; continue; }
        if (put.ok) { account.base = put.data.updated; account.lastSync = put.data.updated || Date.now(); refreshAccountBar(); }
        else dirty = true;
        return;
      }
    } catch (e) { dirty = true; refreshAccountBar(); }   // offline: keep working locally
    finally { syncing = null; }
  })();
  return syncing;
}
function schedulePush() {
  if (!account.user) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(sync, 2000);
}
// the page is going away: no time to merge, so send what's here (only if it changed), marked with the
// server copy it was merged with. If the server has moved on it refuses, and the next sync merges.
// keepalive bodies are capped at 64 KB; bigger ones go as a plain request that may be cut off,
// which loses nothing (local progress stays, the next load merges)
function pushNow() {
  if (!account.user || !dirty || account.base == null) return;
  clearTimeout(pushTimer);
  const body = JSON.stringify({ data: JSON.stringify(S), base: account.base });
  fetch('/api/fc/progress', { method: 'PUT', credentials: 'same-origin', keepalive: body.length < 63000, headers: { 'Content-Type': 'application/json' }, body })
    .then(r => (r.ok ? r.json() : null)).then(d => { if (d && d.updated) { account.base = d.updated; dirty = false; } }).catch(() => {});
}
window.addEventListener('pagehide', pushNow);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') pushNow(); else if (account.user) sync(); });
window.addEventListener('online', () => sync());

const hhmm = t => new Date(t).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
function accountBarHtml() {
  if (account.user) return `<div class="fc-account is-in"><span>Signed in as ${esc(account.user)}${dirty && !navigator.onLine ? ' · offline, saved on this device' : account.lastSync ? ` · synced ${hhmm(account.lastSync)}` : ' · syncing…'}</span><button class="fc-mini" data-signout>Sign out</button></div>`;
  return `<form class="fc-account" data-signin><span>Sign in to sync</span><input class="fc-account-input" name="username" placeholder="Username" autocomplete="username"><input class="fc-account-input" name="password" type="password" placeholder="Password" autocomplete="current-password"><button class="fc-mini mod-cta" type="submit">Sign in</button><span class="fc-account-err"></span></form>`;
}
function refreshAccountBar() {
  const bar = root && $('.fc-account', root);
  if (!bar) return;
  bar.outerHTML = accountBarHtml();
  wireAccountBar();
}
function wireAccountBar() {
  const form = $('[data-signin]', root);
  if (form) form.onsubmit = async e => {
    e.preventDefault();
    const err = $('.fc-account-err', form), btn = $('button', form);
    const username = form.username.value.trim(), password = form.password.value;
    if (!username || !password) { err.textContent = 'Enter a username and password.'; return; }
    btn.disabled = true; err.textContent = '';
    try {
      const r = await api('/api/fc/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      if (!r.ok) { err.textContent = r.data.error || 'Sign-in failed.'; return; }
      account.user = r.data.user || username; account.lastSync = 0; store.set('fcUser', account.user);
      refreshAccountBar();
      await sync();
      if (root && $('.fc-account', root)) dashboard();
    } catch (ex) { err.textContent = 'Could not reach the server.'; }
    finally { if (btn.isConnected) btn.disabled = false; }
  };
  const out = $('[data-signout]', root);
  if (out) out.onclick = async () => {
    if (dirty) await sync();
    await api('/api/fc/logout', { method: 'POST' }).catch(() => {});
    clearTimeout(pushTimer);
    account.user = null; account.lastSync = 0; store.set('fcUser', null);
    refreshAccountBar();
  };
}

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
  { at: 1, name: 'Protocell' },
  { at: 3, name: 'Bacterium' },
  { at: 6, name: 'Eukaryote' },
  { at: 10, name: 'Colony' },
  { at: 15, name: 'Organoid' },
  { at: 21, name: 'Medusa' },
  { at: 28, name: 'Siphonophore' },
  { at: 33, name: 'Comb Jelly' },
  { at: 38, name: 'Sea Star' },
  { at: 43, name: 'Trilobite' },
  { at: 48, name: 'Nautilus' },
  { at: 54, name: 'Octopus' },
  { at: 60, name: 'Dragonfly' },
  { at: 66, name: 'Butterfly' },
  { at: 72, name: 'Anglerfish' },
  { at: 78, name: 'Manta Ray' },
  { at: 84, name: 'Seahorse' },
  { at: 90, name: 'Axolotl' },
  { at: 96, name: 'Sea Turtle' },
  { at: 102, name: 'Archaeopteryx' },
  { at: 108, name: 'Hummingbird' },
  { at: 114, name: 'Humpback Whale' },
  { at: 120, name: 'Neuron' },
  { at: 127, name: 'Cortex' },
  { at: 134, name: 'Coral Reef' },
  { at: 142, name: 'Tree of Life' },
  { at: 150, name: 'Biosphere' },
];
const stageOf = L => { let i = 0; STAGES.forEach((s, k) => { if (L >= s.at) i = k; }); return i; };
const aStage = name => (/^(?!Eu)[AEIOU]/.test(name) ? 'an ' : 'a ') + name;

/* ---------------------------------------------------------------- scheduling */
function cs(id) { return S.cards[id]; }
function isNew(id) { return !S.cards[id]; }
function isDue(id, now = Date.now()) { const c = S.cards[id]; return c && c.due <= now; }
const mastered = id => { const c = S.cards[id]; return c && c.step < 0 && c.ivl >= 21; };
const isOptional = id => !!S.optional[id];
function setOptional(id, v) { if (v) S.optional[id] = true; else delete S.optional[id]; S.optionalAt[id] = Date.now(); save(); }
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
  { id: 'seenall', name: 'Full survey', desc: 'See every card once', test: () => D && D.cards.filter(c => !S.optional[c.id]).every(c => S.cards[c.id]) },
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
const deckCards = deckId => D.cards.filter(c => c.deck === deckId && !S.optional[c.id]).map(c => c.id);
function scopeCards(scope) {
  if (!scope || scope === 'all') return D.cards.filter(c => !S.optional[c.id]).map(c => c.id);
  if (scope === 'optional') return D.cards.filter(c => S.optional[c.id]).map(c => c.id);
  if (scope.startsWith('plan:') || scope.startsWith('cram:')) { const p = S.plans.find(x => x.id === scope.slice(5)); return p ? planCardIds(p) : []; }
  if (scope.startsWith('note:')) { const n = scope.slice(5); return D.cards.filter(c => c.note === n && !S.optional[c.id]).map(c => c.id); }
  if (scope.startsWith('subject:')) { const s = scope.slice(8); return D.cards.filter(c => (D.deckById.get(c.deck) || {}).subject === s && !S.optional[c.id]).map(c => c.id); }
  return deckCards(scope);
}
function counts(ids) {
  const now = Date.now(); let due = 0, fresh = 0, mast = 0;
  for (const id of ids) { if (isNew(id)) fresh++; else if (isDue(id, now)) due++; if (mastered(id)) mast++; }
  return { due, fresh, mast, total: ids.length };
}
const newLeftToday = () => Math.max(0, S.newPerDay - (dayRec().fresh || 0));

/* ---------------------------------------------------------------- exam plans
   A plan is a saved set of decks with a deadline. It only stores which cards it covers and a daily log;
   all card progress, XP and levels live in S.cards / S.xp as usual, so deleting a plan loses nothing. */
let termLinks = null;
function termNotesLinkedFrom() {      // key-term note -> notes that link to it
  if (termLinks) return termLinks;
  termLinks = new Map();
  const termNotes = new Set(D.cards.filter(c => c.type === 'term').map(c => c.note));
  for (const [nid, n] of Object.entries(B.V.notes)) for (const l of n.links || []) if (termNotes.has(l)) {
    if (!termLinks.has(l)) termLinks.set(l, []);
    termLinks.get(l).push(nid);
  }
  return termLinks;
}
const folderOf = p => p ? p.slice(0, p.lastIndexOf('/') + 1) : '';
const deckOrder = (a, b) => B.collator.compare((a.hub || '~' + a.name), (b.hub || '~' + b.name));
function planCardIds(p) {             // in study order: each deck's cards, then the key terms its notes link to
  const out = [], seen = new Set(), tl = p.terms ? termNotesLinkedFrom() : null;
  out.owner = new Map();
  const terms = p.terms ? D.cards.filter(c => c.type === 'term') : [];
  for (const did of p.decks) {
    const d = D.deckById.get(did); if (!d) continue;
    for (const c of D.cards) if (c.deck === did && !S.optional[c.id] && !seen.has(c.id)) { seen.add(c.id); out.push(c.id); out.owner.set(c.id, did); }
    if (tl && d.hub) {
      const f = folderOf(d.hub);
      for (const c of terms) if (!seen.has(c.id) && !S.optional[c.id] && (tl.get(c.note) || []).some(n => n.startsWith(f))) { seen.add(c.id); out.push(c.id); out.owner.set(c.id, did); }
    }
  }
  return out;
}
const dayStart = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const addDays = (t, n) => { const d = new Date(t); d.setDate(d.getDate() + n); return d.getTime(); };
const daysBetween = (a, b) => Math.round((dayStart(b) - dayStart(a)) / DAY);
const fmtDate = t => new Date(t).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const fmtDateTime = t => new Date(t).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
function fmtLeft(ms) {
  if (ms <= 0) return 'deadline passed';
  const m = Math.floor(ms / MIN), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  return d ? `${d}d ${h}h left` : h ? `${h}h ${mm}m left` : `${mm}m left`;
}
const toLocalInput = t => { const d = new Date(t - new Date(t).getTimezoneOffset() * MIN); return d.toISOString().slice(0, 16); };
const plog = (p, day = today()) => (p.log[day] = p.log[day] || { n: 0, fresh: 0 });

function planStats(p, now = Date.now()) {
  const ids = planCardIds(p);
  let fresh = 0, learning = 0, learned = 0, due = 0, mast = 0;
  for (const id of ids) {
    const c = S.cards[id];
    if (!c) { fresh++; continue; }
    if (c.step >= 0) learning++; else learned++;
    if (c.due <= now) due++;
    if (mastered(id)) mast++;
  }
  const total = ids.length, msLeft = p.due - now;
  // days you can still study: today up to the day before the deadline, plus the deadline day itself if it is after 3pm
  const lastDay = new Date(p.due).getHours() >= 15 ? dayStart(p.due) : addDays(dayStart(p.due), -1);
  const usable = Math.max(0, daysBetween(now, lastDay) + 1);
  const span = Math.max(1, daysBetween(p.created, lastDay) + 1);
  const buffer = span >= 4 ? 1 : 0;                      // keep the last day for review only
  const newDays = Math.max(0, usable - buffer);
  const doneToday = (p.log[today()] || {}).fresh || 0;
  const freshAtStart = fresh + doneToday;
  const target = freshAtStart ? Math.ceil(freshAtStart / Math.max(1, newDays)) : 0;
  const todayLeft = Math.max(0, Math.min(fresh, target - doneToday));
  // pace: new cards a day on the plan's completed days
  const elapsed = Math.max(0, daysBetween(p.created, now));
  let pastFresh = 0; for (const [day, r] of Object.entries(p.log)) if (day !== today()) pastFresh += r.fresh || 0;
  const pace = elapsed ? pastFresh / elapsed : null;
  let status, verdict;
  if (!fresh && !learning) { status = 'done'; verdict = `All ${total} cards learned. Keep reviewing what comes due until the exam.`; }
  else if (msLeft <= 0) { status = 'over'; verdict = `Deadline passed with ${learned} of ${total} cards learned.`; }
  else if (!usable) { status = 'behind'; verdict = `No study days left before the deadline and ${fresh + learning} cards still to learn.`; }
  else if (pace != null && fresh > 0 && pace * Math.max(1, newDays) < fresh - doneToday) {
    status = 'behind';
    const shortBy = Math.round(fresh - doneToday - pace * Math.max(1, newDays));
    verdict = `Not on course. At your pace so far (about ${Math.round(pace)} new a day) about ${shortBy} cards would still be unseen at the deadline. Do ${target} new cards a day to finish.`;
  } else if (!todayLeft) { status = 'ontrack'; verdict = fresh ? `On course. Today's ${target} new cards are done${due ? `; ${due} reviews are due` : ''}.` : `On course. Every card has been seen; finish the ${learning} still in learning.`; }
  else { status = 'today'; verdict = `On course if you learn ${todayLeft} more new card${todayLeft > 1 ? 's' : ''} today (${target} a day until ${fmtDate(addDays(lastDay, -buffer))}).`; }
  return { ids, total, fresh, learning, learned, due, mast, msLeft, usable, newDays, buffer, lastDay, target, todayLeft, doneToday, pace, status, verdict };
}

/* priorities: each section of a plan is high, normal or low. Only how often its cards are picked changes:
   of every 9 cards about 6 are high, 2 normal and 1 low, so low never disappears. A tier with nothing
   left drops out of the turn-taking, which is what returns a plan to its normal mix when the high
   sections are finished. Nothing here touches a card's own progress. */
const PRIO_WEIGHT = { high: 6, normal: 2, low: 1 };
const prioOf = (p, deckId) => (p.prio && p.prio[deckId]) || 'normal';
function tierMix(lists) {
  const tiers = Object.keys(PRIO_WEIGHT).map(k => ({ w: PRIO_WEIGHT[k], left: (lists[k] || []).slice(), credit: 0 }));
  const out = [];
  for (;;) {
    const live = tiers.filter(t => t.left.length);
    if (!live.length) return out;
    const sum = live.reduce((s, t) => s + t.w, 0);
    live.forEach(t => { t.credit += t.w; });
    const t = live.reduce((a, b) => (b.credit > a.credit ? b : a));
    t.credit -= sum; out.push(t.left.shift());
  }
}
function byTier(p, ids, owner) {
  const out = { high: [], normal: [], low: [] };
  for (const id of ids) out[prioOf(p, owner.get(id))].push(id);
  return out;
}
const planFresh = (p, st) => tierMix(byTier(p, st.ids.filter(isNew), st.ids.owner));
const reviewsAndNew = (due, fresh) => {      // one new card every three reviews
  const q = []; let i = 0, j = 0;
  while (i < due.length || j < fresh.length) { for (let k = 0; k < 3 && i < due.length; k++) q.push(due[i++]); if (j < fresh.length) q.push(fresh[j++]); }
  return q;
};

/* skipping: a skip is remembered on this device for today and nowhere else, never in S, so it can't
   touch scheduling or progress. It only keeps a restarted session from opening on the same cards. */
const SKIP_KEY = 'fcSkips';
const skipsToday = () => { const s = store.get(SKIP_KEY, null); return s && s.day === today() ? s.ids : []; };
function rememberSkip(id) { const ids = skipsToday(); if (!ids.includes(id)) { ids.push(id); store.set(SKIP_KEY, { day: today(), ids }); } }
const skippedLast = ids => { const s = new Set(skipsToday()); return s.size ? ids.filter(x => !s.has(x)).concat(ids.filter(x => s.has(x))) : ids; };

/* study this first: what is chosen lives on this device, apart from S, so choosing can't change progress
   or a plan. The chosen cards go in front of the usual queue with no daily limit; the rest follows as normal. */
const FOCUS_KEY = 'fcFocus';
const focusNow = () => store.get(FOCUS_KEY, null);
function focusIds(f) {
  const p = f.plan ? S.plans.find(x => x.id === f.plan) : null;
  if (f.plan && !p) return [];
  const ids = p ? planCardIds(p) : scopeCards('all'), owner = p ? ids.owner : null;
  return ids.filter(id => {
    const c = D.byId.get(id); if (!c) return false;
    const deck = (owner && owner.get(id)) || c.deck;
    return f.kind === 'note' ? c.note === f.id : f.kind === 'subject' ? (D.deckById.get(deck) || {}).subject === f.id : deck === f.id;
  });
}
const waiting = ids => { const now = Date.now(); return ids.filter(id => isNew(id) || isDue(id, now)); };
function focusBar(planId) {
  const f = focusNow();
  if (!f || (planId !== undefined && f.plan !== planId)) return '';
  const left = waiting(focusIds(f)).length;
  return `<div class="fc-focus-bar"><span>Studying first: <b>${esc(f.label)}</b> · ${left} left</span><button class="fc-mini" data-focus-clear>Back to normal plan</button></div>`;
}
function clearFocus() { store.set(FOCUS_KEY, null); }

function planSchedule(p, st) {         // day by day from today
  const rows = [];
  const freshIds = planFresh(p, st);
  let k = 0, left = st.fresh;
  for (let i = 0; i < st.usable; i++) {
    const day = dayStart(addDays(Date.now(), i));
    const isNewDay = i < st.newDays;
    let n = 0;
    if (isNewDay) n = i === 0 ? st.todayLeft : Math.ceil(left / Math.max(1, st.newDays - i));
    n = Math.min(n, left); left -= n;
    const slice = freshIds.slice(k, k + n); k += n;
    const decks = [...new Set(slice.map(id => st.ids.owner.get(id)))].map(id => D.deckById.get(id)).filter(Boolean);
    const dayEnd = day + DAY;
    const reviews = st.ids.filter(id => { const c = S.cards[id]; return c && c.due < dayEnd && (i === 0 || c.due >= day); }).length;
    rows.push({ day, n, decks, reviews, review: !isNewDay });
  }
  return rows;
}

function planQueue(p, cram) {
  const st = planStats(p), now = Date.now();
  if (cram) {                          // weakest learned cards first, ignoring due dates
    return st.ids.filter(id => S.cards[id]).sort((a, b) => {
      const x = S.cards[a], y = S.cards[b];
      return (y.lapses - x.lapses) || (x.ease - y.ease) || (x.ivl - y.ivl);
    }).slice(0, 40);
  }
  const owner = st.ids.owner;
  const due = skippedLast(st.ids.filter(id => !isNew(id) && S.cards[id].due <= now).sort((a, b) => S.cards[a].due - S.cards[b].due)).slice(0, 300);
  const pool = skippedLast(planFresh(p, st)), fresh = pool.slice(0, st.todayLeft);
  // each priority keeps its own reviews-and-new rhythm, then the priorities take turns
  const d = byTier(p, due, owner), f = byTier(p, fresh, owner), lists = {};
  for (const k of Object.keys(PRIO_WEIGHT)) lists[k] = reviewsAndNew(d[k], f[k]);
  const q = tierMix(lists);
  q.reserve = pool.slice(st.todayLeft);
  return q;
}

const planFocusLeft = p => { const f = focusNow(); return f && f.plan === p.id ? waiting(focusIds(f)).length : 0; };
const STATUS = { done: ['Goal met', 'ok'], over: ['Finished', 'dim'], behind: ['Behind', 'warn'], ontrack: ['On course', 'ok'], today: ['On course', 'ok'] };
function planCard(p) {
  const st = planStats(p);
  const [label, cls] = STATUS[st.status];
  const pctSeen = st.total ? (st.total - st.fresh) / st.total * 100 : 0, pctLearned = st.total ? st.learned / st.total * 100 : 0;
  return `<div class="fc-plan" data-plan="${esc(p.id)}">
    <div class="fc-plan-head"><div><div class="fc-plan-name">${esc(p.name)}</div><div class="fc-plan-sub">${fmtDateTime(p.due)} · <span data-countdown="${p.due}">${fmtLeft(st.msLeft)}</span></div></div><span class="fc-plan-status ${cls}">${label}</span></div>
    <div class="fc-deck-bar" title="${Math.round(pctSeen)}% seen, ${Math.round(pctLearned)}% learned"><i style="width:${pctSeen}%"></i><b style="width:${pctLearned}%"></b></div>
    <div class="fc-plan-nums"><span><b>${st.learned}</b> / ${st.total} learned</span><span><b>${st.todayLeft}</b> new left today</span><span><b>${st.due}</b> due</span></div>
    <div class="fc-plan-verdict">${esc(st.verdict)}</div>
    ${focusBar(p.id)}
    <div class="fc-plan-actions"><button class="fc-mini mod-cta" data-plan-study="${esc(p.id)}"${st.due + st.todayLeft + planFocusLeft(p) ? '' : ' disabled'}>${icon('play')} Study today's cards</button><button class="fc-mini" data-plan-open="${esc(p.id)}">${icon('list')} Plan</button></div>
  </div>`;
}

let examPapers = null;
function loadExams() {
  if (examPapers) return Promise.resolve(examPapers);
  return fetch('data/exams.json', { cache: 'no-cache' }).then(r => r.json()).then(x => (examPapers = x.subjects.flatMap(s => s.papers.map(p => Object.assign({ subject: s.subject }, p))))).catch(() => (examPapers = []));
}

function planView(p) {
  stopSpecs(); keyHandler = null;
  const st = planStats(p);
  const [label, cls] = STATUS[st.status];
  const rows = planSchedule(p, st);
  const decks = p.decks.map(id => D.deckById.get(id)).filter(Boolean);
  const hist = Object.entries(p.log).sort();
  root.innerHTML = `<div class="fc-view fc-planview">
    <div class="fc-plan-bar"><button class="fc-mini" data-home>${icon('arrow-left')} Flashcards</button></div>
    <div class="fc-plan-title"><h2>${esc(p.name)}</h2><span class="fc-plan-status ${cls}">${label}</span></div>
    <div class="fc-plan-when"><label>Deadline <input type="datetime-local" data-due value="${toLocalInput(p.due)}"></label><span data-countdown="${p.due}">${fmtLeft(st.msLeft)}</span></div>
    <div class="fc-plan-verdict big">${esc(st.verdict)}</div>
    ${focusBar(p.id)}
    <div class="fc-stats fc-plan-stats"><div><b>${st.total}</b><span>cards</span></div><div><b>${st.total - st.fresh}</b><span>seen</span></div><div><b>${st.learned}</b><span>learned</span></div><div><b>${st.mast}</b><span>mastered</span></div></div>
    <div class="fc-plan-actions"><button class="fc-big mod-cta" data-plan-study="${esc(p.id)}"${st.due + st.todayLeft + planFocusLeft(p) ? '' : ' disabled'}>${icon('play')}<span><b>Study today's cards</b><small>${st.todayLeft} new · ${st.due} due</small></span></button>
      <button class="fc-big" data-plan-cram="${esc(p.id)}"${st.total - st.fresh ? '' : ' disabled'}>${icon('zap')}<span><b>Extra practice</b><small>weakest cards you've seen</small></span></button>
      <button class="fc-big" data-choose>${icon('list')}<span><b>Choose what to study</b><small>any section or topic first</small></span></button>
      <button class="fc-big" data-plan-edit>${icon('pencil')}<span><b>Edit plan</b><small>sections and priorities</small></span></button></div>
    <div class="fc-section-title">Day by day</div>
    <div class="fc-plan-days">${rows.length ? rows.map((r, i) => `<div class="fc-plan-day${i === 0 ? ' is-today' : ''}${r.review ? ' is-review' : ''}">
      <div class="fc-plan-date">${i === 0 ? 'Today' : fmtDate(r.day)}</div>
      <div class="fc-plan-work">${r.review ? '<b>Review only</b>: due cards, Extra practice and the exam papers' : r.n ? `<b>${r.n} new</b> · ${esc(r.decks.map(d => d.name).join(', '))}` : (i === 0 && st.doneToday ? `<b>New cards done</b> (${st.doneToday} today)` : '<b>No new cards</b>')}${r.reviews ? `<span class="fc-plan-rev">${i === 0 ? '' : '~'}${r.reviews} review${r.reviews > 1 ? 's' : ''}</span>` : ''}</div></div>`).join('') : '<div class="fc-plan-day"><div class="fc-plan-work">No study days left before the deadline.</div></div>'}
      <div class="fc-plan-day is-exam"><div class="fc-plan-date">${fmtDate(p.due)}</div><div class="fc-plan-work"><b>Deadline</b> ${new Date(p.due).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div></div></div>
    <div class="fc-plan-papers"></div>
    <div class="fc-section-title">Covers</div>
    <div class="fc-plan-covers">${decks.map(d => { const c = counts(deckCards(d.id)), pr = prioOf(p, d.id); return `<span>${pr !== 'normal' ? `<i class="fc-prio-tag ${pr}">${pr === 'high' ? 'High' : 'Low'}</i> ` : ''}${esc(d.subject)} › ${esc(d.name)} <em>${c.total - c.fresh}/${c.total}</em></span>`; }).join('')}${p.terms ? '<span>Key terms linked from these notes</span>' : ''}</div>
    ${hist.length ? `<div class="fc-section-title">Done so far</div><div class="fc-plan-hist">${hist.map(([d, r]) => `<span><b>${fmtDate(new Date(d + 'T12:00').getTime())}</b> ${r.n} reviews, ${r.fresh} new</span>`).join('')}</div>` : ''}
    <section class="fc-footer"><span class="spacer"></span><button class="fc-mini fc-danger" data-plan-delete>Delete plan</button></section>
    <div class="fc-note">Deleting the plan keeps all your card progress, XP and evolution.</div>
  </div>`;
  loadExams().then(papers => {
    const hubs = new Set(decks.map(d => d.hub));
    const subj = new Set(decks.map(d => d.subject));
    const practical = decks.some(d => (d.hub || '').includes('/Practicals/'));
    const deckHubs = new Set(D.decks.map(d => d.hub));
    const list = papers.filter(x => hubs.has(x.hub) || (practical && subj.has(x.subject) && !deckHubs.has(x.hub)));
    const box = $('.fc-plan-papers', root);
    if (box && list.length) box.innerHTML = `<div class="fc-section-title">Exam practice for this plan</div><div class="fc-plan-covers">${list.map(x => `<a class="fc-paper" data-paper="exam/${esc(x.id)}">${icon('clipboard-list')} ${esc(x.lecture)}: ${esc(x.title)} <em>${x.marks} marks</em></a>`).join('')}</div>`;
  });
  tickPlans();
  root.onclick = e => {
    if (e.target.closest('[data-home]')) return dashboard();
    if (e.target.closest('[data-focus-clear]')) { clearFocus(); return planView(p); }
    if (e.target.closest('[data-choose]')) return focusPicker(p);
    if (e.target.closest('[data-plan-edit]')) return planEdit(p);
    const s = e.target.closest('[data-plan-study]'); if (s && !s.disabled) return startSession('plan:' + p.id);
    const c = e.target.closest('[data-plan-cram]'); if (c && !c.disabled) return startSession('cram:' + p.id);
    const pp = e.target.closest('[data-paper]'); if (pp) return B.go(pp.dataset.paper);
    const del = e.target.closest('[data-plan-delete]');
    if (del) {
      if (del.dataset.armed) { S.plans = S.plans.filter(x => x.id !== p.id); S.plansGone[p.id] = Date.now(); save(); B.toast('Plan deleted. Card progress kept.'); return dashboard(); }
      del.dataset.armed = '1'; del.textContent = 'Tap again to delete'; setTimeout(() => { if (del.isConnected) { delete del.dataset.armed; del.textContent = 'Delete plan'; } }, 3000);
    }
  };
  $('[data-due]', root).onchange = e => { const t = new Date(e.target.value).getTime(); if (t > Date.now()) { p.due = t; p.edited = Date.now(); save(); planView(p); } else B.toast('Pick a time in the future'); };
}

/* edit a plan: sections and priorities are the plan's own list. Cards and their progress are never
   touched here, so a section taken out and put back later carries on where it was. */
function planEdit(p) {
  stopSpecs(); keyHandler = null;
  const edited = () => { p.edited = Date.now(); save(); };
  const subjects = [...new Set(D.decks.filter(d => d.hub).map(d => d.subject))];
  let subject = (D.deckById.get(p.decks[0]) || {}).subject || subjects[0];
  const render = () => {
    const ids = planCardIds(p), now = Date.now(), per = new Map(p.decks.map(id => [id, { total: 0, fresh: 0, open: 0 }]));
    for (const id of ids) {
      const r = per.get(ids.owner.get(id)); if (!r) continue;
      r.total++; if (isNew(id)) r.fresh++;
      const c = S.cards[id]; if (!c || c.step >= 0 || c.due <= now) r.open++;
    }
    const addable = D.decks.filter(d => d.subject === subject && d.hub && !p.decks.includes(d.id)).sort(deckOrder);
    root.innerHTML = `<div class="fc-view fc-planedit">
      <div class="fc-plan-bar"><button class="fc-mini" data-back>${icon('arrow-left')} Plan</button></div>
      <h2>Edit plan</h2>
      <label class="fc-field"><span>Name</span><input data-name maxlength="60" value="${esc(p.name)}"></label>
      <div class="fc-section-title">Sections</div>
      <div class="fc-sec-list">${p.decks.map(id => {
        const d = D.deckById.get(id); if (!d) return '';
        const r = per.get(id), pr = prioOf(p, id);
        return `<div class="fc-sec"><div class="fc-sec-name"><b>${esc(d.name)}</b><span>${esc(d.subject)} · ${r.total - r.fresh}/${r.total} seen${r.total && !r.open ? ' · finished' : ''}</span></div>
          <div class="fc-sec-prio" role="group" aria-label="Priority">${['high', 'normal', 'low'].map(k => `<button data-prio="${k}" data-deck="${esc(id)}"${k === pr ? ' class="is-on"' : ''}>${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div>
          <button class="fc-mini fc-sec-remove" data-remove="${esc(id)}" aria-label="Remove ${esc(d.name)}">${icon('x')}</button></div>`;
      }).join('')}</div>
      <label class="fc-check"><input type="checkbox" data-terms${p.terms ? ' checked' : ''}> Include the key terms used in these lectures</label>
      <div class="fc-section-title">Add a section</div>
      <label class="fc-field"><span>Module</span><select data-subject>${subjects.map(s => `<option${s === subject ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
      <div class="fc-sec-list">${addable.map(d => { const c = counts(deckCards(d.id)); return `<div class="fc-sec"><div class="fc-sec-name"><b>${esc(d.name)}</b><span>${c.total - c.fresh}/${c.total} seen</span></div><button class="fc-mini" data-add="${esc(d.id)}">${icon('plus')} Add</button></div>`; }).join('') || '<div class="fc-plan-empty">Every section of this module is in the plan.</div>'}</div>
      <div class="fc-note">High sections come up about three times as often as normal ones; low ones less often, but they never disappear. When the high sections are finished the plan goes back to its usual mix by itself. Removing a section or changing a priority never changes any card's progress.</div>
    </div>`;
    $('.fc-planedit', root).onchange = e => {
      if (e.target.matches('[data-name]')) { p.name = e.target.value.trim() || p.name; edited(); }
      if (e.target.matches('[data-terms]')) { p.terms = e.target.checked; edited(); render(); }
      if (e.target.matches('[data-subject]')) { subject = e.target.value; render(); }
    };
  };
  render();
  root.onclick = e => {
    if (e.target.closest('[data-back]')) return planView(p);
    const pb = e.target.closest('[data-prio]');
    if (pb) { p.prio = Object.assign({}, p.prio); if (pb.dataset.prio === 'normal') delete p.prio[pb.dataset.deck]; else p.prio[pb.dataset.deck] = pb.dataset.prio; edited(); return render(); }
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      if (p.decks.length < 2) return B.toast('A plan needs at least one section. Use Delete plan to remove it.');
      p.decks = p.decks.filter(id => id !== rm.dataset.remove); edited(); B.toast('Removed. Its cards keep their progress.'); return render();
    }
    const ad = e.target.closest('[data-add]');
    if (ad) { p.decks = p.decks.concat(ad.dataset.add).sort((a, b) => deckOrder(D.deckById.get(a) || {}, D.deckById.get(b) || {})); edited(); return render(); }
  };
}

/* choose what to study: module, then section, then the topics (source notes) inside a section */
function focusPicker(p) {
  stopSpecs(); keyHandler = null;
  const ids = p ? planCardIds(p) : scopeCards('all'), owner = p ? ids.owner : null;
  const tree = new Map();
  for (const id of ids) {
    const c = D.byId.get(id), d = c && D.deckById.get((owner && owner.get(id)) || c.deck); if (!d) continue;
    if (!tree.has(d.subject)) tree.set(d.subject, new Map());
    const m = tree.get(d.subject); if (!m.has(d.id)) m.set(d.id, { d, ids: [], notes: new Map() });
    const r = m.get(d.id); r.ids.push(id);
    if (!r.notes.has(c.note)) r.notes.set(c.note, []); r.notes.get(c.note).push(id);
  }
  const line = list => { const now = Date.now(), fresh = list.filter(isNew).length, due = list.filter(id => isDue(id, now)).length; return fresh + due ? `${fresh} new · ${due} due` : 'nothing waiting'; };
  const row = (kind, id, label, list, cls = '') => `<button class="fc-choose-row ${cls}" data-focus-kind="${kind}" data-focus-id="${esc(id)}" data-focus-label="${esc(label)}"><span>${esc(label)}</span><em>${line(list)}</em></button>`;
  root.innerHTML = `<div class="fc-view fc-choose">
    <div class="fc-plan-bar"><button class="fc-mini" data-back>${icon('arrow-left')} ${p ? 'Plan' : 'Flashcards'}</button></div>
    <h2>Choose what to study</h2>
    <div class="fc-note">Your pick comes first with no daily limit, then the normal ${p ? 'plan' : 'order'} carries on. Your progress and ${p ? 'the plan' : 'decks'} stay as they are.</div>
    ${focusBar(p ? p.id : null)}
    ${[...tree].map(([sub, decks]) => `<div class="fc-section-title">${esc(sub)}</div>${tree.size > 1 ? row('subject', sub, 'All of ' + sub, [...decks.values()].flatMap(r => r.ids), 'is-all') : ''}${[...decks.values()].map(r => {
      const notes = [...r.notes].sort((a, b) => B.collator.compare(a[0], b[0]));
      return `<div class="fc-choose-deck">${row('deck', r.d.id, r.d.name, r.ids)}${notes.length > 1 && notes.length <= 40 ? `<details class="fc-topics"><summary>${notes.length} topics</summary>${notes.map(([n, l]) => row('note', n, B.noteTitle(n), l, 'is-topic')).join('')}</details>` : ''}</div>`;
    }).join('')}`).join('')}
  </div>`;
  root.onclick = e => {
    if (e.target.closest('[data-back]')) return p ? planView(p) : dashboard();
    if (e.target.closest('[data-focus-clear]')) { clearFocus(); return focusPicker(p); }
    const b = e.target.closest('[data-focus-kind]'); if (!b) return;
    const f = { plan: p ? p.id : null, kind: b.dataset.focusKind, id: b.dataset.focusId, label: b.dataset.focusLabel };
    if (!waiting(focusIds(f)).length) return B.toast('Nothing new or due there right now');
    store.set(FOCUS_KEY, f);
    startSession(p ? 'plan:' + p.id : 'all');
  };
}

function planForm() {
  stopSpecs(); keyHandler = null;
  const subjects = [...new Set(D.decks.filter(d => d.hub).map(d => d.subject))];
  const def = new Date(addDays(dayStart(Date.now()), 7)); def.setHours(9, 0, 0, 0);
  const st = { subject: subjects.find(s => /genetics/i.test(s)) || subjects[0], picked: new Set(), terms: true };
  const render = () => {
    const decks = D.decks.filter(d => d.subject === st.subject && d.hub).sort(deckOrder);
    root.innerHTML = `<div class="fc-view fc-planform">
      <div class="fc-plan-bar"><button class="fc-mini" data-home>${icon('arrow-left')} Flashcards</button></div>
      <h2>New exam plan</h2>
      <label class="fc-field"><span>Name</span><input data-name maxlength="60" value="${esc(st.name || st.subject + ' exam')}"></label>
      <label class="fc-field"><span>Deadline (exam date and time)</span><input type="datetime-local" data-due value="${st.due || toLocalInput(def.getTime())}"></label>
      <label class="fc-field"><span>Module</span><select data-subject>${subjects.map(s => `<option${s === st.subject ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
      <div class="fc-field"><span>Lectures and practicals <button class="fc-mini" data-all>${decks.every(d => st.picked.has(d.id)) ? 'Clear' : 'Select all'}</button></span>
        <div class="fc-pick">${decks.map(d => `<label class="fc-pick-item"><input type="checkbox" data-deck="${esc(d.id)}"${st.picked.has(d.id) ? ' checked' : ''}><span>${esc(d.name)}</span><em>${d.count}</em></label>`).join('')}</div></div>
      <label class="fc-check"><input type="checkbox" data-terms${st.terms ? ' checked' : ''}> Include the key terms used in these lectures</label>
      <div class="fc-plan-preview"></div>
      <div class="fc-plan-actions"><button class="fc-big mod-cta" data-create>${icon('check')}<span><b>Create plan</b><small>saves this card set</small></span></button></div>
    </div>`;
    preview();
  };
  const read = () => {
    st.name = $('[data-name]', root).value; st.due = $('[data-due]', root).value;
    st.terms = $('[data-terms]', root).checked;
    st.picked = new Set($$('[data-deck]', root).filter(i => i.checked).map(i => i.dataset.deck));
  };
  const draft = () => ({ id: 'p' + Date.now().toString(36), name: (st.name || '').trim() || st.subject + ' exam', decks: D.decks.filter(d => st.picked.has(d.id)).sort(deckOrder).map(d => d.id), terms: st.terms, due: new Date(st.due || toLocalInput(def.getTime())).getTime(), created: Date.now(), log: {} });
  const preview = () => {
    read();
    const box = $('.fc-plan-preview', root);
    if (!st.picked.size) { box.innerHTML = '<span class="dim">Pick at least one lecture.</span>'; return; }
    const p = draft();
    if (!(p.due > Date.now())) { box.innerHTML = '<span class="warn">The deadline must be in the future.</span>'; return; }
    const s = planStats(p);
    box.innerHTML = `<b>${s.total}</b> cards, <b>${s.fresh}</b> not seen yet. ${s.usable} study day${s.usable === 1 ? '' : 's'} before the deadline${s.buffer ? ' (the last kept for review)' : ''}: about <b>${s.target}</b> new cards a day, plus reviews.${s.target > 120 ? ' <span class="warn">That is a heavy load.</span>' : ''}`;
  };
  render();
  root.onclick = e => {
    if (e.target.closest('[data-home]')) return dashboard();
    if (e.target.closest('[data-all]')) { e.preventDefault(); read(); const decks = D.decks.filter(d => d.subject === st.subject && d.hub); const all = decks.every(d => st.picked.has(d.id)); st.picked = all ? new Set() : new Set(decks.map(d => d.id)); return render(); }
    if (e.target.closest('[data-create]')) {
      read();
      if (!st.picked.size) return B.toast('Pick at least one lecture');
      const p = draft();
      if (!(p.due > Date.now())) return B.toast('The deadline must be in the future');
      S.plans.push(p); save(); return planView(p);
    }
  };
  root.oninput = e => { if (!$('.fc-planform', root)) return; if (e.target.matches('[data-subject]')) { read(); st.subject = e.target.value; st.picked = new Set(); return render(); } preview(); };
}

let planTimer = null;
function tickPlans() {
  clearInterval(planTimer);
  planTimer = setInterval(() => {
    if (!root || !root.isConnected) { clearInterval(planTimer); return; }
    $$('[data-countdown]', root).forEach(el => { el.textContent = fmtLeft(+el.dataset.countdown - Date.now()); });
  }, 15000);
}

/* ---------------------------------------------------------------- the specimen */
function specimen(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  let raf = 0, alive = true, t0 = performance.now(), react = { kind: null, at: 0 }, stageIdx = opts.stage || 0, glowBoost = 0;
  const pal = [
    ['#34D399', '#A7F3D0'], ['#38BDF8', '#BAE6FD'], ['#A78BFA', '#DDD6FE'], ['#34D399', '#FDE68A'],
    ['#F472B6', '#FBCFE8'], ['#818CF8', '#C7D2FE'], ['#FBBF24', '#FDE68A'],
    ['#22D3EE', '#CFFAFE'], ['#FB923C', '#FED7AA'], ['#94A3B8', '#E2E8F0'], ['#F59E0B', '#FEF3C7'],
    ['#F43F5E', '#FECDD3'], ['#2DD4BF', '#99F6E4'], ['#FB923C', '#FEF08A'], ['#6366F1', '#BEF264'],
    ['#38BDF8', '#E0F2FE'], ['#FACC15', '#FDE68A'], ['#F9A8D4', '#FCE7F3'], ['#4ADE80', '#BBF7D0'],
    ['#A3E635', '#ECFCCB'], ['#22C55E', '#F472B6'], ['#60A5FA', '#DBEAFE'], ['#C084FC', '#F5D0FE'],
    ['#E879F9', '#FBCFE8'], ['#FB7185', '#67E8F9'], ['#84CC16', '#FDE047'], ['#3B82F6', '#86EFAC'],
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
  const TAU = Math.PI * 2;
  const irid = h => opts.locked ? '#8B93B8' : `hsl(${((h % 360) + 360) % 360},85%,72%)`;
  function smooth(pts, n) {          // Catmull-Rom through [x, y, halfWidth] points
    const out = [], at = i => pts[clamp(i, 0, pts.length - 1)];
    for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < n; k++) {
      const u = k / n, a = at(i - 1), b = at(i), c = at(i + 1), e = at(i + 2);
      out.push([0, 1, 2].map(j => 0.5 * (2 * b[j] + (c[j] - a[j]) * u + (2 * a[j] - 5 * b[j] + 4 * c[j] - e[j]) * u * u + (3 * b[j] - a[j] - 3 * c[j] + e[j]) * u * u * u)));
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function tube(pts, n = 6) {        // traces a body of varying width; returns its centre line
    const p = smooth(pts, n).map(([x, y, r], i, all) => {
      const a = all[Math.max(0, i - 1)], b = all[Math.min(all.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      return { x, y, r: Math.max(0, r), nx: -dy / l, ny: dx / l };
    });
    ctx.beginPath();
    p.forEach((q, i) => { const x = q.x + q.nx * q.r, y = q.y + q.ny * q.r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    for (let i = p.length - 1; i >= 0; i--) ctx.lineTo(p[i].x - p[i].nx * p[i].r, p[i].y - p[i].ny * p[i].r);
    ctx.closePath();
    return p;
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
    7(t, w, hgt, c1, c2) { // comb jelly
      const M = Math.min(w, hgt), cx = w / 2, cy = hgt * 0.43 + Math.sin(t * 0.9) * M * 0.015, rx = M * 0.2, ry = M * 0.29;
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(cx + s * rx * 0.3, cy + ry * 0.92);
        for (let i = 1; i <= 26; i++) ctx.lineTo(cx + s * (rx * 0.3 + i * M * 0.004) + Math.sin(i * 0.4 - t * 2 + s) * i * M * 0.0016, cy + ry * 0.92 + i * M * 0.0085);
        ctx.strokeStyle = hexA(c2, .55); ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); cellFill(cx, cy, ry, c1, 0.16); glowStroke(c1, 1.8, 12);
      for (const f of [-0.92, -0.62, -0.25, 0.25, 0.62, 0.92]) for (let n = 0; n < 14; n++) {
        const a = -1.3 + n / 13 * 2.6;
        dot(cx + rx * f * Math.cos(a), cy + ry * Math.sin(a), Math.max(0.9, M * 0.008), irid(n * 28 - t * 220 + f * 90), 4);
      }
    },
    8(t, w, hgt, c1, c2) { // sea star
      const M = Math.min(w, hgt), cx = w / 2, cy = hgt / 2, R = M * 0.42, rot = t * 0.06 - Math.PI / 2;
      ctx.beginPath();
      for (let i = 0; i <= 150; i++) {
        const a = i / 150 * TAU, r = R * (0.3 + 0.7 * Math.pow(Math.abs(Math.cos(2.5 * a)), 1.5)) * (1 + 0.025 * Math.sin(3 * a + t));
        const x = cx + Math.cos(a + rot) * r, y = cy + Math.sin(a + rot) * r;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath(); cellFill(cx, cy, R * 0.7, c1, 0.24); glowStroke(c1, 2, 12);
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * TAU + rot;
        for (let j = 1; j <= 6; j++) for (const s of [-1, 1]) {
          const rr = R * (0.14 + j * 0.125), off = (1 - j / 7.5) * M * 0.024 * s;
          dot(cx + Math.cos(a) * rr - Math.sin(a) * off, cy + Math.sin(a) * rr + Math.cos(a) * off, Math.max(0.8, M * 0.0075), hexA(c2, .85), 3);
        }
      }
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.11, 0, TAU); glowStroke(c2, 1.4, 6);
    },
    9(t, w, hgt, c1, c2) { // trilobite
      const M = Math.min(w, hgt), cx = w / 2, cy = hgt / 2, rx = M * 0.25, ry = M * 0.39, top = cy - ry * 0.42;
      const half = y => rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2));
      ctx.beginPath();
      for (let i = 0; i < 10; i++) for (const s of [-1, 1]) {
        const y = top + i * ry * 0.13, hw = half(y);
        ctx.moveTo(cx + s * hw, y); ctx.lineTo(cx + s * (hw + M * 0.045), y + Math.sin(t * 5 + i * 0.8 + s) * M * 0.013);
      }
      ctx.strokeStyle = hexA(c2, .65); ctx.lineWidth = 1.1; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); cellFill(cx, cy, ry, c1, 0.22); glowStroke(c1, 2, 12);
      ctx.beginPath(); ctx.moveTo(cx - half(top), top); ctx.quadraticCurveTo(cx, top + ry * 0.16, cx + half(top), top); glowStroke(c2, 1.5, 5);
      ctx.beginPath();
      for (let i = 1; i < 11; i++) { const y = top + i * ry * 0.13, hw = half(y); ctx.moveTo(cx - hw, y); ctx.quadraticCurveTo(cx, y + ry * 0.08, cx + hw, y); }
      ctx.strokeStyle = hexA(c1, .75); ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath();
      for (const s of [-1, 1]) { ctx.moveTo(cx + s * rx * 0.3, top - ry * 0.3); ctx.quadraticCurveTo(cx + s * rx * 0.4, cy, cx + s * rx * 0.08, cy + ry * 0.82); }
      ctx.strokeStyle = hexA(c2, .7); ctx.stroke();
      for (const s of [-1, 1]) dot(cx + s * rx * 0.52, cy - ry * 0.62, Math.max(1.2, M * 0.016), c2, 7);
    },
    10(t, w, hgt, c1, c2) { // nautilus
      const M = Math.min(w, hgt), cx = w * 0.55, cy = hgt * 0.47 + Math.sin(t * 0.8) * M * 0.012, R = M * 0.37, b = 0.17, end = 4.5 * Math.PI;
      const pt = a => { const r = R * Math.exp(b * (a - end)); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
      const mouth = pt(end), inner = pt(end - TAU), mx = (mouth[0] + inner[0]) / 2, my = (mouth[1] + inner[1]) / 2;
      for (let k = 0; k < 7; k++) {
        const u = k / 6 - 0.5;
        ctx.beginPath(); ctx.moveTo(mx, my + u * M * 0.1);
        ctx.quadraticCurveTo(mx - M * 0.14, my + u * M * 0.16 + Math.sin(t * 1.6 + k) * M * 0.02, mx - M * (0.25 + (k % 2) * 0.05), my + u * M * 0.26 + Math.sin(t * 1.3 + k * 2) * M * 0.03);
        ctx.strokeStyle = hexA(c2, .65); ctx.lineWidth = 1.2; ctx.stroke();
      }
      ctx.beginPath();
      for (let a = end - TAU; a <= end + 0.001; a += 0.08) ctx.lineTo(...pt(a));
      ctx.closePath(); cellFill(cx, cy, R, c1, 0.24); glowStroke(c1, 2, 12);
      ctx.beginPath(); ctx.moveTo(...pt(end - TAU * 2.6));
      for (let a = end - TAU * 2.6; a <= end - TAU; a += 0.1) ctx.lineTo(...pt(a));
      glowStroke(c2, 1.4, 5);
      ctx.beginPath();
      for (let a = end - 0.55; a > end - TAU * 1.5; a -= 0.5) {
        const p = pt(a), q = pt(a - TAU);
        ctx.moveTo(...p); ctx.quadraticCurveTo((p[0] + q[0]) / 2 + Math.cos(a + 1.6) * R * 0.07, (p[1] + q[1]) / 2 + Math.sin(a + 1.6) * R * 0.07, ...q);
      }
      ctx.strokeStyle = hexA(c2, .55); ctx.lineWidth = 1; ctx.stroke();
      dot(mx - M * 0.015, my - M * 0.05, Math.max(1.3, M * 0.016), c2, 7);
    },
    11(t, w, hgt, c1, c2) { // octopus
      const M = Math.min(w, hgt), cx = w / 2, cy = hgt * 0.34 + Math.sin(t * 1.1) * M * 0.012, R = M * 0.2;
      for (let k = 0; k < 8; k++) {
        const u = k - 3.5, pts = [];
        for (let s = 0; s <= 7; s++) {
          const f = s / 7, curl = Math.sin(f * 5 - t * 1.8 + k * 1.1) * f * M * 0.05;
          pts.push([cx + u * M * 0.045 + u * f * M * 0.082 + curl, cy + R * 0.7 + f * M * (0.46 - Math.abs(u) * 0.045), M * 0.028 * (1 - f * 0.9)]);
        }
        tube(pts, 3); ctx.fillStyle = hexA(c1, .3); ctx.fill(); glowStroke(c1, 1.1, 5);
      }
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.98, R * 1.18, 0, 0, TAU); cellFill(cx, cy, R * 1.1, c1, 0.26); glowStroke(c1, 2, 13);
      for (const s of [-1, 1]) { dot(cx + s * R * 0.46, cy + R * 0.3, Math.max(1.6, M * 0.024), c2, 7); dot(cx + s * R * 0.46, cy + R * 0.3, Math.max(0.7, M * 0.01), '#05060D', 0); }
    },
    12(t, w, hgt, c1, c2) { // dragonfly
      const M = Math.min(w, hgt), cx = w / 2, ty = hgt * 0.3, L = M * 0.44;
      for (let j = 0; j < 2; j++) for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(cx, ty + j * M * 0.05);
        ctx.rotate(s * ((j ? 0.24 : -0.16) + Math.sin(t * 20 + j * 2) * 0.08));
        ctx.beginPath(); ctx.ellipse(s * L * 0.52, 0, L * 0.5, M * 0.048, 0, 0, TAU); ctx.fillStyle = hexA(c2, .2); ctx.fill(); glowStroke(c1, 1.2, 6);
        ctx.beginPath(); ctx.moveTo(s * L * 0.04, 0); ctx.lineTo(s * L, 0);
        for (let v = 1; v < 7; v++) { const x = s * v * L * 0.145; ctx.moveTo(x, -M * 0.035); ctx.lineTo(x + s * L * 0.03, M * 0.035); }
        ctx.strokeStyle = hexA(c2, .5); ctx.lineWidth = 0.8; ctx.stroke();
        ctx.restore();
      }
      const sway = Math.sin(t * 1.2) * M * 0.025;
      const body = tube([[cx, ty + M * 0.06, M * 0.03], [cx, ty + M * 0.2, M * 0.02], [cx + sway * 0.5, ty + M * 0.38, M * 0.017], [cx + sway, ty + M * 0.56, M * 0.012]], 8);
      cellFill(cx, ty + M * 0.3, M * 0.3, c1, 0.4); glowStroke(c1, 1.4, 8);
      ctx.beginPath(); body.forEach((p, i) => { if (i % 3 === 2) { ctx.moveTo(p.x - p.nx * p.r, p.y - p.ny * p.r); ctx.lineTo(p.x + p.nx * p.r, p.y + p.ny * p.r); } });
      ctx.strokeStyle = hexA(c2, .7); ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, ty + M * 0.02, M * 0.045, M * 0.065, 0, 0, TAU); cellFill(cx, ty, M * 0.07, c1, 0.34); glowStroke(c1, 1.6, 9);
      for (const s of [-1, 1]) dot(cx + s * M * 0.028, ty - M * 0.07, Math.max(1.5, M * 0.024), c2, 8);
    },
    13(t, w, hgt, c1, c2) { // butterfly
      const M = Math.min(w, hgt), cx = w / 2, cy = hgt * 0.5 + Math.sin(t * 1.1) * M * 0.012, open = 0.74 + 0.26 * Math.cos(t * 2.2);
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(s * open, 1);
        ctx.beginPath(); ctx.moveTo(0, -M * 0.03); ctx.bezierCurveTo(M * 0.1, -M * 0.38, M * 0.44, -M * 0.38, M * 0.42, -M * 0.13); ctx.bezierCurveTo(M * 0.4, -M * 0.02, M * 0.14, M * 0.02, 0, M * 0.02);
        cellFill(M * 0.22, -M * 0.16, M * 0.28, c1, 0.3); glowStroke(c1, 1.8, 11);
        ctx.beginPath(); ctx.moveTo(0, M * 0.02); ctx.bezierCurveTo(M * 0.14, M * 0.02, M * 0.35, M * 0.07, M * 0.3, M * 0.23); ctx.bezierCurveTo(M * 0.25, M * 0.36, M * 0.08, M * 0.26, 0, M * 0.1);
        cellFill(M * 0.16, M * 0.14, M * 0.2, c2, 0.26); glowStroke(c2, 1.5, 9);
        ctx.beginPath(); for (let v = 0; v < 5; v++) { ctx.moveTo(M * 0.02, -M * 0.02); ctx.lineTo(M * (0.16 + v * 0.055), -M * (0.28 - v * 0.05)); } ctx.strokeStyle = hexA(c2, .4); ctx.lineWidth = 0.9; ctx.stroke();
        ctx.restore();
        const ex = cx + s * open * M * 0.3;
        dot(ex, cy - M * 0.17, Math.max(2, M * 0.042), hexA(c2, .9), 8); dot(ex, cy - M * 0.17, Math.max(1, M * 0.02), hexA(c1, 1), 0);
        dot(cx + s * open * M * 0.19, cy + M * 0.17, Math.max(1.4, M * 0.024), hexA(c1, .9), 6);
      }
      ctx.beginPath(); ctx.ellipse(cx, cy + M * 0.03, M * 0.016, M * 0.13, 0, 0, TAU); ctx.fillStyle = hexA(c2, .9); ctx.fill();
      ctx.beginPath(); for (const s of [-1, 1]) { ctx.moveTo(cx, cy - M * 0.09); ctx.quadraticCurveTo(cx + s * M * 0.03, cy - M * 0.2, cx + s * M * 0.1, cy - M * 0.24); } ctx.strokeStyle = c2; ctx.lineWidth = 1; ctx.stroke();
    },
    14(t, w, hgt, c1, c2) { // anglerfish
      const M = Math.min(w, hgt), cx = w * 0.44, cy = hgt * 0.58 + Math.sin(t) * M * 0.012, R = M * 0.27, wag = Math.sin(t * 2.4) * R * 0.2;
      ctx.beginPath(); ctx.moveTo(cx - R * 0.85, cy); ctx.quadraticCurveTo(cx - R * 1.2, cy - R * 0.1, cx - R * 1.55, cy - R * 0.5 + wag); ctx.quadraticCurveTo(cx - R * 1.32, cy + wag * 0.5, cx - R * 1.55, cy + R * 0.5 + wag); ctx.quadraticCurveTo(cx - R * 1.2, cy + R * 0.1, cx - R * 0.85, cy);
      cellFill(cx - R * 1.2, cy, R * 0.7, c1, 0.24); glowStroke(c1, 1.5, 8);
      blob(cx, cy, R, t, 2, 0.025, 60); cellFill(cx, cy, R, c1, 0.24); glowStroke(c1, 2, 12);
      const a = [cx + R * 0.02, cy + R * 0.2], u = [cx + R * 1.04, cy - R * 0.2], d = [cx + R * 0.94, cy + R * 0.56];
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...u); ctx.lineTo(...d); ctx.closePath(); ctx.fillStyle = 'rgba(5,6,17,.9)'; ctx.fill(); glowStroke(c1, 1.4, 5);
      ctx.beginPath();
      for (let i = 1; i <= 5; i++) {
        const f = i / 5.6, tx = a[0] + (u[0] - a[0]) * f, ty = a[1] + (u[1] - a[1]) * f, bx = a[0] + (d[0] - a[0]) * f, by = a[1] + (d[1] - a[1]) * f, g = R * 0.06;
        ctx.moveTo(tx - g, ty + g * 0.3); ctx.lineTo(tx + (bx - tx) * 0.5, ty + (by - ty) * 0.5); ctx.lineTo(tx + g, ty - g * 0.3);
        ctx.moveTo(bx - g, by - g * 0.1); ctx.lineTo(bx + (tx - bx) * 0.36, by + (ty - by) * 0.36); ctx.lineTo(bx + g, by + g * 0.1);
      }
      ctx.fillStyle = hexA(c2, .95); ctx.fill();
      dot(cx + R * 0.1, cy - R * 0.42, Math.max(1.4, M * 0.02), c2, 6); dot(cx + R * 0.1, cy - R * 0.42, Math.max(0.6, M * 0.008), '#05060D', 0);
      const lx = cx + R * 1.28, ly = cy - R * 1.02 + Math.sin(t * 1.5) * R * 0.08, on = (Math.sin(t * 3) + 1) / 2;
      ctx.beginPath(); ctx.moveTo(cx + R * 0.05, cy - R * 0.97); ctx.quadraticCurveTo(cx + R * 0.7, cy - R * 1.75, lx, ly); glowStroke(c1, 1.3, 4);
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, M * 0.16); g.addColorStop(0, hexA(c2, .3 + on * .25)); g.addColorStop(1, hexA(c2, 0)); ctx.fillStyle = g; ctx.fillRect(lx - M * 0.16, ly - M * 0.16, M * 0.32, M * 0.32);
      dot(lx, ly, Math.max(1.6, M * 0.022 * (1 + on * 0.3)), c2, 14 + on * 12);
    },
    15(t, w, hgt, c1, c2) { // manta ray
      const M = Math.min(w, hgt), cx = w / 2, cy = hgt * 0.42 + Math.sin(t * 0.8) * M * 0.012, tip = cy + Math.sin(t * 1.5) * M * 0.09;
      tube([[cx, cy + M * 0.2, M * 0.012], [cx + Math.sin(t) * M * 0.02, cy + M * 0.36, M * 0.006], [cx + Math.sin(t * 1.3) * M * 0.05, cy + M * 0.54, M * 0.002]], 6); glowStroke(c1, 1.2, 5);
      ctx.beginPath(); ctx.moveTo(cx, cy - M * 0.19);
      for (const s of [1, -1]) {
        ctx.bezierCurveTo(cx + s * M * 0.12, cy - M * 0.21, cx + s * M * 0.32, cy - M * 0.1, cx + s * M * 0.47, tip);
        ctx.bezierCurveTo(cx + s * M * 0.3, cy + M * 0.03, cx + s * M * 0.14, cy + M * 0.2, cx, cy + M * 0.25);
        if (s > 0) ctx.moveTo(cx, cy - M * 0.19);
      }
      cellFill(cx, cy, M * 0.42, c1, 0.26); glowStroke(c1, 2, 13);
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(cx + s * M * 0.05, cy - M * 0.19); ctx.quadraticCurveTo(cx + s * M * 0.1, cy - M * 0.3, cx + s * M * 0.05, cy - M * 0.32 - Math.sin(t * 2 + s) * M * 0.01); glowStroke(c1, 2.2, 6);
        ctx.beginPath(); for (let g = 0; g < 5; g++) { const y = cy + g * M * 0.03; ctx.moveTo(cx + s * M * 0.04, y); ctx.lineTo(cx + s * M * 0.1, y + M * 0.012); } ctx.strokeStyle = hexA(c2, .65); ctx.lineWidth = 1; ctx.stroke();
        for (let k = 0; k < 4; k++) dot(cx + s * M * (0.16 + k * 0.06), cy - M * 0.07 + (k % 2) * M * 0.05 + (tip - cy) * k * 0.14, Math.max(0.9, M * 0.011), hexA(c2, .75), 4);
      }
    },
    16(t, w, hgt, c1, c2) { // seahorse
      const M = Math.min(w, hgt), cx = w * 0.47, cy = hgt / 2 + Math.sin(t * 1.3) * M * 0.018, fan = Math.sin(t * 9) * 0.25;
      const P = pts => pts.map(([x, y, r]) => [cx + x * M, cy + y * M, r * M]);
      ctx.save(); ctx.translate(cx - M * 0.075, cy - M * 0.03);
      ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = Math.PI * 0.62 + i * 0.3 + fan * 0.4; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * M * 0.14, Math.sin(a) * M * 0.14); } ctx.strokeStyle = hexA(c2, .7); ctx.lineWidth = 1.1; ctx.stroke();
      ctx.restore();
      tube(P([[0.02, -0.3, 0.03], [0.1, -0.28, 0.018], [0.18, -0.26, 0.019]]), 5); cellFill(cx + M * 0.1, cy - M * 0.28, M * 0.12, c1, 0.3); glowStroke(c1, 1.5, 7);
      const body = tube(P([[-0.02, -0.33, 0.06], [-0.07, -0.23, 0.052], [-0.04, -0.12, 0.07], [0.02, -0.01, 0.1], [0.01, 0.1, 0.08], [-0.03, 0.19, 0.055], [-0.05, 0.27, 0.038], [-0.01, 0.35, 0.028], [0.07, 0.36, 0.021], [0.11, 0.3, 0.015], [0.07, 0.25, 0.01], [0.03, 0.28, 0.005]]), 6);
      cellFill(cx, cy, M * 0.34, c1, 0.28); glowStroke(c1, 1.9, 12);
      ctx.beginPath(); body.forEach((p, i) => { if (i % 3 === 0 && i > 3) { ctx.moveTo(p.x - p.nx * p.r, p.y - p.ny * p.r); ctx.lineTo(p.x + p.nx * p.r, p.y + p.ny * p.r); } }); ctx.strokeStyle = hexA(c2, .45); ctx.lineWidth = 0.9; ctx.stroke();
      ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.moveTo(cx - M * (0.05 - i * 0.025), cy - M * 0.37); ctx.lineTo(cx - M * (0.07 - i * 0.03), cy - M * 0.42); } ctx.strokeStyle = c2; ctx.lineWidth = 1.2; ctx.stroke();
      dot(cx + M * 0.005, cy - M * 0.325, Math.max(1.2, M * 0.016), c2, 6);
    },
    17(t, w, hgt, c1, c2) { // axolotl
      const M = Math.min(w, hgt), cx = w / 2, hy = hgt * 0.28, sw = s => Math.sin(t * 1.8 - s * 3) * M * 0.05 * s;
      for (const [dy, a] of [[0.2, 0.9], [0.4, 0.95]]) for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(cx + s * M * 0.08, hy + dy * M); ctx.lineTo(cx + s * M * 0.2, hy + dy * M + Math.sin(t * 1.5 + dy * 9 + s) * M * 0.018 + M * 0.03);
        glowStroke(c1, Math.max(2, M * 0.026 * a), 5);
      }
      tube([[cx, hy + M * 0.02, M * 0.01], [cx, hy + M * 0.08, M * 0.085], [cx + sw(0.2), hy + M * 0.22, M * 0.095], [cx + sw(0.45), hy + M * 0.4, M * 0.07], [cx + sw(0.7), hy + M * 0.54, M * 0.04], [cx + sw(1), hy + M * 0.67, M * 0.004]], 7);
      cellFill(cx, hy + M * 0.3, M * 0.36, c1, 0.3); glowStroke(c1, 1.8, 11);
      for (let k = 0; k < 3; k++) for (const s of [-1, 1]) {
        const ang = (-0.62 + k * 0.5), bx = cx + s * M * 0.12, by = hy - M * 0.01 + k * M * 0.03, wave = Math.sin(t * 2.2 + k) * 0.12, ex = bx + s * Math.cos(ang + wave) * M * 0.21, ey = by + Math.sin(ang + wave) * M * 0.21;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey);
        for (let f = 1; f <= 5; f++) { const q = f / 5.4, x = bx + (ex - bx) * q, y = by + (ey - by) * q; ctx.moveTo(x, y); ctx.lineTo(x + s * M * 0.018, y - M * 0.035); ctx.moveTo(x, y); ctx.lineTo(x + s * M * 0.018, y + M * 0.035); }
        glowStroke(c2, 1.1, 6);
      }
      ctx.beginPath(); ctx.ellipse(cx, hy, M * 0.15, M * 0.105, 0, 0, TAU); cellFill(cx, hy, M * 0.15, c1, 0.34); glowStroke(c1, 1.9, 11);
      for (const s of [-1, 1]) dot(cx + s * M * 0.08, hy - M * 0.025, Math.max(1.3, M * 0.015), '#05060D', 0);
      ctx.beginPath(); ctx.arc(cx, hy + M * 0.01, M * 0.06, 0.3, Math.PI - 0.3); ctx.strokeStyle = hexA(c2, .9); ctx.lineWidth = 1.2; ctx.stroke();
    },
    18(t, w, hgt, c1, c2) { // sea turtle
      const M = Math.min(w, hgt), cx = w / 2, cy = hgt * 0.5 + Math.sin(t * 0.9) * M * 0.012, rx = M * 0.21, ry = M * 0.28, stroke = Math.sin(t * 1.4) * 0.34;
      const flipper = (s, y, len, base, swing) => {
        ctx.save(); ctx.translate(cx + s * rx * 0.72, y); ctx.rotate(s * (base + swing));
        ctx.beginPath(); ctx.ellipse(s * len * 0.5, 0, len * 0.52, len * 0.17, s * 0.15, 0, TAU); cellFill(s * len * 0.5, 0, len * 0.5, c1, 0.3); glowStroke(c1, 1.5, 8); ctx.restore();
      };
      for (const s of [-1, 1]) { flipper(s, cy - ry * 0.55, M * 0.27, -0.35, stroke); flipper(s, cy + ry * 0.7, M * 0.14, 0.55, -stroke * 0.5); }
      ctx.beginPath(); ctx.ellipse(cx, cy - ry * 1.12, M * 0.062, M * 0.085, 0, 0, TAU); cellFill(cx, cy - ry * 1.12, M * 0.08, c1, 0.34); glowStroke(c1, 1.5, 8);
      for (const s of [-1, 1]) dot(cx + s * M * 0.032, cy - ry * 1.2, Math.max(0.9, M * 0.01), c2, 4);
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); cellFill(cx, cy, ry, c1, 0.28); glowStroke(c1, 2.2, 13);
      const hex = (x, y, r) => { for (let i = 0; i <= 6; i++) { const a = i / 6 * TAU + Math.PI / 6, px = x + Math.cos(a) * r * 1.1, py = y + Math.sin(a) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } };
      ctx.beginPath();
      for (let i = -1.5; i <= 1.5; i++) hex(cx, cy + i * ry * 0.46, ry * 0.21);
      for (const s of [-1, 1]) for (const i of [-1, 0, 1]) hex(cx + s * rx * 0.6, cy + i * ry * 0.48, ry * 0.17);
      ctx.strokeStyle = hexA(c2, .75); ctx.lineWidth = 1.1; ctx.stroke();
    },
    19(t, w, hgt, c1, c2) { // archaeopteryx
      const M = Math.min(w, hgt), cx = w * 0.53, cy = hgt * 0.56 + Math.sin(t * 2) * M * 0.012, flap = Math.sin(t * 2.6) * 0.3;
      const P = pts => pts.map(([x, y, r]) => [cx + x * M, cy + y * M, r * M]);
      const tail = tube(P([[-0.03, 0.02, 0.004], [-0.1, 0.05, 0.02], [-0.2, 0.1, 0.013], [-0.46, 0.13, 0.004]]), 6); glowStroke(c1, 1.1, 4);
      tail.forEach((p, i) => { if (i < 8) return; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(p.x + p.nx * s * M * 0.034, p.y + p.ny * s * M * 0.034, M * 0.04, M * 0.011, -0.45 * s + 0.3, 0, TAU); ctx.fillStyle = hexA(c2, .32); ctx.fill(); glowStroke(c1, 0.8, 3); } });
      ctx.beginPath(); ctx.moveTo(cx + M * 0.01, cy + M * 0.06); ctx.lineTo(cx - M * 0.01, cy + M * 0.17); ctx.lineTo(cx + M * 0.04, cy + M * 0.18); ctx.strokeStyle = c1; ctx.lineWidth = 1.6; ctx.stroke();
      tube(P([[0.25, -0.15, 0.024], [0.34, -0.135, 0.004]]), 4); cellFill(cx + M * 0.3, cy - M * 0.14, M * 0.06, c2, 0.4); glowStroke(c2, 1.1, 4);
      tube(P([[-0.12, 0.05, 0.004], [-0.06, 0.04, 0.05], [0.03, 0.01, 0.078], [0.13, -0.06, 0.05], [0.19, -0.13, 0.036], [0.26, -0.15, 0.034]]), 6); cellFill(cx + M * 0.06, cy, M * 0.22, c1, 0.3); glowStroke(c1, 1.8, 11);
      dot(cx + M * 0.235, cy - M * 0.165, Math.max(1, M * 0.012), c2, 5);
      ctx.save(); ctx.translate(cx + M * 0.07, cy - M * 0.03);
      for (let i = 0; i < 10; i++) {
        const a = -2.75 + i * 0.17 + flap * (1 - i * 0.04), L = M * (0.2 + i * 0.03 - (i > 6 ? (i - 6) * 0.03 : 0));
        ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(L * 0.56, 0, L * 0.5, M * 0.021, 0, 0, TAU); ctx.fillStyle = hexA(i % 2 ? c1 : c2, .24); ctx.fill(); glowStroke(c1, 0.9, 4); ctx.restore();
      }
      ctx.restore();
    },
    20(t, w, hgt, c1, c2) { // hummingbird
      const M = Math.min(w, hgt), bob = Math.sin(t * 2.4) * M * 0.012, cx = w * 0.4, cy = hgt * 0.5 + bob;
      const P = pts => pts.map(([x, y, r]) => [cx + x * M, cy + y * M, r * M]);
      const fx = cx + M * 0.46, fy = hgt * 0.42;
      ctx.beginPath(); ctx.moveTo(fx + M * 0.03, fy + M * 0.04); ctx.quadraticCurveTo(fx + M * 0.08, fy + M * 0.25, fx + M * 0.04, hgt * 0.96); ctx.strokeStyle = hexA(c1, .7); ctx.lineWidth = 1.4; ctx.stroke();
      for (let i = 0; i < 5; i++) { const a = -0.95 + i * 0.47; ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * M * 0.05 + M * 0.01, fy + Math.sin(a) * M * 0.05, M * 0.062, M * 0.024, a, 0, TAU); ctx.fillStyle = hexA(c2, .34); ctx.fill(); glowStroke(c2, 1, 6); }
      ctx.save(); ctx.translate(cx + M * 0.01, cy - M * 0.03);
      for (let k = 0; k < 4; k++) { const a = -2.0 + Math.sin(t * 34 + k * 1.2) * 0.62; ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(M * 0.17, 0, M * 0.18, M * 0.035, 0, 0, TAU); ctx.fillStyle = hexA(c2, .13); ctx.fill(); ctx.strokeStyle = hexA(c2, .25); ctx.lineWidth = 0.8; ctx.stroke(); ctx.restore(); }
      ctx.restore();
      for (const a of [1.95, 2.2, 2.45]) { ctx.beginPath(); ctx.moveTo(cx - M * 0.12, cy + M * 0.13); ctx.lineTo(cx - M * 0.12 + Math.cos(a) * M * 0.17, cy + M * 0.13 + Math.sin(a) * M * 0.17); glowStroke(c1, 2, 5); }
      ctx.beginPath(); ctx.moveTo(cx + M * 0.1, cy - M * 0.135); ctx.lineTo(cx + M * 0.36, cy - M * 0.09); glowStroke(c2, 1.5, 4);
      tube(P([[-0.15, 0.17, 0.006], [-0.1, 0.1, 0.035], [-0.03, 0.02, 0.066], [0.03, -0.07, 0.056], [0.09, -0.135, 0.044], [0.13, -0.14, 0.012]]), 6); cellFill(cx, cy, M * 0.2, c1, 0.34); glowStroke(c1, 1.7, 11);
      for (let i = 0; i < 7; i++) dot(cx + M * (0.015 + i * 0.008), cy - M * (0.01 + i * 0.015) + (i % 2) * M * 0.012, Math.max(0.9, M * 0.011), irid(i * 24 + 320 + t * 70), 5);
      dot(cx + M * 0.09, cy - M * 0.15, Math.max(1, M * 0.011), c2, 4);
    },
    21(t, w, hgt, c1, c2) { // humpback whale
      const M = Math.min(w, hgt), cx = w * 0.48, cy = hgt * 0.5, wave = x => Math.sin(t * 1.1 + x * 3) * M * 0.016;
      const P = pts => pts.map(([x, y, r]) => [cx + x * M, cy + y * M + wave(x), r * M]);
      for (let i = 0; i < 6; i++) { const f = ((t * 0.35 + i / 6) % 1), s = i % 2 ? 1 : -1; dot(cx - M * 0.2 + s * f * M * 0.07, cy - M * (0.16 + f * 0.22), Math.max(0.8, M * 0.009 * (1 - f * 0.5)), hexA(c2, .9 * (1 - f)), 5); }
      const end = [cx + M * 0.39, cy - M * 0.07 + wave(0.39)], fl = Math.sin(t * 1.1 + 1) * M * 0.03;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(...end); ctx.quadraticCurveTo(end[0] + s * M * 0.03 + M * 0.03, end[1] - M * 0.09, end[0] + s * M * 0.08 + M * 0.03, end[1] - M * 0.08 + fl); ctx.quadraticCurveTo(end[0] + s * M * 0.05 + M * 0.02, end[1] - M * 0.02, end[0], end[1] + M * 0.01); cellFill(end[0], end[1] - M * 0.05, M * 0.12, c1, 0.32); glowStroke(c1, 1.5, 8); }
      tube(P([[-0.44, 0.05, 0.03], [-0.34, -0.01, 0.1], [-0.15, -0.04, 0.135], [0.07, -0.02, 0.1], [0.25, -0.01, 0.05], [0.39, -0.07, 0.014]]), 7); cellFill(cx - M * 0.1, cy, M * 0.4, c1, 0.28); glowStroke(c1, 2, 13);
      tube(P([[-0.17, 0.04, 0.004], [-0.16, 0.09, 0.03], [-0.13, 0.2, 0.034], [-0.05, 0.33, 0.012]]), 6); cellFill(cx - M * 0.12, cy + M * 0.2, M * 0.16, c1, 0.34); glowStroke(c1, 1.5, 8);
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const y = cy + i * M * 0.016; ctx.moveTo(cx - M * 0.4 + i * M * 0.02, y + M * 0.052 + wave(-0.4)); ctx.quadraticCurveTo(cx - M * 0.25, y + M * 0.06 + wave(-0.25), cx - M * 0.05 - i * M * 0.02, y + M * 0.045 + wave(-0.05)); } ctx.strokeStyle = hexA(c2, .45); ctx.lineWidth = 0.9; ctx.stroke();
      dot(cx - M * 0.31, cy - M * 0.005 + wave(-0.31), Math.max(1, M * 0.012), c2, 5);
    },
    22(t, w, hgt, c1, c2) { // neuron
      const M = Math.min(w, hgt), cx = w * 0.46, cy = hgt * 0.32, dend = new Path2D();
      const branch = (x, y, a, len, depth, seed) => {
        const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len;
        dend.moveTo(x, y); dend.lineTo(nx, ny);
        if (depth) for (const s of [-1, 1]) branch(nx, ny, a + s * (0.42 + 0.2 * Math.sin(seed * 7.1 + s)) + Math.sin(t * 0.8 + seed) * 0.03, len * 0.72, depth - 1, seed + s * 1.7 + 2);
      };
      for (let k = 0; k < 6; k++) branch(cx, cy, -Math.PI / 2 + (k - 2.5) * 0.82, M * 0.095, 3, k * 2.3);
      ctx.strokeStyle = c1; ctx.lineWidth = 1.2; ctx.shadowColor = c1; ctx.shadowBlur = 6 * (1 + glowBoost); ctx.stroke(dend); ctx.shadowBlur = 0;
      const path = f => [cx + Math.sin(f * 2.6) * M * 0.05 + f * M * 0.08, cy + f * M * 0.56];
      const axon = []; for (let i = 0; i <= 12; i++) axon.push([...path(i / 12), M * 0.008]);
      tube(axon, 3); glowStroke(c1, 1.1, 4);
      for (let i = 0; i < 5; i++) {
        const f = 0.14 + i * 0.165, a = path(f), b = path(f + 0.12);
        ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineCap = 'round'; ctx.strokeStyle = hexA(c2, .5); ctx.lineWidth = Math.max(3, M * 0.034); ctx.stroke(); ctx.lineCap = 'butt';
      }
      const end = path(1), term = new Path2D();
      for (let k = 0; k < 4; k++) { const a = 0.75 + k * 0.5, x = end[0] + Math.cos(a) * M * 0.085, y = end[1] + Math.sin(a) * M * 0.085 * 0.55; term.moveTo(...end); term.lineTo(x, y); }
      ctx.strokeStyle = c1; ctx.lineWidth = 1.2; ctx.stroke(term);
      for (let k = 0; k < 4; k++) { const a = 0.75 + k * 0.5; dot(end[0] + Math.cos(a) * M * 0.085, end[1] + Math.sin(a) * M * 0.085 * 0.55, Math.max(1, M * 0.012), c2, 5); }
      blob(cx, cy, M * 0.085, t, 4, 0.08, 40); cellFill(cx, cy, M * 0.085, c1, 0.34); glowStroke(c1, 1.9, 13);
      dot(cx, cy, Math.max(1.6, M * 0.028), c2, 9);
      const f = (t * 0.45) % 1, s = path(f); dot(s[0], s[1], Math.max(1.6, M * 0.02), '#FFFFFF', 18);
    },
    23(t, w, hgt, c1, c2) { // cortex
      const M = Math.min(w, hgt), cx = w * 0.5, cy = hgt * 0.45, rx = M * 0.38, ry = M * 0.28;
      tube([[cx + rx * 0.3, cy + ry * 0.75, M * 0.05], [cx + rx * 0.38, cy + ry * 1.2, M * 0.04], [cx + rx * 0.5, cy + ry * 1.62, M * 0.03]], 5); cellFill(cx + rx * 0.4, cy + ry * 1.2, M * 0.12, c1, 0.3); glowStroke(c1, 1.4, 7);
      ctx.beginPath(); ctx.ellipse(cx + rx * 0.68, cy + ry * 0.72, rx * 0.34, ry * 0.42, -0.25, 0, TAU); cellFill(cx + rx * 0.68, cy + ry * 0.72, rx * 0.34, c2, 0.28); glowStroke(c2, 1.4, 7);
      ctx.beginPath(); for (let i = -2; i <= 2; i++) { const y = cy + ry * (0.72 + i * 0.13); ctx.moveTo(cx + rx * 0.43, y); ctx.quadraticCurveTo(cx + rx * 0.68, y + ry * 0.08, cx + rx * 0.97 - Math.abs(i) * rx * 0.05, y - ry * 0.08); } ctx.strokeStyle = hexA(c2, .55); ctx.lineWidth = 0.9; ctx.stroke();
      const brain = () => { ctx.beginPath(); for (let i = 0; i <= 140; i++) { const a = i / 140 * TAU, b = 1 + 0.03 * Math.sin(a * 13), x = cx + Math.cos(a) * rx * b, y = cy + Math.sin(a) * ry * b * (Math.sin(a) > 0 ? 0.78 : 1.1); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); };
      brain(); cellFill(cx, cy, rx, c1, 0.28); glowStroke(c1, 2, 13);
      ctx.save(); brain(); ctx.clip();
      ctx.beginPath();
      for (let r = 0; r < 6; r++) {
        const y0 = cy - ry * 0.95 + r * ry * 0.38;
        for (let i = 0; i <= 44; i++) { const f = i / 44, x = cx - rx * 1.05 + f * rx * 2.1, y = y0 + Math.sin(f * 15 + r * 2.1) * ry * 0.1 + Math.sin(f * 6 + r) * ry * 0.09; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      }
      ctx.strokeStyle = hexA(c2, .5); ctx.lineWidth = 1.1; ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 9; i++) { const on = Math.pow((Math.sin(t * 2.4 + i * 2.4) + 1) / 2, 3), a = i * 2.4; if (on > 0.05 || opts.still) dot(cx + Math.cos(a) * rx * (0.25 + (i % 4) * 0.2), cy + Math.sin(a) * ry * (0.2 + (i % 3) * 0.28), Math.max(1, M * (0.008 + on * 0.012)), hexA(c2, 0.3 + on * 0.7), 4 + on * 14); }
    },
    24(t, w, hgt, c1, c2) { // coral reef
      const M = Math.min(w, hgt), base = hgt * 0.84, branches = new Path2D(), tips = [];
      const coral = (x, y, a, len, depth, seed) => {
        const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len;
        branches.moveTo(x, y); branches.lineTo(nx, ny);
        if (!depth) { tips.push([nx, ny]); return; }
        for (const s of [-1, 1]) coral(nx, ny, a + s * (0.36 + 0.14 * Math.sin(seed * 3.3)) + Math.sin(t * 0.9 + seed) * 0.015, len * 0.78, depth - 1, seed + s + 3);
      };
      coral(w / 2 - M * 0.24, base, -Math.PI / 2 - 0.12, M * 0.14, 4, 1);
      ctx.strokeStyle = c1; ctx.lineWidth = Math.max(1.3, M * 0.011); ctx.lineCap = 'round'; ctx.shadowColor = c1; ctx.shadowBlur = 7 * (1 + glowBoost); ctx.stroke(branches); ctx.shadowBlur = 0; ctx.lineCap = 'butt';
      ctx.beginPath(); tips.forEach(([x, y]) => { ctx.moveTo(x + M * 0.009, y); ctx.arc(x, y, Math.max(0.9, M * 0.009), 0, TAU); }); ctx.fillStyle = c2; ctx.fill();
      const bx = w / 2 + M * 0.13, br = M * 0.16;
      ctx.beginPath(); ctx.arc(bx, base, br, Math.PI, 0); ctx.closePath(); cellFill(bx, base - br * 0.4, br, c2, 0.3); glowStroke(c2, 1.5, 8);
      ctx.save(); ctx.beginPath(); ctx.arc(bx, base, br, Math.PI, 0); ctx.clip(); ctx.beginPath();
      for (let r = 1; r < 5; r++) for (let i = 0; i <= 36; i++) { const a = Math.PI + i / 36 * Math.PI, rr = br * (r / 5) + Math.sin(a * 14 + r) * br * 0.04, x = bx + Math.cos(a) * rr, y = base + Math.sin(a) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.strokeStyle = hexA(c1, .55); ctx.lineWidth = 0.9; ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(w / 2 - M * 0.5, base + M * 0.01); ctx.quadraticCurveTo(w / 2, base - M * 0.03, w / 2 + M * 0.5, base + M * 0.01); ctx.lineTo(w / 2 + M * 0.46, base + M * 0.09); ctx.quadraticCurveTo(w / 2, base + M * 0.12, w / 2 - M * 0.46, base + M * 0.09); ctx.closePath(); ctx.fillStyle = hexA(c2, .16); ctx.fill(); glowStroke(c1, 1.2, 6);
      for (let i = 0; i < 4; i++) {
        const f = (t * (0.05 + i * 0.012) + i * 0.29) % 1, x = w / 2 - M * 0.46 + f * M * 0.92, y = hgt * (0.2 + i * 0.11) + Math.sin(t * 1.3 + i * 2) * M * 0.015, r = M * (0.03 + (i % 2) * 0.008);
        ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.46, 0, 0, TAU); ctx.moveTo(x - r * 0.9, y); ctx.lineTo(x - r * 1.5, y - r * 0.45); ctx.lineTo(x - r * 1.5, y + r * 0.45); ctx.closePath(); ctx.fillStyle = hexA(i % 2 ? c2 : c1, .85); ctx.shadowColor = c1; ctx.shadowBlur = 6; ctx.fill(); ctx.shadowBlur = 0;
      }
    },
    25(t, w, hgt, c1, c2) { // tree of life
      const M = Math.min(w, hgt), cx = w / 2, base = hgt * 0.72, depths = [], leaves = new Path2D();
      const grow = (x, y, a, len, d, seed) => {
        const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len, p = depths[d] = depths[d] || new Path2D();
        p.moveTo(x, y); p.lineTo(nx, ny);
        if (!d) { leaves.moveTo(nx + M * 0.012, ny); leaves.arc(nx, ny, Math.max(1, M * 0.012), 0, TAU); return; }
        const sway = Math.sin(t * 0.8 + seed) * 0.018;
        grow(nx, ny, a - 0.4 - 0.1 * Math.sin(seed * 2.1) + sway, len * 0.76, d - 1, seed * 1.3 + 1);
        grow(nx, ny, a + 0.4 + 0.1 * Math.sin(seed * 3.7) + sway, len * 0.76, d - 1, seed * 1.7 + 2);
      };
      grow(cx, base, -Math.PI / 2, M * 0.17, 6, 1);
      ctx.lineCap = 'round'; ctx.shadowColor = c1; ctx.shadowBlur = 6 * (1 + glowBoost); ctx.strokeStyle = c1;
      depths.forEach((p, d) => { if (p) { ctx.lineWidth = Math.max(0.8, M * 0.0048 * (d + 0.7)); ctx.stroke(p); } });
      ctx.beginPath();
      for (const s of [-3, -1.6, -0.5, 0.5, 1.6, 3]) { ctx.moveTo(cx, base - M * 0.01); ctx.quadraticCurveTo(cx + s * M * 0.03, base + M * 0.09, cx + s * M * 0.1, base + M * (0.2 - Math.abs(s) * 0.03)); }
      ctx.lineWidth = Math.max(1, M * 0.01); ctx.stroke(); ctx.shadowBlur = 0; ctx.lineCap = 'butt';
      ctx.fillStyle = c2; ctx.shadowColor = c2; ctx.shadowBlur = 6 * (1 + glowBoost); ctx.fill(leaves); ctx.shadowBlur = 0;
    },
    26(t, w, hgt, c1, c2) { // biosphere
      const M = Math.min(w, hgt), cx = w / 2, cy = hgt / 2, R = M * 0.33, spin = t * 0.14;
      const air = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.32); air.addColorStop(0, hexA(c1, .4)); air.addColorStop(1, hexA(c1, 0)); ctx.fillStyle = air; ctx.beginPath(); ctx.arc(cx, cy, R * 1.32, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); cellFill(cx, cy, R, c1, 0.34); glowStroke(c1, 1.8, 16);
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
      for (const [lon, lat, sz, seed] of [[0.2, 0.55, 0.3, 1], [0.9, 0.15, 0.27, 2], [1.9, -0.45, 0.22, 3], [3.0, 0.5, 0.34, 4], [3.7, -0.3, 0.2, 5], [4.8, 0.2, 0.28, 6], [5.6, -0.6, 0.16, 7]]) {
        const a = lon + spin, z = Math.cos(a) * Math.cos(lat); if (z < -0.1) continue;
        const x = cx + R * Math.sin(a) * Math.cos(lat), y = cy - R * Math.sin(lat), sq = Math.max(0.14, Math.cos(a));
        ctx.save(); ctx.translate(x, y); ctx.scale(sq, 1); blob(0, 0, R * sz, seed, seed * 1.9, 0.2, 40); ctx.restore();
        ctx.fillStyle = hexA(c2, .68); ctx.fill();
      }
      ctx.beginPath();
      for (let k = 0; k < 4; k++) { const y = cy + R * (-0.65 + k * 0.42), x0 = cx - R + ((t * 0.04 + k * 0.31) % 1) * R * 1.6; ctx.moveTo(x0, y); ctx.bezierCurveTo(x0 + R * 0.2, y - R * 0.08, x0 + R * 0.4, y + R * 0.08, x0 + R * 0.68, y); }
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = Math.max(1, M * 0.009); ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt';
      ctx.restore();
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * TAU + t * 0.4, x = cx + Math.cos(a) * R * 1.3, y = cy + Math.sin(a) * R * 0.42;
        if (Math.sin(a) < 0 && Math.hypot(x - cx, y - cy) < R) continue;
        dot(x, y, Math.max(0.9, M * (0.008 + 0.006 * (i % 3))), irid(i * 30 + t * 40), 7);
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
    const halo = ctx.createRadialGradient(w / 2, hh / 2, 0, w / 2, hh / 2, Math.min(w, hh) * 0.48);
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
    return () => { document.removeEventListener('keydown', onKey); stopSpecs(); root = null; keyHandler = null; sess = null; clearInterval(sprintTimer); clearInterval(planTimer); };
  },
});
let keyHandler = null;

function ring(frac, label, sub) {
  const r = 34, c = 2 * Math.PI * r, f = clamp(frac, 0, 1);
  return `<div class="fc-ring"><svg viewBox="0 0 84 84"><defs><filter id="fc-ring-glow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#34D399" flood-opacity=".6"/></filter></defs><circle cx="42" cy="42" r="${r}" class="track"/><circle cx="42" cy="42" r="${r}" class="fill" filter="url(#fc-ring-glow)" style="stroke-dasharray:${c};stroke-dashoffset:${c * (1 - f)}"/></svg><div class="fc-ring-label"><b>${label}</b><span>${sub}</span></div></div>`;
}

function dashboard() {
  stopSpecs(); keyHandler = null;
  const lv = levelOf(S.xp), st = stageOf(lv.L), stage = STAGES[st], next = STAGES[st + 1];
  const day = dayRec(), stk = streak();
  const all = counts(scopeCards('all'));
  const opt = counts(scopeCards('optional'));
  const newToday = Math.min(all.fresh, newLeftToday());
  const subjects = [...new Set(D.decks.map(d => d.subject))];
  const newBadges = checkBadges();
  root.innerHTML = `<div class="fc-view">
    <section class="fc-hero">
      <div class="fc-spec"><canvas class="fc-spec-canvas"></canvas></div>
      <div class="fc-hero-main">
        <div class="fc-kicker">Specimen · stage ${st + 1} of ${STAGES.length}</div>
        <div class="fc-name"><span class="fc-name-text">${esc(S.name || stage.name)}</span><button class="clickable-icon fc-rename" title="Name your specimen">${icon('pencil')}</button></div>
        ${S.name ? `<div class="fc-stage">${esc(stage.name)}</div>` : ''}
        <div class="fc-level"><span class="fc-lv">Level ${lv.L}</span><div class="fc-xpbar"><div style="width:${(lv.into / lv.need * 100).toFixed(1)}%"></div></div><span class="fc-xpnum">${lv.into} / ${lv.need} XP</span></div>
        <div class="fc-next">${next ? `Next evolution at level ${next.at}` : 'Final form reached'}</div>
      </div>
      <div class="fc-hero-side">
        ${ring(day.n / S.goal, day.n, `of ${S.goal} today`)}
        <div class="fc-streak${stk ? ' is-on' : ''}">${icon('flame')}<b>${stk}</b><span>day streak</span></div>
      </div>
    </section>
    ${focusBar()}
    <section class="fc-actions">
      <button class="fc-big mod-cta" data-study="all"${all.due + newToday + (focusNow() && !focusNow().plan ? waiting(focusIds(focusNow())).length : 0) ? '' : ' disabled'}>${icon('play')}<span><b>Study now</b><small>${all.due} due · ${newToday} new</small></span></button>
      <button class="fc-big" data-sprint>${icon('timer')}<span><b>Sprint</b><small>60 seconds · best ${S.best.sprint}</small></span></button>
      <div class="fc-stats"><div><b>${all.total}</b><span>cards</span></div><div><b>${all.total - all.fresh}</b><span>seen</span></div><div><b>${all.mast}</b><span>mastered</span></div><div><b>${totalReviews()}</b><span>reviews</span></div></div>
    </section>
    <section class="fc-plans"><div class="fc-section-title">Exam plans <span class="fc-title-actions"><button class="fc-mini" data-choose>${icon('list')} Choose what to study</button><button class="fc-mini" data-plan-new>${icon('plus')} New plan</button></span></div>
      ${S.plans.length ? `<div class="fc-plan-grid">${S.plans.slice().sort((a, b) => a.due - b.due).map(planCard).join('')}</div>` : '<div class="fc-plan-empty">Set a deadline for some lectures to get a day-by-day plan and a card set for it.</div>'}</section>
    <section class="fc-decks">${subjects.map(sub => {
      const decks = D.decks.filter(d => d.subject === sub);
      const sc = counts(scopeCards('subject:' + sub));
      return `<div class="fc-subject"><div class="fc-subject-head"><span>${esc(sub)}</span><button class="fc-mini" data-study="subject:${esc(sub)}"${sc.due + Math.min(sc.fresh, newLeftToday()) ? '' : ' disabled'}>Study all · ${sc.due} due</button></div>
        ${decks.map(d => { const c = counts(deckCards(d.id)); const pct = c.total ? c.mast / c.total * 100 : 0; const seen = c.total ? (c.total - c.fresh) / c.total * 100 : 0;
          return `<div class="fc-deck" data-study="${esc(d.id)}"><div class="fc-deck-name">${esc(d.name)}<span>${c.total} cards</span></div>
            <div class="fc-deck-bar" title="${Math.round(seen)}% seen, ${Math.round(pct)}% mastered"><i style="width:${seen}%"></i><b style="width:${pct}%"></b></div>
            <div class="fc-deck-due">${c.due ? `<span class="due">${c.due} due</span>` : ''}${c.fresh ? `<span class="new">${c.fresh} new</span>` : ''}${!c.due && !c.fresh ? `<span class="done">${icon('check')}</span>` : ''}</div></div>`; }).join('')}</div>`;
    }).join('')}${opt.total ? `<div class="fc-subject"><div class="fc-subject-head"><span>Optional</span></div>
        <div class="fc-deck" data-study="optional"><div class="fc-deck-name">Optional<span>${opt.total} cards</span></div>
          <div class="fc-deck-bar" title="${Math.round((opt.total - opt.fresh) / opt.total * 100)}% seen, ${Math.round(opt.mast / opt.total * 100)}% mastered"><i style="width:${(opt.total - opt.fresh) / opt.total * 100}%"></i><b style="width:${opt.mast / opt.total * 100}%"></b></div>
          <div class="fc-deck-due"><span class="new">${opt.total} optional</span></div></div></div>` : ''}</section>
    <section class="fc-cabinet"><div class="fc-section-title">Evolution</div><div class="fc-evo">${STAGES.map((s, i) => `<div class="fc-evo-item${i <= st ? ' is-unlocked' : ''}${i === st ? ' is-current' : ''}"><canvas data-stage="${i}"></canvas><b>${i <= st ? esc(s.name) : '???'}</b><span>Level ${s.at}</span></div>`).join('')}</div></section>
    <section class="fc-cabinet"><div class="fc-section-title">Badges <span>${Object.keys(S.badges).length} of ${BADGES.length}</span></div><div class="fc-badges">${BADGES.map(b => `<div class="fc-badge${S.badges[b.id] ? ' is-earned' : ''}" title="${esc(b.desc)}">${icon(S.badges[b.id] ? 'trophy' : 'lock')}<b>${esc(b.name)}</b><span>${esc(b.desc)}</span></div>`).join('')}</div></section>
    <div class="fc-section-title fc-settings-head">Settings</div>
    <section class="fc-footer">
      <label>New cards a day <input type="number" min="0" max="200" value="${S.newPerDay}" data-set="newPerDay"></label>
      <label>Daily goal <input type="number" min="5" max="500" value="${S.goal}" data-set="goal"></label>
      <span class="spacer"></span>
      <button class="fc-mini" data-export>${icon('download')} Export progress</button>
      <label class="fc-mini fc-import">${icon('upload')} Import<input type="file" accept="application/json" hidden></label>
      <button class="fc-mini fc-danger" data-reset>Reset</button>
    </section>
    ${accountBarHtml()}
  </div>`;
  const spec = mountSpec($('.fc-spec-canvas', root), { stage: st });
  if (!B.isPhone()) $$('.fc-evo canvas', root).forEach(cv => { const i = +cv.dataset.stage; mountSpec(cv, { stage: i, locked: i > st, still: i !== st }); });
  tickPlans();
  if (newBadges.length) B.toast('Badge earned: ' + newBadges.map(b => b.name).join(', '));
  root.onclick = e => {
    if (B.isPhone()) {      // long lists fold away on a phone
      const fold = e.target.closest('.fc-cabinet .fc-section-title, .fc-settings-head');
      if (fold) { fold.classList.toggle('is-open'); if (fold.parentElement.matches('.fc-cabinet') && !fold.dataset.drawn) { fold.dataset.drawn = '1'; $$('canvas', fold.parentElement).forEach(cv => { const i = +cv.dataset.stage; mountSpec(cv, { stage: i, locked: i > st, still: true }); }); } return; }
      const head = e.target.closest('.fc-subject-head');
      if (head && !e.target.closest('button')) { head.parentElement.classList.toggle('is-open'); return; }
    }
    if (e.target.closest('[data-focus-clear]')) { clearFocus(); return dashboard(); }
    if (e.target.closest('[data-choose]')) return focusPicker(null);
    const sb = e.target.closest('[data-study]'); if (sb && !sb.disabled) return startSession(sb.dataset.study);
    if (e.target.closest('[data-plan-new]')) return planForm();
    const ps = e.target.closest('[data-plan-study]'); if (ps && !ps.disabled) return startSession('plan:' + ps.dataset.planStudy);
    const po = e.target.closest('[data-plan-open], .fc-plan'); if (po) { const p = S.plans.find(x => x.id === (po.dataset.planOpen || po.dataset.plan)); if (p) return planView(p); }
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
  wireAccountBar();
  return spec;
}

/* ---------------------------------------------------------------- study session */
function normalQueue(scope) {
  if (scope.startsWith('plan:') || scope.startsWith('cram:')) { const p = S.plans.find(x => x.id === scope.slice(5)); return p ? planQueue(p, scope.startsWith('cram:')) : []; }
  const ids = scopeCards(scope), now = Date.now();
  const due = skippedLast(ids.filter(id => !isNew(id) && S.cards[id].due <= now).sort((a, b) => S.cards[a].due - S.cards[b].due)).slice(0, 200);
  const pool = skippedLast(ids.filter(isNew));
  // the daily limit is for the general queues. A section picked by hand opens whatever the day's count.
  const cap = scope === 'all' || scope.startsWith('subject:') ? newLeftToday() : Infinity;
  const q = reviewsAndNew(due, pool.slice(0, cap));
  q.reserve = pool.slice(cap);
  return q;
}
function buildQueue(scope) {
  const q = normalQueue(scope), f = focusNow();
  if (!f || (f.plan ? scope !== 'plan:' + f.plan : scope !== 'all')) return q;
  const list = waiting(focusIds(f));
  if (!list.length) { clearFocus(); return q; }
  const now = Date.now(), chosen = new Set(list);
  const out = reviewsAndNew(skippedLast(list.filter(id => isDue(id, now)).sort((a, b) => S.cards[a].due - S.cards[b].due)), skippedLast(list.filter(isNew))).concat(q.filter(id => !chosen.has(id)));
  out.reserve = (q.reserve || []).filter(id => !chosen.has(id));
  out.focus = { ids: chosen, label: f.label };
  return out;
}
function sessionHeader() {
  return `<div class="fc-session-top">
    <button class="clickable-icon" data-quit title="End session">${icon('x')}</button>
    <button class="clickable-icon fc-undo" data-undo title="Undo last rating (U)" hidden>${icon('rotate')}</button>
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
  sess = { plan: /^(plan|cram):/.test(scope) ? S.plans.find(x => x.id === scope.slice(5)) : null, scope, queue, total: queue.length, done: 0, right: 0, combo: 0, xp: 0, levels: [], startStage: stageOf(lv.L), startedAt: Date.now(), seen: new Set(),
    skipped: [], skips: 0, reserve: queue.reserve || [], focus: queue.focus || null, undo: [], gesture: {}, pushed: false };
  if (B.isPhone()) { history.pushState({ fcSession: 1 }, ''); sess.pushed = true; }    // the back button ends the session, not the page
  openSession();
  nextCard();
}
function openSession() {
  root.onclick = null;
  root.innerHTML = `<div class="fc-session">${sessionHeader()}<div class="fc-stage-area"></div><div class="fc-controls"></div></div>`;
  sess.spec = mountSpec($('.fc-mini-spec canvas', root), { stage: stageOf(levelOf(S.xp).L) });
  $('[data-quit]', root).onclick = finishSession;
  $('[data-undo]', root).onclick = undoRating;
  wireSwipe($('.fc-stage-area', root));
}
window.addEventListener('popstate', () => { if (sess && sess.pushed && root) { sess.pushed = false; finishSession(); } });
// every card screen shares the keys for skip and undo
const sessionKeys = (fn, canSkip = true) => e => {
  const k = e.key.toLowerCase();
  if (k === 'u' && !e.ctrlKey && !e.metaKey) return undoRating();
  if (k === 's' && canSkip && !e.ctrlKey && !e.metaKey) return skipCard();
  fn(e);
};
function updateTop() {
  $('.fc-progress div', root).style.width = (sess.done / Math.max(1, sess.done + sess.queue.length + sess.skipped.length) * 100) + '%';
  $('[data-undo]', root).hidden = !sess.undo.length;
  const cb = $('.fc-combo', root); $('.fc-combo-n', cb).textContent = sess.combo; cb.classList.toggle('is-hot', sess.combo >= 5);
}
/* a skip leaves no mark on the card: it moves to a pile for this session, and a skipped new card lets the
   next new one in, so skipping can't use up the day's new cards. */
function skipCard() {
  if (!sess || !sess.queue.length || sess.gesture.noSkip) return;
  const id = sess.queue.shift();
  sess.skipped.push(id); sess.skips++; rememberSkip(id);
  if (isNew(id) && sess.reserve.length) sess.queue.push(sess.reserve.shift());
  keyHandler = null;
  floatXP(0, 'Skipped');
  nextCard();
}
// the pile only comes back when asked for, so skipping can never turn into a loop
function skippedGate() {
  const n = sess.skipped.length;
  const area = $('.fc-stage-area', root), ctr = $('.fc-controls', root);
  sess.gesture = { noSkip: true };
  area.onclick = null;
  area.innerHTML = `<div class="fc-card fc-gate"><h3>${n} skipped card${n === 1 ? '' : 's'} left</h3><p>That's everything else in this session. Skipped cards haven't changed.</p></div>`;
  ctr.innerHTML = `<div class="fc-gate-actions"><button class="fc-continue mod-cta" data-pile>Go through them</button><button class="fc-continue" data-finish>Finish</button></div>`;
  const go = () => { sess.queue = sess.skipped; sess.skipped = []; nextCard(); };
  ctr.onclick = e => { if (e.target.closest('[data-pile]')) go(); else if (e.target.closest('[data-finish]')) finishSession(); };
  keyHandler = sessionKeys(e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }, false);
}
/* undo the last rating: everything grade() changed goes back and the card is shown again. Devices keep the
   copy of a card with more reps, so the restored card takes one more than the rating it undoes; a card that
   was new has no copy to keep, so S.undone records which rating is void. */
function undoRating() {
  const u = sess && sess.undo.pop(); if (!u) return;
  const rated = S.cards[u.id];
  if (u.card) S.cards[u.id] = Object.assign({}, u.card, { reps: rated.reps + 1 });
  else { S.undone[u.id] = rated.reps; delete S.cards[u.id]; }
  S.xp = u.xp; S.days[u.day] = u.dayRec; S.best.combo = u.bestCombo;
  if (sess.plan && u.planLog) sess.plan.log[u.day] = u.planLog;
  Object.assign(sess, u.sess);
  sess.seen = new Set(u.seen);
  if (u.focus && !focusNow()) store.set(FOCUS_KEY, u.focus);
  save();
  keyHandler = null;
  B.toast('Rating undone');
  nextCard();
}
function wireSwipe(area) {
  const LABEL = { right: 'Good', left: 'Again', up: 'Skip' };
  let g = null;
  const reset = () => { const c = $('.fc-card', area); if (c) { c.style.transition = ''; c.style.transform = ''; } const l = $('.fc-swipe-label', area); if (l) l.remove(); };
  area.addEventListener('touchstart', e => {
    g = null;
    const t = e.touches[0];
    if (!B.isPhone() || !sess || e.touches.length > 1 || t.clientX < 16 || t.clientX > innerWidth - 16 || e.target.closest('button, a, summary')) return;
    g = { x: t.clientX, y: t.clientY, dir: null, dx: 0, dy: 0 };
  }, { passive: true });
  area.addEventListener('touchmove', e => {
    if (!g || e.touches.length > 1) return;
    const t = e.touches[0], dx = t.clientX - g.x, dy = t.clientY - g.y;
    if (!g.dir) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      const atEnd = area.scrollTop + area.clientHeight >= area.scrollHeight - 2;
      if (Math.abs(dx) > Math.abs(dy)) g.dir = sess.gesture.rate ? (dx > 0 ? 'right' : 'left') : 'none';
      else g.dir = dy < 0 && atEnd && !sess.gesture.noSkip ? 'up' : 'none';     // otherwise it's a normal scroll
      if (g.dir !== 'none') area.appendChild(h(`<div class="fc-swipe-label ${g.dir}">${LABEL[g.dir]}</div>`));
    }
    if (g.dir === 'none') return;
    e.preventDefault();
    g.dx = g.dir === 'up' ? 0 : dx; g.dy = g.dir === 'up' ? Math.min(0, dy) : 0;
    const c = $('.fc-card', area); if (c) c.style.transform = `translate(${g.dx}px,${g.dy}px) rotate(${g.dx / 28}deg)`;
    const need = g.dir === 'up' ? 90 : innerWidth * 0.3;
    const l = $('.fc-swipe-label', area); if (l) l.style.opacity = Math.min(1, Math.abs(g.dx || g.dy) / need);
  }, { passive: false });
  const end = () => {
    if (!g || !g.dir || g.dir === 'none') { g = null; return; }
    const { dir, dx, dy } = g; g = null;
    const passed = dir === 'up' ? -dy >= 90 : Math.abs(dx) >= innerWidth * 0.3;
    reset();
    if (!passed || !sess) return;
    if (dir === 'up') skipCard(); else sess.gesture.rate(dir === 'right' ? 2 : 0);
  };
  area.addEventListener('touchend', end);
  area.addEventListener('touchcancel', () => { g = null; reset(); });
}
function nextCard() {
  updateTop();
  sess.gesture = {};
  if (sess.focus && !sess.queue.concat(sess.skipped).some(id => sess.focus.ids.has(id))) {
    B.toast(`Finished ${sess.focus.label}. Back to the normal plan.`);
    clearFocus(); sess.focus = null;
  }
  if (!sess.queue.length) return sess.skipped.length ? skippedGate() : finishSession();
  const id = sess.queue[0], card = D.byId.get(id); if (!card) { sess.queue.shift(); return nextCard(); }
  const deck = D.deckById.get(card.deck) || { name: '', subject: '' };
  const fresh = isNew(id);
  const area = $('.fc-stage-area', root), ctr = $('.fc-controls', root);
  const optional = isOptional(id);
  const tag = optional ? '<span class="fc-tag-new">Optional</span>' : fresh ? '<span class="fc-tag-new">New</span>' : '';
  const meta = `<div class="fc-card-meta"><span>${esc(deck.subject)} › ${esc(deck.name)}</span><span class="fc-meta-right">${tag}<button class="fc-mini fc-opt-toggle" data-optional="${esc(id)}">${optional ? 'Make core' : 'Make optional'}</button><button class="clickable-icon fc-card-menu" data-card-menu aria-label="Card options">${icon('sliders')}</button></span></div>`;
  const source = `<a class="fc-source" data-note="${esc(card.note)}">${icon('file')} ${esc(B.titleOf(card.note))}</a>`;
  if (card.type === 'mcq') {
    const letters = 'ABCDEFGH';
    area.innerHTML = `<div class="fc-card is-mcq">${meta}<div class="fc-front">${card.front}</div><div class="fc-options">${card.options.map((o, i) => `<button class="fc-opt" data-o="${i}"><b>${letters[i]}</b><span>${o}</span></button>`).join('')}</div><div class="fc-back fc-mcq-back" hidden>${card.back || ''}${source}</div></div>`;
    ctr.innerHTML = `<div class="fc-hint">Pick an answer · keys 1–${card.options.length}</div><button class="fc-skip" data-skip>Skip <kbd>S</kbd></button>`;
    ctr.onclick = e => { if (e.target.closest('[data-skip]')) skipCard(); };
    const choose = i => {
      if (area.dataset.answered) return; area.dataset.answered = '1';
      const ok = i === card.answer;
      $$('.fc-opt', area).forEach((b, k) => { b.disabled = true; b.classList.toggle('is-right', k === card.answer); b.classList.toggle('is-wrong', k === i && !ok); });
      $('.fc-mcq-back', area).hidden = false;
      grade(id, ok ? 2 : 0, fresh);
      sess.gesture = { noSkip: true };
      updateTop();
      ctr.innerHTML = `<button class="fc-continue mod-cta">Continue <kbd>Space</kbd></button>`;
      ctr.onclick = null;
      $('.fc-continue', ctr).onclick = advance;
      keyHandler = sessionKeys(e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance(); } }, false);
    };
    area.onclick = e => { const ob = e.target.closest('[data-optional]'); if (ob) return toggleOptionalMidSession(id); const cm = e.target.closest('[data-card-menu]'); if (cm) return cardMenu(cm, id, optional); const b = e.target.closest('.fc-opt'); if (b) choose(+b.dataset.o); clickSource(e); };
    keyHandler = sessionKeys(e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= card.options.length) choose(n - 1); });
  } else {
    const front = card.type === 'term' ? `<div class="fc-term">${card.front}</div><div class="fc-prompt">Define this term</div>` : `<div class="fc-front">${card.front}</div>`;
    area.innerHTML = `<div class="fc-card fc-flip"><div class="fc-face fc-face-front">${meta}${front}<div class="fc-tap">Tap to reveal</div></div><div class="fc-face fc-face-back">${meta}${card.type === 'term' ? `<div class="fc-term small">${card.front}</div>` : `<div class="fc-front small">${card.front}</div>`}<div class="fc-back">${card.back}</div>${source}</div></div>`;
    const flipEl = $('.fc-flip', area);
    const reveal = () => {
      if (flipEl.classList.contains('is-flipped')) return;
      flipEl.classList.add('is-flipped');
      const labels = ['Again', 'Hard', 'Good', 'Easy'];
      ctr.innerHTML = `<div class="fc-grades">${labels.map((l, g) => `<button class="fc-grade g${g}" data-g="${g}"><b>${l}</b><span>${preview(id, g)}</span><kbd>${g + 1}</kbd></button>`).join('')}</div><button class="fc-skip" data-skip>Skip <kbd>S</kbd></button>`;
      const rate = g => { grade(id, g, fresh); advance(); };
      sess.gesture = { rate };
      ctr.onclick = e => { if (e.target.closest('[data-skip]')) return skipCard(); const b = e.target.closest('[data-g]'); if (b) rate(+b.dataset.g); };
      keyHandler = sessionKeys(e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 4) rate(n - 1); });
    };
    flipEl.onclick = e => { if (e.target.closest('[data-optional]')) return toggleOptionalMidSession(id); const cm = e.target.closest('[data-card-menu]'); if (cm) return cardMenu(cm, id, optional); if (clickSource(e)) return; reveal(); };
    ctr.innerHTML = `<button class="fc-skip" data-skip>Skip <kbd>S</kbd></button><button class="fc-continue mod-cta">Show answer <kbd>Space</kbd></button>`;
    ctr.onclick = e => { if (e.target.closest('[data-skip]')) skipCard(); };
    $('.fc-continue', ctr).onclick = reveal;
    keyHandler = sessionKeys(e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); reveal(); } });
  }
}
function cardMenu(anchor, id, optional) {
  B.showMenu(anchor, [{ icon: 'bookmark', title: optional ? 'Make core' : 'Make optional', run: () => toggleOptionalMidSession(id) }]);
}
// leaves the session without a grade: no schedule change, no XP, no day/plan counts
function toggleOptionalMidSession(id) {
  setOptional(id, !isOptional(id));
  if (!sess) return;
  keyHandler = null;
  sess.queue = sess.queue.filter(x => x !== id); sess.skipped = sess.skipped.filter(x => x !== id);
  nextCard();
}
function clickSource(e) {
  const s = e.target.closest('.fc-source, a.internal-link');
  if (!s) return false;
  e.preventDefault(); e.stopPropagation();
  if (B.isPhone() && B.V.notes[s.dataset.note]) B.sheet(B.noteTitle(s.dataset.note), B.noteHtml(s.dataset.note, { noProps: true }));   // stays in the session
  else B.go(s.dataset.note, null, true);
  return true;
}
function grade(id, g, fresh) {
  const ok = g >= 2;
  sess.undo.push({ id, card: S.cards[id], xp: S.xp, day: today(), dayRec: Object.assign({}, dayRec()), bestCombo: S.best.combo,
    planLog: sess.plan ? Object.assign({}, plog(sess.plan)) : null, seen: [...sess.seen], focus: focusNow(),
    sess: { queue: sess.queue.slice(), done: sess.done, right: sess.right, combo: sess.combo, xp: sess.xp, levels: sess.levels.slice(), focus: sess.focus } });
  if (sess.undo.length > 5) sess.undo.shift();
  S.cards[id] = schedule(S.cards[id], g);
  if (S.cards[id].reps <= (S.undone[id] || 0)) S.cards[id].reps = S.undone[id] + 1;   // a new rating after an undo counts
  const d = dayRec(); d.n++; if (ok) d.ok++; if (fresh && !isOptional(id) && !sess.seen.has(id)) d.fresh++;
  if (sess.plan) { const r = plog(sess.plan); r.n++; if (fresh && !sess.seen.has(id)) r.fresh++; }
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
  markPlanDays();
  save();
}
function advance() { keyHandler = null; nextCard(); }
function finishSession() {
  keyHandler = null;
  if (!sess) return dashboard();
  const s = sess; sess = null;
  if (s.pushed) { s.pushed = false; history.back(); }
  stopSpecs();
  const lv = levelOf(S.xp), st = stageOf(lv.L);
  const evolved = st > s.startStage;
  const badges = checkBadges();
  const acc = s.done ? Math.round(s.right / s.done * 100) : 0;
  root.innerHTML = `<div class="fc-summary">
    <div class="fc-sum-spec${evolved ? ' is-evolving' : ''}"><canvas></canvas></div>
    ${evolved ? `<div class="fc-evolved">${icon('sparkles')} Evolved into ${esc(aStage(STAGES[st].name))}</div>` : ''}
    <h2>${s.done ? 'Session complete' : 'Session ended'}</h2>
    <div class="fc-sum-grid"><div><b>${s.done}</b><span>reviews</span></div><div><b>${acc}%</b><span>correct</span></div><div><b>+${s.xp}</b><span>XP</span></div><div><b>${Math.round((Date.now() - s.startedAt) / 60000)}m</b><span>time</span></div></div>
    ${s.skips ? `<div class="fc-note">${s.skips} skip${s.skips === 1 ? '' : 's'}. Skipped cards are unchanged and stay in your queue.</div>` : ''}
    <div class="fc-level"><span class="fc-lv">Level ${lv.L}</span><div class="fc-xpbar"><div style="width:${(lv.into / lv.need * 100).toFixed(1)}%"></div></div><span class="fc-xpnum">${lv.into} / ${lv.need}</span></div>
    ${badges.length ? `<div class="fc-sum-badges">${badges.map(b => `<span>${icon('trophy')} ${esc(b.name)}</span>`).join('')}</div>` : ''}
    <div class="fc-sum-actions"><button class="mod-cta" data-again>Keep going</button><button data-home>${s.plan ? 'Back to plan' : 'Back to decks'}</button>${s.undo.length ? '<button data-undo-last>Undo last rating</button>' : ''}</div>
  </div>`;
  const spec = mountSpec($('.fc-sum-spec canvas', root), { stage: evolved ? s.startStage : st });
  if (evolved) setTimeout(() => { spec.stage(st); spec.react('level'); }, 900);
  else if (s.levels.length) spec.react('level');
  root.onclick = e => {
    if (e.target.closest('[data-undo-last]')) { stopSpecs(); sess = s; openSession(); return undoRating(); }
    if (e.target.closest('[data-again]')) startSession(s.scope); else if (e.target.closest('[data-home]')) { if (s.plan && S.plans.includes(s.plan)) planView(s.plan); else dashboard(); }
  };
  keyHandler = null;
}

/* ---------------------------------------------------------------- sprint */
let sprintTimer = null;
function sprintPool() {
  const terms = D.cards.filter(c => c.type === 'term' && !S.optional[c.id]);
  const mcqs = D.cards.filter(c => c.type === 'mcq' && !S.optional[c.id]);
  return { terms, mcqs };
}
function sprintQuestion(pool) {
  // to plain text, entities included: the text is escaped once more where it's shown
  const strip = s => { const t = document.createElement('template'); t.innerHTML = s; return t.content.textContent.replace(/\s+/g, ' ').trim(); };
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

/* ---------------------------------------------------------------- progress page
   A month grid modelled on a habit tracker. Exam plan rows tick themselves; with no plan running the
   Daily goal stands in. Gym, reading and football are logged by hand against a weekly target. */
const HABITS = [
  { id: 'gym', name: 'Gym', per: 4 },
  { id: 'reading', name: 'Reading, 20 mins', per: 4 },
  { id: 'football', name: 'Football practice', per: 1, weekdays: true },
];
const mondayOf = t => { const s = dayStart(t); return addDays(s, -((new Date(s).getDay() + 6) % 7)); };
const planLastDay = p => { const d = dayStart(p.due); return Math.max(dayStart(p.created), new Date(p.due).getHours() >= 15 ? d : addDays(d, -1)); };
const planRuns = (p, t) => t >= dayStart(p.created) && t <= planLastDay(p);
// a day's target was never stored, so past days rebuild it: cards unseen now plus those learned since
function pastPlanDay(p, t, st) {
  const key = today(t), lastDay = planLastDay(p), log = p.log[key] || {};
  const buffer = Math.max(1, daysBetween(p.created, lastDay) + 1) >= 4 ? 1 : 0;
  const newDays = Math.max(0, daysBetween(t, lastDay) + 1 - buffer);
  if (!newDays) return { target: 0, done: (log.n || 0) > 0 };   // review only
  let left = st.fresh; for (const [d, r] of Object.entries(p.log)) if (d >= key) left += r.fresh || 0;
  const target = Math.ceil(left / newDays);
  return { target, done: target > 0 && (log.fresh || 0) >= target };
}
function todayPlanDone(p, st) {
  const worked = ((p.log[today()] || {}).n || 0) + ((S.days[today()] || {}).n || 0) > 0;
  return worked && !st.due && (st.newDays ? !st.todayLeft : true);
}
// a tick stays once earned, so it is written into the plan's log
function markPlanDays() {
  const now = dayStart(Date.now());
  for (const p of S.plans) {
    let st = null; const stats = () => st || (st = planStats(p));
    for (const [key, r] of Object.entries(p.log)) { const t = new Date(key + 'T12:00').getTime(); if (!r.done && dayStart(t) < now && planRuns(p, dayStart(t)) && pastPlanDay(p, dayStart(t), stats()).done) r.done = 1; }
    if (planRuns(p, now) && !(p.log[today()] || {}).done && todayPlanDone(p, stats())) plog(p).done = 1;
  }
}
function planCell(p, t, st, now) {
  if (!planRuns(p, t)) return { state: 'off' };
  const log = p.log[today(t)] || {};
  if (t > now) return { state: 'future' };
  const nums = `${log.fresh || 0} new, ${log.n || 0} reviews`;
  if (t === now) return log.done ? { state: 'done', tip: nums } : { state: 'today', tip: `${st.todayLeft} new and ${st.due} reviews left today` };
  const past = pastPlanDay(p, t, st);
  return { state: log.done || past.done ? 'done' : 'miss', tip: past.target ? `${nums}, target ${past.target} new` : nums };
}
const firstActive = () => { const k = Object.keys(S.days).filter(d => S.days[d].n).sort()[0]; return k ? dayStart(new Date(k + 'T12:00').getTime()) : Infinity; };
function goalCell(t, now) {
  if (S.plans.some(p => planRuns(p, t))) return { state: 'off' };
  if (t > now) return { state: 'future' };
  const n = (S.days[today(t)] || {}).n || 0, tip = `${n} of ${S.goal} reviews`;
  if (n >= S.goal) return { state: 'done', tip };
  return t === now ? { state: 'today', tip } : t < firstActive() ? { state: 'off' } : { state: 'miss', tip };
}
function dailyPct(t, now, stats) {
  if (t > now) return null;
  const run = S.plans.filter(p => planRuns(p, t));
  const pct = run.length ? Math.round(run.filter(p => planCell(p, t, stats(p), now).state === 'done').length / run.length * 100)
    : t < firstActive() ? null : Math.min(100, Math.round(((S.days[today(t)] || {}).n || 0) / S.goal * 100));
  return t === now && !pct ? null : pct;      // today isn't a zero until it's over
}
const habitOn = (h, t) => ((S.habits[h.id] || {})[today(t)] || 0) > 0;
const isWeekend = t => [0, 6].includes(new Date(t).getDay());
const weekCount = (h, monday) => { let n = 0; for (let i = 0; i < 7; i++) if (habitOn(h, addDays(monday, i))) n++; return n; };
function habitWeeks(h, days, now) {        // weeks finished in this range or already hit, from the habit's first tick
  const ticks = Object.keys(S.habits[h.id] || {}).filter(d => S.habits[h.id][d] > 0).sort();
  if (!ticks.length) return { hit: 0, of: 0 };
  const start = mondayOf(new Date(ticks[0] + 'T12:00').getTime());
  const mondays = [...new Set(days.map(mondayOf))].filter(m => m <= now && m >= start);
  const hit = mondays.filter(m => weekCount(h, m) >= h.per).length;
  return { hit, of: mondays.filter(m => addDays(m, 7) <= now || weekCount(h, m) >= h.per).length };
}
function trendSvg(vals, labels, max, unit) {
  const W = 640, H = 250, L = 34, R = 14, T = 14, B_ = 26, n = labels.length;
  const x = i => L + (n > 1 ? i / (n - 1) : 0.5) * (W - L - R), y = v => T + (1 - v / max) * (H - T - B_);
  const pts = vals.map((v, i) => v == null ? null : [x(i), y(v), i]).filter(Boolean);
  const grid = [0, .25, .5, .75, 1].map(f => { const v = f * max; return `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 7}" y="${y(v) + 3.5}" text-anchor="end">${Math.round(v)}</text>`; }).join('');
  const ticks = labels.map((l, i) => i % Math.ceil(n / 8) === 0 ? `<text class="pg-x" x="${x(i)}" y="${H - 7}" text-anchor="middle">${l}</text>` : '').join('');
  if (!pts.length) return `<svg class="pg-svg" viewBox="0 0 ${W} ${H}"><g class="pg-grid">${grid}</g>${ticks}</svg><div class="pg-nodata">Nothing to show for these days yet.</div>`;
  const yTop = T, yBot = H - B_, cl = v => Math.max(yTop, Math.min(yBot, v));
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 2)], b = pts[i - 1], c = pts[i], e = pts[Math.min(pts.length - 1, i + 1)];
    d += ` C${b[0] + (c[0] - a[0]) / 6} ${cl(b[1] + (c[1] - a[1]) / 6)} ${c[0] - (e[0] - b[0]) / 6} ${cl(c[1] - (e[1] - b[1]) / 6)} ${c[0]} ${c[1]}`;
  }
  const last = pts[pts.length - 1], avg = vals.filter(v => v != null).reduce((s, v) => s + v, 0) / pts.length;
  const area = `${d} L${last[0]} ${yBot} L${pts[0][0]} ${yBot} Z`;
  const dots = pts.map(p => `<circle class="pg-hit" cx="${p[0]}" cy="${p[1]}" r="9"><title>${labels[p[2]]}: ${vals[p[2]]}${unit}</title></circle>`).join('');
  return `<svg class="pg-svg" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="pg-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34D399" stop-opacity=".42"/><stop offset="1" stop-color="#34D399" stop-opacity="0"/></linearGradient></defs>
    <g class="pg-grid">${grid}</g>${ticks}<path d="${area}" fill="url(#pg-fill)"/><path class="pg-line" d="${d}"/>
    <line class="pg-avg" x1="${L}" x2="${W - R}" y1="${y(avg)}" y2="${y(avg)}"/><text class="pg-avgt" x="${W - R}" y="${y(avg) - 6}" text-anchor="end">avg ${Math.round(avg)}${unit}</text>
    <circle class="pg-end" cx="${last[0]}" cy="${last[1]}" r="5"/>${dots}</svg>`;
}
let pgRoot = null;
const pg = { anchor: dayStart(Date.now()), mode: 'pct' };
const DAYS2 = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
function pgRange() {
  if (B.isPhone()) { const m = mondayOf(pg.anchor); return Array.from({ length: 7 }, (_, i) => addDays(m, i)); }
  const a = new Date(pg.anchor), len = new Date(a.getFullYear(), a.getMonth() + 1, 0).getDate();
  return Array.from({ length: len }, (_, i) => dayStart(new Date(a.getFullYear(), a.getMonth(), i + 1).getTime()));
}
function pgRender() {
  const root = pgRoot; if (!root) return;
  const old = $('.pg-scroll', root), scroll = old ? old.scrollLeft : null;
  markPlanDays();
  const now = dayStart(Date.now()), days = pgRange(), phone = B.isPhone();
  const cache = new Map(), stats = p => { if (!cache.has(p)) cache.set(p, planStats(p)); return cache.get(p); };
  const shown = days.filter(t => t <= now);
  const plans = S.plans.filter(p => days.some(t => planRuns(p, t))).sort((a, b) => a.due - b.due);
  const showGoal = !S.plans.some(p => planRuns(p, now)) || shown.some(t => goalCell(t, now).state !== 'off');
  const weeks = []; days.forEach(t => { const m = mondayOf(t), w = weeks[weeks.length - 1]; if (w && w.m === m) w.n++; else weeks.push({ m, n: 1 }); });
  let weekNo = 0;
  const weekLabel = w => phone ? (days.includes(now) ? 'THIS WEEK' : '') : w.n > 2 ? `WEEK ${++weekNo}` : '';
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const head = days.map(t => { const d = new Date(t); return `<th class="pg-day${t === now ? ' is-today' : ''}${isWeekend(t) ? ' is-end' : ''}"><span>${DAYS2[d.getDay()]}</span><b>${d.getDate()}</b></th>`; }).join('');
  const rate = label => `<td class="pg-rate"><b>${label}</b></td>`;
  const cellHtml = c => `<td class="${c.today ? 'is-today' : ''}"><span class="pg-box s-${c.state}"${c.tip ? ` title="${esc(c.tip)}"` : ''}>${c.state === 'done' ? icon('check') : ''}</span></td>`;
  const cardRow = (name, sub, cell) => {
    const cells = days.map(t => Object.assign(cell(t), { today: t === now }));
    const judged = days.map((t, i) => [t, cells[i]]).filter(([t, c]) => c.state === 'done' || c.state === 'miss');
    const hit = judged.filter(([, c]) => c.state === 'done').length, pct = judged.length ? Math.round(hit / judged.length * 100) : 0;
    return { html: `<tr><th class="pg-name"><b title="${esc(name)}">${esc(name)}</b><small>${esc(sub)}</small></th>${cells.map(cellHtml).join('')}${phone ? '' : rate(judged.length ? pct + '%' : '–')}</tr>`, name, sub: `${hit} of ${plural(judged.length, 'day')} · ${sub}`, pct, has: judged.length > 0 };
  };
  const cardRows = plans.map(p => cardRow(p.name, 'Due ' + fmtDate(p.due), t => planCell(p, t, stats(p), now)));
  if (showGoal) cardRows.push(cardRow('Daily goal', `${S.goal} reviews a day`, t => goalCell(t, now)));
  const thisMonday = mondayOf(now);
  const habitRows = HABITS.map(h => {
    const cells = days.map(t => {
      const on = habitOn(h, t), off = t > now || (h.weekdays && isWeekend(t));
      return `<td class="${t === now ? 'is-today' : ''}"><button class="pg-box ${off ? 's-off' : on ? 's-done' : 's-open'}" data-habit="${h.id}" data-day="${t}"${off ? ' disabled' : ''} aria-label="${esc(h.name)}, ${esc(fmtDate(t))}" aria-pressed="${on}">${on ? icon('check') : ''}</button></td>`;
    }).join('');
    const w = habitWeeks(h, days, now), pct = w.of ? Math.round(w.hit / w.of * 100) : 0;
    return { html: `<tr><th class="pg-name"><b>${esc(h.name)}</b><small>${weekCount(h, thisMonday)}/${h.per} this week</small></th>${cells}${phone ? '' : rate(w.of ? `${w.hit}/${plural(w.of, 'wk')}` : '–')}</tr>`, name: h.name, sub: `${w.hit} of ${plural(w.of, 'week')} on target`, pct, has: w.of > 0 };
  });
  const daily = days.map(t => dailyPct(t, now, stats));
  const known = daily.filter(v => v != null), mean = known.length ? Math.round(known.reduce((s, v) => s + v, 0) / known.length) : null;
  const dailyRow = `<tr class="pg-daily"><th class="pg-name"><span>Daily %</span></th>${days.map((t, i) => `<td class="${t === now ? 'is-today' : ''}">${daily[i] == null ? '<em>·</em>' : daily[i]}</td>`).join('')}${phone ? '' : `<td class="pg-rate"><b>${mean == null ? '–' : mean + '%'}</b></td>`}</tr>`;
  const section = label => `<tr class="pg-sec"><th class="pg-name">${label}</th><td colspan="${days.length + (phone ? 0 : 1)}"></td></tr>`;
  const a = new Date(pg.anchor);
  const title = phone ? `${fmtDate(days[0])} to ${fmtDate(days[6])}` : a.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const atNow = days.includes(now);
  const labels = days.map(t => phone ? DAYS2[new Date(t).getDay()] : String(new Date(t).getDate()));
  const rec = t => S.days[today(t)] || {};
  const series = {
    pct: { vals: days.map((t, i) => daily[i]), max: 100, unit: '%' },
    reviews: { vals: days.map(t => t > now ? null : rec(t).n || 0), max: Math.max(10, Math.ceil(Math.max(0, ...shown.map(t => rec(t).n || 0)) / 20) * 20), unit: '' },
    accuracy: { vals: days.map(t => rec(t).n ? Math.round((rec(t).ok || 0) / rec(t).n * 100) : null), max: 100, unit: '%' },
  }[pg.mode];
  const bars = [...cardRows, ...habitRows].filter(r => r.has);
  root.innerHTML = `<div class="fc-view pg-view">
    <div class="pg-top"><div><h2>Progress</h2><p>Plans tick themselves. ${phone ? 'Tap' : 'Click'} a square to log a habit.</p></div>
      <div class="pg-nav"><button class="fc-mini" data-shift="-1" aria-label="Earlier">${icon('chevron-left')}</button><b>${esc(title)}</b><button class="fc-mini" data-shift="1" aria-label="Later"${atNow ? ' disabled' : ''}>${icon('chevron-right')}</button></div></div>
    <section class="pg-card pg-scroll"><table class="pg-table">
      <thead><tr><th class="pg-name pg-corner" rowspan="2">${days.length} days</th>${weeks.map((w, i) => `<th class="pg-week w${i % 5}" colspan="${w.n}">${weekLabel(w)}</th>`).join('')}${phone ? '' : '<th class="pg-ratehead" rowspan="2">RATE</th>'}</tr><tr>${head}</tr></thead>
      <tbody>${section('Cards')}${cardRows.map(r => r.html).join('')}${section('Habits')}${habitRows.map(r => r.html).join('')}${dailyRow}</tbody></table></section>
    <div class="pg-lower">
      <section class="pg-card"><div class="pg-cardhead"><h3>Progress Trend</h3><div class="pg-modes">${[['pct', 'Daily %'], ['reviews', 'Reviews'], ['accuracy', 'Accuracy']].map(([k, l]) => `<button class="fc-mini${pg.mode === k ? ' is-on' : ''}" data-mode="${k}">${l}</button>`).join('')}</div></div>${trendSvg(series.vals, labels, series.max, series.unit)}</section>
      <section class="pg-card"><div class="pg-cardhead"><h3>Analysis</h3><span>${phone ? 'this week' : 'this month'}</span></div>
        ${bars.length ? bars.map(r => `<div class="pg-bar"><div><b title="${esc(r.name)}">${esc(r.name)}</b><span>${r.pct}%</span></div><i><u style="width:${r.pct}%"></u></i><small>${esc(r.sub)}</small></div>`).join('') : '<div class="pg-nodata">Nothing to rate yet.</div>'}</section>
    </div></div>`;
  const sc = $('.pg-scroll', root);
  if (scroll != null) sc.scrollLeft = scroll;
  else { const c = $('.pg-day.is-today', root); if (c) sc.scrollLeft = Math.max(0, c.offsetLeft - sc.clientWidth / 2); }
  root.onclick = e => {
    const hb = e.target.closest('[data-habit]');
    if (hb && !hb.disabled) {
      const m = S.habits[hb.dataset.habit] = S.habits[hb.dataset.habit] || {}, key = today(+hb.dataset.day);
      m[key] = (m[key] || 0) > 0 ? -Date.now() : Date.now();   // the sign is the state, the size says which change is newest
      save(); return pgRender();
    }
    const sh = e.target.closest('[data-shift]');
    if (sh && !sh.disabled) { const n = +sh.dataset.shift, d = new Date(pg.anchor); pg.anchor = dayStart(phone ? addDays(pg.anchor, n * 7) : new Date(d.getFullYear(), d.getMonth() + n, 1).getTime()); $('.pg-scroll', root).scrollLeft = 0; return pgRender(); }
    const md = e.target.closest('[data-mode]');
    if (md) { pg.mode = md.dataset.mode; pgRender(); }
  };
}
B.registerView('progress', {
  title: () => 'Progress', icon: 'chart', cls: 'fc-host',
  show(view) {
    pgRoot = view; pg.anchor = dayStart(Date.now());
    view.innerHTML = `<div class="fc-loading"><span class="books-spinner"></span> Loading progress…</div>`;
    const draw = () => { if (pgRoot === view) pgRender(); };
    loadCards().then(() => { draw(); if (account.user) sync().then(draw); }).catch(() => { view.innerHTML = '<div class="pane-empty">Could not load your progress.</div>'; });
    return () => { pgRoot = null; };
  },
});

// every page load while signed in: pull the server copy in
if (account.user) sync().then(() => { if (D && root && $('.fc-account', root)) dashboard(); });
})();
