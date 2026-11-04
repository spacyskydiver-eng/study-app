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
function blank() { return { v: 1, xp: 0, name: '', cards: {}, days: {}, best: { sprint: 0, combo: 0 }, badges: {}, optional: {}, optionalAt: {}, undone: {}, plansGone: {}, newPerDay: 20, goal: 40, plans: [], created: Date.now() }; }
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
];
const stageOf = L => { let i = 0; STAGES.forEach((s, k) => { if (L >= s.at) i = k; }); return i; };

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
    ${evolved ? `<div class="fc-evolved">${icon('sparkles')} Evolved into a ${esc(STAGES[st].name)}</div>` : ''}
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

// every page load while signed in: pull the server copy in
if (account.user) sync().then(() => { if (D && root && $('.fc-account', root)) dashboard(); });
})();
