/* Read aloud: select text (or press Listen) and it is read to you, with a player bar:
   play/pause, previous/next sentence, a scrubber you can drag anywhere, speed, voice.
   The sentence and word being read are highlighted in the page (CSS Custom Highlight API, no DOM changes).
   Default voice: a natural AI voice from the site's server (/api/tts: Deepgram Aura through Workers AI),
   "Draco", a warm British baritone, as the Jarvis-style voice. Each sentence is fetched as audio, the next
   ones are fetched ahead, and they are cached. If the AI voice is unavailable it falls back to the
   device's own voices, which can also be picked by hand.
   window.BVReader.play(rootOrRange, { skip }) and BVReader.selectable(root, { skip }). */
(() => {
'use strict';
const synth = window.speechSynthesis;
if (!synth) { window.BVReader = { play() {}, selectable() {}, supported: false }; return; }

const CPS = 15;          // characters per second at 1× (for the time display and when a voice gives no word timing)
const RATES = [0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5];
const SKIP = 'svg, canvas, script, style, button:not([data-quiz]), .wl-tchart, .rd-skip, [hidden], [aria-hidden="true"]';
const ls = { get(k, d) { try { const v = localStorage.getItem('bv:rd:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
             set(k, v) { try { localStorage.setItem('bv:rd:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } } };

/* ---------------------------------------------------------------- voices */
// a JARVIS-like voice: British, male, calm. Best first; the device decides which of these exist.
const JARVIS = [/arthur.*(premium|enhanced)/i, /daniel.*(premium|enhanced)/i, /ryan.*natural/i, /thomas.*natural/i, /arthur/i, /daniel/i,
                /google uk english male/i, /oliver/i, /george/i, /ryan/i, /male.*(en-gb|uk)/i];
let voices = [];
function loadVoices() {
  voices = synth.getVoices().filter(v => /^en/i.test(v.lang));
  if (P.el) drawVoices();
}
function jarvisVoice() {
  for (const re of JARVIS) { const v = voices.find(x => re.test(x.name) && /GB|UK/i.test(x.lang + x.name)); if (v) return v; }
  return voices.find(v => /en-GB/i.test(v.lang)) || voices.find(v => v.default) || voices[0] || null;
}
const AI_VOICES = [['ai:enceladus', 'Jarvis style: Enceladus (Gemini, British butler)'], ['ai:draco', 'Draco (AI, British baritone)'], ['ai:helios', 'Helios (AI, British)'], ['ai:pandora', 'Pandora (AI, British, female)']];
const voicePref = () => { const v = ls.get('voice', 'ai:enceladus'); return v === 'jarvis' ? 'ai:enceladus' : v; };
const useAI = () => voicePref().startsWith('ai:') && !P.aiDown;
function pickVoice() {
  const want = voicePref();
  return voices.find(v => v.voiceURI === want) || jarvisVoice();
}

/* ---------------------------------------------------------------- text from the page */
const BLOCK = /^(P|LI|H\d|DIV|SECTION|ARTICLE|UL|OL|BLOCKQUOTE|TD|TH|TR|DETAILS|SUMMARY|BR)$/;
function blockOf(n) { let e = n.parentElement; while (e && !BLOCK.test(e.tagName)) e = e.parentElement; return e; }
function collect(range, skip) {
  const root = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
  const sel = SKIP + (skip ? ', ' + skip : '');
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: n => (!n.nodeValue.trim() || (n.parentElement && n.parentElement.closest(sel)) || !range.intersectsNode(n)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  let text = '', lastBlock = null;
  const segs = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    let a = 0, b = n.nodeValue.length;
    if (n === range.startContainer) a = range.startOffset;
    if (n === range.endContainer) b = range.endOffset;
    if (b <= a) continue;
    const blk = blockOf(n);
    if (lastBlock && blk !== lastBlock) text += /[.!?:;]\s*$/.test(text) ? ' ' : '. ';   // a pause between paragraphs, list items, headings
    else if (text && !/\s$/.test(text) && !/^\s/.test(n.nodeValue.slice(a, b))) { /* inline neighbours join as written */ }
    lastBlock = blk;
    segs.push({ node: n, a, g: text.length, len: b - a });
    text += n.nodeValue.slice(a, b);
  }
  return { text, segs };
}
function sentences(text) {
  const out = [], re = /[^.!?]+(?:[.!?]+["'”’)\]]*|$)\s*/g;
  let m;
  while ((m = re.exec(text)) && m[0]) {
    let s = m.index, chunk = m[0];
    while (chunk.length > 240) {                      // long sentences are split at a comma or semicolon so seeking stays fine-grained
      const cut = Math.max(chunk.lastIndexOf(', ', 200), chunk.lastIndexOf('; ', 200));
      const at = cut > 60 ? cut + 2 : 200;
      out.push({ s, e: s + at }); s += at; chunk = chunk.slice(at);
    }
    if (chunk.trim()) out.push({ s, e: s + chunk.length });
  }
  return out;
}
function rangeAt(g0, g1) {
  const segs = P.segs; let sr = null;
  for (const sg of segs) {
    const a = Math.max(g0, sg.g), b = Math.min(g1, sg.g + sg.len);
    if (b <= a) continue;
    if (!sg.node.isConnected) return null;
    if (!sr) { sr = document.createRange(); sr.setStart(sg.node, sg.a + a - sg.g); }
    sr.setEnd(sg.node, sg.a + b - sg.g);
  }
  return sr;
}

/* ---------------------------------------------------------------- player state */
const P = { el: null, text: '', segs: [], sents: [], pos: 0, playing: false, token: 0, rate: ls.get('rate', 1), utterStart: 0, t0: 0, timed: false, tick: 0, userScroll: 0, dragging: false };
const HL = window.CSS && CSS.highlights && window.Highlight;
function highlight(pos) {
  if (!HL) return;
  const si = sentIndex(pos), st = P.sents[si];
  const sr = st && rangeAt(st.s, st.e);
  CSS.highlights.set('rd-sent', sr ? new Highlight(sr) : new Highlight());
  const w = wordAt(pos), wr = w && rangeAt(w[0], w[1]);
  CSS.highlights.set('rd-word', wr ? new Highlight(wr) : new Highlight());
  if (sr && P.playing && Date.now() - P.userScroll > 2500) {
    const r = sr.getBoundingClientRect();
    if (r.height && (r.top < 70 || r.bottom > window.innerHeight - 130)) {
      const box = sr.startContainer.parentElement;
      if (box) box.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }
}
function clearHighlight() { if (HL) { CSS.highlights.delete('rd-sent'); CSS.highlights.delete('rd-word'); } }
const sentIndex = pos => { let i = P.sents.findIndex(s => pos < s.e); return i < 0 ? P.sents.length - 1 : i; };
function wordAt(pos) {
  const t = P.text; if (pos >= t.length) return null;
  let a = pos, b = pos;
  while (a > 0 && /\S/.test(t[a - 1])) a--;
  while (b < t.length && /\S/.test(t[b])) b++;
  return b > a ? [a, b] : null;
}
const wordStart = pos => { let a = Math.min(pos, P.text.length); while (a > 0 && /\S/.test(P.text[a - 1])) a--; return a; };

/* ---------------------------------------------------------------- speaking */
/* ---- AI voice: one audio clip per sentence */
const audio = new Audio();
audio.preload = 'auto';

/* ---- room sound: the AI voice runs through a reverb (a convolver with a made-up room's echo) */
const ROOMS = { off: null, room: { secs: 0.9, decay: 3.2, wet: 0.28 }, hall: { secs: 2.2, decay: 2.4, wet: 0.42 } };
const ROOM_LABEL = { off: 'No echo', room: 'Room', hall: 'Hall' };
let actx = null, conv = null, wetG = null, dryG = null;
function impulse(secs, decay) {
  const rate = actx.sampleRate, len = Math.floor(rate * secs), pre = Math.floor(rate * 0.018), b = actx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = pre; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i - pre) / (len - pre), decay);
  }
  return b;
}
function applyRoom() {
  if (!actx) return;
  const r = ROOMS[ls.get('room', 'room')];
  if (r) conv.buffer = impulse(r.secs, r.decay);
  wetG.gain.value = r ? r.wet : 0;
  dryG.gain.value = r ? 1 - r.wet * 0.35 : 1;
}
function ensureFx() {   // must run inside a tap (iPad rule for starting audio processing)
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!actx) {
    try {
      actx = new AC();
      const src = actx.createMediaElementSource(audio);
      conv = actx.createConvolver(); wetG = actx.createGain(); dryG = actx.createGain();
      src.connect(dryG).connect(actx.destination);
      src.connect(conv).connect(wetG).connect(actx.destination);
      applyRoom();
    } catch (e) { actx = null; return; }
  }
  if (actx.state !== 'running') actx.resume().catch(() => {});
}
const SILENT = (() => {   // 0.05 s of silence as a WAV, built here so it is certainly valid
  const n = 400, b = new Uint8Array(44 + n * 2), d = new DataView(b.buffer), w = (o, t) => [...t].forEach((c, k) => b[o + k] = c.charCodeAt(0));
  w(0, 'RIFF'); d.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true);
  d.setUint32(24, 8000, true); d.setUint32(28, 16000, true); d.setUint16(32, 2, true); d.setUint16(34, 16, true); w(36, 'data'); d.setUint32(40, n * 2, true);
  let bin = ''; b.forEach(x => bin += String.fromCharCode(x)); return 'data:audio/wav;base64,' + btoa(bin);
})();
const clips = new Map();   // text → Promise<object URL>
function clip(text) {
  const voice = voicePref().slice(3), k = voice + '|' + text;
  if (!clips.has(k)) {
    clips.set(k, fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice }) })
      .then(r => { if (!r.ok) throw new Error('tts ' + r.status); return r.blob(); })
      .then(b => URL.createObjectURL(b))
      .catch(e => { clips.delete(k); throw e; }));
  }
  return clips.get(k);
}
const sentText = i => P.text.slice(P.sents[i].s, P.sents[i].e).trim();
function prefetch(si) { for (let i = si + 1; i <= si + 2 && i < P.sents.length; i++) if (sentText(i)) clip(sentText(i)).catch(() => {}); }
function speakAI(pos, tok) {
  const si = sentIndex(pos), st = P.sents[si], t = sentText(si);
  if (!t) { speakFrom(st.e); return; }
  P.aiSent = si; P.aiLoading = true; paint();
  clip(t).then(url => {
    if (tok !== P.token) return;
    P.aiLoading = false;
    audio.onloadedmetadata = () => {
      if (tok !== P.token) return;
      const frac = Math.max(0, Math.min(.98, (pos - st.s) / Math.max(1, st.e - st.s)));
      if (frac > 0.02 && isFinite(audio.duration)) audio.currentTime = frac * audio.duration;
      audio.playbackRate = P.rate;
      audio.play().catch(() => { if (tok === P.token) pause(); });
    };
    audio.onended = () => { if (tok === P.token && P.playing) speakFrom(st.e); };
    audio.src = url;
    prefetch(si);
  }).catch(() => {
    if (tok !== P.token) return;
    P.aiDown = true; P.aiLoading = false;   // no AI voice (offline, or the day's free allowance used): carry on with the device's voice
    note('The AI voice is unavailable right now, so this is the device voice.');
    if (P.playing) speakFrom(pos);
  });
}
let noteTimer = 0;
function note(msg) { P.note = msg; clearTimeout(noteTimer); noteTimer = setTimeout(() => { P.note = ''; paint(); }, 6000); paint(); }

function speakFrom(pos) {
  synth.cancel(); audio.pause();
  const tok = ++P.token;
  P.pos = Math.max(0, Math.min(pos, P.text.length));
  if (P.pos >= P.text.length - 1) { stopAtEnd(); return; }
  const si = sentIndex(P.pos), st = P.sents[si];
  const from = Math.max(P.pos, st.s), chunk = P.text.slice(from, st.e);
  if (!chunk.trim()) { speakFrom(st.e); return; }
  if (useAI()) { speakAI(P.pos, tok); return; }
  const u = new SpeechSynthesisUtterance(chunk);
  const v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; }
  u.rate = P.rate;
  u.pitch = voicePref().startsWith('ai:') ? 0.92 : 1;   // fallback for the Jarvis voice: a touch lower and steadier
  u.onstart = () => { if (tok !== P.token) return; P.utterStart = from; P.t0 = performance.now(); };
  u.onboundary = e => { if (tok !== P.token || e.name === 'sentence') return; P.timed = true; if (P.dragging) return; P.pos = from + e.charIndex; paint(); };
  u.onend = () => { if (tok !== P.token) return; if (P.playing) speakFrom(st.e); };
  u.onerror = e => { if (tok !== P.token || e.error === 'interrupted' || e.error === 'canceled') return; if (P.playing) speakFrom(st.e); };
  P.utterStart = from; P.t0 = performance.now(); P.timed = false;
  synth.speak(u);
  paint();
}
function play() {
  if (!P.text) return;
  if (useAI()) ensureFx();
  // iPad only lets a page play sound that starts from a tap: start (silent) audio now, inside the tap,
  // so the AI voice clips that arrive a moment later are allowed to play
  if (useAI() && !P.unlocked) { audio.onended = audio.onloadedmetadata = null; audio.src = SILENT; audio.play().then(() => { P.unlocked = true; }).catch(() => {}); }
  if (P.pos >= P.text.length - 1) P.pos = 0;
  P.playing = true; speakFrom(wordStart(P.pos)); startTick(); drawButtons();
}
function pause() { P.playing = false; P.token++; synth.cancel(); audio.pause(); stopTick(); drawButtons(); paint(); }
function stopAtEnd() { P.playing = false; P.pos = P.text.length; stopTick(); drawButtons(); paint(); }
function seek(pos, keepPlaying = P.playing) {
  P.pos = wordStart(Math.max(0, Math.min(pos, P.text.length)));
  if (keepPlaying) { P.playing = true; speakFrom(P.pos); startTick(); } else { P.token++; synth.cancel(); audio.pause(); }
  drawButtons(); paint();
}
function prevSentence() {
  const si = sentIndex(P.pos), st = P.sents[si];
  // like a music player: back once restarts this sentence, again goes to the one before
  seek(P.pos - st.s > 12 || si === 0 ? st.s : P.sents[si - 1].s);
}
function nextSentence() { const si = sentIndex(P.pos); if (si < P.sents.length - 1) seek(P.sents[si + 1].s); else stopAtEnd(); }
function setRate(r) {
  P.rate = r; ls.set('rate', r);
  if (P.playing && useAI()) audio.playbackRate = r;   // the AI clip just speeds up, no restart
  else if (P.playing) speakFrom(wordStart(P.pos));
  drawButtons(); paint();
}

// voices that give no word timings (some online voices): estimate where they are from the clock
function startTick() { stopTick(); P.tick = setInterval(() => {
  if (!P.playing || P.dragging) return;
  if (useAI()) {   // follow the clip: position = how far through the sentence's audio we are
    const st = P.sents[P.aiSent];
    if (st && !P.aiLoading && audio.duration && isFinite(audio.duration)) { P.pos = st.s + (audio.currentTime / audio.duration) * (st.e - st.s); paint(); }
    return;
  }
  if (P.timed) return;
  const st = P.sents[sentIndex(P.utterStart)];
  const est = P.utterStart + (performance.now() - P.t0) / 1000 * CPS * P.rate;
  P.pos = Math.min(est, st ? st.e - 1 : est); paint();
}, 120); }
function stopTick() { clearInterval(P.tick); }

/* ---------------------------------------------------------------- player bar */
const fmt = sec => { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); };
const secs = chars => chars / (CPS * P.rate);
const ICON = {
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" stroke="none"/></svg>',
  prev: '<svg viewBox="0 0 24 24"><path d="M6 5v14M18 6l-9 6 9 6z"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M18 5v14M6 6l9 6-9 6z"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};
function build() {
  if (P.el) return;
  const el = document.createElement('div');
  el.className = 'rd-bar';
  el.innerHTML = `
    <div class="rd-row">
      <button class="rd-b" data-rd="prev" title="Previous sentence (←)" aria-label="Previous sentence">${ICON.prev}</button>
      <button class="rd-b rd-main" data-rd="toggle" title="Play / pause (space)" aria-label="Play">${ICON.play}</button>
      <button class="rd-b" data-rd="next" title="Next sentence (→)" aria-label="Next sentence">${ICON.next}</button>
      <span class="rd-time" data-rd-time>0:00 / 0:00</span>
      <input class="rd-scrub" data-rd-scrub type="range" min="0" max="1000" value="0" aria-label="Position">
      <span class="rd-speed"><button class="rd-b rd-s" data-rd="slower" title="Slower" aria-label="Slower">−</button><b data-rd-rate>1×</b><button class="rd-b rd-s" data-rd="faster" title="Faster" aria-label="Faster">+</button></span>
      <select class="rd-voice" data-rd-voice aria-label="Voice"></select>
      <button class="rd-b rd-room" data-rd="room" title="Echo: none, a room, or a hall (AI voices)" aria-label="Echo"><svg viewBox="0 0 24 24"><path d="M3 12h2M7 8v8M11 5v14M15 8v8M19 10v4"/></svg><small data-rd-roomlbl></small></button>
      <button class="rd-b" data-rd="close" title="Stop and close" aria-label="Close">${ICON.x}</button>
    </div>
    <div class="rd-now" data-rd-now></div>`;
  document.body.appendChild(el);
  P.el = el;
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-rd]'); if (!b) return;
    const a = b.dataset.rd;
    if (a === 'toggle') P.playing ? pause() : play();
    else if (a === 'room') { const ks = Object.keys(ROOMS), cur = ls.get('room', 'room'); ls.set('room', ks[(ks.indexOf(cur) + 1) % ks.length]); ensureFx(); applyRoom(); drawButtons(); }
    else if (a === 'prev') prevSentence();
    else if (a === 'next') nextSentence();
    else if (a === 'slower') setRate(RATES[Math.max(0, RATES.indexOf(nearestRate()) - 1)]);
    else if (a === 'faster') setRate(RATES[Math.min(RATES.length - 1, RATES.indexOf(nearestRate()) + 1)]);
    else if (a === 'close') close();
  });
  const scrub = el.querySelector('[data-rd-scrub]');
  let wasPlaying = false;
  scrub.addEventListener('pointerdown', () => { P.dragging = true; wasPlaying = P.playing; });
  scrub.addEventListener('input', () => {   // dragging: move the highlight and time with the thumb, speak on release
    P.dragging = true;
    P.pos = Math.round(scrub.value / 1000 * P.text.length);
    paint(true);
  });
  scrub.addEventListener('change', () => { P.dragging = false; seek(Math.round(scrub.value / 1000 * P.text.length), wasPlaying || P.playing); });
  el.querySelector('[data-rd-voice]').addEventListener('change', e => { ls.set('voice', e.target.value); P.aiDown = false; if (P.playing) { if (useAI()) { audio.src = SILENT; audio.play().catch(() => {}); } speakFrom(wordStart(P.pos)); } });
  drawVoices();
}
const nearestRate = () => RATES.reduce((a, b) => Math.abs(b - P.rate) < Math.abs(a - P.rate) ? b : a);
function drawVoices() {
  const s = P.el && P.el.querySelector('[data-rd-voice]'); if (!s) return;
  const want = voicePref();
  s.innerHTML = AI_VOICES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('') +
    (voices.length ? '<optgroup label="This device\'s voices">' + voices.map(v => `<option value="${v.voiceURI.replace(/"/g, '&quot;')}">${v.name} · ${v.lang}</option>`).join('') + '</optgroup>' : '');
  s.value = [...s.options].some(o => o.value === want) ? want : 'ai:enceladus';
}
function drawButtons() {
  if (!P.el) return;
  P.el.querySelector('[data-rd-roomlbl]').textContent = ROOM_LABEL[ls.get('room', 'room')];
  const t = P.el.querySelector('[data-rd="toggle"]');
  t.innerHTML = P.playing ? ICON.pause : ICON.play;
  t.setAttribute('aria-label', P.playing ? 'Pause' : 'Play');
  P.el.querySelector('[data-rd-rate]').textContent = (+P.rate.toFixed(2)) + '×';
}
function paint(fromDrag) {
  if (!P.el) return;
  const N = P.text.length || 1;
  if (!fromDrag) P.el.querySelector('[data-rd-scrub]').value = Math.round(P.pos / N * 1000);
  P.el.querySelector('[data-rd-time]').textContent = fmt(secs(P.pos)) + ' / ' + fmt(secs(N));
  const st = P.sents[sentIndex(P.pos)];
  P.el.querySelector('[data-rd-now]').textContent = P.note || (P.playing && P.aiLoading ? 'Loading the voice…' : st ? P.text.slice(st.s, st.e).trim() : '');
  highlight(P.pos);
}
function close() { pause(); clearHighlight(); if (P.el) { P.el.remove(); P.el = null; } document.body.classList.remove('rd-open'); P.text = ''; }

/* ---------------------------------------------------------------- start reading */
function load(target, opts = {}) {
  let range = target;
  if (!(target instanceof Range)) { range = document.createRange(); range.selectNodeContents(target); }
  const { text, segs } = collect(range, opts.skip);
  if (!text.trim()) return false;
  pause();
  Object.assign(P, { text, segs, sents: sentences(text), pos: 0 });
  build(); document.body.classList.add('rd-open'); drawButtons(); paint();
  return true;
}
function playTarget(target, opts) { if (load(target, opts)) play(); }

/* select text → a Listen chip appears under it */
let chip = null;
function hideChip() { if (chip) { chip.remove(); chip = null; } }
function selectable(root, opts = {}) {
  if (!root || root.dataset.rdSel) return;
  root.dataset.rdSel = '1';
  const check = () => setTimeout(() => {
    const s = window.getSelection();
    if (!s || s.isCollapsed || !s.rangeCount) { hideChip(); return; }
    const r = s.getRangeAt(0);
    if (!root.contains(r.commonAncestorContainer) || s.toString().trim().length < 3) { hideChip(); return; }
    const rects = r.getClientRects(), last = rects[rects.length - 1] || r.getBoundingClientRect();
    if (!chip) {
      chip = document.createElement('button');
      chip.className = 'rd-chip';
      chip.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/></svg><span>Listen</span>';
      chip.addEventListener('pointerdown', e => e.preventDefault());   // keep the selection
      document.body.appendChild(chip);
    }
    chip.onclick = () => { const rr = window.getSelection().rangeCount ? window.getSelection().getRangeAt(0).cloneRange() : r; hideChip(); playTarget(rr, opts); };
    const x = Math.min(window.innerWidth - 110, Math.max(8, last.right - 50));
    const y = Math.min(window.innerHeight - 130, last.bottom + 10);   // below the selection: iPad's own menu sits above it
    chip.style.left = x + 'px'; chip.style.top = y + 'px';
  }, 30);
  document.addEventListener('selectionchange', check);
  root.addEventListener('pointerup', check);
}

/* keys: space play/pause, ← → sentence, while the player is open and you're not typing */
document.addEventListener('keydown', e => {
  if (!P.el || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.closest('input, textarea, select, [contenteditable="true"]') && !t.matches('[data-rd-scrub]'))) return;
  if (e.key === ' ' || e.key === 'k') { e.preventDefault(); P.playing ? pause() : play(); }
  else if (e.key === 'ArrowLeft' || e.key === 'j') { e.preventDefault(); prevSentence(); }
  else if (e.key === 'ArrowRight' || e.key === 'l') { e.preventDefault(); nextSentence(); }
  else if (e.key === 'Escape') close();
});
['wheel', 'touchmove'].forEach(ev => window.addEventListener(ev, () => { P.userScroll = Date.now(); }, { passive: true, capture: true }));
window.addEventListener('hashchange', () => { if (P.el && !document.querySelector('.wl-host')) close(); });

loadVoices();
if (synth.onvoiceschanged !== undefined) synth.addEventListener('voiceschanged', loadVoices);
// speaking a sentence at a time also avoids Chrome cutting off long speech after about 15 seconds
window.BVReader = { play: playTarget, load, selectable, close, supported: true };
})();
