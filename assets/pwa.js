/* The installed app: registers the offline copy, keeps cards and their diagrams ready for no signal,
   and picks up a new deploy when the app comes back to the front. A phone keeps an installed app in
   memory for days, so waiting for the next cold start isn't enough. */
(() => {
'use strict';
if (!('serviceWorker' in navigator)) return;

// cards load only when Flashcards opens, and diagrams only when a card is shown: fetch them once while online
async function warm() {
  await navigator.serviceWorker.ready;
  try {
    const [cards] = await Promise.all([fetch('data/cards.json', { cache: 'no-cache' }).then(r => r.json()), fetch('data/exams.json', { cache: 'no-cache' })]);
    const imgs = new Set();
    for (const c of cards.cards) for (const m of String(c.front + c.back).matchAll(/src="([^"]+)"/g)) imgs.add(m[1]);
    for (const src of imgs) if (!(await caches.match(src))) await fetch(src).catch(() => {});
  } catch (e) { /* offline or locked: the next open tries again */ }
}

let running = null;
const busy = () => !!document.querySelector('.fc-session, .exam-q') || /^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName || '');
async function checkVersion() {
  try {
    const r = await fetch('/api/ping', { cache: 'no-store', credentials: 'same-origin' });
    if (!r.ok) return;
    const v = (await r.json()).version;
    if (!v) return;
    if (running == null) running = v;
    else if (v !== running && !busy()) location.reload();
  } catch (e) { /* offline */ }
}
window.addEventListener('load', () => {
  navigator.serviceWorker.register('/sw.js').then(() => { warm(); checkVersion(); }).catch(() => {});
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkVersion(); });
window.addEventListener('online', () => { warm(); checkVersion(); });
})();
