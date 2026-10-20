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
function firstImage(ids) {
  for (const id of ids) {
    const n = B.V.notes[id]; if (!n) continue;
    const m = n.html.match(/<img[^>]+src="([^"]+)"/);
    if (m && !/\.svg($|\?)/i.test(m[1])) return m[1].replace(/&amp;/g, '&');
  }
  return '';
}
const moduleImage = m => firstImage(Object.values(m.groups).flat().flatMap(hb => [hb.id, ...hb.topics]));
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
    <button class="nv-nav-jump" data-act-switch>${icon('search')}<span>Jump to…</span><kbd>Ctrl O</kbd></button>
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
      <span class="ag-panel__frame"><span class="ag-panel__media">${it.image ? `<img src="${esc(it.image)}" alt="" draggable="false" loading="lazy">` : `<span class="ag-panel__art">${esc(it.label.split(/\s+/).filter(w => w.length > 3).map(w => w[0]).join('').slice(0, 3))}</span>`}</span><span class="ag-panel__overlay"></span></span>
      <span class="ag-panel__label"><span class="ag-panel__bar"></span><span class="ag-panel__text"><b>${esc(it.label)}</b><small>${esc(it.meta || '')}</small></span></span>
    </a>`).join('')}</div>`);
  const panels = $$('.ag-panel', root);
  let active = Math.min(opts.defaultIndex || 0, count - 1);
  const apply = () => panels.forEach((p, i) => {
    const on = i === active;
    p.classList.toggle('ag-panel--active', on);
    p.style.flexGrow = on ? grow : 1;
    p.style.setProperty('--ag-rot', on ? '0deg' : (i < active ? 8 : -8) + 'deg');
    p.style.setProperty('--ag-shift', (Math.max(-1.5, Math.min(1.5, active - i)) * 14) + 'px');
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
  const totalLecs = modules.reduce((n, m) => n + (m.groups.lecture || []).length, 0);
  const totalTerms = Object.keys(B.V.notes).filter(k => k.startsWith('02 Key Terms/')).length;
  view.innerHTML = `<div class="nv-page nv-home">
    <section class="nv-hero">
      <div class="nv-laser" aria-hidden="true"></div>
      <div class="nv-hero-copy">
        <div class="nv-kicker">${esc(B.V.title || 'Study vault')} · Year 1</div>
        <h1>${greet}${fc.name ? ', ' + esc(fc.name) : ''}</h1>
        <p>${totalLecs} lectures across ${modules.length} modules, ${totalTerms} key terms.</p>
      </div>
      <div class="nv-today" id="nv-today">
        <button class="nv-today-cell" data-go="flashcards"><span class="nv-today-k">Cards due</span><b>${fc.due}</b><small>${fc.streak ? fc.streak + ' day streak' : 'Start a streak today'}</small></button>
        <button class="nv-today-cell" data-go="flashcards"><span class="nv-today-k">Next deadline</span><b>${fc.plan ? (days === 0 ? 'Today' : days + 'd') : '—'}</b><small>${fc.plan ? esc(fc.plan.name) : 'No exam plan set'}</small></button>
        <button class="nv-today-cell nv-today-wide" data-go="${esc(lastHub ? lastHub.id : (modules[0] ? modules[0].id : B.V.home))}"><span class="nv-today-k">${lastHub ? 'Continue reading' : 'Start here'}</span><b class="nv-today-title">${esc(lastHub ? lastHub.title : (modules[0] ? modules[0].title : ''))}</b><small>${lastHub ? esc(lastHub.module.title) + ' · ' + Math.round(readOf(lastHub.id) * 100) + '% read' : 'Open a module'}</small></button>
        <button class="nv-today-ask" data-ask-open title="Ask the assistant">${icon('sparkles')}<span>Ask</span></button>
      </div>
    </section>
    <section class="nv-sec"><div class="nv-sec-head"><h2>Modules</h2><span>Hover to open, click to enter</span></div><div class="nv-acc"></div></section>
    <section class="nv-sec"><div class="nv-sec-head"><h2>Study</h2></div>
      <div class="nv-tools">
        ${[['flashcards', 'cards', 'Flashcards', 'Spaced repetition, sprints and exam plans'], ['exam', 'clipboard-list', 'Exam practice', 'Full papers marked against the scheme'], ['glossary', 'book-open', 'Key terms', totalTerms + ' terms, A to Z'], ['books', 'library', 'Book library', 'Search your textbooks'], ['graph', 'graph', 'Graph', 'Every note and how it links']].filter(t => B.exists(t[0])).map(t => `<button class="nv-tool" data-go="${t[0]}"><span class="nv-tool-ic">${icon(t[1])}</span><b>${t[2]}</b><small>${esc(t[3])}</small></button>`).join('')}
      </div></section>
  </div>`;
  $('.nv-acc', view).appendChild(accordion(modules.map(m => {
    const lec = (m.groups.lecture || []).length, other = Object.entries(m.groups).filter(([k]) => k !== 'lecture').reduce((n, [, v]) => n + v.length, 0);
    return { id: m.id, label: m.title, color: m.color, image: moduleImage(m), meta: [m.semester, lec ? lec + ' lectures' : '', other ? other + ' more' : ''].filter(Boolean).join(' · ') };
  }), { defaultIndex: Math.max(0, modules.indexOf(lastHub ? lastHub.module : modules[0])), expandRatio: 0.46 }));
  view.onclick = e => {
    if (e.target.closest('[data-ask-open]')) { N.assistant && N.assistant.open(); return; }
    const g = e.target.closest('[data-go]'); if (g) B.go(g.dataset.go);
  };
  mountGL($('.nv-laser', view), 'laserFlow', { surfaceRef: { current: $('#nv-today', view) }, beamPosition: 0.7, color: '#8B5CF6', intensity: 1.6, fog: 0.25, dust: 1.2, speed: 1.1 }, bag);
  return destroyAll(bag);
}

/* ---------------------------------------------------------------- module page */
function showModule(view, id) {
  const bag = [];
  const m = moduleOfId(id) || model().modules.find(x => x.id === id);
  const n = B.V.notes[id];
  const tagline = summaryOf(id);
  const lecs = m.groups.lecture || [];
  const topics = Object.values(m.groups).flat().reduce((k, hb) => k + hb.topics.length, 0);
  const examLinks = id => [...(B.V.notes[id] || { html: '' }).html.matchAll(/data-note="(exam\/[^"]+)"/g)].map(x => x[1]);
  const lecCard = hb => {
    const pr = readOf(hb.id), st = stats(hb.id), ex = examLinks(hb.id)[0];
    return `<a class="nv-lec" href="${esc(B.hashFor(hb.id))}" data-go="${esc(hb.id)}">
      <span class="nv-lec-n">${hb.number ? plainNum(hb.number) : '·'}</span>
      <span class="nv-lec-body"><b>${esc(hb.title.replace(/\s*\((Lecture|Seminar|Practical) \d+\)$/, ''))}</b><small>${esc(st || hb.topics.length + ' topics')}</small>
        <span class="nv-lec-bar"><i style="width:${Math.round(pr * 100)}%"></i></span></span>
      <span class="nv-lec-side">${pr >= 0.98 ? `<span class="nv-pill ok">${icon('check')} Read</span>` : pr ? `<span class="nv-pill">${Math.round(pr * 100)}%</span>` : ''}${ex ? `<button class="nv-pill nv-pill-btn" data-go="${esc(ex)}">${icon('clipboard-list')} Paper</button>` : ''}</span>
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
        <div class="nv-stats"><span><b>${lecs.length}</b> lectures</span><span><b>${topics}</b> topics</span>${Object.entries(m.groups).filter(([k]) => k !== 'lecture').map(([k, v]) => `<span><b>${v.length}</b> ${KIND[k].toLowerCase()}</span>`).join('')}</div>
      </div>
      <div class="nv-mod-cover" aria-hidden="true"></div>
    </header>
    ${Object.keys(KIND).filter(k => (m.groups[k] || []).length).map(k => `<section class="nv-sec"><div class="nv-sec-head"><h2>${KIND[k]}</h2><span>${m.groups[k].length}</span></div><div class="nv-timeline">${m.groups[k].map(lecCard).join('')}</div></section>`).join('') || '<section class="nv-sec"><div class="nv-empty">Nothing in this module yet.</div></section>'}
    <details class="nv-raw"><summary>${icon('file')} Full module note</summary><div class="markdown-preview-view markdown-rendered ${esc((n.css || []).join(' '))}"><div class="markdown-preview-sizer markdown-preview-section">${raw.innerHTML}</div></div></details>
  </div>`;
  B.hydrate($('.nv-raw', view), id);
  view.onclick = e => {
    const g = e.target.closest('[data-go]');
    if (g && !e.target.closest('.nv-raw')) { e.preventDefault(); e.stopPropagation(); B.go(g.dataset.go); }
  };
  const img = moduleImage(m);
  const cover = $('.nv-mod-cover', view);
  if (img) mountGL(cover, 'ditherVeil', { src: img, fit: 'contain', pattern: 'bayer', pixelSize: 2, inkColor: '#07080F', paperColor: '#3A2F78', contrast: 1.2, revealRadius: 120, rimColor: m.color, rim: 0.25, wander: true }, bag);
  else cover.classList.add('is-blank');
  return destroyAll(bag);
}

/* ---------------------------------------------------------------- lecture reader */
function cleanBody(html, opts = {}) {
  const box = document.createElement('div'); box.innerHTML = html;
  box.querySelector(':scope > .el-h1')?.remove();
  box.querySelectorAll('.callout[data-callout="path"]').forEach(c => (c.closest('.el-div') || c).remove());
  if (opts.hub) {
    box.querySelector('.callout[data-callout="abstract"]')?.closest('.el-div')?.remove();
    const t = box.querySelector('h2#topics');
    if (t) { const blk = t.closest('.el-h2'); const nx = blk.nextElementSibling; if (nx && /el-(ol|ul)/.test(nx.className)) nx.remove(); blk.remove(); }
  }
  return box.innerHTML;
}
function termsUsed(ids) {
  const seen = new Map();
  for (const id of ids) for (const l of (B.V.notes[id] || {}).links || []) if (l.startsWith('02 Key Terms/')) seen.set(l, (seen.get(l) || 0) + 1);
  return [...seen.entries()].sort((a, b) => b[1] - a[1] || B.collator.compare(a[0], b[0])).map(x => x[0]);
}
function showReader(view, id, heading) {
  const bag = [];
  const { hubs, topicHub } = model();
  const hubId = hubs[id] ? id : topicHub[id];
  const hb = hubs[hubId], m = hb.module;
  const hubNote = B.V.notes[hubId];
  const chapters = [{ id: hubId, title: 'Overview', n: '00' }, ...hb.topics.map((t, i) => ({ id: t, title: B.V.notes[t].title.replace(/^\d+\s+/, ''), n: plainNum(i + 1) }))];
  const siblings = Object.keys(KIND).flatMap(k => m.groups[k] || []);
  const at = siblings.indexOf(hb);
  const prev = siblings[at - 1], next = siblings[at + 1];
  const terms = termsUsed(chapters.map(c => c.id));
  const img = firstImage([hubId, ...hb.topics]);
  const cls = n => esc(['markdown-preview-view', 'markdown-rendered', ...(n.css || [])].join(' '));
  view.innerHTML = `<div class="nv-reader" style="--mod:${m.color}">
    <aside class="nv-rail">
      <button class="nv-back" data-go="${esc(m.id)}">${icon('arrow-left')} ${esc(m.title)}</button>
      <div class="nv-rail-kicker">${esc(KIND_ONE[hb.kind] || 'Notes')} ${hb.number || ''}</div>
      <div class="nv-rail-title">${esc(hb.title.replace(/\s*\((Lecture|Seminar|Practical) \d+\)$/, ''))}</div>
      <div class="nv-rail-progress"><i></i></div>
      <ol class="nv-chapters">${chapters.map((c, i) => `<li><button data-ch="${i}"><span>${c.n}</span>${esc(c.title)}</button></li>`).join('')}</ol>
    </aside>
    <div class="nv-read">
      <header class="nv-read-hero">
        <div class="nv-read-cover" aria-hidden="true"></div>
        <div class="nv-read-copy">
          <div class="nv-kicker">${esc(m.title)} · ${esc(KIND_ONE[hb.kind] || '')} ${hb.number || ''}</div>
          <h1>${esc(hb.title.replace(/\s*\((Lecture|Seminar|Practical) \d+\)$/, ''))}</h1>
          <p class="nv-stats">${esc(stats(hubId) || hb.topics.length + ' topics')}</p>
          <button class="nv-pill nv-pill-btn" data-ask-open>${icon('sparkles')} Ask about this lecture</button>
        </div>
      </header>
      ${chapters.map((c, i) => {
        const n = B.V.notes[c.id];
        const sum = i ? summaryOf(c.id) : '';
        return `<section class="nv-ch" data-ch="${i}" data-note="${esc(c.id)}">
          ${i ? `<div class="nv-ch-head"><span class="nv-ch-n">${c.n}</span><div><h2>${esc(c.title)}</h2>${sum ? `<p>${esc(sum)}</p>` : ''}</div></div>` : ''}
          <div class="${cls(n)}"><div class="markdown-preview-sizer markdown-preview-section">${cleanBody(n.html, { hub: !i })}</div></div>
        </section>`;
      }).join('')}
      <footer class="nv-read-foot">
        ${prev ? `<button class="nv-next" data-go="${esc(prev.id)}"><small>${icon('arrow-left')} Previous</small><b>${esc(prev.title)}</b></button>` : '<span></span>'}
        ${next ? `<button class="nv-next is-next" data-go="${esc(next.id)}"><small>Next ${icon('arrow-right')}</small><b>${esc(next.title)}</b></button>` : `<button class="nv-next is-next" data-go="${esc(m.id)}"><small>Done ${icon('check')}</small><b>Back to ${esc(m.title)}</b></button>`}
      </footer>
    </div>
    <aside class="nv-side">
      ${terms.length ? `<div class="nv-side-h">Key terms in this ${esc((KIND_ONE[hb.kind] || 'lecture').toLowerCase())}</div><div class="nv-terms">${terms.slice(0, 40).map(t => `<a class="internal-link nv-term" data-note="${esc(t)}" href="${esc(B.hashFor(t))}">${esc(B.V.notes[t].title)}</a>`).join('')}</div>` : ''}
    </aside>
  </div>`;
  $$('.nv-ch', view).forEach(sec => B.hydrate(sec, sec.dataset.note));
  B.wireLinks(view);

  // chapters: rail clicks, links to topics in this lecture scroll instead of reloading
  const secs = $$('.nv-ch', view), btns = $$('.nv-chapters button', view);
  const byNote = new Map(secs.map(s => [s.dataset.note, s]));
  const scrollTo = (el, smooth) => { const top = el.getBoundingClientRect().top - view.getBoundingClientRect().top + view.scrollTop - 14; view.scrollTo({ top, behavior: smooth ? 'smooth' : 'instant' }); };
  view.addEventListener('click', e => {
    const a = e.target.closest('a.internal-link[data-note]');
    if (a && byNote.has(a.dataset.note) && !(e.ctrlKey || e.metaKey)) {
      e.preventDefault(); e.stopPropagation();
      const sec = byNote.get(a.dataset.note);
      const tgt = a.dataset.heading ? sec.querySelector(`[id="${CSS.escape(a.dataset.heading)}"]`) : null;
      scrollTo(tgt || sec, true); return;
    }
    if (e.target.closest('[data-ask-open]')) { N.assistant && N.assistant.open(); return; }
    const c = e.target.closest('[data-ch]'); if (c && c.tagName === 'BUTTON') { scrollTo(secs[+c.dataset.ch], true); return; }
    const g = e.target.closest('[data-go]'); if (g) { e.stopPropagation(); B.go(g.dataset.go); }
  }, true);

  // scroll spy and reading progress
  const bar = $('.nv-rail-progress i', view);
  let ticking = false;
  const spy = () => {
    ticking = false;
    const vt = view.getBoundingClientRect().top, mark = vt + view.clientHeight * 0.3;
    let idx = 0;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top <= mark) idx = i; });
    btns.forEach((b, i) => { b.classList.toggle('is-active', i === idx); b.classList.toggle('is-done', i < idx); });
    const frac = view.scrollHeight <= view.clientHeight ? 1 : view.scrollTop / (view.scrollHeight - view.clientHeight);
    bar.style.width = Math.round(frac * 100) + '%';
    markRead(hubId, frac);
    const ab = btns[idx]; if (ab) { const r = ab.closest('.nv-chapters'); if (r && (ab.offsetTop < r.scrollTop || ab.offsetTop > r.scrollTop + r.clientHeight - 30)) r.scrollTop = ab.offsetTop - 40; }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } };
  view.addEventListener('scroll', onScroll, { passive: true });

  // open at the topic (or heading) asked for
  requestAnimationFrame(() => {
    const sec = byNote.get(id);
    const tgt = heading && sec ? sec.querySelector(`[id="${CSS.escape(heading)}"]`) : null;
    if (tgt) scrollTo(tgt, false); else if (sec && id !== hubId) scrollTo(sec, false);
    spy();
  });
  if (img) mountGL($('.nv-read-cover', view), 'ditherVeil', { src: img, fit: 'cover', pattern: 'bayer', pixelSize: 2, inkColor: '#07080F', paperColor: '#3A2F78', contrast: 1.2, revealRadius: 110, rimColor: m.color, rim: 0.3, wander: true }, bag);
  else $('.nv-read-cover', view).classList.add('is-blank');
  return () => { view.removeEventListener('scroll', onScroll); destroyAll(bag)(); };
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
  reader: { title: id => { const { hubs, topicHub } = model(); const hb = hubs[id] || hubs[topicHub[id]]; return hb ? hb.title : B.V.notes[id].title; }, icon: 'book-open', cls: 'nv-view nv-view-reader', show: (v, id, hd) => showReader(v, id, hd) },
};
N.route = id => {
  if (!B.V || !B.V.notes[id]) return null;
  if (id === B.V.home) return DEFS.home;
  const p = B.V.notes[id].props || {};
  if (p.type === 'subject hub') return DEFS.module;
  const { hubs, topicHub } = model();
  if (hubs[id] || topicHub[id]) return DEFS.reader;
  return null;
};
N.navigator = navPane;
N.model = model;
})();
