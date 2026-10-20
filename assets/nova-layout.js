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
    <button class="nv-nav-item" data-navmap>${icon('graph')}<span>Neural map</span></button>
  </nav>`;
  root.onclick = e => {
    const t = e.target.closest('[data-toggle]');
    if (t) {
      const mod = t.closest('.nv-nav-mod'); mod.classList.toggle('is-open');
      const s = new Set(store.get(OPEN_KEY, [])); mod.classList.contains('is-open') ? s.add(t.dataset.toggle) : s.delete(t.dataset.toggle); store.set(OPEN_KEY, [...s]);
      return;
    }
    if (e.target.closest('[data-navmap]')) { N.map && N.map.open(B.currentId()); return; }
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


/* ---------------------------------------------------------------- Outlook (calendar + inbox) on the home page */
const fmtTime = iso => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const dayKey = d => d.toISOString().slice(0, 10);
async function msGet(path) {
  try { const r = await fetch(path, { credentials: 'same-origin', cache: 'no-store' }); if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return null; return await r.json(); } catch (e) { return null; }
}
N.ms = { get: msGet, fmtTime };
async function outlookSection(el) {
  const st = await msGet('/api/ms/status');
  if (!st || st.notConfigured || !el.isConnected) return;     // not set up on this site: stay hidden
  el.hidden = false;
  if (!st.connected && st.source === 'flow') {
    el.innerHTML = `<div class="nv-sec-head"><h2>Today</h2></div><div class="nv-ms-connect"><div><b>Waiting for the first sync</b><small>Your calendar and emails appear here once the Power Automate flows send their first update.${st.lastReject ? `<br>Last sync email was turned away at ${new Date(st.lastReject.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}: ${esc(st.lastReject.why)} (from ${esc(st.lastReject.from)}).` : ''}</small></div></div>`;
    return;
  }
  if (!st.connected) {
    el.innerHTML = `<div class="nv-sec-head"><h2>Today</h2></div><div class="nv-ms-connect"><div><b>Connect your Outlook</b><small>Show your calendar and latest emails here, and let the assistant answer “what’s on tonight?”</small></div><a class="nv-mapbtn" href="/ms/connect">${icon('link')}<span>Connect</span></a></div>`;
    return;
  }
  const synced = st.lastSync ? ' · updated ' + new Date(st.lastSync).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
  el.innerHTML = `<div class="nv-sec-head"><h2>Today</h2><span>${esc((st.account || '') + synced)}</span></div><div class="nv-ms-grid"><div class="nv-ms-col nv-ms-cal"><div class="nv-kicker">Calendar</div><div class="nv-ms-list">Loading…</div></div><div class="nv-ms-col nv-ms-mail"><div class="nv-kicker">Inbox</div><div class="nv-ms-list">Loading…</div></div></div>`;
  const [cal, mail] = await Promise.all([msGet('/api/ms/calendar?days=2'), msGet('/api/ms/mail')]);
  if (!el.isConnected) return;
  const today = dayKey(new Date()), tomorrow = dayKey(new Date(Date.now() + 864e5));
  const evs = (cal && cal.events) || [];
  $('.nv-ms-cal .nv-ms-list', el).innerHTML = cal && cal.error ? `<div class="nv-empty">${esc(cal.error)}</div>` : evs.length ? evs.slice(0, 7).map(e => {
    const d = e.start.slice(0, 10);
    return `<a class="nv-ms-item" href="${esc(e.link || '#')}" target="_blank" rel="noopener"><span class="nv-ms-when">${d === today ? '' : d === tomorrow ? 'Tmrw ' : ''}${e.allDay ? 'All day' : fmtTime(e.start)}</span><b>${esc(e.subject || '(no title)')}</b>${e.location ? `<small>${esc(e.location)}</small>` : ''}</a>`;
  }).join('') : '<div class="nv-empty">Nothing on today or tomorrow.</div>';
  const msgs = (mail && mail.messages) || [];
  $('.nv-ms-mail .nv-ms-list', el).innerHTML = mail && mail.error ? `<div class="nv-empty">${esc(mail.error)}</div>` : msgs.length ? msgs.slice(0, 6).map(m => `<a class="nv-ms-item${m.unread ? ' is-unread' : ''}" href="${esc(m.link || '#')}" target="_blank" rel="noopener"><span class="nv-ms-when">${new Date(m.received).toDateString() === new Date().toDateString() ? fmtTime(m.received) : new Date(m.received).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span><b>${esc(m.subject || '(no subject)')}</b><small>${esc(m.from)} · ${esc((m.preview || '').slice(0, 90))}</small></a>`).join('') : '<div class="nv-empty">Inbox is empty.</div>';
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
    <section class="nv-sec nv-ms" hidden></section>
    <section class="nv-sec"><div class="nv-sec-head"><h2>Modules</h2></div><div class="nv-acc"></div></section>
  </div>`;
  outlookSection($('.nv-ms', view));
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
        <div class="nv-mod-bar"><button class="nv-back" data-go="${esc(B.V.home)}">${icon('arrow-left')} Home</button><button class="nv-mapbtn" data-map title="See this module on the neural map">${icon('graph')}<span>Map</span></button></div>
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
    if (e.target.closest('[data-map]')) { N.map && N.map.open(id); return; }
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

/* ---------------------------------------------------------------- focus + peek reader
   A topic is laid out in newspaper columns that fill the screen, so a whole section is visible at
   once and reads left to right instead of down a long page. Every topic of the lecture is a tab
   along the top (left / right arrow keys move between them). Clicking any link opens that note in a
   Peek panel beside the topic, so another note can be read without losing your place. */
function showLens(view, id, heading) {
  const D = deckModel(id);
  const chs = D.chapters;
  let cur = Math.max(0, chs.findIndex(c => c.id === id));
  let peekId = null, alive = true;
  view.innerHTML = `<div class="nv-lens${D.single ? ' is-single' : ''}" style="--mod:${D.color}">
    <header class="nv-lens-top">
      <div class="nv-lens-id">
        <button class="nv-back" data-go="${esc(D.back.id)}" title="${esc(D.back.label)}">${icon('arrow-left')}<span>${esc(D.back.label)}</span></button>
        <div class="nv-lens-name"><span class="nv-kicker">${esc(D.kicker)}</span><b>${esc(D.title)}</b></div>
        <div class="nv-lens-hint">${D.single ? '' : '<kbd>←</kbd><kbd>→</kbd> topics · '}click a link to peek</div>
        <button class="nv-mapbtn" data-map title="See this on the neural map (M)">${icon('graph')}<span>Map</span></button>
      </div>
      ${D.single ? '' : `<nav class="nv-tabs">${chs.map((c, i) => `<button class="nv-tab" data-ch="${i}" title="${esc(c.title)}"><span>${c.n}</span><em>${esc(c.title)}</em></button>`).join('')}</nav>`}
    </header>
    <div class="nv-lens-body">
      <main class="nv-focus"></main>
      <aside class="nv-peek" aria-label="Peek">
        <div class="nv-peek-head"><span class="nv-kicker">Peek</span><b></b>
          <button class="nv-peek-btn" data-peek-open title="Open this note">${icon('arrow-right')}</button>
          <button class="nv-peek-btn" data-peek-close title="Close (Esc)">${icon('x')}</button></div>
        <div class="nv-peek-body"></div>
      </aside>
    </div>
  </div>`;
  const focus = $('.nv-focus', view), peek = $('.nv-peek', view), lens = $('.nv-lens', view);

  const cols = (noteId, extraHead, extraTail) => {
    const n = B.V.notes[noteId];
    const body = cleanBody(n.html, { hub: !!(D.hubId && noteId === D.hubId) });
    const el = h(`<div class="nv-cols"><div class="markdown-preview-view markdown-rendered ${esc((n.css || []).join(' '))}"><div class="markdown-preview-sizer">${extraHead || ''}${body.innerHTML}${extraTail || ''}</div></div></div>`);
    el.dataset.note = noteId;
    return el;
  };
  const scrollToId = (sc, hid) => {
    const t = hid && sc.querySelector(`[id="${CSS.escape(hid)}"]`);
    if (!t) return;
    const left = t.getBoundingClientRect().left - sc.getBoundingClientRect().left + sc.scrollLeft - 24;
    sc.scrollTo({ left: Math.max(0, left), behavior: 'instant' });
  };

  function show(i, dir, hid) {
    cur = i;
    const c = chs[i];
    const head = c.hub ? `<div class="nv-col-head"><span class="nv-kicker">Overview</span><h1>${esc(D.title)}</h1></div>`
      : D.single ? `<div class="nv-col-head"><h1>${esc(c.title)}</h1></div>`
      : `<div class="nv-col-head"><span class="nv-col-n">${c.n}</span><h1>${esc(c.title)}</h1></div>`;
    let tail = '';
    if (!D.single) {
      const nx = chs[i + 1];
      if (nx) tail = `<div class="nv-col-next"><button data-ch="${i + 1}"><small>Next topic</small><b>${nx.n} · ${esc(nx.title)}</b>${icon('arrow-right')}</button></div>`;
      else tail = `<div class="nv-col-next is-end"><div class="nv-kicker">End of ${esc(D.kind.toLowerCase())}</div>
        ${D.next ? `<button data-go="${esc(D.next.id)}"><small>Next ${esc(D.kind.toLowerCase())}</small><b>${esc(stripTitle(D.next.title))}</b>${icon('arrow-right')}</button>` : `<button data-go="${esc(D.back.id)}"><small>Done</small><b>Back to ${esc(D.back.label)}</b>${icon('arrow-right')}</button>`}
        ${D.terms.length ? `<div class="nv-terms">${D.terms.slice(0, 30).map(t => `<a class="internal-link nv-term" data-note="${esc(t)}" href="${esc(B.hashFor(t))}">${esc(B.V.notes[t].title)}</a>`).join('')}</div>` : ''}</div>`;
    }
    const el = cols(c.id, head, tail);
    el.classList.add('is-in', dir > 0 ? 'from-right' : dir < 0 ? 'from-left' : 'from-below');
    focus.querySelectorAll('.nv-cols').forEach(o => o.remove());
    focus.appendChild(el);
    B.hydrate(el, c.id);
    void el.offsetWidth; el.classList.remove('is-in');
    if (hid) requestAnimationFrame(() => scrollToId(el, hid));
    $$('.nv-tab', view).forEach((t, k) => { t.classList.toggle('is-active', k === i); t.classList.toggle('is-done', k < i); });
    const at = $('.nv-tab.is-active', view), bar = $('.nv-tabs', view);
    if (at && bar) bar.scrollTo({ left: at.offsetLeft - bar.clientWidth / 2 + at.offsetWidth / 2, behavior: dir ? 'smooth' : 'instant' });
    if (D.hubId) markRead(D.hubId, (i + 1) / chs.length);
  }

  function openPeek(noteId, hid) {
    if (!B.V.notes[noteId]) return;
    peekId = noteId;
    const n = B.V.notes[noteId];
    $('.nv-peek-head b', peek).textContent = stripTitle(n.title);
    const body = $('.nv-peek-body', peek);
    body.innerHTML = '';
    const el = cols(noteId);
    body.appendChild(el);
    B.hydrate(el, noteId);
    lens.classList.add('has-peek');
    if (hid) requestAnimationFrame(() => scrollToId(el, hid));
  }
  function closePeek() { peekId = null; lens.classList.remove('has-peek'); }

  // links open in the peek; tabs and buttons switch topic
  lens.addEventListener('click', e => {
    const a = e.target.closest('a.internal-link[data-note]');
    if (a && !(e.ctrlKey || e.metaKey)) {
      e.preventDefault(); e.stopPropagation(); B.closePopover();
      if (B.V.notes[a.dataset.note]) openPeek(a.dataset.note, a.dataset.heading || null);
      else B.go(a.dataset.note);
      return;
    }
    if (e.target.closest('[data-peek-close]')) { closePeek(); return; }
    if (e.target.closest('[data-map]')) { N.map && N.map.open(chs[cur].id); return; }
    if (e.target.closest('[data-peek-open]')) {
      const k = chs.findIndex(c => c.id === peekId);
      const pid = peekId; closePeek();
      if (k >= 0) show(k, k > cur ? 1 : -1); else if (pid) B.go(pid);
      return;
    }
    const t = e.target.closest('[data-ch]');
    if (t && t.tagName === 'BUTTON') { const k = +t.dataset.ch; if (k !== cur) show(k, k > cur ? 1 : -1); return; }
    const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); e.stopPropagation(); B.go(g.dataset.go); }
  }, true);
  // click is the preview here, so the hover popovers stay out of the way
  lens.addEventListener('mouseover', e => { if (e.target.closest && e.target.closest('a.internal-link')) e.stopPropagation(); });
  // the wheel moves along the columns
  lens.addEventListener('wheel', e => {
    const sc = e.target.closest('.nv-cols');
    if (!sc || window.innerWidth <= 900) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && sc.scrollWidth > sc.clientWidth) { e.preventDefault(); sc.scrollLeft += e.deltaY; }
  }, { passive: false });
  const onKey = e => {
    if (!alive || (e.target.closest && e.target.closest('input, textarea, select, [contenteditable], .na-sheet, .menu'))) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape' && peekId) { closePeek(); return; }
    if ((e.key === 'm' || e.key === 'M') && N.map && !N.map.isOpen()) { e.preventDefault(); N.map.open(chs[cur].id); return; }
    if (D.single) return;
    if (e.key === 'ArrowRight' && cur < chs.length - 1) { e.preventDefault(); show(cur + 1, 1); }
    else if (e.key === 'ArrowLeft' && cur > 0) { e.preventDefault(); show(cur - 1, -1); }
  };
  document.addEventListener('keydown', onKey);
  show(cur, 0, heading || null);
  return () => { alive = false; document.removeEventListener('keydown', onKey); };
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
  deck: { title: id => { const { hubs, topicHub } = model(); const hb = hubs[id] || hubs[topicHub[id]]; return stripTitle(hb ? hb.title : B.V.notes[id].title); }, icon: 'book-open', cls: 'nv-view nv-view-lens', show: (v, id, hd) => showLens(v, id, hd) },
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
