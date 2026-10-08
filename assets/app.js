/* Biomedicine Vault: an Obsidian-style reader for the vault.
   Data comes from data/vault.json, built by tools/build_site.py. */
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
const CANVAS_COLORS = { '1': '#fb464c', '2': '#e9973f', '3': '#e0de71', '4': '#44cf6e', '5': '#53dfdd', '6': '#a882ff' };

/* ------------------------------------------------------------------ data */
let V = null;
const backlinks = {};
const titleOf = id => (V.notes[id] ? V.notes[id].title : id.endsWith('.canvas') ? id.split('/').pop().replace(/\.canvas$/, '') : id.split('/').pop());
const exists = id => !!(V.notes[id] || V.canvases[id]);

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
    <button class="clickable-icon" data-act="home" title="Home">${icon('home')}</button>
    <button class="clickable-icon" data-act="random" title="Random note">${icon('shuffle')}</button>
    <div class="spacer"></div>
    <a class="clickable-icon" href="legacy/index.html" title="Flashcards and whiteboard (old study app)">${icon('cards')}</a>
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
    else if (a === 'home') go(V.home);
    else if (a === 'random') { const ids = Object.keys(V.notes); go(ids[Math.floor(Math.random() * ids.length)]); }
    else if (a === 'back') history.back();
    else if (a === 'forward') history.forward();
    else if (a === 'theme') toggleTheme();
    else if (a === 'switcher') openSwitcher();
    else if (a === 'local-graph') { setSide('right', true); setRightPane('localgraph'); }
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
        const px = Math.max(180, Math.min(560, w));
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
    if (mod && e.key.toLowerCase() === 'o') { e.preventDefault(); openSwitcher(); }
    else if (mod && e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); setSide('left', true); setLeftPane('search'); }
    else if (mod && e.key.toLowerCase() === 'g') { e.preventDefault(); go('graph'); }
    else if (e.key === 'Escape') { closePopover(); const m = $('.modal-container'); if (m) m.remove(); const l = $('.lightbox'); if (l) l.remove(); }
  });
  window.addEventListener('resize', () => { if (isMobile()) { $('#scrim').classList.toggle('is-visible', state.leftOpen || state.rightOpen); } });
}

function toggleTheme() {
  const dark = document.body.classList.contains('theme-dark');
  document.body.classList.toggle('theme-dark', !dark); document.body.classList.toggle('theme-light', dark);
  store.set('theme', dark ? 'light' : 'dark');
  $('[data-act="theme"]').innerHTML = icon(dark ? 'sun' : 'moon');
  if (current.view === 'graph' && graphInst) graphInst.restyle();
  if (localGraphInst) localGraphInst.restyle();
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
    `<div class="pane-header">Views</div><div class="tree-item" data-graph="1">${icon('graph')} Graph view</div>`;
  $('#bookmarks').onclick = e => { const t = e.target.closest('.tree-item'); if (!t) return; t.dataset.graph ? go('graph') : go(t.dataset.id); if (isMobile()) setSide('left', false); };
}

/* ------------------------------------------------------------------ tabs and routing */
let current = { view: null, id: null };
function initTabs() {
  if (!Array.isArray(state.tabs) || !state.tabs.length) state.tabs = [V.home];
  state.tabs = state.tabs.filter(t => t === 'graph' || exists(t));
  if (!state.tabs.length) state.tabs = [V.home];
  if (state.active >= state.tabs.length) state.active = 0;
}
function saveTabs() { store.set('tabs', state.tabs); store.set('activeTab', state.active); }
function hashFor(id, heading) { return '#/' + encodeURI(id) + (heading ? '#' + encodeURIComponent(heading) : ''); }
function parseHash() {
  const raw = location.hash.slice(2);
  if (!raw) return null;
  const i = raw.indexOf('#');
  const id = decodeURI(i < 0 ? raw : raw.slice(0, i));
  const heading = i < 0 ? null : decodeURIComponent(raw.slice(i + 1));
  return { id, heading };
}
function go(id, heading, newTab) {
  if (!id) return;
  if (newTab) { state.tabs.splice(state.active + 1, 0, id); state.active += 1; saveTabs(); }
  const target = hashFor(id, heading);
  if (location.hash === target) route(); else location.hash = target;
}
function route() {
  const r = parseHash();
  if (!r) { location.replace(hashFor(state.tabs[state.active] || V.home)); return; }
  let { id, heading } = r;
  if (id !== 'graph' && !exists(id)) {
    // tolerate links to a bare note name
    const hit = Object.keys(V.notes).find(k => k.split('/').pop().toLowerCase() === id.split('/').pop().toLowerCase());
    if (hit) { location.replace(hashFor(hit, heading)); return; }
    id = V.home;
  }
  state.tabs[state.active] = id; saveTabs(); renderTabs();
  closePopover();
  if (id === 'graph') showGraph();
  else if (id.endsWith('.canvas')) showCanvas(id);
  else showNote(id, heading);
}
function renderTabs() {
  const bar = $('#tabbar');
  bar.innerHTML = state.tabs.map((t, i) => `<div class="workspace-tab-header${i === state.active ? ' is-active' : ''}" data-i="${i}" title="${esc(t === 'graph' ? 'Graph view' : titleOf(t))}">
    <span class="workspace-tab-header-inner-icon">${icon(t === 'graph' ? 'graph' : t.endsWith('.canvas') ? 'canvas' : 'file')}</span>
    <span class="workspace-tab-header-inner-title">${esc(t === 'graph' ? 'Graph view' : titleOf(t))}</span>
    <span class="workspace-tab-header-inner-close-button" data-close="${i}">${icon('x')}</span></div>`).join('') +
    `<button class="clickable-icon new-tab-button" data-newtab="1" title="New tab">${icon('plus')}</button>`;
  bar.onclick = e => {
    const c = e.target.closest('[data-close]');
    if (c) { e.stopPropagation(); const i = +c.dataset.close; state.tabs.splice(i, 1); if (!state.tabs.length) state.tabs = [V.home]; if (state.active >= i && state.active > 0) state.active--; saveTabs(); location.hash = hashFor(state.tabs[state.active]); renderTabs(); return; }
    if (e.target.closest('[data-newtab]')) { go(V.home, null, true); return; }
    const t = e.target.closest('.workspace-tab-header');
    if (t) { state.active = +t.dataset.i; saveTabs(); location.hash = hashFor(state.tabs[state.active]); }
  };
  bar.onauxclick = e => { const t = e.target.closest('.workspace-tab-header'); if (t && e.button === 1) { const c = $('[data-close]', t); c && c.click(); } };
}
function setCrumbs(id) {
  const crumbs = $('#crumbs');
  if (id === 'graph') { crumbs.innerHTML = `<span class="view-header-title">Graph view</span>`; $('#mobile-title').textContent = 'Graph view'; document.title = 'Graph view · ' + V.title; return; }
  const parts = id.split('/');
  const name = parts.pop().replace(/\.canvas$/, '');
  crumbs.innerHTML = parts.map(p => `<span class="view-header-breadcrumb">${esc(p)}</span> / `).join('') + `<span class="view-header-title">${esc(name)}</span>`;
  $('#mobile-title').textContent = name;
  document.title = name + ' · ' + V.title;
}

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
  current = { view: 'note', id };
  if (graphInst) { graphInst.destroy(); graphInst = null; }
  $('#leaf').dataset.type = 'markdown';
  const view = $('#view');
  view.classList.remove('graph-host');
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
    title.addEventListener('click', e => { if (e.target.closest('a')) return; c.classList.toggle('is-collapsed'); });
    c.addEventListener('click', e => { if (c.classList.contains('is-collapsed') && !e.target.closest('a') && !e.target.closest('.callout-title')) c.classList.remove('is-collapsed'); });
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
  wireLinks(root);
}
function wireLinks(root) {
  root.addEventListener('click', e => {
    const a = e.target.closest('a.internal-link');
    if (!a || a.closest('.canvas-wrapper.just-dragged')) return;
    if (a.dataset.note) { e.preventDefault(); go(a.dataset.note, a.dataset.heading || null, e.ctrlKey || e.metaKey || e.button === 1); }
    else if (a.dataset.heading) { e.preventDefault(); const t = document.getElementById(a.dataset.heading); if (t) t.scrollIntoView({ behavior: 'smooth' }); }
  });
  if (!window.matchMedia('(hover: hover)').matches) return;
  root.addEventListener('mouseover', e => {
    const a = e.target.closest('a.internal-link[data-note]');
    if (!a || !V.notes[a.dataset.note]) return;
    clearTimeout(popTimer);
    popTimer = setTimeout(() => showPopover(a), 420);
    a.addEventListener('mouseleave', () => { clearTimeout(popTimer); popTimer = setTimeout(() => { if (!popHover) closePopover(); }, 260); }, { once: true });
  });
}
let popTimer = null, popHover = false;
function showPopover(a) {
  closePopover();
  const id = a.dataset.note;
  const pop = h(`<div class="popover hover-popover">${noteHtml(id, { noProps: true })}</div>`);
  document.body.appendChild(pop);
  hydrate(pop, id);
  const r = a.getBoundingClientRect();
  const W = pop.offsetWidth, H = pop.offsetHeight;
  let x = Math.min(window.innerWidth - W - 12, Math.max(12, r.left));
  let y = r.bottom + 8; if (y + H > window.innerHeight - 12) y = Math.max(12, r.top - H - 8);
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
  if (a.dataset.heading) { const t = pop.querySelector(`[id="${CSS.escape(a.dataset.heading)}"]`); if (t) pop.scrollTop = t.offsetTop - 10; }
  pop.addEventListener('mouseenter', () => { popHover = true; clearTimeout(popTimer); });
  pop.addEventListener('mouseleave', () => { popHover = false; popTimer = setTimeout(closePopover, 200); });
}
function closePopover() { popHover = false; $$('.hover-popover').forEach(p => p.remove()); }

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
  if (current.view === 'graph') {
    $('#pane-' + p).innerHTML = `<div class="pane-empty">Open a note to see its ${p === 'localgraph' ? 'local graph' : p}.</div>`;
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
  sum.textContent = `${hits.length} result${hits.length === 1 ? '' : 's'}`;
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
  const all = [...Object.keys(V.notes), ...Object.keys(V.canvases), 'graph'];
  const m = h(`<div class="modal-container"><div class="prompt"><input class="prompt-input" placeholder="Find or open a note…" autocomplete="off"><div class="prompt-results"></div>
    <div class="prompt-instructions"><span>↑↓ to navigate</span><span>↵ to open</span><span>ctrl ↵ new tab</span><span>esc to close</span></div></div></div>`);
  document.body.appendChild(m);
  const input = $('.prompt-input', m), res = $('.prompt-results', m);
  let sel = 0, list = [];
  const fuzzy = (q, s) => { s = s.toLowerCase(); let i = 0, score = 0, last = -2; for (const ch of q) { const j = s.indexOf(ch, i); if (j < 0) return -1; score += j === last + 1 ? 3 : 1; last = j; i = j + 1; } return score - s.length * 0.01; };
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    const recent = store.get('recent', []);
    list = q ? all.map(id => ({ id, s: Math.max(fuzzy(q, id === 'graph' ? 'graph view' : titleOf(id)) * 2, fuzzy(q, id)) })).filter(x => x.s >= 0).sort((a, b) => b.s - a.s).slice(0, 60).map(x => x.id)
      : [...recent.filter(exists), ...all.filter(id => !recent.includes(id))].slice(0, 40);
    sel = Math.min(sel, Math.max(0, list.length - 1));
    res.innerHTML = list.map((id, i) => `<div class="suggestion${i === sel ? ' is-selected' : ''}" data-i="${i}"><div class="suggestion-title">${esc(id === 'graph' ? 'Graph view' : titleOf(id))}</div><div class="suggestion-note">${esc(id === 'graph' ? '' : id.split('/').slice(0, -1).join(' / '))}</div></div>`).join('') || '<div class="pane-empty">No matches</div>';
    const s = $('.is-selected', res); if (s) s.scrollIntoView({ block: 'nearest' });
  };
  const open = (i, nt) => { const id = list[i]; if (!id) return; m.remove(); const r = store.get('recent', []).filter(x => x !== id); r.unshift(id); store.set('recent', r.slice(0, 20)); go(id, null, nt); };
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
function graphColor(id, groups) {
  for (const g of groups) { const terms = parseQuery(g.query); if (terms.length && matches(id, terms)) return g.color; }
  return null;
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
  for (const id of ids) for (const t of V.notes[id].links) if (set.has(t) && t !== id) { links.push({ source: id, target: t }); deg[id] = (deg[id] || 0) + 1; deg[t] = (deg[t] || 0) + 1; }
  let nodes = ids.map(id => ({ id, deg: deg[id] || 0, color: graphColor(id, G.groups) }));
  if (!opts.local && opts.showOrphans === false) nodes = nodes.filter(n => n.deg > 0);
  return { nodes, links };
}
function makeGraph(host, opts = {}) {
  const canvas = host.querySelector('canvas') || host.appendChild(document.createElement('canvas'));
  canvas.classList.add('graph-canvas');
  const ctx = canvas.getContext('2d');
  const G = V.graph;
  const cfg = Object.assign({ nodeSize: G.nodeSize, lineSize: G.lineSize, textFade: G.textFade, center: G.center, repel: G.repel, linkStrength: G.linkStrength, linkDistance: G.linkDistance, showOrphans: G.showOrphans, search: G.search }, opts.local ? {} : store.get('graphCfg', {}));
  let data = graphData(Object.assign({}, opts, cfg));
  let W = 0, H = 0, dpr = 1, transform = d3.zoomIdentity, hover = null, sim = null, alive = true, raf = null, ticks = 0, userZoomed = false;
  let neighbours = new Map();
  let colors = {};
  const tooltip = opts.local ? null : host.appendChild(h('<div class="graph-tooltip"></div>'));
  function readColors() {
    const cs = getComputedStyle(document.body);
    const light = document.body.classList.contains('theme-light');
    colors = {
      node: cs.getPropertyValue('--graph-node').trim() || (light ? '#5B65A0' : '#9AA6D8'),
      line: cs.getPropertyValue('--graph-line').trim() || 'rgba(150,170,255,.2)',
      text: cs.getPropertyValue('--graph-text').trim() || (light ? '#1B2040' : '#C9D0F2'),
      focus: light ? '#1B2040' : '#FFFFFF', accent: cs.getPropertyValue('--interactive-accent').trim() || '#34D399',
    };
  }
  function indexNeighbours() {
    neighbours = new Map(data.nodes.map(n => [n.id, new Set()]));
    for (const l of data.links) { const s = l.source.id || l.source, t = l.target.id || l.target; neighbours.get(s).add(t); neighbours.get(t).add(s); }
  }
  const radius = n => (opts.local ? 3.2 : 3) * cfg.nodeSize * (1 + Math.sqrt(n.deg) * 0.55);
  function resize() {
    const r = host.getBoundingClientRect(); dpr = window.devicePixelRatio || 1;
    W = r.width; H = r.height; canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr);
    draw();
  }
  function startSim() {
    if (sim) sim.stop();
    indexNeighbours();
    const prev = new Map((startSim.prev || []).map(n => [n.id, n]));
    data.nodes.forEach(n => { const p = prev.get(n.id); if (p) { n.x = p.x; n.y = p.y; } });
    sim = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id).distance(opts.local ? 60 : 30 + cfg.linkDistance * 0.22).strength(Math.min(1, cfg.linkStrength) * (opts.local ? .7 : .45)))
      .force('charge', d3.forceManyBody().strength(-(opts.local ? 140 : 18 + cfg.repel * 9)).distanceMax(opts.local ? 400 : 900))
      .force('x', d3.forceX(0).strength(cfg.center * (opts.local ? .08 : .045)))
      .force('y', d3.forceY(0).strength(cfg.center * (opts.local ? .08 : .045)))
      .force('collide', d3.forceCollide(d => radius(d) + 2))
      .alphaDecay(opts.local ? 0.04 : 0.018)
      .on('tick', () => { ticks++; if (!userZoomed && (ticks === 60 || ticks === 160)) fit(true); schedule(); })
      .on('end', () => { if (!userZoomed) fit(true); });
    ticks = 0;
    startSim.prev = data.nodes;
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(() => { raf = null; draw(); }); }
  function draw() {
    if (!alive) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr * transform.k, 0, 0, dpr * transform.k, dpr * (transform.x + W / 2), dpr * (transform.y + H / 2));
    const focus = hover || (opts.local ? data.nodes.find(n => n.id === opts.local) : null);
    const near = focus ? neighbours.get(focus.id) : null;
    ctx.lineWidth = Math.max(0.4, cfg.lineSize) / transform.k * (opts.local ? 1 : 1);
    for (const l of data.links) {
      const s = l.source, t = l.target; if (s.x == null) continue;
      const lit = focus && (s === focus || t === focus);
      ctx.strokeStyle = lit ? (focus.color || colors.accent) : colors.line;
      ctx.globalAlpha = focus && !lit && hover ? 0.25 : 1;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y); ctx.stroke();
    }
    for (const n of data.nodes) {
      if (n.x == null) continue;
      const dim = hover && n !== hover && !(near && near.has(n.id));
      ctx.globalAlpha = dim ? 0.22 : 1;
      ctx.fillStyle = n === focus ? (n.color || colors.focus) : (n.color || colors.node);
      ctx.beginPath(); ctx.arc(n.x, n.y, radius(n) * (n === hover ? 1.25 : 1), 0, Math.PI * 2); ctx.fill();
      if (opts.local && n.id === opts.local) { ctx.strokeStyle = colors.focus; ctx.lineWidth = 1.5 / transform.k; ctx.stroke(); }
    }
    // labels
    const k = transform.k;
    const base = opts.local ? 1 : Math.max(0, Math.min(1, (k - (1.1 - cfg.textFade * 0.25)) * 2.2));
    ctx.font = `${12 / Math.max(k, .6)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const n of data.nodes) {
      if (n.x == null) continue;
      const special = hover && (n === hover || (near && near.has(n.id)));
      const a = special ? 1 : hover ? base * 0.15 : base;
      if (a <= 0.02) continue;
      ctx.globalAlpha = a; ctx.fillStyle = colors.text;
      ctx.fillText(titleOf(n.id), n.x, n.y + radius(n) + 3 / k);
    }
    ctx.globalAlpha = 1;
  }
  function nodeAt(px, py) {
    const [x, y] = transform.invert([px - W / 2, py - H / 2]);
    let best = null, bd = Infinity;
    for (const n of data.nodes) { const d = (n.x - x) ** 2 + (n.y - y) ** 2; const r = radius(n) + 4 / transform.k; if (d < r * r && d < bd) { bd = d; best = n; } }
    return best;
  }
  const zoom = d3.zoom().scaleExtent([0.05, 8]).filter(e => !e.button && !(e.type === 'mousedown' && nodeAt(...d3.pointer(e, canvas))))
    .on('zoom', e => { transform = e.transform; if (e.sourceEvent) userZoomed = true; schedule(); });
  function fit(animate) {
    const pts = data.nodes.filter(n => n.x != null);
    if (!pts.length || !W) return;
    const q = (arr, f) => arr[Math.max(0, Math.min(arr.length - 1, Math.round(f * (arr.length - 1))))];
    const xs = pts.map(n => n.x).sort((a, b) => a - b), ys = pts.map(n => n.y).sort((a, b) => a - b);
    const lo = pts.length > 40 ? 0.01 : 0, hi = 1 - lo;
    const x0 = q(xs, lo), x1 = q(xs, hi), y0 = q(ys, lo), y1 = q(ys, hi);
    const pad = opts.local ? 40 : 60;
    const k = Math.max(0.05, Math.min(opts.local ? 2 : 1.6, (W - pad * 2) / Math.max(1, x1 - x0), (H - pad * 2) / Math.max(1, y1 - y0)));
    const t = d3.zoomIdentity.translate(-k * (x0 + x1) / 2, -k * (y0 + y1) / 2).scale(k);
    const sel = d3.select(canvas);
    (animate ? sel.transition().duration(500) : sel).call(zoom.transform, t);
  }
  d3.select(canvas).call(zoom).on('dblclick.zoom', null);
  let dragNode = null, moved = false;
  canvas.addEventListener('pointerdown', e => {
    const [px, py] = d3.pointer(e, canvas); dragNode = nodeAt(px, py); moved = false;
    if (dragNode) { canvas.setPointerCapture(e.pointerId); canvas.classList.add('is-dragging'); sim.alphaTarget(0.25).restart(); }
  });
  canvas.addEventListener('pointermove', e => {
    const [px, py] = d3.pointer(e, canvas);
    if (dragNode) { moved = true; const [x, y] = transform.invert([px - W / 2, py - H / 2]); dragNode.fx = x; dragNode.fy = y; schedule(); return; }
    const n = nodeAt(px, py);
    if (n !== hover) { hover = n; canvas.style.cursor = n ? 'pointer' : ''; schedule(); }
    if (tooltip) { if (n) { tooltip.style.display = 'block'; tooltip.textContent = titleOf(n.id); tooltip.style.left = px + 'px'; tooltip.style.top = (py - 6) + 'px'; } else tooltip.style.display = 'none'; }
  });
  canvas.addEventListener('pointerup', e => {
    if (dragNode) {
      const n = dragNode; dragNode = null; canvas.classList.remove('is-dragging'); sim.alphaTarget(0);
      n.fx = null; n.fy = null;
      if (!moved) go(n.id, null, e.ctrlKey || e.metaKey);
    }
  });
  canvas.addEventListener('pointerleave', () => { hover = null; if (tooltip) tooltip.style.display = 'none'; schedule(); });
  const ro = new ResizeObserver(resize); ro.observe(host);
  readColors(); resize(); startSim();
  if (!opts.local) {
    const k = Math.min(1, Math.max(0.25, Math.min(W, H) / 1400));
    transform = d3.zoomIdentity.scale(k); d3.select(canvas).call(zoom.transform, transform);
  } else { transform = d3.zoomIdentity.scale(1.1); d3.select(canvas).call(zoom.transform, transform); }
  return {
    cfg, data: () => data,
    update(newCfg) {
      Object.assign(cfg, newCfg); if (!opts.local) store.set('graphCfg', { nodeSize: cfg.nodeSize, lineSize: cfg.lineSize, textFade: cfg.textFade, center: cfg.center, repel: cfg.repel, linkStrength: cfg.linkStrength, linkDistance: cfg.linkDistance, showOrphans: cfg.showOrphans, search: cfg.search });
      if ('search' in newCfg || 'showOrphans' in newCfg) data = graphData(Object.assign({}, opts, cfg));
      startSim(); sim.alpha(0.6).restart();
    },
    fit() { userZoomed = false; fit(true); },
    restyle() { readColors(); draw(); },
    destroy() { alive = false; if (sim) sim.stop(); ro.disconnect(); if (tooltip) tooltip.remove(); },
  };
}
function prettyQuery(q) { const t = parseQuery(q)[0]; return t ? (t.val.split('/').pop() || t.val).replace(/^\w/, c => c.toUpperCase()) : q; }
function showGraph() {
  current = { view: 'graph', id: 'graph' };
  const view = $('#view');
  $('#leaf').dataset.type = 'graph';
  view.classList.add('graph-host');
  view.innerHTML = '';
  setCrumbs('graph'); revealInExplorer('__none__'); renderRight();
  $('#status').innerHTML = '';
  if (graphInst) graphInst.destroy();
  graphInst = makeGraph(view, {});
  const c = graphInst.cfg;
  const panel = h(`<div class="graph-controls${store.get('graphPanel', false) ? '' : ' is-collapsed'}">
    <div class="graph-controls-header"><span>${icon('sliders')}</span><span style="flex:1;margin-left:8px">Graph settings</span><span>${graphInst.data().nodes.length} notes</span></div>
    <div class="graph-control-section"><h4>Filters</h4>
      <input class="search-input" data-k="search" value="${esc(c.search)}" placeholder="e.g. -path:&quot;Key Terms&quot;">
      <div class="graph-control-row"><span>Orphans</span><input type="checkbox" data-k="showOrphans" ${c.showOrphans ? 'checked' : ''}></div></div>
    <div class="graph-control-section"><h4>Groups</h4>${V.graph.groups.map(g => `<div class="color-group"><span class="color-dot" style="background:${g.color};color:${g.color}"></span>${esc(prettyQuery(g.query))}</div>`).join('')}</div>
    <div class="graph-control-section"><h4>Display</h4>
      <div class="graph-control-row"><span>Text fade</span><input type="range" min="-3" max="3" step="0.1" data-k="textFade" value="${c.textFade}"></div>
      <div class="graph-control-row"><span>Node size</span><input type="range" min="0.3" max="3" step="0.05" data-k="nodeSize" value="${c.nodeSize}"></div>
      <div class="graph-control-row"><span>Link thickness</span><input type="range" min="0.2" max="3" step="0.05" data-k="lineSize" value="${c.lineSize}"></div></div>
    <div class="graph-control-section"><h4>Forces</h4>
      <div class="graph-control-row"><span>Center force</span><input type="range" min="0" max="1.5" step="0.01" data-k="center" value="${c.center}"></div>
      <div class="graph-control-row"><span>Repel force</span><input type="range" min="0" max="20" step="0.5" data-k="repel" value="${c.repel}"></div>
      <div class="graph-control-row"><span>Link force</span><input type="range" min="0" max="1" step="0.01" data-k="linkStrength" value="${c.linkStrength}"></div>
      <div class="graph-control-row"><span>Link distance</span><input type="range" min="30" max="500" step="5" data-k="linkDistance" value="${c.linkDistance}"></div></div>
  </div>`);
  view.appendChild(panel);
  $('.graph-controls-header', panel).onclick = () => { panel.classList.toggle('is-collapsed'); store.set('graphPanel', !panel.classList.contains('is-collapsed')); };
  let t;
  panel.addEventListener('input', e => {
    const k = e.target.dataset.k; if (!k) return;
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'range' ? +e.target.value : e.target.value;
    clearTimeout(t);
    const apply = () => { if (['textFade', 'nodeSize', 'lineSize'].includes(k)) { graphInst.cfg[k] = v; graphInst.restyle(); store.set('graphCfg', Object.assign(store.get('graphCfg', {}), { [k]: v })); } else graphInst.update({ [k]: v }); $('.graph-controls-header span:last-child', panel).textContent = graphInst.data().nodes.length + ' notes'; };
    k === 'search' ? (t = setTimeout(apply, 300)) : apply();
  });
}

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
    const col = colorOf(e.color) || 'var(--text-faint)';
    paths += `<path d="M${x1},${y1} C${x1 + d1[0] * len},${y1 + d1[1] * len} ${x2 + d2[0] * len},${y2 + d2[1] * len} ${x2},${y2}" style="stroke:${col}"/>`;
    if ((e.toEnd || 'arrow') === 'arrow') {
      const ang = Math.atan2(-d2[1], -d2[0]); const s = 12;
      const p1 = [x2 - Math.cos(ang - 0.45) * s, y2 - Math.sin(ang - 0.45) * s], p2 = [x2 - Math.cos(ang + 0.45) * s, y2 - Math.sin(ang + 0.45) * s];
      paths += `<path d="M${p1} L${x2},${y2} L${p2} Z" style="fill:${col};stroke:${col}"/>`;
    }
    if (e.label) paths += `<text class="canvas-edge-label" x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2}" text-anchor="middle">${esc(e.label)}</text>`;
  }
  svg.innerHTML = paths;
  // pan and zoom
  let t = { x: 0, y: 0, k: 1 };
  const apply = () => { layer.style.transform = `translate(${t.x}px,${t.y}px) scale(${t.k})`; wrap.style.backgroundSize = `${22 * t.k}px ${22 * t.k}px`; wrap.style.backgroundPosition = `${t.x}px ${t.y}px`; };
  const fit = () => {
    const r = wrap.getBoundingClientRect(); if (!isFinite(minX)) return;
    const k = Math.min(r.width / (maxX - minX + 160), r.height / (maxY - minY + 160), 1.2);
    t = { k, x: r.width / 2 - (minX + maxX) / 2 * k, y: r.height / 2 - (minY + maxY) / 2 * k }; apply();
  };
  const zoomAt = (f, cx, cy) => { const k = Math.max(0.01, Math.min(4, t.k * f)); t.x = cx - (cx - t.x) * (k / t.k); t.y = cy - (cy - t.y) * (k / t.k); t.k = k; apply(); };
  wrap.addEventListener('wheel', e => {
    e.preventDefault(); const r = wrap.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > 0 && !e.shiftKey && Math.abs(e.deltaX) < 1 && e.deltaMode === 1) zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
    else if (e.ctrlKey) zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
    else { t.x -= e.deltaX; t.y -= e.deltaY; apply(); }
  }, { passive: false });
  wrap.addEventListener('dblclick', e => { const r = wrap.getBoundingClientRect(); zoomAt(1.6, e.clientX - r.left, e.clientY - r.top); });
  const pts = new Map(); let last = null, pinch = null, moved = 0;
  wrap.addEventListener('pointerdown', e => {
    if (e.target.closest('.canvas-zoom-controls')) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]); wrap.setPointerCapture(e.pointerId); moved = 0; wrap.classList.remove('just-dragged');
    if (pts.size === 1) last = [e.clientX, e.clientY];
    if (pts.size === 2) { const [p, q] = [...pts.values()]; pinch = { d: Math.hypot(p[0] - q[0], p[1] - q[1]), k: t.k }; }
    wrap.classList.add('is-dragging');
  });
  wrap.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2 && pinch) {
      const [p, q] = [...pts.values()]; const d = Math.hypot(p[0] - q[0], p[1] - q[1]); const r = wrap.getBoundingClientRect();
      zoomAt((pinch.k * d / pinch.d) / t.k, (p[0] + q[0]) / 2 - r.left, (p[1] + q[1]) / 2 - r.top); moved += 10; return;
    }
    if (last) { const dx = e.clientX - last[0], dy = e.clientY - last[1]; moved += Math.abs(dx) + Math.abs(dy); t.x += dx; t.y += dy; last = [e.clientX, e.clientY]; apply(); }
  });
  const end = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) { last = null; wrap.classList.remove('is-dragging'); if (moved > 6) { wrap.classList.add('just-dragged'); setTimeout(() => wrap.classList.remove('just-dragged'), 50); } } else last = [...pts.values()][0]; };
  wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
  $('.canvas-zoom-controls', wrap).addEventListener('click', e => { const b = e.target.closest('[data-z]'); if (!b) return; const r = wrap.getBoundingClientRect(); if (b.dataset.z === 'fit') fit(); else zoomAt(b.dataset.z === 'in' ? 1.4 : 1 / 1.4, r.width / 2, r.height / 2); });
  wireLinks(wrap);
  requestAnimationFrame(fit);
  new ResizeObserver(() => {}).observe(wrap);
}
function showCanvas(path) {
  current = { view: 'canvas', id: path };
  if (graphInst) { graphInst.destroy(); graphInst = null; }
  $('#leaf').dataset.type = 'canvas';
  const view = $('#view');
  view.classList.remove('graph-host');
  view.innerHTML = '';
  renderCanvas(view, path);
  setCrumbs(path); revealInExplorer(path); renderRight(); renderStatus(path);
  if (isMobile()) { setSide('left', false); setSide('right', false); }
}

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
  shell();
  $('[data-act="theme"]').innerHTML = icon(theme === 'light' ? 'sun' : 'moon');
  renderExplorer(); renderBookmarks(); initTabs(); renderTabs();
  setLeftPane(state.leftPane); setRightPane(state.rightPane);
  if (isMobile()) { state.leftOpen = false; state.rightOpen = false; }
  setSide('left', state.leftOpen); setSide('right', state.rightOpen);
  window.addEventListener('hashchange', route);
  route();
}
boot();
})();
