/* Nova assistant: the AI helper rebuilt around a Strands orb (React Bits).
   - an orb sits docked in the corner of every Nova page; click it or press Ctrl J
   - closing only hides it: the chat is kept until "New chat"
   - "show me / which lecture / open … in the book" questions drive the neural map (nova-map.js)
   - a conversation sheet slides in with a large orb at the top that reacts to what is happening:
     it drifts when idle, stirs when hovered, "listens" while you talk to it, churns while the answer
     is being worked out, and speaks in time with the answer as it types itself out
   - with no highlight it asks about the part of the page you are reading (the chapter in view in the
     lecture reader), so a question can be asked without selecting anything first
   - voice input through the browser's speech recognition, with the mic level driving the orb
   It reuses ask.js for the engine call, formatting and key-term linking (B.ask). */
(() => {
'use strict';
const B = window.BV;
const { icon, esc, $, $$, h, store } = B;
const N = window.NovaUI;

let dock = null, sheet = null, orb = null, state = null;

/* ---------------------------------------------------------------- context from what is on screen */
function clip(s, n) { s = String(s || '').replace(/\n{3,}/g, '\n\n').trim(); return s.length <= n ? s : s.slice(0, n) + '…'; }
function pageContext() {
  const view = $('#view');
  if (!view) return null;
  // lecture reader: the chapter nearest the top third of the screen
  const secs = $$('.nv-ch', view);
  let el = $('.nv-focus .nv-cols[data-note]', view);
  if (el) { /* deck: the page on screen */ }
  else if (secs.length) {
    const mark = view.getBoundingClientRect().top + view.clientHeight * 0.3;
    secs.forEach(s => { if (s.getBoundingClientRect().top <= mark) el = s; });
    el = el || secs[0];
  } else {
    el = $('[data-ask-note]', view) || (view.dataset.askNote ? view : null);
  }
  const id = el ? (el.dataset.note || el.dataset.askNote) : B.currentId();
  const n = id && B.V.notes[id];
  if (!n) return null;
  const p = n.props || {};
  const title = (p.title || n.title || '').replace(/^\d+\s+/, '');
  const text = el ? (el.innerText || el.textContent || '') : n.text;
  return {
    noteId: id,
    selection: title,
    ctx: {
      note: { id, title, subject: p.subject || ((p.subjects || [])[0]) || '', lecture: p.part_of || (p.type === 'hub' ? title : ''), summary: p.summary || '' },
      section: { heading: title, text: clip(text, 3600) },
      block: clip(text, 1500),
    },
  };
}

/* ---------------------------------------------------------------- orb helpers */
const speech = t => {          // same envelope Strands uses for "listening", reused for speaking
  const sm = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const phrase = sm(-0.8, -0.3, 0.6 * Math.sin(t * 2.7) + 0.5 * Math.sin(t * 1.53 + 1.2));
  const syl = Math.max(0, Math.sin(t * 17 + 1.6 * Math.sin(t * 5.3)));
  return phrase * (0.35 + 0.65 * syl) * (0.25 + 0.6 + 0.4 * Math.sin(t * 3.7 + 0.7));
};
function setMood(mood) {
  if (!sheet) return;
  sheet.dataset.mood = mood;
  const label = { idle: 'Ready', listening: 'Listening', thinking: 'Thinking', speaking: 'Answering', error: 'Something went wrong' }[mood] || '';
  const st = $('.na-status', sheet); if (st) st.textContent = label;
  if (!orb) return;
  if (mood === 'thinking') orb.set({ listening: true, level: undefined, energy: 0.8, speed: 1.6 });
  else if (mood === 'idle' || mood === 'error') orb.set({ listening: false, level: undefined, energy: mood === 'error' ? 0.2 : 0.5, speed: 1 });
}

/* ---------------------------------------------------------------- dock (CSS only: no WebGL running all the time) */
function mountDock() {
  if (dock || !B.isNova()) return;
  dock = h(`<button class="na-dock" title="Ask the assistant (Ctrl J)" aria-label="Open the assistant"><span class="na-dock-orb"><i></i></span></button>`);
  document.body.appendChild(dock);
  dock.addEventListener('click', () => open());
}
function unmountDock() { if (dock) { dock.remove(); dock = null; } }

/* ---------------------------------------------------------------- sheet: built once, hidden and shown, so the chat survives closing */
const SUGGEST = ['Which lecture covers Okazaki fragments?', 'Show me where PCR is explained', 'Explain this page simply', 'What would an exam ask here?'];
function whereText() {
  const pc = pageContext();
  if (!pc) return 'Your notes and textbooks';
  const n = pc.ctx.note;
  return [n.lecture && n.lecture !== n.title ? n.lecture : '', n.title].filter(Boolean).join(' › ');
}
function build() {
  state = { history: [], busy: false, rec: null };
  sheet = h(`<div class="na-sheet" role="dialog" aria-label="Assistant" data-mood="idle">
    <div class="na-top">
      <div class="na-bar">
        <button class="na-new" title="Start a new chat">${icon('plus')}<span>New chat</span></button>
        <button class="na-x" title="Close (Esc)">${icon('x')}</button>
      </div>
      <div class="na-orb"></div>
      <div class="na-status">Ready</div>
      <div class="na-where">${icon('book-open')}<span></span></div>
    </div>
    <div class="na-thread" aria-live="polite"></div>
    <div class="na-chips">${SUGGEST.map(s => `<button class="na-chip">${esc(s)}</button>`).join('')}</div>
    <form class="na-form">
      <button type="button" class="na-mic" title="Speak your question">${icon('mic')}</button>
      <input class="na-input" type="text" maxlength="400" autocomplete="off" placeholder="Ask, or say “show me…”">
      <button class="na-send" type="submit" title="Ask">${icon('arrow-up')}</button>
    </form>
    <div class="na-foot">Answers come from your notes and textbooks · “show me” opens it on the map</div>
  </div>`);
  document.body.appendChild(sheet);
  B.wireLinks(sheet);
  const input = $('.na-input', sheet);
  // pointerdown so a busy frame never swallows the close
  $('.na-x', sheet).addEventListener('pointerdown', e => { e.preventDefault(); close(); });
  $('.na-new', sheet).addEventListener('click', newChat);
  $('.na-chips', sheet).addEventListener('click', e => { const b = e.target.closest('.na-chip'); if (b) ask(b.textContent); });
  $('.na-form', sheet).addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
  $('.na-mic', sheet).addEventListener('click', toggleMic);
  if (!SR()) $('.na-mic', sheet).hidden = true;
}
function open() {
  if (!B.isNova()) return;
  if (!sheet) build();
  $('.na-where span', sheet).textContent = whereText();
  sheet.hidden = false;
  requestAnimationFrame(() => sheet && sheet.classList.add('is-open'));
  if (dock) dock.classList.add('is-hidden');
  if (!orb) N.loadGL().then(() => {
    if (!sheet || orb || !sheet.classList.contains('is-open') || !N.strands) return;
    orb = N.strands($('.na-orb', sheet), { energy: 0.5, glassSize: 1.05, intro: true });
    setMood(sheet.dataset.mood || 'idle');
  }).catch(() => {});
  document.addEventListener('keydown', onKey, true);
  setTimeout(() => { if (sheet && !B.isMobile()) $('.na-input', sheet).focus({ preventScroll: true }); }, 60);
}
function onKey(e) { if (e.key === 'Escape' && sheet && sheet.classList.contains('is-open')) { e.stopPropagation(); close(); } }
/** Hide the sheet. The conversation stays; only "New chat" clears it. */
function close() {
  stopMic();
  document.removeEventListener('keydown', onKey, true);
  if (orb) { orb.destroy(); orb = null; }       // no WebGL running while it is closed
  if (sheet) sheet.classList.remove('is-open');
  if (dock) dock.classList.remove('is-hidden');
}
function newChat() {
  if (!sheet) return;
  if (state && state.typer) cancelAnimationFrame(state.typer);
  stopMic();
  state = { history: [], busy: false, rec: null };
  $('.na-thread', sheet).innerHTML = '';
  $('.na-chips', sheet).hidden = false;
  sheet.classList.remove('has-thread');
  setMood('idle');
  $('.na-input', sheet).focus();
}
function destroy() {
  close();
  if (sheet) { sheet.remove(); sheet = null; }
  state = null;
}

/* ---------------------------------------------------------------- "show me": find notes and drive the map */
const STOP = new Set(('show me the a an of in on to which what where whereabouts is are was does do did lecture lectures topic topics note notes about talk talks ' +
  'talking covers cover covered explain explained explains section sections module bring up open take find go for that this it please can could you i ' +
  'want see look at from book books textbook textbooks library page pages pull mentioned mention mentions discuss discusses discussed my our there any ' +
  'tell where\'s whats what\'s with be been part parts').split(' '));
const tokens = s => s.toLowerCase().replace(/[^\p{L}\p{N}\s'-]/gu, ' ').split(/\s+/).map(w => w.replace(/^'+|'+$/g, '')).filter(w => w.length > 1 && !STOP.has(w));
/* forgiving matching: typos ("leccture", "genetisc", "take m e") still count */
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1), i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] ? d[i - 2][j - 2] + 1 : 99);
  return d[a.length][b.length];
}
const near = (w, target) => w === target || (target.length > 3 && lev(w, target) <= (target.length > 6 ? 2 : 1));
function clean(q) {
  // join stray single letters ("take m e" -> "take me") and lower-case
  return q.toLowerCase().replace(/\b([a-z])\s(?=[a-z]\b)/g, '$1').replace(/[^\p{L}\p{N}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim();
}
const VERBS = ['show', 'open', 'take', 'bring', 'pull', 'find', 'where', 'which', 'navigate', 'jump', 'goto', 'go', 'load', 'display', 'see'];
const KINDS = { lecture: ['lecture', 'lec', 'lect'], practical: ['practical', 'prac'], seminar: ['seminar'] };
const MODULE_WORDS = {
  'Molecular Biology and Genetics': ['genetics', 'genetic', 'molecular', 'molbio', 'gene'],
  'Biological Chemistry': ['chemistry', 'biochem', 'biochemistry', 'chem'],
  'Introduction to Biomedicine': ['biomedicine', 'biomed', 'introduction', 'intro'],
  'Cell Biology and Physiology': ['cell', 'physiology', 'cells'],
  'Professional Skills for Biosciences': ['skills', 'professional'],
};
function navIntent(q) {
  const s = clean(q), words = s.split(' ');
  const has = list => words.some(w => list.some(t => near(w, t)));
  const verb = has(VERBS) || /\b(go to|take me|bring up|pull up|look up)\b/.test(s);
  // "lecture 8", "leccture 8", "lec8", "practical 2"
  let kind = null, num = null;
  for (let k = 0; k < words.length; k++) {
    const m = words[k].match(/^([a-z]+?)(\d{1,2})$/);
    const w = m ? m[1] : words[k], n = m ? +m[2] : (/^\d{1,2}$/.test(words[k + 1] || '') ? +words[k + 1] : null);
    for (const [kd, list] of Object.entries(KINDS)) if (n != null && list.some(t => near(w, t) || w === t)) { kind = kd; num = n; }
  }
  const mod = Object.entries(MODULE_WORDS).find(([, list]) => words.some(w => list.some(t => near(w, t))));
  if (num != null && (verb || words.length <= 6)) return { kind: 'number', which: kind, num, module: mod ? mod[0] : null };
  if (!verb) return null;
  if (has(['book', 'books', 'textbook', 'textbooks', 'library', 'alberts', 'klug'])) return { kind: 'book' };
  const lectureish = has(['lecture', 'lectures', 'topic', 'topics', 'notes', 'section', 'module', 'practical', 'seminar']);
  if (mod && has(['module']) && tokens(s).every(t => MODULE_WORDS[mod[0]].some(x => near(t, x)) || near(t, 'module'))) return { kind: 'module', module: mod[0] };
  if (lectureish || /^(show|open|bring|pull|take|go|find|jump)/.test(s)) return { kind: 'note', lectureish, terms: tokens(s) };
  return null;
}
function planNumber(intent) {
  const L = N.model ? N.model() : null; if (!L) return null;
  const mods = intent.module ? L.modules.filter(m => m.title === intent.module) : L.modules;
  const which = intent.which || 'lecture';
  const found = mods.flatMap(m => (m.groups[which] || []).filter(hb => hb.number === intent.num));
  if (!found.length) return { missing: `${which[0].toUpperCase() + which.slice(1)} ${intent.num}${intent.module ? ' in ' + intent.module : ''}` };
  const hb = found[0];
  return { open: hb.id, ids: [hb.id, ...hb.topics.slice(0, 6)], title: `${which[0].toUpperCase() + which.slice(1)} ${hb.number} · ${hb.title.replace(/\s*\((Lecture|Seminar|Practical) \d+\)$/, '')}`, module: hb.module.title,
    also: found.slice(1, 3).map(x => ({ id: x.id, label: `${x.module.title}: ${x.title}` })) };
}
function searchNotes(terms, { noTerms } = {}) {
  if (!terms.length) return [];
  const phrase = terms.join(' ');
  const res = [];
  for (const [id, n] of Object.entries(B.V.notes)) {
    const p = n.props || {};
    const isTerm = id.startsWith('02 Key Terms/');
    if (noTerms && isTerm) continue;
    if (!['topic', 'hub', 'key term', 'subject hub'].includes(p.type)) continue;
    const title = (n.title + ' ' + ((p.aliases || []).join(' '))).toLowerCase(), text = (n.text || '').toLowerCase();
    let score = 0, hits = 0;
    for (const t of terms) {
      const inTitle = title.includes(t);
      const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const c = Math.min(6, (text.match(re) || []).length);
      if (inTitle) score += 8; score += c; if (inTitle || c) hits++;
    }
    if (!hits) continue;
    if (terms.length > 1) { if (title.includes(phrase)) score += 25; else if (text.includes(phrase)) score += 8; }
    score *= hits / terms.length;
    if (p.type === 'topic') score *= 1.15;
    res.push({ id, score, isTerm, type: p.type });
  }
  return res.sort((a, b) => b.score - a.score);
}
function planNote(intent) {
  const L = N.model ? N.model() : null;
  const hits = searchNotes(intent.terms, { noTerms: intent.lectureish });
  if (!hits.length || !L) return null;
  // add up topic hits per lecture and pick the lecture that talks about it most
  const byHub = new Map();
  for (const r of hits.slice(0, 40)) {
    const hub = L.hubs[r.id] ? r.id : L.topicHub[r.id];
    if (!hub) continue;
    const e = byHub.get(hub) || { hub, score: 0, topics: [] };
    e.score += r.score; if (r.id !== hub) e.topics.push(r); byHub.set(hub, e);
  }
  const ranked = [...byHub.values()].sort((a, b) => b.score - a.score);
  const top = hits[0];
  if (!ranked.length || (top.isTerm && !intent.lectureish && top.score > ranked[0].score)) {
    return { open: top.id, ids: [top.id, ...hits.slice(1, 5).map(h => h.id)], title: B.V.notes[top.id].title, also: [] };
  }
  const best = ranked[0];
  const topic = best.topics[0];
  const hubTitle = L.hubs[best.hub].title.replace(/\s*\((Lecture|Seminar|Practical) \d+\)$/, '');
  return {
    open: topic ? topic.id : best.hub,
    ids: [topic ? topic.id : best.hub, best.hub, ...best.topics.slice(1, 5).map(t => t.id)],
    title: hubTitle + (topic ? ' › ' + B.V.notes[topic.id].title.replace(/^\d+\s+/, '') : ''),
    module: L.hubs[best.hub].module ? L.hubs[best.hub].module.title : '',
    also: ranked.slice(1, 3).map(r => ({ id: r.topics[0] ? r.topics[0].id : r.hub, label: L.hubs[r.hub].title.replace(/\s*\((Lecture|Seminar|Practical) \d+\)$/, '') })),
  };
}
function takeControl(fn) {
  // hide the chat (it is kept) and let the map take over
  setTimeout(() => { close(); fn(); }, 650);
}

/* ---------------------------------------------------------------- asking */
async function ask(q) {
  q = String(q || '').trim();
  if (!q || !state || state.busy) return;
  const st = state;
  st.busy = true;
  const input = $('.na-input', sheet); input.value = '';
  $('.na-chips', sheet).hidden = true;
  const thread = $('.na-thread', sheet);
  const turn = h(`<div class="na-turn"><div class="na-q">${esc(q)}</div><div class="na-a"><span class="na-dots"><i></i><i></i><i></i></span></div></div>`);
  thread.appendChild(turn); thread.scrollTop = thread.scrollHeight;
  sheet.classList.add('has-thread');
  setMood('thinking');
  const a = $('.na-a', turn);
  const intent = navIntent(q);
  try {
    if (intent && (intent.kind === 'number' || intent.kind === 'module')) {
      const L = N.model ? N.model() : null;
      const plan = intent.kind === 'number' ? planNumber(intent)
        : (() => { const m = L && L.modules.find(x => x.title === intent.module); return m ? { open: m.id, ids: [m.id, ...Object.values(m.groups).flat().map(h => h.id).slice(0, 8)], title: m.title, also: [] } : null; })();
      if (plan && plan.missing) {
        a.innerHTML = `<p>I couldn't find ${esc(plan.missing)} in your notes.</p>`;
        setMood('idle'); st.busy = false; return;
      }
      if (plan) {
        a.innerHTML = `<p>Bringing up <strong>${esc(plan.title)}</strong>${plan.module ? ` in ${esc(plan.module)}` : ''}.</p>${plan.also.length ? `<p class="na-also">Also: ${plan.also.map(x => `<button class="na-jump" data-id="${esc(x.id)}">${esc(x.label)}</button>`).join(', ')}.</p>` : ''}`;
        $$('.na-jump', a).forEach(bt => bt.onclick = () => takeControl(() => N.map ? N.map.flyTo([bt.dataset.id], { open: bt.dataset.id, caption: bt.textContent }) : B.go(bt.dataset.id)));
        st.history.push({ q, a: 'Opened ' + plan.title });
        setMood('idle'); st.busy = false;
        takeControl(() => N.map ? N.map.flyTo(plan.ids, { open: plan.open, caption: plan.title }) : B.go(plan.open));
        return;
      }
    }
    if (intent && intent.kind === 'note') {
      const plan = planNote(intent);
      if (plan) {
        a.innerHTML = `<p>Bringing up <strong>${esc(plan.title)}</strong>${plan.module ? ` in ${esc(plan.module)}` : ''}.</p>${plan.also.length ? `<p class="na-also">Also comes up in ${plan.also.map(x => `<button class="na-jump" data-id="${esc(x.id)}">${esc(x.label)}</button>`).join(', ')}.</p>` : ''}`;
        $$('.na-jump', a).forEach(b => b.onclick = () => takeControl(() => N.map ? N.map.flyTo([b.dataset.id], { open: b.dataset.id, caption: b.textContent }) : B.go(b.dataset.id)));
        st.history.push({ q, a: 'Opened ' + plan.title });
        setMood('idle'); st.busy = false;
        takeControl(() => N.map ? N.map.flyTo(plan.ids, { open: plan.open, caption: plan.title }) : B.go(plan.open));
        return;
      }
    }
    const pc = pageContext();
    const body = pc
      ? { question: q, selection: pc.selection, ...pc.ctx, history: st.history.slice(-4) }
      : { question: q, selection: 'General question', note: { id: '', title: 'Biomedicine notes', subject: '', lecture: '', summary: '' }, section: { heading: '', text: '' }, block: '', history: st.history.slice(-4) };
    const r = await B.ask.explain(body);
    if (state !== st) return;
    st.history.push({ q, a: r.answer });
    a.innerHTML = B.ask.linkTerms(B.ask.md(r.answer), pc ? pc.noteId : null);
    await typeOut(a, st);
    if (state !== st) return;
    const openBook = s => {
      const go = () => { store.set('bookHighlight', { book: s.book, page: s.page, text: s.text }); B.go(`book/${s.book}/${s.page}`); };
      takeControl(() => N.map ? N.map.warp({ caption: `Opening ${s.citation}`, then: go }) : go());
    };
    if (r.sources.length) {
      const src = h(`<div class="na-sources">${r.sources.slice(0, 4).map((s, i) => `<button class="na-source" data-i="${i}" title="${esc(s.text.slice(0, 200))}">${icon('book-open')}<span>${esc(s.citation)}</span></button>`).join('')}</div>`);
      a.appendChild(src);
      $$('.na-source', src).forEach(b => b.onclick = () => openBook(r.sources[+b.dataset.i]));
    }
    const tools = h(`<div class="na-tools"><button class="na-tool" data-copy title="Copy answer">${icon('copy')}</button></div>`);
    a.appendChild(tools);
    $('[data-copy]', tools).onclick = async () => { try { await navigator.clipboard.writeText(r.answer); B.toast('Answer copied'); } catch (e) { B.toast('Copy failed'); } };
    setMood('idle');
    if (intent && intent.kind === 'book' && r.sources.length) {
      a.insertAdjacentHTML('beforeend', `<p class="na-also">Opening ${esc(r.sources[0].citation)}…</p>`);
      openBook(r.sources[0]);
    }
  } catch (err) {
    if (state !== st) return;
    const api = B.ask.apiBase();
    a.innerHTML = `<div class="na-error">${icon(err.kind === 'auth' ? 'lock' : 'alert-triangle')}<span>${esc(err.message)}</span>${err.kind === 'auth' && api ? ` <a href="${esc(api)}" target="_blank" rel="noopener">Sign in</a>` : ''}</div>`;
    setMood('error');
    if (!st.history.length) $('.na-chips', sheet).hidden = false;
  }
  st.busy = false;
  thread.scrollTop = thread.scrollHeight;
  if (!B.isMobile() && sheet.classList.contains('is-open')) input.focus({ preventScroll: true });
}

/* type the answer out, with the orb "speaking" in time */
function typeOut(el, st) {
  return new Promise(done => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    const full = nodes.map(n => n.nodeValue);
    const total = full.reduce((k, s) => k + s.length, 0);
    if (reduced || !total) { done(); return; }
    nodes.forEach(n => { n.nodeValue = ''; });
    el.classList.add('is-typing');
    setMood('speaking');
    const cps = Math.max(70, Math.min(260, total / 4));      // long answers type faster, max ~4 s
    const t0 = performance.now();
    const thread = $('.na-thread', sheet);
    const step = now => {
      if (state !== st) { done(); return; }
      const t = (now - t0) / 1000;
      let left = Math.floor(t * cps);
      for (let i = 0; i < nodes.length; i++) {
        const take = Math.min(full[i].length, Math.max(0, left));
        nodes[i].nodeValue = full[i].slice(0, take);
        left -= full[i].length;
      }
      if (orb) orb.set({ level: 0.35 + 0.65 * speech(t * 1.1) });
      if (thread) thread.scrollTop = thread.scrollHeight;
      if (t * cps < total) st.typer = requestAnimationFrame(step);
      else { el.classList.remove('is-typing'); if (orb) orb.set({ level: undefined }); done(); }
    };
    st.typer = requestAnimationFrame(step);
  });
}

/* ---------------------------------------------------------------- voice */
const SR = () => window.SpeechRecognition || window.webkitSpeechRecognition;
function toggleMic() { if (state && state.rec) stopMic(); else startMic(); }
async function startMic() {
  const Rec = SR(); if (!Rec || !state || state.busy) return;
  const st = state;
  const rec = new Rec();
  rec.lang = 'en-GB'; rec.interimResults = true; rec.continuous = false;
  st.rec = { rec, stream: null, ctx: null, raf: 0 };
  sheet.classList.add('is-listening');
  setMood('listening');
  if (orb) orb.set({ energy: 0.7 });
  const input = $('.na-input', sheet);
  rec.onresult = e => { input.value = [...e.results].map(r => r[0].transcript).join(' '); };
  rec.onerror = () => stopMic();
  rec.onend = () => { const q = input.value; stopMic(); if (q.trim()) ask(q); };
  try { rec.start(); } catch (e) { stopMic(); return; }
  try {   // mic level -> orb
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (state !== st || !st.rec) { stream.getTracks().forEach(t => t.stop()); return; }
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const an = ac.createAnalyser(); an.fftSize = 512;
    ac.createMediaStreamSource(stream).connect(an);
    const buf = new Uint8Array(an.fftSize);
    Object.assign(st.rec, { stream, ctx: ac });
    const tick = () => {
      if (!st.rec) return;
      an.getByteTimeDomainData(buf);
      let sum = 0; for (const v of buf) { const x = (v - 128) / 128; sum += x * x; }
      if (orb) orb.set({ level: Math.min(1, Math.sqrt(sum / buf.length) * 5) });
      st.rec.raf = requestAnimationFrame(tick);
    };
    tick();
  } catch (e) { if (orb) orb.set({ listening: true }); }
}
function stopMic() {
  if (!state || !state.rec) return;
  const r = state.rec; state.rec = null;
  cancelAnimationFrame(r.raf);
  try { r.rec.onend = null; r.rec.stop(); } catch (e) { /* already stopped */ }
  if (r.stream) r.stream.getTracks().forEach(t => t.stop());
  if (r.ctx) r.ctx.close().catch(() => {});
  if (sheet) sheet.classList.remove('is-listening');
  if (orb) orb.set({ level: undefined, listening: false });
  if (state && !state.busy) setMood('idle');
}

/* ---------------------------------------------------------------- lifecycle */
document.addEventListener('bv-uimode', e => { if (e.detail.mode === 'nova') mountDock(); else { destroy(); unmountDock(); } });
document.addEventListener('keydown', e => {
  if (!B.isNova() || !(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'j') return;
  e.preventDefault(); if (sheet && sheet.classList.contains('is-open')) close(); else open();
});
mountDock();
N.assistant = { open, close };
})();
