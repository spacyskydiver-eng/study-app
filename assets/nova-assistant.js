/* Nova assistant: the AI helper rebuilt around a Strands orb (React Bits).
   - an orb sits docked in the corner of every Nova page; click it (or highlight text and press Ask)
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

let dock = null, dockOrb = null, sheet = null, orb = null, state = null;

/* ---------------------------------------------------------------- context from what is on screen */
function clip(s, n) { s = String(s || '').replace(/\n{3,}/g, '\n\n').trim(); return s.length <= n ? s : s.slice(0, n) + '…'; }
function pageContext() {
  const view = $('#view');
  if (!view) return null;
  // lecture reader: the chapter nearest the top third of the screen
  const secs = $$('.nv-ch', view);
  let el = null;
  if (secs.length) {
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

/* ---------------------------------------------------------------- dock */
function mountDock() {
  if (dock || !B.isNova()) return;
  dock = h(`<button class="na-dock" title="Ask the assistant" aria-label="Open the assistant"><span class="na-dock-orb"></span></button>`);
  document.body.appendChild(dock);
  dock.addEventListener('click', () => open());
  N.loadGL().then(() => {
    if (!dock || !N.strands) return;
    dockOrb = N.strands($('.na-dock-orb', dock), { energy: 0.45, glassSize: 1.15, intro: true, interactive: true, clickPulse: true, maxDevicePixelRatio: 2 });
  }).catch(() => {});
}
function unmountDock() {
  if (dockOrb) { dockOrb.destroy(); dockOrb = null; }
  if (dock) { dock.remove(); dock = null; }
}

/* ---------------------------------------------------------------- sheet */
function suggestionsFor(c) {
  if (c.fromSelection) return B.ask.chipsFor(c.selection);
  if (!c.ctx) return ['What should I focus on for the exam?', 'Quiz me on this module', 'Explain the hardest idea here'];
  return [`Summarise “${clip(c.ctx.note.title, 48)}”`, 'Explain this simply', 'What would an exam ask here?', 'Give me an example'];
}
function open(opts = {}) {
  if (!B.isNova()) return;
  const fromSelection = !!opts.selection && !!opts.ctx;
  const page = fromSelection ? null : pageContext();
  const c = fromSelection ? { fromSelection, selection: opts.selection, ctx: opts.ctx, noteId: opts.noteId } : { fromSelection: false, selection: page ? page.selection : 'General question', ctx: page ? page.ctx : null, noteId: page ? page.noteId : null };
  if (sheet && state && !fromSelection && state.c.noteId === c.noteId) { sheet.classList.add('is-open'); $('.na-input', sheet).focus(); return; }
  close(true);
  state = { c, history: [], busy: false, rec: null };
  const where = c.ctx ? [c.ctx.note.lecture && c.ctx.note.lecture !== c.ctx.note.title ? c.ctx.note.lecture : '', c.ctx.note.title].filter(Boolean).join(' › ') : 'Your notes and textbooks';
  sheet = h(`<div class="na-sheet" role="dialog" aria-label="Assistant" data-mood="idle">
    <div class="na-top">
      <button class="na-x" title="Close (Esc)">${icon('x')}</button>
      <div class="na-orb"></div>
      <div class="na-status">Ready</div>
      <div class="na-where">${icon(c.fromSelection ? 'quote' : 'book-open')}<span>${esc(where)}</span></div>
      ${c.fromSelection ? `<blockquote class="na-sel">${esc(clip(c.selection, 280))}</blockquote>` : ''}
    </div>
    <div class="na-thread" aria-live="polite"></div>
    <div class="na-chips">${suggestionsFor(c).map(s => `<button class="na-chip">${esc(s)}</button>`).join('')}</div>
    <form class="na-form">
      <button type="button" class="na-mic" title="Speak your question">${icon('mic')}</button>
      <input class="na-input" type="text" maxlength="400" autocomplete="off" placeholder="${c.fromSelection ? 'Ask about the highlighted text…' : 'Ask about what you are reading…'}">
      <button class="na-send" type="submit" title="Ask">${icon('arrow-up')}</button>
    </form>
    <div class="na-foot">Answers come from this note and your textbooks</div>
  </div>`);
  document.body.appendChild(sheet);
  if (dock) dock.classList.add('is-hidden');
  requestAnimationFrame(() => sheet && sheet.classList.add('is-open'));
  B.wireLinks(sheet);
  N.loadGL().then(() => {
    if (!sheet || !N.strands) return;
    orb = N.strands($('.na-orb', sheet), { energy: 0.5, glassSize: 1.05, intro: true });
  }).catch(() => {});
  const input = $('.na-input', sheet);
  $('.na-x', sheet).onclick = () => close();
  $('.na-chips', sheet).addEventListener('click', e => { const b = e.target.closest('.na-chip'); if (b) ask(b.textContent); });
  $('.na-form', sheet).addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
  $('.na-mic', sheet).addEventListener('click', toggleMic);
  if (!SR()) $('.na-mic', sheet).hidden = true;
  document.addEventListener('keydown', onKey, true);
  setTimeout(() => { if (sheet && !B.isMobile()) input.focus({ preventScroll: true }); }, 60);
}
function onKey(e) { if (e.key === 'Escape' && sheet) { e.stopPropagation(); close(); } }
function close(instant) {
  stopMic();
  document.removeEventListener('keydown', onKey, true);
  if (orb) { orb.destroy(); orb = null; }
  if (sheet) {
    const s = sheet; sheet = null;
    if (instant) s.remove(); else { s.classList.remove('is-open'); setTimeout(() => s.remove(), 320); }
  }
  if (state && state.typer) cancelAnimationFrame(state.typer);
  state = null;
  if (dock) dock.classList.remove('is-hidden');
}

/* ---------------------------------------------------------------- asking */
async function ask(q) {
  q = String(q || '').trim();
  if (!q || !state || state.busy) return;
  const st = state, c = st.c;
  st.busy = true;
  const input = $('.na-input', sheet); input.value = '';
  $('.na-chips', sheet).hidden = true;
  const thread = $('.na-thread', sheet);
  const turn = h(`<div class="na-turn"><div class="na-q">${esc(q)}</div><div class="na-a"><span class="na-dots"><i></i><i></i><i></i></span></div></div>`);
  thread.appendChild(turn); thread.scrollTop = thread.scrollHeight;
  sheet.classList.add('has-thread');
  setMood('thinking');
  const a = $('.na-a', turn);
  try {
    const body = c.ctx
      ? { question: q, selection: c.selection, ...c.ctx, history: st.history.slice(-4) }
      : { question: q, selection: c.selection, note: { id: '', title: 'Biomedicine notes', subject: '', lecture: '', summary: '' }, section: { heading: '', text: '' }, block: '', history: st.history.slice(-4) };
    const r = await B.ask.explain(body);
    if (state !== st) return;
    st.history.push({ q, a: r.answer });
    a.innerHTML = B.ask.linkTerms(B.ask.md(r.answer), c.noteId);
    await typeOut(a, st);
    if (state !== st) return;
    if (r.sources.length) {
      const src = h(`<div class="na-sources">${r.sources.slice(0, 4).map((s, i) => `<button class="na-source" data-i="${i}" title="${esc(s.text.slice(0, 200))}">${icon('book-open')}<span>${esc(s.citation)}</span></button>`).join('')}</div>`);
      a.appendChild(src);
      $$('.na-source', src).forEach(b => b.onclick = () => {
        const s = r.sources[+b.dataset.i];
        store.set('bookHighlight', { book: s.book, page: s.page, text: s.text });
        B.go(`book/${s.book}/${s.page}`, null, true);
      });
    }
    const tools = h(`<div class="na-tools"><button class="na-tool" data-copy title="Copy answer">${icon('copy')}</button></div>`);
    a.appendChild(tools);
    $('[data-copy]', tools).onclick = async () => { try { await navigator.clipboard.writeText(r.answer); B.toast('Answer copied'); } catch (e) { B.toast('Copy failed'); } };
    setMood('idle');
  } catch (err) {
    if (state !== st) return;
    const api = B.ask.apiBase();
    a.innerHTML = `<div class="na-error">${icon(err.kind === 'auth' ? 'lock' : 'alert-triangle')}<span>${esc(err.message)}</span>${err.kind === 'auth' && api ? ` <a href="${esc(api)}" target="_blank" rel="noopener">Sign in</a>` : ''}</div>`;
    setMood('error');
    if (!st.history.length) $('.na-chips', sheet).hidden = false;
  }
  st.busy = false;
  thread.scrollTop = thread.scrollHeight;
  if (!B.isMobile()) input.focus({ preventScroll: true });
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
document.addEventListener('bv-uimode', e => { if (e.detail.mode === 'nova') mountDock(); else { close(true); unmountDock(); } });
document.addEventListener('keydown', e => {
  if (!B.isNova() || !(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'j') return;
  e.preventDefault(); if (sheet) close(); else open();
});
mountDock();
N.assistant = { open, close };
})();
