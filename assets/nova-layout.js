/* Nova layout: the second interface re-lays the vault out around modules and lectures instead of
   folders and files. Loaded after nova-components.js, only in Nova mode.
     - navigator: the left pane lists modules > lectures (plus practicals, seminars, extras) and tools
     - home: a LaserFlow hero landing on a "today" panel, an accordion of modules, a tool bento
     - module: a module page with a dithered cover and every lecture as a card with reading progress
     - reader: a lecture (or practical / seminar) read as one page, every topic note stitched in as a
       chapter, with a chapter rail, scroll progress, key terms used, and previous / next lecture
   app.js asks NovaUI.route(id) for a view before falling back to the normal note view, so Classic is
   untouched and the notes themselves are not changed. */
(() => {
'use strict';
const B = window.BV;
const { icon, esc, $, $$, h, store } = B;
const N = window.NovaUI;

const COLORS = {
  'Molecular Biology and Genetics': '#34D399',
  'Introduction to Biomedicine': '#A78BFA',
  'Biological Chemistry': '#FBBF24',
  'Cell Biology and Physiology': '#38BDF8',
  'Professional Skills for Biosciences': '#FB7185',
};
const colorOf = s => COLORS[s] || '#8B5CF6';
const KIND = { lecture: 'Lectures', practical: 'Practicals', seminar: 'Seminars', extra: 'Extras' };
const KIND_ONE = { lecture: 'Lecture', practical: 'Practical', seminar: 'Seminar', extra: 'Extra' };

/* ---------------------------------------------------------------- model */
let M = null;
const folderOf = id => id.slice(0, id.lastIndexOf('/'));
const nameOf = id => id.slice(id.lastIndexOf('/') + 1);
function model() {
  if (M && M.V === B.V) return M;
  const notes = B.V.notes;
  const modules = [], byTitle = {}, hubs = {}, folderHub = {}, folderTopics = {};
  for (const [id, n] of Object.entries(notes)) {
    const p = n.props || {};
    if (p.type === 'subject hub') {
      const m = { id, title: p.title || n.title, base: folderOf(id) + '/', semester: p.semester || '', color: colorOf(p.title || n.title), groups: {} };
      modules.push(m); byTitle[m.title] = m;
    } else if (p.type === 'hub') {
      hubs[id] = { id, title: p.title || n.title, kind: p.kind || 'extra', number: p.number || 0, subject: p.subject || '' };
      folderHub[folderOf(id)] = id;
    }
  }
  for (const [id, n] of Object.entries(notes)) {
    const p = n.props || {};
    if (p.type === 'topic' && folderHub[folderOf(id)]) (folderTopics[folderOf(id)] = folderTopics[folderOf(id)] || []).push(id);
  }
  for (const f in folderTopics) folderTopics[f].sort((a, b) => B.collator.compare(nameOf(a), nameOf(b)));
  for (const hub of Object.values(hubs)) {
    const m = byTitle[hub.subject] || modules.find(x => hub.id.startsWith(x.base));
    if (!m) continue;
    hub.module = m;
    hub.topics = folderTopics[folderOf(hub.id)] || [];
    (m.groups[hub.kind] = m.groups[hub.kind] || []).push(hub);
  }
  for (const m of modules) for (const k in m.groups) m.groups[k].sort((a, b) => (a.number - b.number) || B.collator.compare(nameOf(folderOf(a.id)), nameOf(folderOf(b.id))));
  const order = ['Molecular Biology and Genetics', 'Introduction to Biomedicine', 'Biological Chemistry', 'Cell Biology and Physiology', 'Professional Skills for Biosciences'];
  modules.sort((a, b) => ((order.indexOf(a.title) + 99) % 99) - ((order.indexOf(b.title) + 99) % 99) || B.collator.compare(a.title, b.title));
  const topicHub = {};
  for (const hub of Object.values(hubs)) for (const t of hub.topics || []) topicHub[t] = hub.id;
  M = { V: B.V, modules, byTitle, hubs, topicHub };
  return M;
}
const moduleOfId = id => model().modules.find(m => id.startsWith(m.base));
function stats(hubId) {                // "14 topics · 27 key terms · 27 questions" from the hub's abstract callout
  const n = B.V.notes[hubId]; if (!n) return '';
  const m = n.html.match(/data-callout="abstract">[\s\S]*?<div class="callout-content"><p>([\s\S]*?)<\/p>/);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}
function summaryOf(id) {
  const n = B.V.notes[id]; if (!n) return '';
  if (n.props && n.props.summary) return n.props.summary;
  const m = n.html.match(/data-callout="abstract">[\s\S]*?<div class="callout-content"><p>([\s\S]*?)<\/p>/);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}
const plainNum = n => String(n).padStart(2, '0');

/* reading progress: furthest chapter reached per hub */
const READ_KEY = 'novaRead';
const readOf = id => (store.get(READ_KEY, {})[id] || 0);
function markRead(id, frac) { const r = store.get(READ_KEY, {}); if (frac > (r[id] || 0) + 0.01) { r[id] = Math.min(1, frac); store.set(READ_KEY, r); } }

/* ---------------------------------------------------------------- GL helpers: mount once the bundle is in */
function mountGL(el, kind, props, bag) {
  N.loadGL().then(() => {
    if (!el.isConnected || !B.isNova() || !N[kind]) return;
    try { bag.push(N[kind](el, props)); } catch (e) { console.error(e); }
  }).catch(() => {});
}
const destroyAll = bag => () => { while (bag.length) { try { bag.pop().destroy(); } catch (e) { /* already gone */ } } };

/* ---------------------------------------------------------------- navigator (left pane) */
const OPEN_KEY = 'novaNavOpen';
function navPane(root) {
  const { modules } = model();
  const cur = B.currentId() || '';
  const curHub = model().topicHub[cur] || (model().hubs[cur] ? cur : '');
  const curMod = moduleOfId(cur);
  const open = new Set(store.get(OPEN_KEY, curMod ? [curMod.id] : []));
  if (curMod) open.add(curMod.id);
  const tool = (id, ic, label) => B.exists(id) ? `<button class="nv-nav-item${cur === id ? ' is-active' : ''}" data-go="${esc(id)}">${icon(ic)}<span>${esc(label)}</span></button>` : '';
  root.innerHTML = `<nav class="nv-nav">
    ${tool(B.V.home, 'home', 'Home')}
    <div class="nv-nav-label">Modules</div>
    ${modules.map(m => {
      const lecs = Object.keys(KIND).flatMap(k => (m.groups[k] || []).map(hb => ({ hb, k })));
      const isOpen = open.has(m.id);
      return `<div class="nv-nav-mod${isOpen ? ' is-open' : ''}" style="--mod:${m.color}" data-mod="${esc(m.id)}">
        <div class="nv-nav-modrow${cur === m.id ? ' is-active' : ''}"><button class="nv-nav-caret" data-toggle="${esc(m.id)}" aria-label="Expand">${icon('chevron-right')}</button><button class="nv-nav-modname" data-go="${esc(m.id)}"><i></i><span>${esc(m.title)}</span></button></div>
        <div class="nv-nav-lecs">${lecs.length ? lecs.map(({ hb, k }, i) => {
          const head = k !== 'lecture' && (i === 0 || lecs[i - 1].k !== k) ? `<div class="nv-nav-sub">${KIND[k]}</div>` : '';
          const pr = readOf(hb.id);
          return `${head}<button class="nv-nav-lec${curHub === hb.id ? ' is-active' : ''}" data-go="${esc(hb.id)}" title="${esc(hb.title)}"><b>${hb.number ? plainNum(hb.number) : '·'}</b><span>${esc(hb.title.replace(/\s*\((Lecture|Seminar) \d+\)$/, ''))}</span>${pr ? `<em style="--p:${Math.round(pr * 100)}%"></em>` : ''}</button>`;
        }).join('') : '<div class="nv-nav-empty">No lectures yet</div>'}</div></div>`;
    }).join('')}
    <div class="nv-nav-label">Library</div>
    ${tool('glossary', 'book-open', 'Key terms')}
    ${tool('flashcards', 'cards', 'Flashcards')}
    ${tool('exam', 'clipboard-list', 'Exam practice')}
    ${tool('books', 'library', 'Book library')}
    ${tool('graph', 'graph', 'Graph')}
  </nav>`;
  root.onclick = e => {
    const t = e.target.closest('[data-toggle]');
    if (t) {
      const mod = t.closest('.nv-nav-mod'); mod.classList.toggle('is-open');
      const s = new Set(store.get(OPEN_KEY, [])); mod.classList.contains('is-open') ? s.add(t.dataset.toggle) : s.delete(t.dataset.toggle); store.set(OPEN_KEY, [...s]);
      return;
    }
    if (e.target.closest('[data-act-switch]')) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'o', ctrlKey: true, bubbles: true })); return; }
    const g = e.target.closest('[data-go]');
    if (g) B.go(g.dataset.go);
  };
}
window.addEventListener('hashchange', () => { if (B.isNova()) setTimeout(() => { const el = $('#explorer'); if (el) navPane(el); }, 0); });

/* ---------------------------------------------------------------- accordion gallery (React Bits port, CSS transitions instead of GSAP) */
function accordion(items, opts = {}) {
  const ratio = Math.min(Math.max(opts.expandRatio || 0.5, 0.2), 0.9);
  const count = items.length;
  const grow = count > 1 ? (ratio * (count - 1)) / (1 - ratio) : 1;
  const root = h(`<div class="accordion-gallery" role="list">${items.map((it, i) => `
    <a class="ag-panel" role="listitem" tabindex="0" href="${esc(B.hashFor(it.id))}" data-i="${i}" style="--mod:${it.color}" aria-label="${esc(it.label)}">
      <span class="ag-panel__frame"><span class="ag-panel__glow"></span><span class="ag-panel__num">${plainNum(i + 1)}</span></span>
      <span class="ag-panel__label"><span class="ag-panel__bar"></span><span class="ag-panel__text"><b>${esc(it.label)}</b>${it.tagline ? `<em>${esc(it.tagline)}</em>` : ''}<small>${esc(it.meta || '')}</small></span></span>
    </a>`).join('')}</div>`);
  const panels = $$('.ag-panel', root);
  let active = Math.min(opts.defaultIndex || 0, count - 1);
  const apply = () => panels.forEach((p, i) => {
    const on = i === active;
    p.classList.toggle('ag-panel--active', on);
    p.style.flexGrow = on ? grow : 1;
    if (on) p.setAttribute('aria-current', 'true'); else p.removeAttribute('aria-current');
  });
  panels.forEach((p, i) => {
    p.addEventListener('mouseenter', () => { if (window.matchMedia('(hover: hover)').matches) { active = i; apply(); } });
    p.addEventListener('focus', () => { active = i; apply(); });
    p.addEventListener('click', e => { e.preventDefault(); if (i !== active) { active = i; apply(); return; } B.go(items[i].id); });
    p.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); panels[(i + 1) % count].focus(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); panels[(i - 1 + count) % count].focus(); }
      else if (e.key === 'Enter') { e.preventDefault(); B.go(items[i].id); }
    });
  });
  apply();
  return root;
}

/* ---------------------------------------------------------------- home */
function fcSummary() {
  const s = store.get('fc2', null) || {};
  const now = Date.now();
  let due = 0;
  for (const c of Object.values(s.cards || {})) if (c && c.due <= now) due++;
  const plans = (s.plans || []).filter(p => p.due > now).sort((a, b) => a.due - b.due);
  let streak = 0;
  const days = s.days || {};
  for (let d = new Date(); ; d.setDate(d.getDate() - 1)) {
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (days[k] && days[k].n) streak++; else if (streak || k !== new Date().toISOString().slice(0, 10)) break;
    if (streak > 400) break;
  }
  return { due, plan: plans[0], streak, name: s.name || '' };
}
function lastLecture() {
  const { hubs, topicHub } = model();
  for (const r of store.get('recent', [])) {
    if (hubs[r]) return r;
    if (topicHub[r]) return topicHub[r];
  }
  return null;
}
function showHome(view) {
  const bag = [];
  const { modules } = model();
  const fc = fcSummary();
  const hr = new Date().getHours();
  const greet = hr < 5 ? 'Up late' : hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  const last = lastLecture();
  const lastHub = last && model().hubs[last];
  const days = fc.plan ? Math.max(0, Math.ceil((fc.plan.due - Date.now()) / 864e5)) : 0;
    const cont = lastHub || (modules[0] && (modules[0].groups.lecture || [])[0]);
  view.innerHTML = `<div class="nv-page nv-home">
    <section class="nv-hero">
      <div class="nv-laser" aria-hidden="true"></div>
      <div class="nv-hero-copy"><h1>${greet}${fc.name ? ', ' + esc(fc.name) : ''}</h1></div>
      <div class="nv-today" id="nv-today">
        ${cont ? `<button class="nv-today-cell nv-today-wide" data-go="${esc(cont.id)}"><span class="nv-today-k">${lastHub ? 'Continue reading' : 'Start here'}</span><b class="nv-today-title">${esc(cont.title)}</b><small>${esc(cont.module.title)}${lastHub ? ' · ' + Math.round(readOf(cont.id) * 100) + '% read' : ''}</small></button>` : ''}
        <button class="nv-today-cell" data-go="flashcards"><span class="nv-today-k">Cards due</span><b>${fc.due}</b><small>${fc.plan ? esc(fc.plan.name) + ' in ' + (days === 0 ? 'under a day' : days + 'd') : fc.streak ? fc.streak + ' day streak' : 'Flashcards'}</small></button>
      </div>
    </section>
    <section class="nv-sec"><div class="nv-sec-head"><h2>Modules</h2></div><div class="nv-acc"></div></section>
  </div>`;
  $('.nv-acc', view).appendChild(accordion(modules.map(m => {
    const lec = (m.groups.lecture || []).length;
    return { id: m.id, label: m.title, color: m.color, tagline: summaryOf(m.id), meta: [m.semester, lec ? lec + ' lectures' : 'No lectures yet'].filter(Boolean).join(' · ') };
  }), { defaultIndex: Math.max(0, modules.indexOf(lastHub ? lastHub.module : modules[0])), expandRatio: 0.46 }));
  view.onclick = e => {
    if (e.target.closest('[data-ask-open]')) { N.assistant && N.assistant.open(); return; }
    const g = e.target.closest('[data-go]'); if (g) B.go(g.dataset.go);
  };
  mountGL($('.nv-laser', view), 'laserFlow', { surfaceRef: { current: $('#nv-today', view) }, beamPosition: 0.72, color: '#8B5CF6', intensity: 1.3, fog: 0, dust: 0.8, speed: 0.9, spread: 1, spill: 0.6 }, bag);
  return destroyAll(bag);
}

/* ---------------------------------------------------------------- module page */
function showModule(view, id) {
  const bag = [];
  const m = moduleOfId(id) || model().modules.find(x => x.id === id);
  const n = B.V.notes[id];
  const tagline = summaryOf(id);
  const lecs = m.groups.lecture || [];
  const lecCard = hb => {
    const pr = readOf(hb.id);
    return `<a class="nv-lec" href="${esc(B.hashFor(hb.id))}" data-go="${esc(hb.id)}">
      <span class="nv-lec-n">${hb.number ? plainNum(hb.number) : '·'}</span>
      <span class="nv-lec-body"><b>${esc(hb.title.replace(/\s*\((Lecture|Seminar|Practical) \d+\)$/, ''))}</b><small>${hb.topics.length} topics</small></span>
      <span class="nv-lec-side">${pr >= 0.98 ? `<span class="nv-lec-done">${icon('check')}</span>` : ''}</span>
      ${pr > 0 && pr < 0.98 ? `<span class="nv-lec-bar"><i style="width:${Math.round(pr * 100)}%"></i></span>` : ''}
    </a>`;
  };
  const raw = document.createElement('div'); raw.innerHTML = n.html;
  raw.querySelector('.el-h1')?.remove();
  raw.querySelector('.callout[data-callout="abstract"]')?.closest('.el-div')?.remove();
  view.innerHTML = `<div class="nv-page nv-module" style="--mod:${m.color}">
    <header class="nv-mod-head">
      <div class="nv-mod-text">
        <button class="nv-back" data-go="${esc(B.V.home)}">${icon('arrow-left')} Home</button>
        <div class="nv-kicker">${esc(m.semester ? m.semester + ' module' : 'Module')}</div>
        <h1>${esc(m.title)}</h1>
        ${tagline ? `<p class="nv-lede">${esc(tagline)}</p>` : ''}
      </div>
    </header>
    ${Object.keys(KIND).filter(k => (m.groups[k] || []).length).map(k => `<section class="nv-sec"><div class="nv-sec-head"><h2>${KIND[k]}</h2></div><div class="nv-timeline">${m.groups[k].map(lecCard).join('')}</div></section>`).join('') || '<section class="nv-sec"><div class="nv-empty">Nothing in this module yet.</div></section>'}
    <details class="nv-raw"><summary>${icon('file')} Full module note</summary><div class="markdown-preview-view markdown-rendered ${esc((n.css || []).join(' '))}"><div class="markdown-preview-sizer markdown-preview-section">${raw.innerHTML}</div></div></details>
  </div>`;
  B.hydrate($('.nv-raw', view), id);
  view.onclick = e => {
    const g = e.target.closest('[data-go]');
    if (g && !e.target.closest('.nv-raw')) { e.preventDefault(); e.stopPropagation(); B.go(g.dataset.go); }
  };
  return destroyAll(bag);
}

/* ---------------------------------------------------------------- lecture reader */
/* ---------------------------------------------------------------- deck reader
   No scrolling: a note (or a whole lecture, every topic stitched in as a chapter) is cut into pages
   that each fit the screen. Blocks are packed into pages by measuring them at the real page size;
   long lists and tables are split between pages, headings never end a page, and a block that is
   still too tall gets a page of its own. Flip with the arrow keys, space, the mouse wheel, a swipe
   or the buttons; the topic list on the left jumps straight to a chapter. */
const stripTitle = t => String(t || '').replace(/\s*\((Lecture|Seminar|Practical) \d+\)$/, '').replace(/^\d+\s+/, '');
function deckModel(id) {
  const { hubs, topicHub } = model();
  const hubId = hubs[id] ? id : topicHub[id];
  if (hubId) {
    const hb = hubs[hubId], m = hb.module;
    const siblings = Object.keys(KIND).flatMap(k => m.groups[k] || []);
    const at = siblings.indexOf(hb);
    const chapters = [{ id: hubId, title: 'Overview', n: '00', hub: true }, ...hb.topics.map((t, i) => ({ id: t, title: stripTitle(B.V.notes[t].title), n: plainNum(i + 1) }))];
    return { hubId, color: m.color, kicker: `${KIND_ONE[hb.kind] || ''} ${hb.number || ''}`.trim(), title: stripTitle(hb.title), back: { id: m.id, label: m.title },
      chapters, next: siblings[at + 1], prev: siblings[at - 1], module: m, terms: termsUsed(chapters.map(c => c.id)), kind: KIND_ONE[hb.kind] || 'Lecture' };
  }
  const n = B.V.notes[id], p = n.props || {};
  const subj = p.subject || (p.subjects || [])[0] || '';
  const m = model().byTitle[subj] || moduleOfId(id);
  const isTerm = id.startsWith('02 Key Terms/');
  return { hubId: null, color: m ? m.color : (isTerm ? '#FDE68A' : '#8B5CF6'), kicker: isTerm ? 'Key term' : (p.type || ''), title: stripTitle(n.title),
    back: isTerm ? { id: 'glossary', label: 'Key terms' } : m ? { id: m.id, label: m.title } : { id: B.V.home, label: 'Home' },
    chapters: [{ id, title: stripTitle(n.title), n: '' }], single: true, isTerm };
}
function termsUsed(ids) {
  const seen = new Map();
  for (const id of ids) for (const l of (B.V.notes[id] || {}).links || []) if (l.startsWith('02 Key Terms/')) seen.set(l, (seen.get(l) || 0) + 1);
  return [...seen.entries()].sort((a, b) => b[1] - a[1] || B.collator.compare(a[0], b[0])).map(x => x[0]);
}
function cleanBody(html, opts = {}) {
  const box = document.createElement('div'); box.innerHTML = html;
  box.querySelector(':scope > .el-h1')?.remove();
  box.querySelectorAll('.callout[data-callout="path"]').forEach(c => (c.closest('.el-div') || c).remove());
  if (opts.hub) {
    box.querySelector('.callout[data-callout="abstract"]')?.closest('.el-div')?.remove();
    const t = box.querySelector('h2#topics');
    if (t) { const blk = t.closest('.el-h2'); const nx = blk.nextElementSibling; if (nx && /el-(ol|ul)/.test(nx.className)) nx.remove(); blk.remove(); }
    // the key-term list is on the finish page instead
    const kt = box.querySelector('h2#key-terms');
    if (kt) { let blk = kt.closest('.el-h2'); while (blk) { const nx = blk.nextElementSibling; blk.remove(); blk = nx && !/^el-h[12]\b/.test(nx.className) ? nx : null; } }
  }
  // drop empty trailing sections (a heading with nothing under it)
  [...box.children].forEach(el => { if (!el.textContent.trim() && !el.querySelector('img, svg, iframe, .markdown-embed, .canvas-embed')) el.remove(); });
  return box;
}
const isHeading = el => /^el-h[2-6]\b/.test(el.className);
const waitImages = (root, ms) => Promise.race([
  Promise.all([...root.querySelectorAll('img')].map(img => img.complete ? null : new Promise(r => { img.onload = img.onerror = r; }))),
  new Promise(r => setTimeout(r, ms)),
]);

function showDeck(view, id, heading) {
  const bag = [];
  const D = deckModel(id);
  const chs = D.chapters;
  const startCh = Math.max(0, chs.findIndex(c => c.id === id));
  const hasEnd = !!D.hubId;
  view.innerHTML = `<div class="nv-deck" style="--mod:${D.color}">
    <header class="nv-deck-top">
      <button class="nv-back" data-go="${esc(D.back.id)}">${icon('arrow-left')}<span>${esc(D.back.label)}</span></button>
      <div class="nv-deck-name"><span class="nv-kicker">${esc(D.kicker)}</span><b>${esc(D.title)}</b></div>
      <div class="nv-deck-count"></div>
    </header>
    <div class="nv-deck-body${D.single ? ' is-single' : ''}">
      ${D.single ? '' : `<nav class="nv-toc"><ol>${chs.map((c, i) => `<li><button data-ch="${i}"><span>${c.n}</span><em>${esc(c.title)}</em></button></li>`).join('')}${hasEnd ? `<li><button data-ch="end"><span>${icon('check')}</span><em>Finish</em></button></li>` : ''}</ol></nav>`}
      <div class="nv-stage">
        <div class="nv-measure nv-card"><div class="nv-card-in markdown-preview-view markdown-rendered"><div class="markdown-preview-sizer"></div></div></div>
      </div>
    </div>
    <footer class="nv-deck-foot">
      <button class="nv-flip" data-dir="-1" title="Previous page (←)">${icon('arrow-left')}</button>
      <div class="nv-segs">${chs.map((c, i) => `<button class="nv-seg" data-ch="${i}" title="${esc(c.title)}"><b></b></button>`).join('')}</div>
      <button class="nv-flip" data-dir="1" title="Next page (→)">${icon('arrow-right')}</button>
    </footer>
  </div>`;
  const stage = $('.nv-stage', view), measure = $('.nv-measure', view), msizer = $('.markdown-preview-sizer', measure);
  const pages = new Map();        // chapter -> [{ blocks: [html], first: blockIndex }]
  let cur = { ch: startCh, pg: 0 }, card = null, busy = false, alive = true;

  const chapterHead = (c, first) => c.hub ? '' : D.single ? (first ? `<div class="nv-card-head"><h1>${esc(c.title)}</h1></div>` : '') : first
    ? `<div class="nv-card-head"><span class="nv-card-n">${c.n}</span><h1>${esc(c.title)}</h1></div>`
    : `<div class="nv-card-run"><span>${c.n}</span>${esc(c.title)}</div>`;

  async function paginate(ch) {
    if (pages.has(ch)) return pages.get(ch);
    const c = chs[ch], n = B.V.notes[c.id];
    const box = cleanBody(n.html, { hub: c.hub });
    measure.querySelector('.nv-card-in').className = `nv-card-in markdown-preview-view markdown-rendered ${(n.css || []).join(' ')}`;
    msizer.innerHTML = box.innerHTML;
    msizer.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
    await waitImages(msizer, 4000);
    if (!alive) return [];
    const blocks = [...msizer.children].map(el => el.outerHTML);
    const inner = measure.querySelector('.nv-card-in'), cs = getComputedStyle(inner);
    const limit = inner.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 16;
    const out = [];
    let pageBlocks = [], firstIdx = 0;
    const startPage = () => { msizer.innerHTML = chapterHead(c, out.length === 0); pageBlocks = []; };
    const fits = () => msizer.scrollHeight <= limit;
    const close = () => { out.push({ blocks: pageBlocks, first: firstIdx }); };
    startPage();
    for (let bi = 0; bi < blocks.length; bi++) {
      const tmp = document.createElement('div'); tmp.innerHTML = blocks[bi]; const el = tmp.firstElementChild;
      msizer.appendChild(el);
      if (fits()) { if (!pageBlocks.length) firstIdx = bi; pageBlocks.push(blocks[bi]); continue; }
      // shrink a figure into the space left rather than leaving half a page empty
      const imgs = el.querySelectorAll('img');
      if (imgs.length === 1) {
        const over = msizer.scrollHeight - limit, ih = imgs[0].offsetHeight;
        if (ih - over >= 200) {
          imgs[0].style.maxHeight = (ih - over - 4) + 'px';
          if (fits()) { if (!pageBlocks.length) firstIdx = bi; pageBlocks.push(el.outerHTML); continue; }
          imgs[0].style.maxHeight = '';
        }
      }
      el.remove();
      // split a long list or table across pages
      const list = el.querySelector(':scope > ul, :scope > ol'), table = el.querySelector('table');
      if ((list && list.children.length > 1) || (table && table.tBodies[0] && table.tBodies[0].rows.length > 1)) {
        const items = list ? [...list.children] : [...table.tBodies[0].rows];
        const shell = () => { const s = el.cloneNode(true); const l = list ? s.querySelector(':scope > ul, :scope > ol') : s.querySelector('table').tBodies[0]; l.innerHTML = ''; return [s, l]; };
        let [part, holder] = shell(); msizer.appendChild(part);
        let start = 0;
        for (let k = 0; k < items.length; k++) {
          holder.appendChild(items[k].cloneNode(true));
          if (fits()) continue;
          holder.lastElementChild.remove();
          if (holder.children.length) { if (!pageBlocks.length) firstIdx = bi; pageBlocks.push(part.outerHTML); }
          if (pageBlocks.length) close();
          startPage();
          [part, holder] = shell();
          if (list && list.tagName === 'OL') holder.setAttribute('start', String((+list.getAttribute('start') || 1) + k));
          msizer.appendChild(part); holder.appendChild(items[k].cloneNode(true)); firstIdx = bi; start = k;
        }
        if (holder.children.length) { if (!pageBlocks.length) firstIdx = bi; pageBlocks.push(part.outerHTML); }
        continue;
      }
      // move a dangling heading onto the next page with its content
      const carry = [];
      while (pageBlocks.length > 1) { const t = document.createElement('div'); t.innerHTML = pageBlocks[pageBlocks.length - 1]; if (!isHeading(t.firstElementChild)) break; carry.unshift(pageBlocks.pop()); }
      if (pageBlocks.length) close();
      startPage();
      firstIdx = carry.length ? bi - carry.length : bi;
      for (const hb of carry) { const t = document.createElement('div'); t.innerHTML = hb; msizer.appendChild(t.firstElementChild); pageBlocks.push(hb); }
      msizer.appendChild(el); pageBlocks.push(blocks[bi]);
      if (!fits() && pageBlocks.length === 1) { close(); startPage(); }   // a single tall block keeps its own page
    }
    if (pageBlocks.length || !out.length) close();
    msizer.innerHTML = '';
    pages.set(ch, out);
    return out;
  }

  function endPage() {
    const nx = D.next;
    return `<div class="nv-end">
      <div class="nv-end-ring">${icon('check')}</div>
      <div class="nv-kicker">Finished</div>
      <h1>${esc(D.title)}</h1>
      <p>${chs.length - 1} topics read.</p>
      <div class="nv-end-actions">
        ${nx ? `<button class="nv-end-btn is-main" data-go="${esc(nx.id)}"><small>Next</small><b>${esc(stripTitle(nx.title))}</b></button>` : `<button class="nv-end-btn is-main" data-go="${esc(D.back.id)}"><small>Done</small><b>Back to ${esc(D.back.label)}</b></button>`}
        ${B.exists('flashcards') ? `<button class="nv-end-btn" data-go="flashcards"><small>Practise</small><b>Flashcards</b></button>` : ''}
      </div>
      ${D.terms.length ? `<div class="nv-end-terms"><div class="nv-kicker">Key terms in this ${esc(D.kind.toLowerCase())}</div><div class="nv-terms">${D.terms.slice(0, 24).map(t => `<a class="internal-link nv-term" data-note="${esc(t)}" href="${esc(B.hashFor(t))}">${esc(B.V.notes[t].title)}</a>`).join('')}</div></div>` : ''}
    </div>`;
  }

  function paint(dir) {
    const isEnd = cur.ch === 'end';
    const c = isEnd ? null : chs[cur.ch];
    const list = isEnd ? null : pages.get(cur.ch);
    const pg = isEnd ? null : list[cur.pg];
    const n = c && B.V.notes[c.id];
    const el = h(`<div class="nv-card is-entering${dir ? (dir > 0 ? ' from-right' : ' from-left') : ''}">
      ${isEnd ? `<div class="nv-card-in">${endPage()}</div>` : `<div class="nv-card-in markdown-preview-view markdown-rendered ${esc((n.css || []).join(' '))}"><div class="markdown-preview-sizer">${chapterHead(c, cur.pg === 0)}${pg.blocks.join('')}</div></div>`}
    </div>`);
    if (!isEnd) el.querySelector('.nv-card-in').dataset.note = c.id;
    stage.appendChild(el);
    if (!isEnd) B.hydrate(el.querySelector('.nv-card-in'), c.id);
    const old = card; card = el;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('is-entering')));
    if (old) { old.classList.add(dir < 0 ? 'to-right' : 'to-left', 'is-leaving'); setTimeout(() => old.remove(), 450); }
    // chrome: counter, toc, segments, progress
    const total = list ? list.length : 1;
    $('.nv-deck-count', view).innerHTML = isEnd ? 'Finished' : D.single ? (total > 1 ? `${cur.pg + 1} / ${total}` : '') : `<span>${c.hub ? 'Overview' : 'Topic ' + c.n}</span> · ${cur.pg + 1} / ${total}`;
    $$('.nv-toc button', view).forEach(b => {
      const k = b.dataset.ch === 'end' ? chs.length : +b.dataset.ch, at = isEnd ? chs.length : cur.ch;
      b.classList.toggle('is-active', k === at); b.classList.toggle('is-done', k < at);
      if (k === at) b.scrollIntoView({ block: 'nearest' });
    });
    $$('.nv-seg', view).forEach((s, i) => {
      const f = isEnd || i < cur.ch ? 1 : i > cur.ch ? 0 : (cur.pg + 1) / total;
      s.querySelector('b').style.width = Math.round(f * 100) + '%';
      s.classList.toggle('is-active', !isEnd && i === cur.ch);
    });
    $('.nv-flip[data-dir="-1"]', view).disabled = !isEnd && cur.ch === 0 && cur.pg === 0;
    $('.nv-flip[data-dir="1"]', view).disabled = isEnd || (!hasEnd && cur.ch === chs.length - 1 && cur.pg === total - 1);
    if (D.hubId) markRead(D.hubId, isEnd ? 1 : (cur.ch + (cur.pg + 1) / total) / chs.length);
    // a page that is still too tall scrolls inside itself
    const inner = el.querySelector('.nv-card-in');
    const tall = () => el.classList.toggle('is-tall', inner.scrollHeight > inner.clientHeight + 4);
    tall(); inner.querySelectorAll('img').forEach(img => { img.loading = 'eager'; if (!img.complete) img.addEventListener('load', tall, { once: true }); });
    if (glow) glow.refresh();
  }

  async function goTo(ch, pg, dir, headingId) {
    if (busy || !alive) return;
    busy = true;
    try {
      if (ch !== 'end') {
        const list = await paginate(ch);
        if (!alive) return;
        if (headingId) { const k = list.findIndex(p => p.blocks.some(b => b.includes(`id="${headingId}"`))); if (k >= 0) pg = k; }
        pg = pg === 'last' ? list.length - 1 : Math.max(0, Math.min(pg, list.length - 1));
      }
      cur = { ch, pg };
      paint(dir);
    } finally { busy = false; }
  }
  function step(dir) {
    if (cur.ch === 'end') { if (dir < 0) goTo(chs.length - 1, 'last', -1); return; }
    const list = pages.get(cur.ch) || [];
    if (dir > 0) {
      if (cur.pg < list.length - 1) goTo(cur.ch, cur.pg + 1, 1);
      else if (cur.ch < chs.length - 1) goTo(cur.ch + 1, 0, 1);
      else if (hasEnd) goTo('end', 0, 1);
    } else {
      if (cur.pg > 0) goTo(cur.ch, cur.pg - 1, -1);
      else if (cur.ch > 0) goTo(cur.ch - 1, 'last', -1);
    }
  }

  // input: keys, wheel, swipe, buttons
  const onKey = e => {
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable], .na-sheet, .menu, .modal-container')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (['ArrowRight', 'PageDown', ' ', 'l'].includes(e.key) && !e.shiftKey) { e.preventDefault(); step(1); }
    else if (['ArrowLeft', 'PageUp', 'h'].includes(e.key) || (e.key === ' ' && e.shiftKey)) { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowDown' && !D.single) { e.preventDefault(); if (cur.ch !== 'end' && cur.ch < chs.length - 1) goTo(cur.ch + 1, 0, 1); else if (hasEnd) goTo('end', 0, 1); }
    else if (e.key === 'ArrowUp' && !D.single) { e.preventDefault(); goTo(cur.ch === 'end' ? chs.length - 1 : Math.max(0, cur.ch - 1), 0, -1); }
  };
  document.addEventListener('keydown', onKey);
  let wheelAcc = 0, wheelLock = 0;
  view.addEventListener('wheel', e => {
    const tall = e.target.closest('.nv-card.is-tall .nv-card-in, .nv-toc');
    if (tall) { const t = tall; const atEnd = e.deltaY > 0 ? t.scrollTop + t.clientHeight >= t.scrollHeight - 2 : t.scrollTop <= 0; if (!atEnd || t.classList.contains('nv-toc')) return; }
    e.preventDefault();
    const now = performance.now(); if (now < wheelLock) return;
    wheelAcc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(wheelAcc) > 50) { step(Math.sign(wheelAcc)); wheelAcc = 0; wheelLock = now + 520; }
  }, { passive: false });
  let sx = null, sy = 0;
  stage.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { sx = e.clientX; sy = e.clientY; } });
  stage.addEventListener('pointerup', e => {
    if (sx == null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) step(dx < 0 ? 1 : -1);
  });
  view.addEventListener('click', e => {
    const a = e.target.closest('a.internal-link[data-note]');
    if (a && !(e.ctrlKey || e.metaKey)) {
      const k = chs.findIndex(c => c.id === a.dataset.note);
      if (k >= 0) { e.preventDefault(); e.stopPropagation(); goTo(k, 0, k > cur.ch ? 1 : -1, a.dataset.heading || null); return; }
    }
    const f = e.target.closest('.nv-flip'); if (f) { step(+f.dataset.dir); return; }
    const t = e.target.closest('[data-ch]');
    if (t && t.tagName === 'BUTTON') { const k = t.dataset.ch === 'end' ? 'end' : +t.dataset.ch; goTo(k, 0, k === 'end' || k > cur.ch ? 1 : -1); return; }
    const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); e.stopPropagation(); B.go(g.dataset.go); }
  }, true);
  // re-cut the pages when the stage changes size, staying on the same block
  let lastSize = '';
  const ro = new ResizeObserver(() => {
    const sz = stage.clientWidth + 'x' + stage.clientHeight;
    if (sz === lastSize) return; const first = !lastSize; lastSize = sz; setH();
    if (first) return;
    const at = cur.ch !== 'end' && pages.get(cur.ch) ? pages.get(cur.ch)[cur.pg].first : 0;
    pages.clear();
    if (cur.ch === 'end') { paint(0); return; }
    paginate(cur.ch).then(list => { if (!alive) return; let k = 0; list.forEach((p, i) => { if (p.first <= at) k = i; }); cur.pg = k; paint(0); });
  });
  ro.observe(stage);
  // magic bento spotlight on the page card
  let glow = null;
  if (N.bento) { glow = N.bento(stage, { cards: '.nv-card:not(.nv-measure)', spotlightRadius: 420, clickEffect: false }); bag.push(glow); }
  const setH = () => stage.style.setProperty('--page-h', stage.clientHeight + 'px');
  setH();
  requestAnimationFrame(() => goTo(startCh, 0, 0, heading || null));
  return () => { alive = false; ro.disconnect(); document.removeEventListener('keydown', onKey); destroyAll(bag)(); };
}

/* ---------------------------------------------------------------- glossary (key terms A to Z) */
B.registerView('glossary', {
  title: () => 'Key terms', icon: 'book-open', cls: 'nv-view',
  show(view) {
    const ids = Object.keys(B.V.notes).filter(k => k.startsWith('02 Key Terms/')).sort((a, b) => B.collator.compare(B.V.notes[a].title, B.V.notes[b].title));
    const def = id => { const m = B.V.notes[id].html.match(/data-callout="definition">[\s\S]*?<div class="callout-content"><p>([\s\S]*?)<\/p>/); return m ? m[1].replace(/<[^>]+>/g, '').trim() : ''; };
    const subj = id => ((B.V.notes[id].props || {}).subjects || [])[0] || '';
    const letter = id => { const c = B.V.notes[id].title.replace(/^[^A-Za-z0-9]+/, '')[0] || '#'; return /[a-z]/i.test(c) ? c.toUpperCase() : '#'; };
    const groups = {}; ids.forEach(id => (groups[letter(id)] = groups[letter(id)] || []).push(id));
    view.innerHTML = `<div class="nv-page nv-gloss">
      <header class="nv-gloss-head"><div class="nv-kicker">Library</div><h1>Key terms</h1>
        <div class="nv-gloss-search">${icon('search')}<input type="search" placeholder="Filter ${ids.length} terms…" autocomplete="off"></div>
        <div class="nv-az">${Object.keys(groups).map(l => `<button data-l="${l}">${l}</button>`).join('')}</div></header>
      ${Object.entries(groups).map(([l, list]) => `<section class="nv-gloss-sec" data-l="${l}"><h2>${l}</h2><div class="nv-gloss-grid">${list.map(id => `<a class="nv-gterm" href="${esc(B.hashFor(id))}" data-go="${esc(id)}" style="--mod:${colorOf(subj(id))}" data-q="${esc((B.V.notes[id].title + ' ' + def(id)).toLowerCase())}"><b>${esc(B.V.notes[id].title)}</b><span>${esc(def(id).slice(0, 150))}${def(id).length > 150 ? '…' : ''}</span></a>`).join('')}</div></section>`).join('')}
    </div>`;
    const input = $('input', view);
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      $$('.nv-gterm', view).forEach(a => { a.hidden = q && !a.dataset.q.includes(q); });
      $$('.nv-gloss-sec', view).forEach(s => { s.hidden = !$$('.nv-gterm', s).some(a => !a.hidden); });
    });
    view.onclick = e => {
      const l = e.target.closest('[data-l]'); if (l && l.tagName === 'BUTTON') { const s = $(`.nv-gloss-sec[data-l="${l.dataset.l}"]`, view); if (s) s.scrollIntoView({ behavior: 'smooth' }); return; }
      const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); B.go(g.dataset.go); }
    };
  },
});

/* ---------------------------------------------------------------- routing */
const DEFS = {
  home: { title: () => 'Home', icon: 'home', cls: 'nv-view', show: v => showHome(v) },
  module: { title: id => (B.V.notes[id] || {}).title || 'Module', icon: 'layers', cls: 'nv-view', show: (v, id) => showModule(v, id) },
  deck: { title: id => { const { hubs, topicHub } = model(); const hb = hubs[id] || hubs[topicHub[id]]; return stripTitle(hb ? hb.title : B.V.notes[id].title); }, icon: 'book-open', cls: 'nv-view nv-view-deck', show: (v, id, hd) => showDeck(v, id, hd) },
};
N.route = id => {
  if (!B.V || !B.V.notes[id]) return null;
  if (id === B.V.home) return DEFS.home;
  const p = B.V.notes[id].props || {};
  if (p.type === 'subject hub') return DEFS.module;
  if (model().hubs[id] || model().topicHub[id]) return DEFS.deck;
  return DEFS.deck;        // every other note is read as pages too
};
N.navigator = navPane;
N.model = model;
})();
