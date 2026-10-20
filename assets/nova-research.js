/* Nova: research mode. Ask the orb to "find information on X" and it searches the textbooks, pulls the
   best sections out as cards that whip across the screen into a deck, then writes one combined
   explanation from them. The deck can be flicked through (arrows, ← →, or swipe), and any card
   opens its book page. Search and explain both go to the private book engine (books.js / ask.js). */
(() => {
'use strict';
const B = window.BV;
const { icon, esc, $, $$, h } = B;
const N = window.NovaUI;
const wait = ms => new Promise(r => setTimeout(r, ms));
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let open = null;
function close() {
  if (!open) return;
  const el = open.el; open.alive = false; open = null;
  document.removeEventListener('keydown', onKey, true);
  el.classList.add('is-closing'); setTimeout(() => el.remove(), 260);
}
function onKey(e) {
  if (!open) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  else if (e.key === 'ArrowRight' && open.go) { e.preventDefault(); open.go(1); }
  else if (e.key === 'ArrowLeft' && open.go) { e.preventDefault(); open.go(-1); }
}

const cardHtml = (r, i, full) => `<article class="rs-card${full ? ' is-full' : ''}" data-i="${i}">
  <header><span class="rs-cite">${icon('book-open')}${esc(B.books.cite(r))}</span>${r.chapter ? `<span class="rs-ch">${esc(r.chapter)}${r.section ? ' › ' + esc(r.section) : ''}</span>` : ''}</header>
  <div class="rs-text">${full ? B.books.hl(r.plain || r.text, open && open.topic) : esc((r.plain || r.text).replace(/<[^>]+>/g, '').slice(0, 260)) + '…'}</div>
  ${r.figures && r.figures.length ? `<div class="rs-figs">${r.figures.slice(0, full ? 3 : 1).map(f => `<img src="${esc(f.url)}" alt="" loading="lazy" data-full="${esc(f.full || f.url)}">`).join('')}</div>` : ''}
  ${full && r.page ? `<button class="rs-open">${icon('book-open')} Open this page</button>` : ''}
</article>`;

async function research(topic) {
  topic = String(topic || '').trim().replace(/[?.!]+$/, '');
  if (!topic) return;
  close();
  const el = h(`<div class="rs" role="dialog" aria-label="Research: ${esc(topic)}">
    <div class="rs-top"><div><div class="nv-kicker">Research · textbooks</div><h1>${esc(topic)}</h1><div class="rs-status">Searching your textbooks…</div></div><button class="rs-x" title="Close (Esc)">${icon('x')}</button></div>
    <div class="rs-stage"><div class="rs-belt"></div></div>
    <div class="rs-body">
      <section class="rs-read"><div class="rs-read-inner"></div></section>
      <section class="rs-deck"><div class="rs-deck-cards"></div><div class="rs-deck-bar"><button class="rs-prev" title="Previous (←)">${icon('chevron-left')}</button><span class="rs-count"></span><button class="rs-next" title="Next (→)">${icon('chevron-right')}</button></div></section>
    </div>
  </div>`);
  document.body.appendChild(el);
  const me = open = { el, topic, alive: true, go: null };
  document.addEventListener('keydown', onKey, true);
  $('.rs-x', el).onclick = close;
  requestAnimationFrame(() => el.classList.add('is-in'));
  const status = t => { const s = $('.rs-status', el); if (s) s.textContent = t; };

  // 1. search
  let hits = [];
  try { hits = await B.books.search(topic, { limit: 14 }); }
  catch (e) { if (me.alive) { status(e.message || 'The book library did not answer.'); $('.rs-read-inner', el).innerHTML = `<p class="rs-err">${esc(e.message || '')}${B.ask && B.ask.apiBase() ? ` <a href="${esc(B.ask.apiBase())}" target="_blank" rel="noopener">Sign in to the book library</a>, then ask again.` : ''}</p>`; el.classList.add('is-done'); } return; }
  if (!me.alive) return;
  // keep the strongest, one per page, so the deck isn't the same page twice
  const seen = new Set(); hits = hits.filter(r => { const k = r.book + r.page; if (seen.has(k) || !(r.plain || r.text)) return false; seen.add(k); return true; }).slice(0, 10);
  if (!hits.length) { status('Nothing in the textbooks on that.'); el.classList.add('is-done'); return; }
  status(`Pulling ${hits.length} sections from ${[...new Set(hits.map(r => r.book))].join(', ')}`);

  // 2. cards whip across the stage, left to right, into the deck
  const belt = $('.rs-belt', el), deck = $('.rs-deck-cards', el);
  for (let i = 0; i < hits.length && me.alive; i++) {
    const c = h(cardHtml(hits[i], i, false)); belt.appendChild(c);
    if (!reduced()) {
      await c.animate([
        { transform: 'translate3d(-70vw, 30px, 0) rotate(-9deg) scale(.86)', opacity: 0, filter: 'blur(6px)' },
        { transform: 'translate3d(0, 0, 0) rotate(0) scale(1)', opacity: 1, filter: 'blur(0)', offset: .45 },
        { transform: 'translate3d(0, 0, 0) rotate(0) scale(1)', opacity: 1, filter: 'blur(0)', offset: .7 },
        { transform: 'translate3d(70vw, -20px, 0) rotate(8deg) scale(.8)', opacity: 0, filter: 'blur(5px)' },
      ], { duration: 820, easing: 'cubic-bezier(.65,0,.35,1)' }).finished;
    }
    c.remove();
    const mini = h(`<span class="rs-chip" style="--k:${i}">${esc(B.books.cite(hits[i]))}</span>`); $('.rs-stage', el).appendChild(mini);
  }
  if (!me.alive) return;

  // 3. combine: one explanation written from those sections
  status('Combining them into one explanation…');
  el.classList.add('is-combining');
  const passages = hits.map(r => `[${B.books.cite(r)}] ${(r.plain || r.text).replace(/<[^>]+>/g, '')}`).join('\n\n').slice(0, 3600);
  let answer = '', sources = [];
  try {
    const r = await B.ask.explain({
      question: `Give me a clear, well-structured explanation of "${topic}" for a first-year biomedicine student, using the textbook passages: the key idea first, then the mechanism or details step by step, the key terms, and why it matters. Cite the books where you use them.`,
      selection: topic, note: { id: '', title: 'Research: ' + topic, subject: '', lecture: '', summary: '' }, section: { heading: topic, text: passages }, block: '', history: [],
    });
    answer = r.answer; sources = r.sources;
  } catch (e) { answer = `I found the sections but couldn't write the summary: ${e.message || 'the book engine did not answer'}. The cards on the right have everything.`; }
  if (!me.alive) return;
  el.classList.remove('is-combining'); el.classList.add('is-done');
  status(`${hits.length} sections · ${[...new Set(hits.map(r => r.book))].length} books`);
  const read = $('.rs-read-inner', el);
  read.innerHTML = B.ask.md(answer);
  // type it out quickly (the text is already laid out, so nothing jumps)
  if (!reduced()) {
    const walker = document.createTreeWalker(read, NodeFilter.SHOW_TEXT); const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    const full = nodes.map(n => n.nodeValue); nodes.forEach(n => { n.nodeValue = ''; });
    const total = full.reduce((k, t) => k + t.length, 0), cps = Math.max(220, total / 3.5), t0 = performance.now();
    await new Promise(done => { const step = now => { if (!me.alive) return done(); let left = Math.floor((now - t0) / 1000 * cps); nodes.forEach((n, i) => { n.nodeValue = full[i].slice(0, Math.max(0, left)); left -= full[i].length; }); if ((now - t0) / 1000 * cps < total) requestAnimationFrame(step); else done(); }; requestAnimationFrame(step); });
  }
  if (sources.length) read.insertAdjacentHTML('beforeend', `<div class="rs-srcs">${sources.slice(0, 6).map(s => `<button class="rs-src" data-cite="${esc(s.citation)}">${icon('book-open')}${esc(s.citation)}</button>`).join('')}</div>`);

  // 4. the deck: flick through every section
  let cur = 0;
  deck.innerHTML = hits.map((r, i) => cardHtml(r, i, true)).join('');
  const cards = $$('.rs-card', deck);
  const lay = (dir = 0) => {
    cards.forEach((c, i) => {
      const d = i - cur;
      c.style.transform = d === 0 ? 'translate3d(0,0,0) rotate(0)' : d > 0 ? `translate3d(${Math.min(d, 3) * 14}px, ${Math.min(d, 3) * 10}px, 0) scale(${1 - Math.min(d, 3) * .04}) rotate(${Math.min(d, 3) * 1.2}deg)` : `translate3d(-120%, 0, 0) rotate(-10deg)`;
      c.style.opacity = d < 0 || d > 3 ? 0 : 1 - d * .18;
      c.style.zIndex = 50 - Math.abs(d);
      c.classList.toggle('is-current', d === 0);
      c.inert = d !== 0;
    });
    $('.rs-count', el).textContent = `${cur + 1} / ${cards.length}`;
    void dir;
  };
  me.go = d => { const n = Math.max(0, Math.min(cards.length - 1, cur + d)); if (n !== cur) { cur = n; lay(d); } };
  lay();
  $('.rs-prev', el).onclick = () => me.go(-1); $('.rs-next', el).onclick = () => me.go(1);
  // swipe
  let sx = null;
  deck.addEventListener('pointerdown', e => { if (e.target.closest('button, img, a')) return; sx = e.clientX; });
  deck.addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) me.go(dx < 0 ? 1 : -1); });
  el.addEventListener('click', e => {
    const op = e.target.closest('.rs-open'); if (op) { const r = hits[+op.closest('.rs-card').dataset.i]; close(); B.books.open(r); return; }
    const src = e.target.closest('.rs-src'); if (src) { const i = hits.findIndex(r => B.books.cite(r) === src.dataset.cite); if (i >= 0) { cur = i; lay(); } return; }
    const img = e.target.closest('.rs-card img[data-full]'); if (img) { const lb = h(`<div class="lightbox"><img src="${esc(img.dataset.full)}" alt=""></div>`); lb.onclick = () => lb.remove(); document.body.appendChild(lb); }
  });
}
N.research = research;
})();
