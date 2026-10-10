/* Ask: highlight any text in a note, then ask about it. The question goes to the private book engine
   (POST /explain) together with the note, the section and the highlighted passage, so the answer is about
   what this lecture means by it. The engine adds matching textbook passages and calls a small model; the
   API key never reaches the browser. */
(() => {
'use strict';
const B = window.BV;
const { icon, esc, $, $$, h, store } = B;
let API = '', PATH = '/explain';

B.onBoot(V => {
  const c = (V.config || {});
  API = String(((c.books || {}).api) || '').replace(/\/+$/, '');
  if (c.ask && c.ask.path) PATH = c.ask.path;
});

/* ---------- mark note roots so a selection can be traced back to its note */
B.onHydrate((root, id) => { if (id && B.V.notes[id]) root.dataset.askNote = id; });

/* ---------- selection -> floating Ask button */
let fab = null, panel = null, pending = 0;
function selection() {
  const s = window.getSelection();
  if (!s || s.isCollapsed || !s.rangeCount) return null;
  const text = String(s).replace(/\s+/g, ' ').trim();
  if (text.length < 2 || text.length > 900) return null;
  const range = s.getRangeAt(0);
  const anc = range.commonAncestorContainer;
  const el = anc.nodeType === 1 ? anc : anc.parentElement;
  if (!el || el.closest('input, textarea, .ask-panel, .ask-fab, .menu')) return null;
  const host = el.closest('[data-ask-note]');
  if (!host) return null;
  const rects = range.getClientRects();
  const rect = rects.length ? rects[rects.length - 1] : range.getBoundingClientRect();
  return { text, el, host, id: host.dataset.askNote, rect, first: rects.length ? rects[0] : rect };
}
function hideFab() { if (fab) { fab.remove(); fab = null; } }
function showFab(info) {
  hideFab();
  fab = h(`<button class="ask-fab" title="Ask about the highlighted text">${icon('sparkles')}<span>Ask</span></button>`);
  document.body.appendChild(fab);
  const W = fab.offsetWidth, H = fab.offsetHeight, r = info.rect;
  let x = r.right - W / 2, y = r.bottom + 8;
  if (y + H > window.innerHeight - 8) y = info.first.top - H - 8;
  fab.style.left = Math.max(8, Math.min(x, window.innerWidth - W - 8)) + 'px';
  fab.style.top = Math.max(8, y) + 'px';
  fab.addEventListener('pointerdown', e => e.preventDefault());   // keep the selection
  fab.addEventListener('click', e => { e.preventDefault(); const cur = selection() || info; hideFab(); openPanel(cur); });
}
function check(delay) {
  clearTimeout(pending);
  pending = setTimeout(() => { const info = selection(); if (info) showFab(info); else hideFab(); }, delay);
}
document.addEventListener('mouseup', e => { if (e.target.closest && e.target.closest('.ask-fab, .ask-panel')) return; check(10); });
document.addEventListener('keyup', e => { if (e.shiftKey || e.key === 'Shift') check(10); });
document.addEventListener('selectionchange', () => { if (B.isMobile()) check(350); else if (fab && !selection()) hideFab(); });
document.addEventListener('scroll', hideFab, true);

/* ---------- context sent with the question */
const TOP = /^el-(h1|h2|h3)\b/;
function context(info) {
  const n = B.V.notes[info.id] || {}, p = n.props || {};
  const block = info.el.closest('li, p, td, blockquote, .callout, h1, h2, h3, h4') || info.el;
  const sizer = info.host.querySelector('.markdown-preview-sizer') || info.host;
  let top = block;
  while (top.parentElement && top.parentElement !== sizer && top.parentElement !== info.host) top = top.parentElement;
  let heading = '', before = [], after = [];
  for (let x = top.previousElementSibling; x; x = x.previousElementSibling) {
    if (TOP.test(x.className)) { heading = x.textContent.trim(); break; }
    before.unshift(x.innerText || x.textContent);
  }
  for (let x = top.nextElementSibling; x; x = x.nextElementSibling) {
    if (TOP.test(x.className)) break;
    after.push(x.innerText || x.textContent);
  }
  const clip = (s, n, end) => { s = s.replace(/\n{3,}/g, '\n\n').trim(); return s.length <= n ? s : end ? '…' + s.slice(-n) : s.slice(0, n) + '…'; };
  const here = (top.innerText || top.textContent || '').trim();
  const section = [clip(before.join('\n'), 1200, true), here, clip(after.join('\n'), 1200, false)].filter(Boolean).join('\n');
  return {
    note: { id: info.id, title: (p.title || n.display || B.titleOf(info.id)), subject: p.subject || '', lecture: p.part_of || '', summary: p.summary || '' },
    section: { heading, text: clip(section, 3600, false) },
    block: clip((block.innerText || block.textContent || '').trim(), 1500, false),
  };
}

/* ---------- answer formatting: light markdown, then link key terms the vault already has */
function md(s) {
  const lines = esc(String(s || '')).replace(/\r/g, '').split('\n');
  let out = '', list = null;
  const inline = t => t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>').replace(/`([^`]+)`/g, '<code>$1</code>');
  const close = () => { if (list) { out += `</${list}>`; list = null; } };
  let para = [];
  const flush = () => { if (para.length) { out += `<p>${inline(para.join(' '))}</p>`; para = []; } };
  for (const raw of lines) {
    const l = raw.trim();
    let m;
    if (!l) { flush(); close(); continue; }
    if ((m = l.match(/^[-•*]\s+(.*)/))) { flush(); if (list !== 'ul') { close(); out += '<ul>'; list = 'ul'; } out += `<li>${inline(m[1])}</li>`; continue; }
    if ((m = l.match(/^\d+[.)]\s+(.*)/))) { flush(); if (list !== 'ol') { close(); out += '<ol>'; list = 'ol'; } out += `<li>${inline(m[1])}</li>`; continue; }
    close(); para.push(l);
  }
  flush(); close();
  return out;
}
let TERMS = null;
function terms() {
  if (TERMS) return TERMS;
  TERMS = Object.keys(B.V.notes).filter(k => k.startsWith('02 Key Terms/')).map(k => {
    const n = B.V.notes[k], names = [n.display || k.split('/').pop(), ...(((n.props || {}).aliases) || [])];
    return { id: k, names: [...new Set(names.filter(x => x && x.length > 2))] };
  });
  return TERMS;
}
function linkTerms(htmlStr, selfId) {
  const box = document.createElement('div'); box.innerHTML = htmlStr;
  const used = new Set(); let count = 0;
  const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  const list = terms().flatMap(t => t.names.map(name => ({ id: t.id, name }))).sort((a, b) => b.name.length - a.name.length);
  for (const node of nodes) {
    if (count >= 8 || node.parentElement.closest('a, code')) continue;
    for (const t of list) {
      if (used.has(t.id) || t.id === selfId) continue;
      const re = new RegExp(`(^|[^\\w-])(${t.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![\\w-])`, 'i');
      const m = node.nodeValue.match(re);
      if (!m) continue;
      const i = m.index + m[1].length;
      const after = node.splitText(i); after.splitText(m[2].length);
      const a = document.createElement('a');
      a.className = 'internal-link'; a.dataset.note = t.id; a.href = B.hashFor(t.id); a.textContent = after.nodeValue;
      after.replaceWith(a);
      used.add(t.id); count++;
      break;
    }
  }
  return box.innerHTML;
}

/* ---------- engine call */
async function explain(body) {
  if (!API) throw Object.assign(new Error('The AI helper is not connected on this site.'), { kind: 'unset' });
  let res;
  try {
    res = await fetch(API + PATH, { method: 'POST', credentials: 'include', mode: 'cors', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
  } catch (e) { throw Object.assign(new Error('The book library did not answer. Sign in to it, then try again.'), { kind: 'auth' }); }
  if (res.status === 401 || res.status === 403) throw Object.assign(new Error('Sign in to the book library, then try again.'), { kind: 'auth' });
  if (res.status === 429) throw Object.assign(new Error("Today's question limit has been reached."), { kind: 'limit' });
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('json')) throw Object.assign(new Error('Sign in to the book library, then try again.'), { kind: 'auth' });
  const d = await res.json();
  if (!res.ok) throw Object.assign(new Error(d.error || `The AI helper returned ${res.status}.`), { kind: 'http' });
  return { answer: d.answer || d.text || '', sources: (d.sources || []).map(s => ({
    book: s.book || s.book_short || '', bookId: s.book_id || '', page: s.page || s.printed_page || '',
    citation: s.citation || `${s.book || ''}${s.page ? ', p. ' + s.page : ''}`, text: s.text || '' })).filter(s => s.page && s.book) };
}

/* ---------- panel */
function chipsFor(text) {
  const words = text.split(/\s+/).length;
  const short = text.length > 60 ? text.slice(0, 57).replace(/\s+\S*$/, '') + '…' : text;
  return words <= 5
    ? [`What does “${short}” mean here?`, 'Explain this simply', 'Why does it matter here?']
    : ['Explain this simply', 'Define the key terms', 'Give me an example'];
}
function closePanel() {
  if (!panel) return;
  panel.remove(); panel = null;
  document.removeEventListener('keydown', onKey, true);
  document.removeEventListener('pointerdown', onOutside, true);
}
function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); closePanel(); } }
function onOutside(e) {
  if (!panel || panel.contains(e.target) || e.target.closest('.hover-popover, .menu, .ask-fab')) return;
  closePanel();
}
function place(p, info) {
  if (B.isMobile()) { p.classList.add('is-sheet'); return; }
  const W = p.offsetWidth, H = Math.min(p.offsetHeight, window.innerHeight * 0.7), r = info.rect, f = info.first;
  let top = r.bottom + 10;
  if (top + H > window.innerHeight - 10) top = Math.max(10, f.top - H - 10);
  const left = Math.max(10, Math.min(r.left - 40, window.innerWidth - W - 10));
  p.style.left = left + 'px'; p.style.top = top + 'px';
}
function openPanel(info) {
  closePanel();
  const ctx = context(info);
  const where = [ctx.note.lecture, ctx.note.title].filter(Boolean).join(' › ');
  const history = [];
  panel = h(`<div class="ask-panel" role="dialog" aria-label="Ask about the highlighted text">
    <div class="ask-head">
      <span class="ask-badge">${icon('sparkles')}</span>
      <div class="ask-head-text"><div class="ask-title">Ask about this</div><div class="ask-where">${esc(where)}</div></div>
      <button class="clickable-icon ask-close" title="Close">${icon('x')}</button>
    </div>
    <blockquote class="ask-sel">${esc(info.text)}</blockquote>
    <div class="ask-thread"></div>
    <div class="ask-chips">${chipsFor(info.text).map(c => `<button class="ask-chip">${esc(c)}</button>`).join('')}</div>
    <form class="ask-form"><input class="ask-input" type="text" maxlength="400" placeholder="Ask about the highlighted text…" autocomplete="off"><button class="ask-send" type="submit" title="Ask">${icon('arrow-right')}</button></form>
    <div class="ask-foot">AI answer from this note and your textbooks</div>
  </div>`);
  document.body.appendChild(panel);
  place(panel, info);
  B.wireLinks(panel);
  const thread = $('.ask-thread', panel), input = $('.ask-input', panel), chips = $('.ask-chips', panel);
  $('.ask-close', panel).onclick = closePanel;
  let busy = false;
  async function ask(q) {
    q = q.trim(); if (!q || busy) return;
    busy = true; input.value = ''; chips.hidden = true;
    const item = h(`<div class="ask-turn"><div class="ask-q">${esc(q)}</div><div class="ask-a"><span class="books-spinner"></span> Thinking…</div></div>`);
    thread.appendChild(item); item.scrollIntoView({ block: 'nearest' });
    const a = $('.ask-a', item);
    try {
      const r = await explain({ question: q, selection: info.text, ...ctx, history: history.slice(-4) });
      history.push({ q, a: r.answer });
      a.innerHTML = linkTerms(md(r.answer), info.id) + (r.sources.length ? `<div class="ask-sources">${r.sources.slice(0, 4).map((s, i) => `<button class="ask-source" data-i="${i}" title="${esc(s.text.slice(0, 200))}">${icon('book-open')}<span>${esc(s.citation)}</span></button>`).join('')}</div>` : '')
        + `<div class="ask-tools"><button class="clickable-icon" data-copy title="Copy answer">${icon('copy')}</button></div>`;
      $$('.ask-source', a).forEach(b => b.onclick = () => {
        const s = r.sources[+b.dataset.i];
        store.set('bookHighlight', { book: s.book, page: s.page, text: s.text });
        B.go(`book/${s.book}/${s.page}`, null, true);
      });
      $('[data-copy]', a).onclick = async () => { try { await navigator.clipboard.writeText(r.answer); B.toast('Answer copied'); } catch (e) { B.toast('Copy failed'); } };
    } catch (err) {
      a.innerHTML = `<div class="ask-error">${icon(err.kind === 'auth' ? 'lock' : 'alert-triangle')}<span>${esc(err.message)}</span>${err.kind === 'auth' && API ? ` <a href="${esc(API)}" target="_blank" rel="noopener">Sign in</a>` : ''}</div>`;
      if (!history.length) chips.hidden = false;
    }
    busy = false; input.focus();
    item.scrollIntoView({ block: 'nearest' });
  }
  chips.addEventListener('click', e => { const c = e.target.closest('.ask-chip'); if (c) ask(c.textContent); });
  $('.ask-form', panel).addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
  setTimeout(() => {
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onOutside, true);
    if (!B.isMobile()) input.focus({ preventScroll: true });
  }, 0);
}
})();
