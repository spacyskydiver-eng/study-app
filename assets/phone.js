/* The phone shell: a bottom bar for the main sections, a More sheet for the rest, bottom sheets, and a
   plain linked-notes page in place of the graph. Only runs on phones; desktop never sees any of it
   (the layout itself is in phone.css, under body.is-phone). */
(() => {
'use strict';
const B = window.BV;
const { icon, esc, $, h, store } = B;

/* ---------------------------------------------------------------- bottom sheets */
function closeSheet() { const s = $('.ph-sheet-wrap'); if (s) s.remove(); }
function sheet(title, html, onclick) {
  closeSheet();
  const el = h(`<div class="ph-sheet-wrap"><div class="ph-sheet-scrim"></div><div class="ph-sheet" role="dialog" aria-label="${esc(title)}">
    <div class="ph-sheet-head"><b>${esc(title)}</b><button class="clickable-icon" data-close aria-label="Close">${icon('x')}</button></div>
    <div class="ph-sheet-body">${html}</div></div></div>`);
  el.addEventListener('click', e => {
    if (e.target.closest('[data-close]') || e.target.classList.contains('ph-sheet-scrim')) return closeSheet();
    const a = e.target.closest('a.internal-link'); if (a) e.preventDefault();
    if (onclick) onclick(e);
  });
  document.body.appendChild(el);
  return el;
}
B.sheet = sheet;

/* ---------------------------------------------------------------- the linked notes page */
function linkRows(ids) { return ids.filter(id => B.V.notes[id]).map(id => `<a class="ph-link" href="${esc(B.hashFor(id))}">${icon('file')}<span>${esc(B.noteTitle(id))}</span></a>`).join(''); }
B.registerView('linked', {
  title: () => 'Linked notes', icon: 'link',
  show(view) {
    const recent = store.get('recent', []).filter(id => B.V.notes[id]);
    const from = recent[0];
    const most = Object.keys(B.V.notes).map(id => [id, B.backlinksOf(id).length]).sort((a, b) => b[1] - a[1]).slice(0, 15).map(x => x[0]);
    view.innerHTML = `<div class="ph-page"><p class="ph-lead">The map needs a bigger screen. Here is what it connects.</p>
      ${from ? `<h2>Links to ${esc(B.noteTitle(from))}</h2>${linkRows(B.backlinksOf(from).slice(0, 30)) || '<p class="ph-lead">Nothing links here yet.</p>'}` : ''}
      <h2>Most linked notes</h2>${linkRows(most)}</div>`;
  },
});

/* ---------------------------------------------------------------- bottom bar */
const TABS = [
  { id: 'home', label: 'Home', ic: 'home' },
  { id: 'notes', label: 'Notes', ic: 'book-open' },
  { id: 'cards', label: 'Cards', ic: 'cards' },
  { id: 'search', label: 'Search', ic: 'search' },
  { id: 'more', label: 'More', ic: 'menu' },
];
const leftOpen = () => { const l = $('#left'); return l && !l.classList.contains('is-collapsed'); };
function moreSheet() {
  const row = (id, ic, label) => (id && !B.exists(id) ? '' : `<button class="ph-more-row" data-go="${esc(id)}">${icon(ic)}<span>${esc(label)}</span></button>`);
  const nova = B.isNova();
  const el = sheet('More', `
    ${row('progress', 'chart', 'Progress')}
    ${row('exam', 'clipboard-list', 'Exam practice')}
    ${row('books', 'library', 'Book library')}
    ${row('glossary', 'book-open', 'Key terms')}
    ${row('watchlist', 'trending-up', 'Biotech investing')}
    ${row('markets', 'candles', 'Markets')}
    ${row('mail', 'mail', 'Mail')}
    ${row('calendar', 'calendar', 'Calendar')}
    ${$('.na-dock') ? `<button class="ph-more-row" data-ask>${icon('sparkles')}<span>Ask the assistant</span></button>` : ''}
    <button class="ph-more-row" data-bookmarks>${icon('bookmark')}<span>Bookmarks</span></button>
    <button class="ph-more-row" data-theme>${icon(document.body.classList.contains('theme-dark') ? 'moon' : 'sun')}<span>Light or dark</span></button>
    <button class="ph-more-row" data-mode>${icon('zap')}<span>Interface: ${nova ? 'Nova' : 'Classic'}</span></button>`, e => {
    const g = e.target.closest('[data-go]');
    if (g) { closeSheet(); B.go(g.dataset.go); }
    else if (e.target.closest('[data-ask]')) { closeSheet(); $('.na-dock').click(); }
    else if (e.target.closest('[data-bookmarks]')) { closeSheet(); B.setLeftPane('bookmarks'); B.setSide('left', true); paint(); }
    else if (e.target.closest('[data-theme]')) { closeSheet(); B.toggleTheme(); }
    else if (e.target.closest('[data-mode]')) B.openUiModeMenu(e.target.closest('[data-mode]'));
  });
  return el;
}
function act(id) {
  closeSheet();
  if (id === 'more') { B.setSide('left', false); B.setSide('right', false); moreSheet(); return paint(); }
  if (id === 'notes' || id === 'search') {
    const pane = id === 'notes' ? 'files' : 'search';
    if (leftOpen() && $(`#left .sidebar-tab.is-active[data-pane="${pane}"]`)) B.setSide('left', false);
    else { B.setLeftPane(pane); B.setSide('left', true); }
    return paint();
  }
  B.setSide('left', false); B.setSide('right', false);
  B.go(id === 'home' ? B.V.home : 'flashcards');
  paint();
}
function paint() {
  const bar = $('#ph-bar'); if (!bar) return;
  const cur = B.currentId();
  const pane = leftOpen() ? ($('#left .sidebar-tab.is-active') || { dataset: {} }).dataset.pane : null;
  const on = pane === 'files' ? 'notes' : pane === 'search' ? 'search' : $('.ph-sheet-wrap') ? 'more' : cur === B.V.home ? 'home' : cur === 'flashcards' ? 'cards' : '';
  bar.querySelectorAll('button').forEach(b => { b.classList.toggle('is-active', b.dataset.tab === on); b.setAttribute('aria-current', b.dataset.tab === on ? 'page' : 'false'); });
}
function contentsButton() {
  const head = $('.mobile-header'); if (!head || $('[data-ph-contents]', head)) return;
  const btn = h(`<button class="clickable-icon" data-ph-contents aria-label="Contents">${icon('list')}</button>`);
  btn.onclick = () => { B.setRightPane('outline'); B.setSide('right', true); };
  head.appendChild(btn);
}
function mount() {
  if (!B.isPhone() || $('#ph-bar') || !$('#app .workspace')) return;
  const bar = h(`<nav id="ph-bar" aria-label="Main">${TABS.map(t => `<button data-tab="${t.id}">${icon(t.ic)}<span>${t.label}</span></button>`).join('')}</nav>`);
  bar.onclick = e => { const b = e.target.closest('[data-tab]'); if (b) act(b.dataset.tab); };
  document.body.appendChild(bar);
  contentsButton();
  paint();
}
const tryMount = () => { if ($('#app .workspace')) { mount(); paint(); } else setTimeout(tryMount, 200); };
tryMount();
window.addEventListener('hashchange', () => { closeSheet(); setTimeout(paint, 0); });
window.matchMedia('(pointer: coarse)').addEventListener('change', mount);
window.addEventListener('resize', mount);

/* the on-screen keyboard shrinks the visual viewport: the bar gets out of its way */
if (window.visualViewport) {
  let tall = window.visualViewport.height;
  window.visualViewport.addEventListener('resize', () => {
    tall = Math.max(tall, window.visualViewport.height);
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '');
    document.body.classList.toggle('ph-typing', typing && window.visualViewport.height < tall - 120);
  });
  window.addEventListener('orientationchange', () => { tall = 0; });
}
})();
