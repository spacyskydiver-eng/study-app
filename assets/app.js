/* Biomedicine Vault: an Obsidian-style reader for the vault.
   Data comes from data/vault.json, built by tools/build_site.py.
   Extra views (flashcards, book library) live in their own files and register through window.BV. */
(() => {
'use strict';

/* ------------------------------------------------------------------ icons */
const ICON = {
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'arrow-left': '<path d="m12 19-7-7 7-7M19 12H5"/>',
  'arrow-right': '<path d="M5 12h14M12 5l7 7-7 7"/>',
  'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'folder': '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  'files': '<path d="M20 7h-3a2 2 0 0 1-2-2V2"/><path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z"/><path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8"/>',
  'file': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  'graph': '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/>',
  'home': '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  'shuffle': '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
  'bookmark': '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  'panel-left': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  'panel-right': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/>',
  'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  'link-out': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  'list': '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  'layers': '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
  'canvas': '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  'x': '<path d="M18 6 6 18M6 6l12 12"/>',
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'minus': '<path d="M5 12h14"/>',
  'maximize': '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  'sliders': '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
  'menu': '<path d="M4 6h16M4 12h16M4 18h16"/>',
  'book-open': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  'library': '<path d="m16 6 4 14M12 6v14M8 8v12M4 4v16"/>',
  'pencil': '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  'clipboard-list': '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
  'help-circle': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
  'quote': '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2.02-2-2H4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .01-1 1.03V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.76-2.02-2-2h-4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>',
  'image': '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  'map': '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
  'key': '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  'flame': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  'check': '<path d="M20 6 9 17l-5-5"/>',
  'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
  'zap': '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  'bug': '<rect width="8" height="14" x="8" y="6" rx="4"/><path d="m19 7-3 2M5 7l3 2M19 19l-3-2M5 19l3-2M20 13h-4M4 13h4M10 4l1 2M14 4l-1 2"/>',
  'cards': '<rect width="16" height="12" x="4" y="7" rx="2"/><path d="M8 3h10a2 2 0 0 1 2 2v8"/>',
  'copy': '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  'dna': '<path d="M2 15c6.667-6 13.333 0 20-6M9 22c1.798-1.998 2.518-3.995 2.807-5.993M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="m17 6-2.5-2.5M14 8l-1-1M7 18l2.5 2.5M3.5 14.5l.5.5M20 9l.5.5M6.5 12.5l1 1M16.5 10.5l1 1M10 16l1.5 1.5"/>',
  'cell': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><circle cx="6.5" cy="9" r="1"/><circle cx="17" cy="15.5" r="1.2"/><circle cx="16" cy="7.5" r=".8"/>',
  'orbit': '<circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><path d="M10.4 21.9a10 10 0 0 0 9.941-15.416M13.5 2.1a10 10 0 0 0-9.841 15.416"/>',
  'play': '<polygon points="6 3 20 12 6 21 6 3"/>',
  'pause': '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  'trophy': '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  'timer': '<path d="M10 2h4M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
  'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  'rotate': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  'sparkles': '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"/>',
  'lock': '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
};
const icon = (n, cls = '') => `<svg class="svg-icon ${cls}" viewBox="0 0 24 24">${ICON[n] || ICON.file}</svg>`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const store = {
  get(k, d) { try { const v = localStorage.getItem('bv:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('bv:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
};
const isMobile = () => window.matchMedia('(max-width: 900px)').matches;
const canHover = () => window.matchMedia('(hover: hover)').matches;
const CANVAS_COLORS = { '1': '#fb464c', '2': '#e9973f', '3': '#e0de71', '4': '#44cf6e', '5': '#53dfdd', '6': '#a882ff' };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* ------------------------------------------------------------------ data and view registry */
let V = null;
const backlinks = {};
const SPECIAL = {};   // exact ids such as 'graph'
const PREFIXED = [];  // ids such as 'book/Alberts 7e/412'
const hooks = { hydrate: [], boot: [] };
function viewFor(id) {
  if (SPECIAL[id]) return SPECIAL[id];
  return PREFIXED.find(p => id.startsWith(p.prefix)) || null;
}
const titleOf = id => {
  const sv = viewFor(id); if (sv) return sv.title(id);
  return V.notes[id] ? V.notes[id].title : id.endsWith('.canvas') ? id.split('/').pop().replace(/\.canvas$/, '') : id.split('/').pop();
};
const iconOf = id => { const sv = viewFor(id); return sv ? sv.icon : id.endsWith('.canvas') ? 'canvas' : 'file'; };
const exists = id => !!(V.notes[id] || V.canvases[id] || viewFor(id));

function prepare() {
  for (const [id, n] of Object.entries(V.notes)) {
    n.html = n.html.replace(/<div class="callout-icon" data-icon="([\w-]+)"><\/div>/g, (m, i) => `<div class="callout-icon">${icon(i)}</div>`);
    for (const t of n.links) (backlinks[t] = backlinks[t] || new Set()).add(id);
    n.lower = (n.title + ' ' + n.text).toLowerCase();
  }
  for (const [id, c] of Object.entries(V.canvases)) {
    for (const t of c.links) (backlinks[t] = backlinks[t] || new Set()).add(id);
    for (const node of c.nodes) if (node.html) node.html = node.html.replace(/<div class="callout-icon" data-icon="([\w-]+)"><\/div>/g, (m, i) => `<div class="callout-icon">${icon(i)}</div>`);
  }
}

/* ------------------------------------------------------------------ layout */
const state = {
  tabs: store.get('tabs', null),
  active: store.get('activeTab', 0),
  leftOpen: store.get('leftOpen', true),
  rightOpen: store.get('rightOpen', true),
  leftPane: store.get('leftPane', 'files'),
  rightPane: store.get('rightPane', 'backlinks'),
  collapsed: new Set(store.get('collapsed', [])),
  expandedOnce: store.get('expandedOnce', false),
};

function shell() {
  const app = $('#app');
  app.innerHTML = `
  <div class="workspace-ribbon">
    <button class="clickable-icon" data-act="toggle-left" title="Toggle left sidebar">${icon('panel-left')}</button>
    <button class="clickable-icon" data-act="pane-files" title="Files">${icon('files')}</button>
    <button class="clickable-icon" data-act="pane-search" title="Search (Ctrl+Shift+F)">${icon('search')}</button>
    <button class="clickable-icon" data-act="switcher" title="Quick switcher (Ctrl+O)">${icon('arrow-right')}</button>
    <button class="clickable-icon" data-act="graph" title="Graph view (Ctrl+G)">${icon('graph')}</button>
    <button class="clickable-icon" data-act="open" data-id="flashcards" title="Flashcards">${icon('cards')}</button>
    <button class="clickable-icon" data-act="open" data-id="books" title="Book library">${icon('library')}</button>
    <button class="clickable-icon" data-act="home" title="Home">${icon('home')}</button>
    <button class="clickable-icon" data-act="random" title="Random note">${icon('shuffle')}</button>
    <div class="spacer"></div>
    <button class="clickable-icon" data-act="theme" title="Light or dark">${icon('moon')}</button>
  </div>
  <div class="workspace">
    <div class="workspace-split mod-left-split" id="left">
      <div class="sidebar-tabs">
        <button class="sidebar-tab" data-pane="files" title="Files">${icon('files')}</button>
        <button class="sidebar-tab" data-pane="search" title="Search">${icon('search')}</button>
        <button class="sidebar-tab" data-pane="bookmarks" title="Bookmarks">${icon('bookmark')}</button>
      </div>
      <div class="sidebar-pane" data-pane="files"><div class="nav-files-container" id="explorer"></div></div>
      <div class="sidebar-pane" data-pane="search">
        <div class="search-input-wrap">${icon('search')}<input class="search-input" id="search" type="search" placeholder="Search notes…" autocomplete="off"></div>
        <div class="search-summary" id="search-summary"></div><div id="search-results"></div>
      </div>
      <div class="sidebar-pane" data-pane="bookmarks"><div id="bookmarks"></div></div>
    </div>
    <div class="resize-handle" data-side="left"></div>
    <div class="workspace-split mod-root">
      <div class="mobile-header">
        <button class="clickable-icon" data-act="toggle-left">${icon('menu')}</button>
        <button class="clickable-icon" data-act="back">${icon('chevron-left')}</button>
        <div class="title" id="mobile-title"></div>
        <button class="clickable-icon" data-act="switcher">${icon('search')}</button>
        <button class="clickable-icon" data-act="open" data-id="flashcards">${icon('cards')}</button>
        <button class="clickable-icon" data-act="graph">${icon('graph')}</button>
        <button class="clickable-icon" data-act="toggle-right">${icon('link')}</button>
      </div>
      <div class="workspace-tab-header-container" id="tabbar"></div>
      <div class="view-header">
        <button class="clickable-icon" data-act="back" title="Back">${icon('arrow-left')}</button>
        <button class="clickable-icon" data-act="forward" title="Forward">${icon('arrow-right')}</button>
        <div class="view-header-title-container" id="crumbs"></div>
        <button class="clickable-icon" data-act="local-graph" title="Local graph">${icon('graph')}</button>
        <button class="clickable-icon" data-act="toggle-right" title="Toggle right sidebar">${icon('panel-right')}</button>
      </div>
      <div class="workspace-leaf-content" id="leaf" style="flex:1;min-height:0;display:flex;flex-direction:column">
        <div class="view-content" id="view"></div>
      </div>
    </div>
    <div class="resize-handle" data-side="right"></div>
    <div class="workspace-split mod-right-split" id="right">
      <div class="sidebar-tabs">
        <button class="sidebar-tab" data-rpane="backlinks" title="Backlinks">${icon('link')}</button>
        <button class="sidebar-tab" data-rpane="outgoing" title="Outgoing links">${icon('link-out')}</button>
        <button class="sidebar-tab" data-rpane="outline" title="Outline">${icon('list')}</button>
        <button class="sidebar-tab" data-rpane="localgraph" title="Local graph">${icon('graph')}</button>
      </div>
      <div class="sidebar-pane" data-rpane="backlinks" id="pane-backlinks"></div>
      <div class="sidebar-pane" data-rpane="outgoing" id="pane-outgoing"></div>
      <div class="sidebar-pane" data-rpane="outline" id="pane-outline"></div>
      <div class="sidebar-pane workspace-leaf-content" data-type="localgraph" data-rpane="localgraph" id="pane-localgraph"></div>
    </div>
  </div>
  <div class="sidebar-scrim" id="scrim"></div>
  <div class="status-bar" id="status"></div>`;
  wireShell();
  wireLinks($('#view'));
}

function setLeftPane(p) {
  state.leftPane = p; store.set('leftPane', p);
  $$('#left .sidebar-tab').forEach(b => b.classList.toggle('is-active', b.dataset.pane === p));
  $$('#left .sidebar-pane').forEach(b => b.classList.toggle('is-active', b.dataset.pane === p));
  $$('.workspace-ribbon [data-act^="pane-"]').forEach(b => b.classList.toggle('is-active', b.dataset.act === 'pane-' + p && state.leftOpen));
  if (p === 'search') setTimeout(() => $('#search').focus(), 30);
}
function setRightPane(p) {
  state.rightPane = p; store.set('rightPane', p);
  $$('#right .sidebar-tab').forEach(b => b.classList.toggle('is-active', b.dataset.rpane === p));
  $$('#right .sidebar-pane').forEach(b => b.classList.toggle('is-active', b.dataset.rpane === p));
  renderRight();
}
function setSide(side, open) {
  if (side === 'left') { state.leftOpen = open; if (!isMobile()) store.set('leftOpen', open); }
  else { state.rightOpen = open; if (!isMobile()) store.set('rightOpen', open); }
  $('#left').classList.toggle('is-collapsed', !state.leftOpen);
  $('#right').classList.toggle('is-collapsed', !state.rightOpen);
  $('#scrim').classList.toggle('is-visible', isMobile() && (state.leftOpen || state.rightOpen));
  if (side === 'right' && open) renderRight();
}

function wireShell() {
  document.body.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act;
    if (a === 'toggle-left') setSide('left', !state.leftOpen);
    else if (a === 'toggle-right') setSide('right', !state.rightOpen);
    else if (a.startsWith('pane-')) { const p = a.slice(5); if (state.leftOpen && state.leftPane === p) setSide('left', false); else { setSide('left', true); setLeftPane(p); } }
    else if (a === 'graph') { go('graph'); if (isMobile()) setSide('left', false); }
    else if (a === 'open') { go(b.dataset.id, null, e.ctrlKey || e.metaKey); if (isMobile()) setSide('left', false); }
    else if (a === 'home') go(V.home);
    else if (a === 'random') { const ids = Object.keys(V.notes); go(ids[Math.floor(Math.random() * ids.length)]); }
    else if (a === 'back') history.back();
    else if (a === 'forward') history.forward();
    else if (a === 'theme') toggleTheme();
    else if (a === 'switcher') openSwitcher();
    else if (a === 'local-graph') { setSide('right', true); setRightPane('localgraph'); }
    else if (a === 'close-tab') closeTab(state.active);
  });
  $$('#left .sidebar-tab').forEach(b => b.addEventListener('click', () => setLeftPane(b.dataset.pane)));
  $$('#right .sidebar-tab').forEach(b => b.addEventListener('click', () => setRightPane(b.dataset.rpane)));
  $('#scrim').addEventListener('click', () => { setSide('left', false); setSide('right', false); });
  // resizable sidebars
  $$('.resize-handle').forEach(hd => {
    hd.addEventListener('pointerdown', e => {
      const side = hd.dataset.side; hd.classList.add('is-dragging'); hd.setPointerCapture(e.pointerId);
      const move = ev => {
        const w = side === 'left' ? ev.clientX - 46 : window.innerWidth - ev.clientX;
        const px = clamp(w, 180, 560);
        document.body.style.setProperty(side === 'left' ? '--left-width' : '--right-width', px + 'px');
      };
      const up = () => { hd.classList.remove('is-dragging'); hd.removeEventListener('pointermove', move); hd.removeEventListener('pointerup', up);
        store.set('widths', { left: getComputedStyle(document.body).getPropertyValue('--left-width'), right: getComputedStyle(document.body).getPropertyValue('--right-width') }); };
      hd.addEventListener('pointermove', move); hd.addEventListener('pointerup', up);
    });
  });
  const w = store.get('widths', null);
  if (w) { if (w.left) document.body.style.setProperty('--left-width', w.left); if (w.right) document.body.style.setProperty('--right-width', w.right); }
  // search
  let t;
  $('#search').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => runSearch(e.target.value), 140); });
  // keyboard
  document.addEventListener('keydown', e => {
    const mod = e.ctrlKey || e.metaKey;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '');
    if (mod && e.key.toLowerCase() === 'o') { e.preventDefault(); openSwitcher(); }
    else if (mod && e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); setSide('left', true); setLeftPane('search'); }
    else if (mod && e.key.toLowerCase() === 'g') { e.preventDefault(); go('graph'); }
    else if (mod && e.key.toLowerCase() === 't' && !typing) { e.preventDefault(); newTab(); }
    else if (mod && e.key.toLowerCase() === 'w' && !typing) { e.preventDefault(); closeTab(state.active); }
    else if (e.key === 'Escape') { closePopover(); const m = $('.modal-container'); if (m) m.remove(); const l = $('.lightbox'); if (l) l.remove(); $$('.menu').forEach(x => x.remove()); }
  });
  window.addEventListener('resize', () => { if (isMobile()) { $('#scrim').classList.toggle('is-visible', state.leftOpen || state.rightOpen); } });
}

function toggleTheme() {
  const dark = document.body.classList.contains('theme-dark');
  document.body.classList.toggle('theme-dark', !dark); document.body.classList.toggle('theme-light', dark);
  store.set('theme', dark ? 'light' : 'dark');
  $('[data-act="theme"]').innerHTML = icon(dark ? 'sun' : 'moon');
  if (graphInst) graphInst.restyle();
  if (localGraphInst) localGraphInst.restyle();
  document.dispatchEvent(new CustomEvent('bv-theme'));
}

/* ------------------------------------------------------------------ file explorer */
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
function renderExplorer() {
  const build = (node, prefix) => {
    const folders = Object.keys(node).filter(k => k !== '__files__').sort(collator.compare);
    const files = (node.__files__ || []).slice().sort((a, b) => collator.compare(a.split('/').pop(), b.split('/').pop()));
    let out = '';
    for (const f of folders) {
      const path = prefix ? prefix + '/' + f : f;
      const col = state.collapsed.has(path) ? ' is-collapsed' : '';
      out += `<div class="nav-folder${col}"><div class="nav-folder-title" data-path="${esc(path)}"><span class="nav-folder-collapse-indicator">${icon('chevron-down')}</span><span class="nav-folder-title-content">${esc(f)}</span></div><div class="nav-folder-children">${build(node[f], path)}</div></div>`;
    }
    for (const p of files) {
      const isCanvas = p.endsWith('.canvas');
      const id = isCanvas ? p : p.replace(/\.md$/, '');
      const name = p.split('/').pop().replace(/\.(md|canvas)$/, '');
      out += `<div class="nav-file"><div class="nav-file-title" data-path="${esc(p)}" data-id="${esc(id)}"><span class="nav-file-title-content">${esc(name)}</span>${isCanvas ? '<span class="nav-file-tag">canvas</span>' : ''}</div></div>`;
    }
    return out;
  };
  if (!state.expandedOnce) {
    // first visit: everything below the top level starts collapsed
    const walk = (node, prefix, depth) => { for (const k of Object.keys(node)) { if (k === '__files__') continue; const p = prefix ? prefix + '/' + k : k; if (depth >= 1 || (node[k].__files__ || []).length > 40) state.collapsed.add(p); walk(node[k], p, depth + 1); } };
    walk(V.tree, '', 0); state.expandedOnce = true; store.set('expandedOnce', true); store.set('collapsed', [...state.collapsed]);
  }
  const ex = $('#explorer');
  ex.innerHTML = build(V.tree, '');
  ex.onclick = e => {
    const ft = e.target.closest('.nav-folder-title');
    if (ft) { const f = ft.parentElement; f.classList.toggle('is-collapsed'); const p = ft.dataset.path; f.classList.contains('is-collapsed') ? state.collapsed.add(p) : state.collapsed.delete(p); store.set('collapsed', [...state.collapsed]); return; }
    const fi = e.target.closest('.nav-file-title');
    if (fi) { go(fi.dataset.id, null, e.ctrlKey || e.metaKey); if (isMobile()) setSide('left', false); }
  };
}
function revealInExplorer(id) {
  $$('#explorer .nav-file-title.is-active').forEach(e => e.classList.remove('is-active'));
  const el = $(`#explorer .nav-file-title[data-id="${CSS.escape(id)}"]`);
  if (!el) return;
  el.classList.add('is-active');
  let p = el.parentElement.parentElement;
  while (p && p.classList.contains('nav-folder-children')) {
    const folder = p.parentElement; if (folder.classList.contains('is-collapsed')) { folder.classList.remove('is-collapsed'); state.collapsed.delete($('.nav-folder-title', folder).dataset.path); }
    p = folder.parentElement;
  }
  store.set('collapsed', [...state.collapsed]);
  const box = $('#left .sidebar-pane[data-pane="files"]');
  const r = el.getBoundingClientRect(), br = box.getBoundingClientRect();
  if (id !== V.home && (r.top < br.top || r.bottom > br.bottom)) el.scrollIntoView({ block: 'center' });
}
function renderBookmarks() {
  const items = (V.bookmarks || []).map(b => {
    const id = b.path.endsWith('.md') ? b.path.slice(0, -3) : b.path;
    if (!exists(id)) return '';
    return `<div class="tree-item" data-id="${esc(id)}">${icon(b.path.endsWith('.canvas') ? 'canvas' : 'bookmark')} ${esc(b.title || titleOf(id))}</div>`;
  }).join('');
  $('#bookmarks').innerHTML = `<div class="pane-header">Bookmarks</div>` + (items || '<div class="pane-empty">No bookmarks</div>') +
    `<div class="pane-header">Views</div>` +
    [['graph', 'graph', 'Graph view'], ['flashcards', 'cards', 'Flashcards'], ['books', 'library', 'Book library']].filter(([id]) => exists(id))
      .map(([id, ic, t]) => `<div class="tree-item" data-id="${id}">${icon(ic)} ${t}</div>`).join('') +
    `<a class="tree-item" href="legacy/index.html">${icon('layers')} Old study app</a>`;
  $('#bookmarks').onclick = e => { const t = e.target.closest('.tree-item[data-id]'); if (!t) return; go(t.dataset.id); if (isMobile()) setSide('left', false); };
}

/* ------------------------------------------------------------------ tabs and routing */
let current = { view: null, id: null, cleanup: null };
function initTabs() {
  if (!Array.isArray(state.tabs) || !state.tabs.length) state.tabs = [V.home];
  state.tabs = state.tabs.filter(t => exists(t));
  if (!state.tabs.length) state.tabs = [V.home];
  if (state.active >= state.tabs.length || state.active < 0) state.active = 0;
}
function saveTabs() { store.set('tabs', state.tabs); store.set('activeTab', state.active); }
function hashFor(id, heading) { return '#/' + encodeURI(id).replace(/#/g, '%23').replace(/\?/g, '%3F') + (heading ? '#' + encodeURIComponent(heading) : ''); }
function parseHash() {
  const raw = location.hash.slice(2);
  if (!raw) return null;
  const i = raw.indexOf('#');
  let id, heading = null;
  try { id = decodeURIComponent(i < 0 ? raw : raw.slice(0, i)); } catch (e) { id = i < 0 ? raw : raw.slice(0, i); }
  if (i >= 0) { try { heading = decodeURIComponent(raw.slice(i + 1)); } catch (e) { heading = raw.slice(i + 1); } }
  return { id, heading };
}
function navigate(target) { if (location.hash === target) route(); else location.hash = target; }
function go(id, heading, newTab) {
  if (!id) return;
  if (newTab) { state.tabs.splice(state.active + 1, 0, id); state.active += 1; saveTabs(); }
  navigate(hashFor(id, heading));
}
function activateTab(i) {
  state.active = clamp(i, 0, state.tabs.length - 1); saveTabs();
  navigate(hashFor(state.tabs[state.active]));
}
function newTab() { state.tabs.splice(state.active + 1, 0, 'newtab'); activateTab(state.active + 1); }
function closeTab(i) {
  state.tabs.splice(i, 1);
  if (!state.tabs.length) state.tabs = ['newtab'];
  if (state.active > i || state.active >= state.tabs.length) state.active = Math.max(0, state.active - 1);
  activateTab(state.active);
}
function route() {
  const r = parseHash();
  if (!r) { location.replace(hashFor(state.tabs[state.active] || V.home)); return; }
  let { id, heading } = r;
  if (!exists(id)) {
    // tolerate links to a bare note name
    const hit = Object.keys(V.notes).find(k => k.split('/').pop().toLowerCase() === id.split('/').pop().toLowerCase());
    if (hit) { location.replace(hashFor(hit, heading)); return; }
    id = V.home;
  }
  state.tabs[state.active] = id; saveTabs(); renderTabs();
  closePopover(); $$('.menu').forEach(x => x.remove());
  teardown();
  const sv = viewFor(id);
  if (sv) showSpecial(sv, id, heading);
  else if (id.endsWith('.canvas')) showCanvas(id);
  else showNote(id, heading);
  const rec = store.get('recent', []).filter(x => x !== id); rec.unshift(id); store.set('recent', rec.slice(0, 20));
}
function teardown() {
  if (current.cleanup) { try { current.cleanup(); } catch (e) { console.error(e); } }
  current = { view: null, id: null, cleanup: null };
  if (graphInst) { graphInst.destroy(); graphInst = null; }
  const view = $('#view');
  view.className = 'view-content'; view.removeAttribute('style'); view.onclick = null; view.innerHTML = ''; view.scrollTop = 0;
}
function showSpecial(sv, id, heading) {
  current = { view: 'special', id, cleanup: null, def: sv };
  $('#leaf').dataset.type = sv.type || 'special';
  const view = $('#view');
  if (sv.cls) view.classList.add(...sv.cls.split(' '));
  const cleanup = sv.show(view, id, heading);
  if (typeof cleanup === 'function') current.cleanup = cleanup;
  setCrumbs(id); revealInExplorer('__none__'); renderRight(); $('#status').innerHTML = '';
  if (isMobile()) { setSide('left', false); setSide('right', false); }
}
function renderTabs() {
  const bar = $('#tabbar');
  bar.innerHTML = state.tabs.map((t, i) => `<div class="workspace-tab-header${i === state.active ? ' is-active' : ''}" data-i="${i}" title="${esc(titleOf(t))}">
    <span class="workspace-tab-header-inner-icon">${icon(iconOf(t))}</span>
    <span class="workspace-tab-header-inner-title">${esc(titleOf(t))}</span>
    <span class="workspace-tab-header-inner-close-button" data-close="${i}">${icon('x')}</span></div>`).join('') +
    `<button class="clickable-icon new-tab-button" data-newtab="1" title="New tab (Ctrl+T)">${icon('plus')}</button>`;
  bar.onclick = e => {
    const c = e.target.closest('[data-close]');
    if (c) { e.stopPropagation(); closeTab(+c.dataset.close); return; }
    if (e.target.closest('[data-newtab]')) { newTab(); return; }
    const t = e.target.closest('.workspace-tab-header');
    if (t) activateTab(+t.dataset.i);
  };
  bar.onauxclick = e => { const t = e.target.closest('.workspace-tab-header'); if (t && e.button === 1) closeTab(+t.dataset.i); };
  const act = $('.workspace-tab-header.is-active', bar); if (act) act.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
function setCrumbs(id) {
  const crumbs = $('#crumbs');
  const sv = viewFor(id);
  if (sv) { const t = sv.title(id); crumbs.innerHTML = `<span class="view-header-title">${esc(t)}</span>`; $('#mobile-title').textContent = t; document.title = t + ' · ' + V.title; return; }
  const parts = id.split('/');
  const name = parts.pop().replace(/\.canvas$/, '');
  crumbs.innerHTML = parts.map(p => `<span class="view-header-breadcrumb">${esc(p)}</span> / `).join('') + `<span class="view-header-title">${esc(name)}</span>`;
  $('#mobile-title').textContent = name;
  document.title = name + ' · ' + V.title;
}

/* new tab page */
SPECIAL.newtab = {
  title: () => 'New tab', icon: 'file', cls: 'is-newtab',
  show(view) {
    const recent = store.get('recent', []).filter(x => x !== 'newtab' && exists(x)).slice(0, 8);
    view.innerHTML = `<div class="empty-state"><div class="empty-state-container">
      <div class="empty-state-title">No file is open</div>
      <div class="empty-state-action-list">
        <div class="empty-state-action" data-act="switcher">Go to file <span>Ctrl O</span></div>
        <div class="empty-state-action" data-act="pane-search">Search notes <span>Ctrl Shift F</span></div>
        <div class="empty-state-action" data-nt="graph">Open graph view <span>Ctrl G</span></div>
        ${exists('flashcards') ? '<div class="empty-state-action" data-nt="flashcards">Flashcards</div>' : ''}
        ${exists('books') ? '<div class="empty-state-action" data-nt="books">Book library</div>' : ''}
        <div class="empty-state-action" data-nt="${esc(V.home)}">Home</div>
        <div class="empty-state-action" data-act="close-tab">Close</div>
      </div>
      ${recent.length ? `<div class="empty-state-recent"><div class="pane-header">Recent</div>${recent.map(r => `<div class="tree-item" data-nt="${esc(r)}">${icon(iconOf(r))} ${esc(titleOf(r))}</div>`).join('')}</div>` : ''}
    </div></div>`;
    view.onclick = e => { const a = e.target.closest('[data-nt]'); if (a) go(a.dataset.nt); };
  },
};

/* ------------------------------------------------------------------ note view */
function propsHtml(n) {
  const keys = Object.keys(n.props || {});
  if (!keys.length) return '';
  const val = v => Array.isArray(v) ? v.map(x => `<span class="pill">${esc(x)}</span>`).join('') : esc(v);
  return `<div class="metadata-container is-collapsed"><div class="metadata-properties-heading">${icon('chevron-right')} Properties</div><div class="metadata-content">` +
    keys.map(k => `<div class="metadata-property"><div class="metadata-property-key">${esc(k)}</div><div class="metadata-property-value">${val(n.props[k])}</div></div>`).join('') + `</div></div>`;
}
function noteHtml(id, opts = {}) {
  const n = V.notes[id];
  const cls = ['markdown-preview-view', 'markdown-rendered', ...(n.css || [])].join(' ');
  return `<div class="${esc(cls)}"><div class="markdown-preview-sizer markdown-preview-section">${opts.noProps ? '' : propsHtml(n)}${n.html}</div></div>`;
}
let graphInst = null, localGraphInst = null;
function showNote(id, heading) {
  current = { view: 'note', id, cleanup: null };
  $('#leaf').dataset.type = 'markdown';
  const view = $('#view');
  view.innerHTML = `<div class="markdown-reading-view">${noteHtml(id)}</div>`;
  hydrate(view, id);
  view.scrollTop = 0;
  if (heading) { const t = view.querySelector(`[id="${CSS.escape(heading)}"]`); if (t) t.scrollIntoView(); }
  setCrumbs(id); revealInExplorer(id); renderRight(); renderStatus(id);
  if (isMobile()) { setSide('left', false); setSide('right', false); }
}
function hydrate(root, id) {
  // callouts
  $$('.callout[data-callout-fold]', root).forEach(c => {
    const title = $(':scope > .callout-title', c);
    title.addEventListener('click', e => { if (e.target.closest('a,button')) return; c.classList.toggle('is-collapsed'); });
    c.addEventListener('click', e => { if (c.classList.contains('is-collapsed') && !e.target.closest('a,button') && !e.target.closest('.callout-title')) c.classList.remove('is-collapsed'); });
  });
  $$('.metadata-properties-heading', root).forEach(m => m.addEventListener('click', () => m.parentElement.classList.toggle('is-collapsed')));
  // embeds
  $$('.markdown-embed[data-embed]', root).forEach(el => {
    const t = el.dataset.embed;
    if (!V.notes[t] || t === id) return;
    el.innerHTML = `<div class="markdown-embed-title">${esc(titleOf(t))}</div><div class="markdown-embed-content">${V.notes[t].html}</div>`;
  });
  $$('.canvas-embed[data-canvas]', root).forEach(el => { if (V.canvases[el.dataset.canvas]) renderCanvas(el, el.dataset.canvas); });
  // images
  $$('img', root).forEach(img => img.addEventListener('click', () => { if (img.closest('.canvas-wrapper')) return; const lb = h(`<div class="lightbox"><img src="${esc(img.src)}" alt=""></div>`); lb.onclick = () => lb.remove(); document.body.appendChild(lb); }));
  for (const f of hooks.hydrate) { try { f(root, id); } catch (e) { console.error(e); } }
}

/* links and hover previews. Each root is wired once. */
const wired = new WeakSet();
function wireLinks(root) {
  if (wired.has(root)) return;
  wired.add(root);
  root.addEventListener('click', e => {
    const a = e.target.closest('a.internal-link');
    if (!a || a.closest('.canvas-wrapper.just-dragged')) return;
    if (a.dataset.note) { e.preventDefault(); closePopover(); go(a.dataset.note, a.dataset.heading || null, e.ctrlKey || e.metaKey || e.button === 1); }
    else if (a.dataset.heading) { e.preventDefault(); const t = document.getElementById(a.dataset.heading); if (t) t.scrollIntoView({ behavior: 'smooth' }); }
  });
  if (!canHover()) return;
  root.addEventListener('mouseover', e => {
    const a = e.target.closest('a.internal-link[data-note]');
    if (!a || !V.notes[a.dataset.note] || a.dataset.popWired) return;
    a.dataset.popWired = '1';
    const enter = () => { clearTimeout(popTimer); popTimer = setTimeout(() => showPopover(a), 380); };
    a.addEventListener('mouseenter', enter);
    a.addEventListener('mouseleave', () => { clearTimeout(popTimer); schedulePopClose(); });
    enter();
  });
}
let popTimer = null, popCloseTimer = null;
function schedulePopClose() {
  clearTimeout(popCloseTimer);
  popCloseTimer = setTimeout(() => {
    const pops = $$('.hover-popover');
    // keep every popover up to the deepest one under the pointer, close the rest
    let keep = -1;
    pops.forEach(p => { if (p.matches(':hover')) keep = Math.max(keep, +p.dataset.level); });
    pops.forEach(p => { if (+p.dataset.level > keep) { p.classList.add('is-closing'); setTimeout(() => p.remove(), 120); } });
  }, 280);
}
function showPopover(a) {
  if (!a.isConnected) return;
  const r = a.getBoundingClientRect();
  if (!r.width && !r.height) return;
  const parent = a.closest('.hover-popover');
  const level = parent ? +parent.dataset.level + 1 : 0;
  const id = a.dataset.note;
  // same link already previewed at this level
  const same = $$('.hover-popover').find(p => +p.dataset.level === level && p.dataset.note === id);
  if (same) return;
  $$('.hover-popover').forEach(p => { if (+p.dataset.level >= level) p.remove(); });
  const pop = h(`<div class="popover hover-popover" data-level="${level}" data-note="${esc(id)}">${noteHtml(id, { noProps: true })}</div>`);
  pop.style.zIndex = 50 + level;
  document.body.appendChild(pop);
  hydrate(pop, id);
  wireLinks(pop);
  const W = pop.offsetWidth, H = pop.offsetHeight;
  const x = clamp(r.left, 12, window.innerWidth - W - 12);
  let y = r.bottom + 8; if (y + H > window.innerHeight - 12) y = Math.max(12, r.top - H - 8);
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
  if (a.dataset.heading) { const t = pop.querySelector(`[id="${CSS.escape(a.dataset.heading)}"]`); if (t) pop.scrollTop = t.offsetTop - 10; }
  pop.addEventListener('mouseenter', () => { clearTimeout(popCloseTimer); });
  pop.addEventListener('mouseleave', schedulePopClose);
}
function closePopover() { clearTimeout(popTimer); clearTimeout(popCloseTimer); $$('.hover-popover').forEach(p => p.remove()); }

/* small context menu, used by quotes and other views */
function showMenu(anchorEl, items) {
  $$('.menu').forEach(m => m.remove());
  const m = h(`<div class="menu">${items.map((it, i) => it === '-' ? '<div class="menu-separator"></div>' : `<div class="menu-item" data-i="${i}">${it.icon ? icon(it.icon) : ''}<span>${esc(it.title)}</span></div>`).join('')}</div>`);
  document.body.appendChild(m);
  const r = anchorEl.getBoundingClientRect ? anchorEl.getBoundingClientRect() : { left: anchorEl.x, right: anchorEl.x, top: anchorEl.y, bottom: anchorEl.y };
  const W = m.offsetWidth, H = m.offsetHeight;
  m.style.left = clamp(r.left, 8, window.innerWidth - W - 8) + 'px';
  m.style.top = (r.bottom + 6 + H > window.innerHeight ? Math.max(8, r.top - H - 6) : r.bottom + 6) + 'px';
  m.addEventListener('click', e => { const it = e.target.closest('.menu-item'); if (!it) return; m.remove(); items[+it.dataset.i].run(); });
  setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('pointerdown', off, true); } }, true), 0);
  return m;
}
function toast(msg) {
  const t = h(`<div class="notice">${esc(msg)}</div>`);
  let c = $('.notice-container'); if (!c) { c = h('<div class="notice-container"></div>'); document.body.appendChild(c); }
  c.appendChild(t); setTimeout(() => { t.classList.add('is-hiding'); setTimeout(() => t.remove(), 300); }, 2600);
}

/* ------------------------------------------------------------------ right sidebar + status */
function snippetFor(srcId, targetId) {
  const n = V.notes[srcId]; if (!n) return '';
  const name = titleOf(targetId).toLowerCase();
  const i = n.lower.indexOf(name, n.title.length);
  if (i < 0) return '';
  const start = Math.max(0, i - 70), j = i - (n.title.length + 1);
  const text = n.text.slice(Math.max(0, j - 70), j + name.length + 90);
  const k = text.toLowerCase().indexOf(name);
  return (start > 0 ? '…' : '') + esc(text.slice(0, k)) + '<mark>' + esc(text.slice(k, k + name.length)) + '</mark>' + esc(text.slice(k + name.length)) + '…';
}
function renderRight() {
  if (!V || !state.rightOpen) return;
  const id = current.id;
  const p = state.rightPane;
  if (p !== 'localgraph' && localGraphInst) { localGraphInst.destroy(); localGraphInst = null; }
  if (!id || current.view === 'special') {
    if (localGraphInst) { localGraphInst.destroy(); localGraphInst = null; }
    $('#pane-' + p).innerHTML = `<div class="pane-empty">Open a note to see its ${p === 'localgraph' ? 'local graph' : p === 'outgoing' ? 'outgoing links' : p}.</div>`;
    return;
  }
  if (p === 'backlinks') {
    const bl = [...(backlinks[id] || [])].sort((a, b) => collator.compare(titleOf(a), titleOf(b)));
    $('#pane-backlinks').innerHTML = `<div class="pane-header">Linked mentions <span>${bl.length}</span></div>` +
      (bl.map(s => `<div class="tree-item" data-id="${esc(s)}">${esc(titleOf(s))}<span class="tree-item-sub">${snippetFor(s, id) || esc(s.split('/').slice(0, -1).join(' / '))}</span></div>`).join('') || '<div class="pane-empty">No backlinks found.</div>');
  } else if (p === 'outgoing') {
    const src = V.notes[id] ? V.notes[id].links : (V.canvases[id] ? V.canvases[id].links : []);
    $('#pane-outgoing').innerHTML = `<div class="pane-header">Links <span>${src.length}</span></div>` +
      (src.map(s => `<div class="tree-item" data-id="${esc(s)}">${esc(titleOf(s))}<span class="tree-item-sub">${esc(s.split('/').slice(0, -1).join(' / '))}</span></div>`).join('') || '<div class="pane-empty">No outgoing links.</div>');
  } else if (p === 'outline') {
    const hs = V.notes[id] ? V.notes[id].headings : [];
    $('#pane-outline').innerHTML = `<div class="pane-header">Outline</div>` +
      (hs.map(x => `<div class="tree-item outline-h${x.level}" data-heading="${esc(x.id)}">${esc(x.text)}</div>`).join('') || '<div class="pane-empty">No headings.</div>');
  } else if (p === 'localgraph') {
    const pane = $('#pane-localgraph');
    if (!V.notes[id]) { pane.innerHTML = '<div class="pane-empty">No local graph for this view.</div>'; return; }
    pane.innerHTML = `<div class="pane-header">Local graph · ${esc(titleOf(id))}</div><div class="local-graph"><canvas></canvas></div>
      <div class="graph-control-row" style="padding:0 14px"><span>Depth</span><input type="range" min="1" max="3" step="1" value="${store.get('localDepth', 1)}" id="local-depth"></div>`;
    if (localGraphInst) localGraphInst.destroy();
    localGraphInst = makeGraph($('.local-graph', pane), { local: id, depth: store.get('localDepth', 1) });
    $('#local-depth').oninput = e => { store.set('localDepth', +e.target.value); renderRight(); };
  }
  $$('#right .tree-item').forEach(t => t.onclick = () => {
    if (t.dataset.heading) { const el = document.getElementById(t.dataset.heading); if (el) el.scrollIntoView({ behavior: 'smooth' }); if (isMobile()) setSide('right', false); }
    else go(t.dataset.id);
  });
}
function renderStatus(id) {
  const n = V.notes[id];
  const bl = (backlinks[id] || new Set()).size;
  $('#status').innerHTML = n ? `<span>${bl} backlink${bl === 1 ? '' : 's'}</span><span>${n.words.toLocaleString()} words</span>` : `<span>${bl} backlink${bl === 1 ? '' : 's'}</span>`;
}

/* ------------------------------------------------------------------ search */
function runSearch(q) {
  q = q.trim();
  const out = $('#search-results'), sum = $('#search-summary');
  if (!q) { out.innerHTML = ''; sum.textContent = ''; return; }
  const phrases = []; q.replace(/"([^"]+)"|(\S+)/g, (m, a, b) => phrases.push((a || b).toLowerCase()));
  const hits = [];
  for (const [id, n] of Object.entries(V.notes)) {
    if (!phrases.every(p => n.lower.includes(p) || id.toLowerCase().includes(p))) continue;
    let score = 0; const tl = n.title.toLowerCase();
    for (const p of phrases) { if (tl === p) score += 100; else if (tl.startsWith(p)) score += 40; else if (tl.includes(p)) score += 25; score += Math.min(10, n.lower.split(p).length - 1); }
    hits.push({ id, score });
  }
  hits.sort((a, b) => b.score - a.score || collator.compare(titleOf(a.id), titleOf(b.id)));
  sum.innerHTML = `${hits.length} result${hits.length === 1 ? '' : 's'}` + (exists('books') ? ` · <a class="search-books-link" href="${hashFor('books')}">Search the books</a>` : '');
  const bl = $('.search-books-link', sum); if (bl) bl.onclick = e => { e.preventDefault(); store.set('bookQuery', q); go('books'); if (isMobile()) setSide('left', false); };
  const rx = new RegExp('(' + phrases.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
  const hl = t => t.split(rx).map((part, k) => k % 2 ? '<mark>' + esc(part) + '</mark>' : esc(part)).join('');
  const snippets = text => {
    const low = text.toLowerCase(), pos = [];
    const whole = low.indexOf(q.toLowerCase()); if (whole >= 0) pos.push(whole);
    for (const p of phrases) { const i = low.indexOf(p); if (i >= 0) pos.push(i); }
    pos.sort((a, b) => a - b);
    const out = []; let end = -1;
    for (const i of pos) { if (i < end) continue; const s = Math.max(0, i - 60), e = Math.min(text.length, i + 140); out.push((s ? '…' : '') + hl(text.slice(s, e)) + (e < text.length ? '…' : '')); end = e; if (out.length === 2) break; }
    return out;
  };
  out.innerHTML = hits.slice(0, 120).map(({ id }) => {
    const n = V.notes[id];
    const m = snippets(n.text);
    return `<div class="search-result" data-id="${esc(id)}"><div class="search-result-title">${esc(n.title)}</div><div class="search-result-path">${esc(id.split('/').slice(0, -1).join(' / ') || 'vault root')}</div>${m.map(x => `<div class="search-result-match">${x}</div>`).join('')}</div>`;
  }).join('');
  out.onclick = e => { const r = e.target.closest('.search-result'); if (r) { go(r.dataset.id, null, e.ctrlKey || e.metaKey); if (isMobile()) setSide('left', false); } };
}
function openSwitcher() {
  if ($('.modal-container')) return;
  const all = [...Object.keys(V.notes), ...Object.keys(V.canvases), ...Object.keys(SPECIAL).filter(k => k !== 'newtab')];
  const m = h(`<div class="modal-container"><div class="prompt"><input class="prompt-input" placeholder="Find or open a note…" autocomplete="off"><div class="prompt-results"></div>
    <div class="prompt-instructions"><span>↑↓ to navigate</span><span>↵ to open</span><span>ctrl ↵ new tab</span><span>esc to close</span></div></div></div>`);
  document.body.appendChild(m);
  const input = $('.prompt-input', m), res = $('.prompt-results', m);
  let sel = 0, list = [];
  const fuzzy = (q, s) => { s = s.toLowerCase(); let i = 0, score = 0, last = -2; for (const ch of q) { const j = s.indexOf(ch, i); if (j < 0) return -1; score += j === last + 1 ? 3 : 1; last = j; i = j + 1; } return score - s.length * 0.01; };
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    const recent = store.get('recent', []);
    list = q ? all.map(id => ({ id, s: Math.max(fuzzy(q, titleOf(id)) * 2, fuzzy(q, id)) })).filter(x => x.s >= 0).sort((a, b) => b.s - a.s).slice(0, 60).map(x => x.id)
      : [...recent.filter(x => exists(x) && x !== 'newtab'), ...all.filter(id => !recent.includes(id))].slice(0, 40);
    sel = Math.min(sel, Math.max(0, list.length - 1));
    res.innerHTML = list.map((id, i) => `<div class="suggestion${i === sel ? ' is-selected' : ''}" data-i="${i}"><div class="suggestion-title">${esc(titleOf(id))}</div><div class="suggestion-note">${esc(viewFor(id) ? 'View' : id.split('/').slice(0, -1).join(' / '))}</div></div>`).join('') || '<div class="pane-empty">No matches</div>';
    const s = $('.is-selected', res); if (s) s.scrollIntoView({ block: 'nearest' });
  };
  const open = (i, nt) => { const id = list[i]; if (!id) return; m.remove(); go(id, null, nt); };
  input.addEventListener('input', () => { sel = 0; draw(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(list.length - 1, sel + 1); draw(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); }
    else if (e.key === 'Enter') { open(sel, e.ctrlKey || e.metaKey); e.preventDefault(); }
    else if (e.key === 'Escape') m.remove();
  });
  res.addEventListener('click', e => { const s = e.target.closest('.suggestion'); if (s) open(+s.dataset.i, e.ctrlKey || e.metaKey); });
  m.addEventListener('click', e => { if (e.target === m) m.remove(); });
  draw(); input.focus();
}

/* ------------------------------------------------------------------ graph */
function parseQuery(q) {
  const terms = [];
  (q || '').replace(/(-?)(path|file|tag|line|section)?:?("([^"]*)"|(\S+))/g, (m, neg, key, _, quoted, bare) => {
    const val = (quoted != null ? quoted : bare || '').toLowerCase();
    if (!val && !key) return m;
    terms.push({ neg: neg === '-', key: key || 'any', val });
    return m;
  });
  return terms;
}
function matches(id, terms) {
  const n = V.notes[id];
  const path = (n ? n.path : id).toLowerCase(), file = path.split('/').pop();
  return terms.every(t => {
    let hit;
    if (t.key === 'path') hit = path.includes(t.val);
    else if (t.key === 'file') hit = file.includes(t.val);
    else hit = file.includes(t.val) || (n && n.lower.includes(t.val));
    return t.neg ? !hit : hit;
  });
}
function graphGroup(id, groups) {
  for (let i = 0; i < groups.length; i++) { const terms = parseQuery(groups[i].query); if (terms.length && matches(id, terms)) return i; }
  return -1;
}
function graphData(opts) {
  const G = V.graph;
  const filter = parseQuery(opts.local ? '' : (opts.search != null ? opts.search : G.search));
  let ids = Object.keys(V.notes).filter(id => matches(id, filter));
  if (opts.local) {
    const all = new Set([opts.local]);
    let frontier = [opts.local];
    for (let d = 0; d < (opts.depth || 1); d++) {
      const next = [];
      for (const f of frontier) {
        const out = V.notes[f] ? V.notes[f].links : [];
        for (const t of [...out, ...(backlinks[f] || [])]) if (V.notes[t] && !all.has(t)) { all.add(t); next.push(t); }
      }
      frontier = next;
    }
    ids = [...all];
  }
  const set = new Set(ids);
  const links = [];
  const deg = {};
  const seen = new Set();
  for (const id of ids) for (const t of V.notes[id].links) {
    if (!set.has(t) || t === id) continue;
    const k = id < t ? id + '\n' + t : t + '\n' + id; if (seen.has(k)) continue; seen.add(k);
    links.push({ source: id, target: t }); deg[id] = (deg[id] || 0) + 1; deg[t] = (deg[t] || 0) + 1;
  }
  let nodes = ids.map(id => {
    const n = V.notes[id], parts = id.split('/');
    const g = graphGroup(id, G.groups);
    const li = parts.findIndex(p => /^(Lectures|Practicals|Extras)$/.test(p));
    return {
      id, deg: deg[id] || 0, group: g, color: g >= 0 ? G.groups[g].color : null,
      type: String((n.props || {}).type || ''), kt: parts[0] === '02 Key Terms',
      subject: parts[0] === '01 Year 1' && parts.length > 2 ? parts[1] : '', folder: li >= 0 && parts[li + 1] ? parts.slice(0, li + 2).join('/') : '',
    };
  });
  if (!opts.local && opts.showOrphans === false) nodes = nodes.filter(n => n.deg > 0);
  const byId = new Map(nodes.map(n => [n.id, n]));
  const linked = links.map(l => ({ source: byId.get(l.source), target: byId.get(l.target) })).filter(l => l.source && l.target);
  return { nodes, links: linked };
}

/* Layouts. Each returns a function (node, time) -> {x, y, z} in graph units; z is depth from 0 (back) to 1 (front). */
function helixLayout(nodes, neighbours, vertical) {
  const subjOrder = n => (n.group < 0 ? 99 : n.group);
  const strandA = nodes.filter(n => !n.kt).sort((a, b) => subjOrder(a) - subjOrder(b) || collator.compare(a.folder, b.folder) || collator.compare(a.id, b.id));
  const pos = new Map(strandA.map((n, i) => [n.id, strandA.length > 1 ? i / (strandA.length - 1) : .5]));
  const strandB = nodes.filter(n => n.kt).map(n => { const nb = [...(neighbours.get(n.id) || [])].map(x => pos.get(x)).filter(x => x != null); return { n, u: nb.length ? nb.reduce((a, b) => a + b, 0) / nb.length : .5 }; })
    .sort((a, b) => a.u - b.u).map(x => x.n);
  strandA.forEach((n, i) => { n.u = strandA.length > 1 ? i / (strandA.length - 1) : .5; n.strand = 0; });
  strandB.forEach((n, i) => { n.u = strandB.length > 1 ? i / (strandB.length - 1) : .5; n.strand = 1; });
  const per = Math.max(strandA.length, strandB.length, 10);
  const L = clamp(per * 9, 900, 2600), R = L * 0.24, turns = 2.6;
  return (n, t) => {
    const th = n.u * turns * Math.PI * 2 + n.strand * Math.PI + t * 0.22;
    const a = (n.u - 0.5) * L, b = Math.sin(th) * R, z = (Math.cos(th) + 1) / 2;
    return vertical ? { x: b, y: a, z } : { x: a, y: b, z };
  };
}
function cellLayout(nodes, neighbours) {
  const hubs = nodes.filter(n => !n.kt && (/hub|home/.test(n.type) || !n.folder));
  const terms = nodes.filter(n => n.kt);
  const rest = nodes.filter(n => !n.kt && !hubs.includes(n));
  // organelles: one per lecture or practical folder, laid round a ring, grouped by subject
  const clusters = new Map();
  for (const n of rest) { const k = n.folder; if (!clusters.has(k)) clusters.set(k, []); clusters.get(k).push(n); }
  const list = [...clusters.entries()].sort((a, b) => (a[1][0].group - b[1][0].group) || collator.compare(a[0], b[0]));
  const total = list.reduce((s, [, v]) => s + Math.sqrt(v.length) + 1.2, 0);
  const ringR = 560;
  let acc = 0;
  const GA = Math.PI * (3 - Math.sqrt(5));
  for (const [, members] of list) {
    const w = Math.sqrt(members.length) + 1.2;
    const ang = ((acc + w / 2) / total) * Math.PI * 2 - Math.PI / 2; acc += w;
    const cx = Math.cos(ang) * ringR, cy = Math.sin(ang) * ringR;
    members.sort((a, b) => b.deg - a.deg);
    members.forEach((n, i) => { const r = 19 * Math.sqrt(i + 0.5); n.base = { x: cx + Math.cos(i * GA) * r, y: cy + Math.sin(i * GA) * r }; n.ang = ang; });
  }
  // nucleus
  hubs.sort((a, b) => b.deg - a.deg).forEach((n, i) => { const r = 26 * Math.sqrt(i + 0.3); n.base = { x: Math.cos(i * GA) * r, y: Math.sin(i * GA) * r }; n.ang = Math.atan2(n.base.y, n.base.x); });
  // membrane: key terms placed near the organelles they link to, as a two-layer ring
  const angOf = new Map(rest.map(n => [n.id, n.ang]));
  const ordered = terms.map(n => {
    const as = [...(neighbours.get(n.id) || [])].map(x => angOf.get(x)).filter(x => x != null);
    const sx = as.reduce((s, a) => s + Math.cos(a), 0), sy = as.reduce((s, a) => s + Math.sin(a), 0);
    return { n, a: as.length ? Math.atan2(sy, sx) : 0 };
  }).sort((a, b) => a.a - b.a);
  const memR = 1010;
  ordered.forEach(({ n }, i) => { const a = (i / ordered.length) * Math.PI * 2 + ordered[0].a; n.mem = { a, layer: i % 2 }; });
  return (n, t) => {
    if (n.mem) {
      const r = memR + (n.mem.layer ? 24 : -24) + Math.sin(n.mem.a * 5 + t * 0.6) * 14;
      return { x: Math.cos(n.mem.a) * r, y: Math.sin(n.mem.a) * r, z: 1 };
    }
    const wob = Math.sin(t * 0.5 + (n.base.x + n.base.y) * 0.01) * 3;
    return { x: n.base.x + wob, y: n.base.y - wob, z: 1 };
  };
}

function makeGraph(host, opts = {}) {
  const local = !!opts.local;
  const canvas = host.querySelector('canvas') || host.appendChild(document.createElement('canvas'));
  canvas.classList.add('graph-canvas');
  const ctx = canvas.getContext('2d');
  const G = V.graph;
  const cfg = Object.assign({ nodeSize: G.nodeSize, lineSize: G.lineSize, textFade: G.textFade, center: G.center, repel: G.repel, linkStrength: G.linkStrength, linkDistance: G.linkDistance, showOrphans: G.showOrphans, search: G.search, shape: 'cell', animate: !isMobile() },
    local ? { shape: 'free' } : store.get('graphCfg2', {}));
  let data = graphData(Object.assign({}, opts, cfg));
  let W = 0, H = 0, dpr = 1, hover = null, sim = null, alive = true, raf = 0, userZoomed = false, last = performance.now(), clock = 0;
  let neighbours = new Map(), colors = {}, layout = null, tween = null;
  const view = { x: 0, y: 0, k: 1 }; let goal = d3.zoomIdentity;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function readColors() {
    const cs = getComputedStyle(document.body);
    const light = document.body.classList.contains('theme-light');
    colors = {
      node: cs.getPropertyValue('--graph-node').trim() || (light ? '#5B65A0' : '#9AA6D8'),
      line: light ? 'rgba(60,70,120,' : 'rgba(150,170,255,',
      text: cs.getPropertyValue('--graph-text').trim() || (light ? '#1B2040' : '#DDE2FA'),
      focus: light ? '#1B2040' : '#FFFFFF', accent: cs.getPropertyValue('--interactive-accent').trim() || '#34D399',
      halo: light ? 'rgba(255,255,255,.85)' : 'rgba(5,7,15,.82)',
    };
  }
  function indexNeighbours() {
    neighbours = new Map(data.nodes.map(n => [n.id, new Set()]));
    for (const l of data.links) { const s = l.source.id || l.source, t = l.target.id || l.target; if (neighbours.has(s) && neighbours.has(t)) { neighbours.get(s).add(t); neighbours.get(t).add(s); } }
  }
  const shaped = () => !local && cfg.shape !== 'free';
  const radius = n => (local ? 3.4 : shaped() ? 5.4 : 3.8) * cfg.nodeSize * (1 + Math.sqrt(n.deg) * (shaped() ? 0.32 : 0.42));
  function resize() {
    const r = host.getBoundingClientRect(); dpr = window.devicePixelRatio || 1;
    const was = W;
    W = r.width; H = r.height; canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr);
    if (!was && W) fit(false);
    kick();
  }

  // ---- layout engines
  function setupLayout() {
    if (sim) { sim.stop(); sim = null; }
    indexNeighbours();
    for (const n of data.nodes) { n.ha = n.ha == null ? 1 : n.ha; n.la = n.la || 0; n.hs = n.hs || 1; n.ox = n.ox || 0; n.oy = n.oy || 0; }
    if (shaped()) {
      layout = cfg.shape === 'helix' ? helixLayout(data.nodes, neighbours, H > W * 1.1) : cellLayout(data.nodes, neighbours);
      const from = new Map(data.nodes.map(n => [n.id, n.x == null ? null : { x: n.x, y: n.y }]));
      tween = { start: performance.now(), dur: reduceMotion ? 1 : 900, from };
      for (const n of data.nodes) if (n.x == null) { const p = layout(n, clock); n.x = p.x * 0.2; n.y = p.y * 0.2; from.set(n.id, { x: n.x, y: n.y }); }
    } else {
      layout = null; tween = null;
      const linkD = local ? 70 : 60 + cfg.linkDistance * 0.28;
      sim = d3.forceSimulation(data.nodes)
        .force('link', d3.forceLink(data.links).id(d => d.id).distance(linkD).strength(Math.min(1, cfg.linkStrength) * (local ? .6 : .32)))
        .force('charge', d3.forceManyBody().strength(-(local ? 240 : 70 + cfg.repel * 14)).distanceMax(local ? 500 : 1600).theta(0.85))
        .force('x', d3.forceX(0).strength(cfg.center * (local ? .06 : .03)))
        .force('y', d3.forceY(0).strength(cfg.center * (local ? .06 : .03)))
        .force('collide', d3.forceCollide(d => radius(d) + (local ? 10 : 7)).strength(.9))
        .velocityDecay(.42).alphaDecay(local ? .035 : .02)
        .on('tick', kick);
      let ticks = 0;
      sim.on('tick.fit', () => { ticks++; if (!userZoomed && (ticks === 40 || ticks === 140)) fit(true); });
      sim.on('end', () => { if (!userZoomed) fit(true); });
    }
  }
  function positions(now) {
    if (!layout) return;
    const k = tween ? clamp((now - tween.start) / tween.dur, 0, 1) : 1;
    const e = ease(k);
    for (const n of data.nodes) {
      const p = layout(n, clock);
      n.z = p.z;
      if (n !== dragNode) { n.ox *= 0.86; n.oy *= 0.86; if (Math.abs(n.ox) < .05) n.ox = 0; if (Math.abs(n.oy) < .05) n.oy = 0; }
      const tx = p.x + n.ox, ty = p.y + n.oy;
      if (k < 1) { const f = tween.from.get(n.id) || { x: tx, y: ty }; n.x = f.x + (tx - f.x) * e; n.y = f.y + (ty - f.y) * e; }
      else { n.x = tx; n.y = ty; }
    }
    if (k >= 1) tween = null;
  }

  // ---- frame loop
  function kick() { if (!raf && alive) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function frame(now) {
    raf = 0;
    if (!alive) return;
    const dt = Math.min(64, now - last); last = now;
    let busy = false;
    const spinning = shaped() && cfg.animate && !hover && !dragNode && !reduceMotion && !document.hidden;
    if (spinning) { clock += dt / 1000; busy = true; }
    if (layout) { positions(now); if (tween) busy = true; if (dragNode || data.nodes.some(n => n.ox || n.oy)) busy = true; }
    if (sim && sim.alpha() > sim.alphaMin()) busy = true;
    // smooth zoom and pan towards the goal set by d3-zoom
    const f = 1 - Math.exp(-dt / 70);
    const dx = goal.x - view.x, dy = goal.y - view.y, dk = goal.k - view.k;
    if (Math.abs(dx) > .05 || Math.abs(dy) > .05 || Math.abs(dk) > .0005) { view.x += dx * f; view.y += dy * f; view.k += dk * f; busy = true; }
    else { view.x = goal.x; view.y = goal.y; view.k = goal.k; }
    if (inertia) { busy = stepInertia(dt) || busy; }
    // hover fades
    const near = hover ? neighbours.get(hover.id) : null;
    const g = 1 - Math.exp(-dt / 90);
    const zoomLabel = clamp((view.k - (local ? 1.5 : 0.9 - cfg.textFade * 0.2)) * 2.4, 0, 1);
    for (const n of data.nodes) {
      const lit = !hover || n === hover || (near && near.has(n.id));
      const ta = lit ? 1 : 0.13, tl = hover ? (n === hover ? 1 : 0) : (local && n.id === opts.local ? 1 : zoomLabel), ts = n === hover ? 1.35 : 1;
      if (Math.abs(n.ha - ta) > .01) { n.ha += (ta - n.ha) * g; busy = true; } else n.ha = ta;
      if (Math.abs(n.la - tl) > .01) { n.la += (tl - n.la) * g; busy = true; } else n.la = tl;
      if (Math.abs(n.hs - ts) > .005) { n.hs += (ts - n.hs) * g; busy = true; } else n.hs = ts;
    }
    draw();
    if (busy) raf = requestAnimationFrame(frame);
  }
  function draw() {
    const k = view.k;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * (view.x + W / 2), dpr * (view.y + H / 2));
    const near = hover ? neighbours.get(hover.id) : null;
    const depth = n => (layout && cfg.shape === 'helix') ? 0.45 + 0.55 * (n.z == null ? 1 : n.z) : 1;
    // links
    const baseA = (shaped() ? (cfg.shape === 'helix' ? .13 : .17) : .26) * clamp(W * H / 720000, .4, 1);
    ctx.lineWidth = Math.max(0.35, cfg.lineSize * 0.9) / k;
    ctx.strokeStyle = colors.line + (hover ? baseA * 0.35 : baseA) + ')';
    ctx.beginPath();
    for (const l of data.links) {
      const s = l.source, t = l.target; if (s.x == null || t.x == null) continue;
      if (hover && (s === hover || t === hover)) continue;
      ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y);
    }
    ctx.stroke();
    if (hover) {
      ctx.lineWidth = Math.max(0.8, cfg.lineSize * 1.6) / k;
      ctx.strokeStyle = hover.color || colors.accent; ctx.globalAlpha = 0.9;
      ctx.beginPath();
      for (const l of data.links) { const s = l.source, t = l.target; if (s === hover || t === hover) { ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y); } }
      ctx.stroke(); ctx.globalAlpha = 1;
    }
    // nodes, back to front for the helix
    const order = (layout && cfg.shape === 'helix') ? data.nodes.slice().sort((a, b) => a.z - b.z) : data.nodes;
    for (const n of order) {
      if (n.x == null) continue;
      const d = depth(n);
      ctx.globalAlpha = n.ha * (0.35 + 0.65 * d);
      ctx.fillStyle = n.color || colors.node;
      const r = radius(n) * n.hs * (0.7 + 0.3 * d);
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill();
      if ((local && n.id === opts.local) || n === hover) { ctx.globalAlpha = 1; ctx.strokeStyle = colors.focus; ctx.lineWidth = 1.6 / k; ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    // labels: only the hovered note while hovering, otherwise by zoom level
    const fs = 12.5 / Math.max(k, .55);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const n of data.nodes) {
      if (n.x == null || n.la <= 0.02 || n === hover) continue;
      if (layout && cfg.shape === 'helix' && n.z < 0.35 && !local) continue;
      ctx.globalAlpha = n.la * (layout && cfg.shape === 'helix' ? n.z : 1);
      ctx.font = `500 ${fs}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = colors.text;
      ctx.fillText(titleOf(n.id), n.x, n.y + radius(n) * n.hs + 4 / k);
    }
    if (hover && hover.x != null) {
      const t = titleOf(hover.id);
      const big = 14 / Math.max(k, .45);
      ctx.font = `600 ${big}px Inter, system-ui, sans-serif`;
      const w = ctx.measureText(t).width, y = hover.y + radius(hover) * hover.hs + 6 / k, pad = 6 / k;
      ctx.globalAlpha = hover.la;
      ctx.fillStyle = colors.halo;
      roundRect(ctx, hover.x - w / 2 - pad, y - pad * 0.6, w + pad * 2, big + pad * 1.4, 6 / k); ctx.fill();
      ctx.fillStyle = colors.focus; ctx.fillText(t, hover.x, y);
    }
    ctx.globalAlpha = 1;
  }
  function roundRect(c, x, y, w, h2, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h2, r); c.arcTo(x + w, y + h2, x, y + h2, r); c.arcTo(x, y + h2, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function toWorld(px, py) { return [(px - W / 2 - view.x) / view.k, (py - H / 2 - view.y) / view.k]; }
  function nodeAt(px, py) {
    const [x, y] = toWorld(px, py);
    let best = null, bd = Infinity;
    for (const n of data.nodes) { if (n.x == null) continue; const d = (n.x - x) ** 2 + (n.y - y) ** 2; const r = radius(n) * n.hs + 5 / view.k; if (d < r * r && d < bd) { bd = d; best = n; } }
    return best;
  }

  // ---- zoom, pan and momentum
  let inertia = null, samples = [];
  const zoom = d3.zoom().scaleExtent([0.04, 6])
    .filter(e => {
      if (e.button) return false;
      if (e.type === 'mousedown' || e.type === 'touchstart') {
        const p = e.touches ? e.touches[0] : e; const r = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 1) return true;
        if (nodeAt(p.clientX - r.left, p.clientY - r.top)) return false;
      }
      return true;
    })
    .on('start', e => { inertia = null; samples = []; if (e.sourceEvent) userZoomed = true; })
    .on('zoom', e => {
      goal = e.transform;
      if (e.sourceEvent && /move/.test(e.sourceEvent.type)) { samples.push({ t: performance.now(), x: goal.x, y: goal.y, k: goal.k }); if (samples.length > 6) samples.shift(); }
      if (e.sourceEvent && e.sourceEvent.type === 'wheel') userZoomed = true;
      kick();
    })
    .on('end', e => {
      if (!e.sourceEvent || samples.length < 2 || reduceMotion) return;
      const a = samples[0], b = samples[samples.length - 1], dt = b.t - a.t;
      if (performance.now() - b.t > 60 || dt <= 0 || Math.abs(b.k - a.k) > 1e-6) return;
      const vx = (b.x - a.x) / dt, vy = (b.y - a.y) / dt;
      if (Math.hypot(vx, vy) > 0.15) { inertia = { vx, vy }; kick(); }
    });
  function stepInertia(dt) {
    const decay = Math.exp(-dt / 300);
    inertia.vx *= decay; inertia.vy *= decay;
    if (Math.hypot(inertia.vx, inertia.vy) < 0.01) { inertia = null; return false; }
    const t = d3.zoomIdentity.translate(goal.x + inertia.vx * dt, goal.y + inertia.vy * dt).scale(goal.k);
    d3.select(canvas).call(zoom.transform, t);
    return true;
  }
  function fit(animate) {
    if (!W || !data.nodes.length) return;
    let pts;
    if (layout) pts = data.nodes.map(n => { const p = layout(n, clock); return { x: p.x, y: p.y }; });
    else pts = data.nodes.filter(n => n.x != null);
    if (!pts.length) return;
    const q = (arr, f) => arr[clamp(Math.round(f * (arr.length - 1)), 0, arr.length - 1)];
    const xs = pts.map(n => n.x).sort((a, b) => a - b), ys = pts.map(n => n.y).sort((a, b) => a - b);
    const lo = (!layout && pts.length > 40) ? 0.01 : 0, hi = 1 - lo;
    const x0 = q(xs, lo), x1 = q(xs, hi), y0 = q(ys, lo), y1 = q(ys, hi);
    const pad = local ? 30 : 50;
    const k = clamp(Math.min((W - pad * 2) / Math.max(1, x1 - x0), (H - pad * 2) / Math.max(1, y1 - y0)), 0.04, local ? 2 : 1.4);
    const t = d3.zoomIdentity.translate(-k * (x0 + x1) / 2, -k * (y0 + y1) / 2).scale(k);
    d3.select(canvas).call(zoom.transform, t);
    if (!animate) { view.x = t.x; view.y = t.y; view.k = t.k; }
    kick();
  }
  d3.select(canvas).call(zoom).on('dblclick.zoom', null);

  // ---- node hover and drag
  let dragNode = null, moved = false, downAt = null;
  const local2 = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  canvas.addEventListener('pointerdown', e => {
    const [px, py] = local2(e); const n = nodeAt(px, py); moved = false; downAt = [px, py];
    if (!n) return;
    dragNode = n; hover = n; canvas.setPointerCapture(e.pointerId); canvas.classList.add('is-dragging');
    inertia = null;
    if (sim) { sim.alphaTarget(0.18).restart(); n.fx = n.x; n.fy = n.y; }
    kick();
  });
  canvas.addEventListener('pointermove', e => {
    const [px, py] = local2(e);
    if (dragNode) {
      if (!moved && Math.hypot(px - downAt[0], py - downAt[1]) < 4) return;
      moved = true;
      const [x, y] = toWorld(px, py);
      if (sim) { dragNode.fx = x; dragNode.fy = y; }
      else if (layout) { const p = layout(dragNode, clock); dragNode.ox = x - p.x; dragNode.oy = y - p.y; }
      kick(); return;
    }
    if (e.pointerType === 'touch') return;
    const n = nodeAt(px, py);
    if (n !== hover) { hover = n; canvas.style.cursor = n ? 'pointer' : ''; kick(); }
  });
  const release = e => {
    if (!dragNode) return;
    const n = dragNode; dragNode = null; canvas.classList.remove('is-dragging');
    if (sim) { sim.alphaTarget(0); n.fx = null; n.fy = null; }
    if (!moved && e.type === 'pointerup') go(n.id, null, e.ctrlKey || e.metaKey);
    if (e.pointerType === 'touch') hover = null;
    kick();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => { if (!dragNode && hover) { hover = null; canvas.style.cursor = ''; kick(); } });
  const onVis = () => kick();
  document.addEventListener('visibilitychange', onVis);
  const ro = new ResizeObserver(resize); ro.observe(host);
  readColors();
  { const r = host.getBoundingClientRect(); W = r.width; H = r.height; dpr = window.devicePixelRatio || 1; canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr); }
  setupLayout();
  if (!local) window.__graph = { nodes: () => data.nodes, toScreen: n => [n.x * view.k + view.x + W / 2, n.y * view.k + view.y + H / 2] };
  if (layout) fit(false);
  else { goal = d3.zoomIdentity.scale(local ? 1 : 0.5); d3.select(canvas).call(zoom.transform, goal); view.x = goal.x; view.y = goal.y; view.k = goal.k; }
  kick();
  const save = () => { if (!local) store.set('graphCfg2', { nodeSize: cfg.nodeSize, lineSize: cfg.lineSize, textFade: cfg.textFade, center: cfg.center, repel: cfg.repel, linkStrength: cfg.linkStrength, linkDistance: cfg.linkDistance, showOrphans: cfg.showOrphans, search: cfg.search, shape: cfg.shape, animate: cfg.animate }); };
  return {
    cfg, data: () => data,
    update(newCfg) {
      Object.assign(cfg, newCfg); save();
      if ('search' in newCfg || 'showOrphans' in newCfg) { const old = new Map(data.nodes.map(n => [n.id, n])); data = graphData(Object.assign({}, opts, cfg)); data.nodes.forEach(n => { const o = old.get(n.id); if (o) { n.x = o.x; n.y = o.y; } }); }
      if ('shape' in newCfg || 'search' in newCfg || 'showOrphans' in newCfg) { setupLayout(); userZoomed = false; if (layout) fit(true); else sim.alpha(0.8).restart(); }
      else if (sim && ['center', 'repel', 'linkStrength', 'linkDistance'].some(k => k in newCfg)) { setupLayout(); sim.alpha(0.5).restart(); }
      kick();
    },
    fit() { userZoomed = false; fit(true); },
    restyle() { readColors(); kick(); },
    destroy() { alive = false; if (sim) sim.stop(); ro.disconnect(); cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onVis); },
  };
}
function prettyQuery(q) { const t = parseQuery(q)[0]; return t ? (t.val.split('/').pop() || t.val).replace(/^\w/, c => c.toUpperCase()) : q; }
SPECIAL.graph = {
  title: () => 'Graph view', icon: 'graph', type: 'graph', cls: 'graph-host',
  show(view) {
    graphInst = makeGraph(view, {});
    const c = graphInst.cfg;
    const shapes = [['cell', 'cell', 'Cell'], ['helix', 'dna', 'Helix'], ['free', 'orbit', 'Free']];
    const panel = h(`<div class="graph-controls${store.get('graphPanel', false) ? '' : ' is-collapsed'}">
      <div class="graph-controls-header"><span>${icon('sliders')}</span><span style="flex:1;margin-left:8px">Graph settings</span><span class="graph-count">${graphInst.data().nodes.length} notes</span></div>
      <div class="graph-control-section"><h4>Shape</h4>
        <div class="segmented">${shapes.map(([k, ic, t]) => `<button data-shape="${k}" class="${c.shape === k ? 'is-active' : ''}">${icon(ic)}<span>${t}</span></button>`).join('')}</div>
        <div class="graph-control-row"><span>Animate</span><input type="checkbox" data-k="animate" ${c.animate ? 'checked' : ''}></div></div>
      <div class="graph-control-section"><h4>Filters</h4>
        <input class="search-input" data-k="search" value="${esc(c.search)}" placeholder="e.g. -path:&quot;Key Terms&quot;">
        <div class="graph-control-row"><span>Orphans</span><input type="checkbox" data-k="showOrphans" ${c.showOrphans ? 'checked' : ''}></div></div>
      <div class="graph-control-section"><h4>Groups</h4>${V.graph.groups.map(g => `<div class="color-group"><span class="color-dot" style="background:${g.color};color:${g.color}"></span>${esc(prettyQuery(g.query))}</div>`).join('')}</div>
      <div class="graph-control-section"><h4>Display</h4>
        <div class="graph-control-row"><span>Text fade</span><input type="range" min="-3" max="3" step="0.1" data-k="textFade" value="${c.textFade}"></div>
        <div class="graph-control-row"><span>Node size</span><input type="range" min="0.3" max="3" step="0.05" data-k="nodeSize" value="${c.nodeSize}"></div>
        <div class="graph-control-row"><span>Link thickness</span><input type="range" min="0.2" max="3" step="0.05" data-k="lineSize" value="${c.lineSize}"></div></div>
      <div class="graph-control-section free-only"><h4>Forces</h4>
        <div class="graph-control-row"><span>Center force</span><input type="range" min="0" max="1.5" step="0.01" data-k="center" value="${c.center}"></div>
        <div class="graph-control-row"><span>Repel force</span><input type="range" min="0" max="20" step="0.5" data-k="repel" value="${c.repel}"></div>
        <div class="graph-control-row"><span>Link force</span><input type="range" min="0" max="1" step="0.01" data-k="linkStrength" value="${c.linkStrength}"></div>
        <div class="graph-control-row"><span>Link distance</span><input type="range" min="30" max="500" step="5" data-k="linkDistance" value="${c.linkDistance}"></div></div>
    </div>`);
    view.appendChild(panel);
    const fitBtn = h(`<button class="clickable-icon graph-fit" title="Zoom to fit">${icon('maximize')}</button>`);
    view.appendChild(fitBtn); fitBtn.onclick = () => graphInst.fit();
    const sync = () => { panel.classList.toggle('is-free', graphInst.cfg.shape === 'free'); $$('[data-shape]', panel).forEach(b => b.classList.toggle('is-active', b.dataset.shape === graphInst.cfg.shape)); };
    sync();
    $('.graph-controls-header', panel).onclick = () => { panel.classList.toggle('is-collapsed'); store.set('graphPanel', !panel.classList.contains('is-collapsed')); };
    panel.addEventListener('click', e => { const b = e.target.closest('[data-shape]'); if (!b) return; graphInst.update({ shape: b.dataset.shape }); sync(); });
    let t;
    panel.addEventListener('input', e => {
      const k = e.target.dataset.k; if (!k) return;
      const v = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'range' ? +e.target.value : e.target.value;
      clearTimeout(t);
      const apply = () => { if (['textFade', 'nodeSize', 'lineSize', 'animate'].includes(k)) { graphInst.cfg[k] = v; graphInst.restyle(); graphInst.update({}); } else graphInst.update({ [k]: v }); $('.graph-count', panel).textContent = graphInst.data().nodes.length + ' notes'; };
      k === 'search' ? (t = setTimeout(apply, 300)) : apply();
    });
  },
};

/* ------------------------------------------------------------------ canvas */
function colorOf(c) { if (!c) return null; return CANVAS_COLORS[c] || c; }
function anchor(n, side) {
  switch (side) {
    case 'top': return [n.x + n.width / 2, n.y];
    case 'bottom': return [n.x + n.width / 2, n.y + n.height];
    case 'left': return [n.x, n.y + n.height / 2];
    case 'right': return [n.x + n.width, n.y + n.height / 2];
    default: return [n.x + n.width / 2, n.y + n.height / 2];
  }
}
function dir(side) { return { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] }[side] || [0, 0]; }
function renderCanvas(host, path) {
  const c = V.canvases[path];
  host.innerHTML = '';
  const wrap = h(`<div class="canvas-wrapper"><div class="canvas"></div><div class="canvas-zoom-controls">
    <button class="clickable-icon" data-z="in" title="Zoom in">${icon('plus')}</button><button class="clickable-icon" data-z="out" title="Zoom out">${icon('minus')}</button><button class="clickable-icon" data-z="fit" title="Zoom to fit">${icon('maximize')}</button></div></div>`);
  host.appendChild(wrap);
  const layer = $('.canvas', wrap);
  const byId = {};
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of c.nodes) { byId[n.id] = n; minX = Math.min(minX, n.x); minY = Math.min(minY, n.y); maxX = Math.max(maxX, n.x + n.width); maxY = Math.max(maxY, n.y + n.height); }
  const groups = c.nodes.filter(n => n.type === 'group').sort((a, b) => b.width * b.height - a.width * a.height);
  const others = c.nodes.filter(n => n.type !== 'group');
  let html = '';
  const nodeStyle = n => { const col = colorOf(n.color); return `left:${n.x}px;top:${n.y}px;width:${n.width}px;height:${n.height}px;` + (col ? `--canvas-color: ${col};` : ''); };
  for (const g of groups) {
    const bgCls = g.backgroundStyle === 'cover' ? ' bg-cover' : g.backgroundStyle === 'repeat' ? ' bg-repeat' : '';
    html += `<div class="canvas-node canvas-node-group${g.color ? ' is-themed' : ''}" style="${nodeStyle(g)}"><div class="canvas-node-container">${g.background ? `<div class="canvas-group-bg${bgCls}" style="background-image:url('${esc(g.background)}')"></div>` : ''}</div>${g.label ? `<div class="canvas-node-label">${esc(g.label)}</div>` : ''}</div>`;
  }
  html += `<svg class="canvas-edges" width="1" height="1"></svg>`;
  for (const n of others) {
    let inner = '';
    if (n.type === 'text') inner = `<div class="markdown-preview-view markdown-rendered"><div class="markdown-preview-sizer">${n.html || ''}</div></div>`;
    else if (n.type === 'file' && n.image) inner = `<img src="${esc(n.image)}" alt="" draggable="false">`;
    else if (n.type === 'file' && n.note && V.notes[n.note]) inner = `<div class="canvas-file-title"><a class="internal-link" data-note="${esc(n.note)}" href="${hashFor(n.note)}">${esc(titleOf(n.note))}</a></div><div class="markdown-preview-view markdown-rendered ${esc((V.notes[n.note].css || []).join(' '))}"><div class="markdown-preview-sizer">${V.notes[n.note].html}</div></div>`;
    else if (n.type === 'file' && n.note) inner = `<div class="canvas-file-title"><a class="internal-link" data-note="${esc(n.note)}" href="${hashFor(n.note)}">${esc(titleOf(n.note))}</a></div>`;
    else if (n.type === 'link') inner = `<div class="canvas-file-title"><a class="external-link" href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.url)}</a></div>`;
    else inner = `<div class="canvas-file-title">${esc(n.file || '')}</div>`;
    html += `<div class="canvas-node canvas-node-${n.type}${n.color ? ' is-themed' : ''}" style="${nodeStyle(n)}"><div class="canvas-node-container"><div class="canvas-node-content">${inner}</div></div></div>`;
  }
  layer.innerHTML = html;
  // edges
  const svg = $('svg', layer);
  let paths = '';
  for (const e of c.edges) {
    const a = byId[e.fromNode], b = byId[e.toNode]; if (!a || !b) continue;
    const fs = e.fromSide || 'right', ts = e.toSide || 'left';
    const [x1, y1] = anchor(a, fs), [x2, y2] = anchor(b, ts);
    const d1 = dir(fs), d2 = dir(ts);
    const len = Math.max(40, Math.hypot(x2 - x1, y2 - y1) * 0.35);
    const col = colorOf(e.color) || 'var(--canvas-edge, rgba(160,170,210,.55))';
    const arrow = (e.toEnd || 'arrow') === 'arrow';
    const s = 13, ex = x2 - (arrow ? -d2[0] * 0 : 0), ey = y2;
    paths += `<path class="canvas-edge" d="M${x1},${y1} C${x1 + d1[0] * len},${y1 + d1[1] * len} ${x2 + d2[0] * len},${y2 + d2[1] * len} ${x2 + d2[0] * (arrow ? s * 0.8 : 0)},${y2 + d2[1] * (arrow ? s * 0.8 : 0)}" style="stroke:${col}"/>`;
    if (arrow) {
      const ang = Math.atan2(-d2[1], -d2[0]);
      const p1 = [ex - Math.cos(ang - 0.42) * s, ey - Math.sin(ang - 0.42) * s], p2 = [ex - Math.cos(ang + 0.42) * s, ey - Math.sin(ang + 0.42) * s];
      paths += `<path class="canvas-edge-arrow" d="M${p1} L${ex},${ey} L${p2} Z" style="fill:${col};stroke:${col}"/>`;
    }
    if (e.label) paths += `<text class="canvas-edge-label" x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2}" text-anchor="middle">${esc(e.label)}</text>`;
  }
  svg.innerHTML = paths;

  // pan and zoom, eased, with momentum after a flick
  const t = { x: 0, y: 0, k: 1 }, goalT = { x: 0, y: 0, k: 1 };
  let raf2 = 0, lastT = 0, vel = null, alive2 = true;
  const apply = () => {
    layer.style.transform = `translate3d(${t.x}px,${t.y}px,0) scale(${t.k})`;
    wrap.style.backgroundSize = `${22 * t.k}px ${22 * t.k}px`; wrap.style.backgroundPosition = `${t.x}px ${t.y}px`;
    wrap.classList.toggle('is-far', t.k < 0.12);
  };
  const tick = now => {
    raf2 = 0; if (!alive2 || !wrap.isConnected) return;
    const dt = Math.min(64, now - (lastT || now)); lastT = now;
    let busy = false;
    if (vel) {
      const d = Math.exp(-dt / 320); vel.x *= d; vel.y *= d; goalT.x += vel.x * dt; goalT.y += vel.y * dt; busy = true;
      if (Math.hypot(vel.x, vel.y) < 0.01) vel = null;
    }
    const f = 1 - Math.exp(-dt / 75);
    for (const key of ['x', 'y', 'k']) { const d = goalT[key] - t[key]; if (Math.abs(d) > (key === 'k' ? 1e-4 : 0.05)) { t[key] += d * f; busy = true; } else t[key] = goalT[key]; }
    apply();
    if (busy) raf2 = requestAnimationFrame(tick);
    else wrap.classList.remove('is-moving');
  };
  const kickC = () => { wrap.classList.add('is-moving'); if (!raf2) { lastT = performance.now(); raf2 = requestAnimationFrame(tick); } };
  const setNow = () => { t.x = goalT.x; t.y = goalT.y; t.k = goalT.k; apply(); };
  const fit = animate => {
    const r = wrap.getBoundingClientRect(); if (!isFinite(minX) || !r.width) return;
    const k = Math.min(r.width / (maxX - minX + 160), r.height / (maxY - minY + 160), 1.2);
    goalT.k = k; goalT.x = r.width / 2 - (minX + maxX) / 2 * k; goalT.y = r.height / 2 - (minY + maxY) / 2 * k;
    vel = null; animate ? kickC() : setNow();
  };
  const zoomAt = (f, cx, cy) => { const k = clamp(goalT.k * f, 0.005, 4); goalT.x = cx - (cx - goalT.x) * (k / goalT.k); goalT.y = cy - (cy - goalT.y) * (k / goalT.k); goalT.k = k; kickC(); };
  wrap.addEventListener('wheel', e => {
    e.preventDefault(); vel = null; const r = wrap.getBoundingClientRect();
    const px = e.deltaMode === 1 ? 16 : 1;
    const isMouseWheel = e.deltaMode === 1 || (Math.abs(e.deltaY) >= 50 && Math.abs(e.deltaX) < 1 && Number.isInteger(e.deltaY));
    if (e.ctrlKey || e.metaKey || isMouseWheel) zoomAt(Math.exp(-e.deltaY * px * (e.ctrlKey ? 0.012 : 0.0022)), e.clientX - r.left, e.clientY - r.top);
    else { goalT.x -= e.deltaX * px; goalT.y -= e.deltaY * px; kickC(); }
  }, { passive: false });
  wrap.addEventListener('dblclick', e => { if (e.target.closest('a')) return; const r = wrap.getBoundingClientRect(); zoomAt(1.8, e.clientX - r.left, e.clientY - r.top); });
  const pts = new Map(); let lastP = null, pinch = null, moved = 0, track = [];
  wrap.addEventListener('pointerdown', e => {
    if (e.target.closest('.canvas-zoom-controls')) return;
    if (!e.target.closest('a')) e.preventDefault();
    pts.set(e.pointerId, [e.clientX, e.clientY]); wrap.setPointerCapture(e.pointerId); moved = 0; vel = null; track = [];
    wrap.classList.remove('just-dragged');
    if (pts.size === 1) lastP = [e.clientX, e.clientY];
    if (pts.size === 2) { const [p, q] = [...pts.values()]; pinch = { d: Math.hypot(p[0] - q[0], p[1] - q[1]), k: goalT.k }; }
    wrap.classList.add('is-dragging');
  });
  wrap.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2 && pinch) {
      const [p, q] = [...pts.values()]; const d = Math.hypot(p[0] - q[0], p[1] - q[1]); const r = wrap.getBoundingClientRect();
      zoomAt((pinch.k * d / pinch.d) / goalT.k, (p[0] + q[0]) / 2 - r.left, (p[1] + q[1]) / 2 - r.top); moved += 10; return;
    }
    if (lastP) {
      const dx = e.clientX - lastP[0], dy = e.clientY - lastP[1]; moved += Math.abs(dx) + Math.abs(dy);
      goalT.x += dx; goalT.y += dy; t.x = goalT.x; t.y = goalT.y; apply();
      lastP = [e.clientX, e.clientY]; track.push([performance.now(), goalT.x, goalT.y]); if (track.length > 6) track.shift();
    }
  });
  const end = e => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
    if (!pts.size) {
      lastP = null; wrap.classList.remove('is-dragging');
      if (moved > 6) { wrap.classList.add('just-dragged'); setTimeout(() => wrap.classList.remove('just-dragged'), 60); }
      if (track.length > 2) {
        const a = track[0], b = track[track.length - 1], dt = b[0] - a[0];
        if (dt > 0 && performance.now() - b[0] < 60) { const vx = (b[1] - a[1]) / dt, vy = (b[2] - a[2]) / dt; if (Math.hypot(vx, vy) > 0.2) { vel = { x: vx, y: vy }; kickC(); } }
      }
    } else lastP = [...pts.values()][0];
  };
  wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
  $('.canvas-zoom-controls', wrap).addEventListener('click', e => { const b = e.target.closest('[data-z]'); if (!b) return; const r = wrap.getBoundingClientRect(); if (b.dataset.z === 'fit') fit(true); else zoomAt(b.dataset.z === 'in' ? 1.5 : 1 / 1.5, r.width / 2, r.height / 2); });
  wireLinks(wrap);
  requestAnimationFrame(() => fit(false));
  return () => { alive2 = false; cancelAnimationFrame(raf2); };
}
function showCanvas(path) {
  current = { view: 'canvas', id: path, cleanup: null };
  $('#leaf').dataset.type = 'canvas';
  const view = $('#view');
  current.cleanup = renderCanvas(view, path);
  setCrumbs(path); revealInExplorer(path); renderRight(); renderStatus(path);
  if (isMobile()) { setSide('left', false); setSide('right', false); }
}

/* ------------------------------------------------------------------ public API for the other views */
window.BV = {
  get V() { return V; }, icon, esc, $, $$, h, store, isMobile, clamp, ease, collator,
  go, hashFor, titleOf, exists, hydrate, wireLinks, showMenu, toast, closePopover, noteHtml,
  registerView(id, def) { if (def.prefix) PREFIXED.push(def); else SPECIAL[id] = def; },
  onHydrate(f) { hooks.hydrate.push(f); },
  onBoot(f) { hooks.boot.push(f); },
  refreshTabs() { renderTabs(); if (current.id) setCrumbs(current.id); },
};

/* ------------------------------------------------------------------ boot */
async function boot() {
  const theme = store.get('theme', 'dark');
  document.body.classList.toggle('theme-dark', theme === 'dark'); document.body.classList.toggle('theme-light', theme === 'light');
  try {
    const res = await fetch('data/vault.json', { cache: 'no-cache' });
    V = await res.json();
  } catch (e) {
    $('#loading .loading-text').textContent = 'Could not load the vault data.'; return;
  }
  prepare();
  for (const f of hooks.boot) { try { f(V); } catch (e) { console.error(e); } }
  shell();
  $('[data-act="theme"]').innerHTML = icon(theme === 'light' ? 'sun' : 'moon');
  $$('[data-act="open"]').forEach(b => { if (!exists(b.dataset.id)) b.remove(); });
  renderExplorer(); renderBookmarks(); initTabs(); renderTabs();
  setLeftPane(state.leftPane); setRightPane(state.rightPane);
  if (isMobile()) { state.leftOpen = false; state.rightOpen = false; }
  setSide('left', state.leftOpen); setSide('right', state.rightOpen);
  window.addEventListener('hashchange', route);
  route();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
})();
