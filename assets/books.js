/* Book library: search the private textbook engine from the site, and open the book page behind any quote.
   The engine lives on its own (Cloudflare Access protected) subdomain. Its address comes from
   site.config.json -> data/vault.json "config.books". All requests send the Access cookie. */
(() => {
'use strict';
const B = window.BV;
const { icon, esc, $, $$, h, store } = B;
let C = { api: '', reader: '', ids: {}, label: 'Book library' };

B.onBoot(V => {
  const c = ((V.config || {}).books) || {};
  C = { api: String(c.api || '').replace(/\/+$/, ''), reader: c.reader || '', ids: c.ids || {}, label: c.label || 'Book library', books: c.books || [] };
});

/* ---------- engine adapter. Field names are read loosely so small API differences don't break the view. */
const bookId = short => C.ids[short] || String(short || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const shortName = id => { for (const [k, v] of Object.entries(C.ids)) if (v === id) return k; return id; };
class EngineError extends Error { constructor(kind, msg) { super(msg || kind); this.kind = kind; } }
async function call(path) {
  if (!C.api) throw new EngineError('unset');
  let res;
  try { res = await fetch(C.api + path, { credentials: 'include', mode: 'cors', headers: { Accept: 'application/json' } }); }
  catch (e) { throw new EngineError('auth', 'The book library did not answer. Sign in to it, then try again.'); }
  if (res.status === 401 || res.status === 403 || res.type === 'opaqueredirect') throw new EngineError('auth', 'Sign in to the book library, then try again.');
  if (!res.ok) throw new EngineError('http', `The book library returned ${res.status}.`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('json')) throw new EngineError('auth', 'Sign in to the book library, then try again.');
  return res.json();
}
// Our engine's /search rows carry `kind` (not `type`), no book name or book id (there's only
// one book right now), and `figure_refs` as bare figure numbers like "1-2", not URLs — so those
// get turned into fetchable /figure/<id> addresses here rather than in the engine.
function parseBookIdFromRowId(id) {
  const core = String(id || '').replace(/^fig:/, '');
  const m = core.match(/^([a-z0-9]+?)(?::|_fig)/);
  return m ? m[1] : '';
}
function normResult(r) {
  const kind = r.type || r.kind || (r.figure_number ? 'figure' : 'text');
  const parsedBookId = parseBookIdFromRowId(r.id);
  const book = r.book_short || r.short_name || r.book_name || r.book || (parsedBookId && shortName(parsedBookId)) || '';
  const bid = r.book_id || r.bookId || parsedBookId || bookId(book);
  const figSources = r.figures || (
    kind === 'figure'
      ? [{ id: String(r.id || '').replace(/^fig:/, '') }]
      : (r.figure_refs || []).map(ref => ({ id: `${bid}_fig${ref}`, number: ref }))
  );
  const figs = figSources.map(f => typeof f === 'string' ? { url: f } : {
    url: f.thumb || f.thumb_url || f.thumbnail || f.url || f.image_url || f.signed_url || f.id || '',
    full: f.url || f.image_url || f.signed_url || f.thumb || f.id || '',
    label: f.number || f.figure || f.figure_number || f.label || '', caption: f.caption || '',
  }).filter(f => f.url).map(f => ({ ...f, url: `${C.api}/figure/${f.url}`, full: `${C.api}/figure/${f.full || f.url.split('/figure/').pop()}` }));
  return {
    id: r.id || r.chunk_id || '',
    type: kind,
    text: r.highlight || r.highlighted || r.snippet || r.text || r.caption || '',
    plain: r.text || r.caption || '',
    book, bookId: bid,
    page: r.page || r.printed_page || r.page_printed || r.pageNumber || '',
    chapter: r.chapter_title || r.chapter || '', section: r.section_title || r.section || '',
    figure: r.figure_number || '', figures: figs,
  };
}
function normPage(d) {
  const img = d.url || d.image_url || d.signed_url || d.image || (d.page && (d.page.url || d.page.image_url)) || '';
  const chunks = (d.chunks || d.paragraphs || []).map(c => typeof c === 'string' ? c : (c.text || ''));
  return { img, chunks, page: d.printed_page || d.page_number || d.page, pages: d.page_count || d.pages || null };
}
// keep only <mark>/<b>/<em> from engine highlights, escape the rest
function safeHl(s, q) {
  let out = esc(s).replace(/&lt;(\/?)(mark|b|em|strong)&gt;/g, '<$1$2>').replace(/\*\*(.+?)\*\*/g, '<mark>$1</mark>');
  if (!/<mark>|<b>|<strong>/.test(out) && q) {
    const terms = q.split(/\s+/).filter(w => w.length > 2).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (terms.length) out = out.replace(new RegExp('(' + terms.join('|') + ')', 'gi'), '<mark>$1</mark>');
  }
  return out.replace(/<(\/?)(b|strong)>/g, '<$1mark>');
}
const readerUrl = (book, page) => C.reader ? C.reader.replace('{api}', C.api).replace('{book}', encodeURIComponent(bookId(book))).replace('{page}', encodeURIComponent(page)) : '';
const quoteCallout = (book, page, text) => `> [!quote] ${book}, p. ${page}\n> ${String(text).replace(/\s+/g, ' ').trim()}`;
async function copy(text, msg) { try { await navigator.clipboard.writeText(text); B.toast(msg || 'Copied'); } catch (e) { B.toast('Copy failed'); } }

function authPanel(err, retry) {
  const unset = err.kind === 'unset';
  const p = h(`<div class="books-auth">
    <div class="books-auth-icon">${icon(unset ? 'alert-triangle' : 'lock')}</div>
    <div class="books-auth-title">${unset ? 'Book library not connected' : 'Book library locked'}</div>
    <div class="books-auth-text">${esc(unset ? 'No book library address is set for this site.' : err.message)}</div>
    ${unset ? '' : `<div class="books-auth-actions"><a class="mod-cta" href="${esc(C.api)}" target="_blank" rel="noopener">${icon('link-out')} Sign in</a><button class="mod-muted" data-retry>${icon('rotate')} Try again</button></div>`}
  </div>`);
  const r = $('[data-retry]', p); if (r) r.onclick = retry;
  return p;
}

/* ---------- search view */
B.registerView('books', {
  title: () => C.label, icon: 'library', cls: 'books-host',
  show(view) {
    const q0 = store.get('bookQuery', '');
    view.innerHTML = `<div class="books-view">
      <div class="books-head">
        <div class="books-kicker">${icon('library')} ${esc(C.label)}</div>
        <div class="books-search"><span class="books-search-icon">${icon('search')}</span><input type="search" placeholder="Search the textbooks" value="${esc(q0)}" autocomplete="off"><button class="books-go mod-cta">Search</button></div>
        <div class="books-filters"><div class="segmented small"><button data-type="all" class="is-active">All</button><button data-type="text">Text</button><button data-type="figure">Figures</button></div>
          ${C.books.length ? `<select class="books-book"><option value="">All books</option>${C.books.map(b => `<option value="${esc(b.id || bookId(b.short))}">${esc(b.short || b.title)}</option>`).join('')}</select>` : ''}
          ${C.api ? `<a class="books-open-reader" href="${esc(C.api)}" target="_blank" rel="noopener">${icon('link-out')} Open the reader</a>` : ''}</div>
      </div>
      <div class="books-status"></div>
      <div class="books-results"></div>
    </div>`;
    const input = $('input', view), results = $('.books-results', view), status = $('.books-status', view);
    let type = 'all', seq = 0;
    const run = async () => {
      const q = input.value.trim(); store.set('bookQuery', q);
      if (!q) { results.innerHTML = ''; status.textContent = ''; return; }
      const my = ++seq;
      status.innerHTML = `<span class="books-spinner"></span> Searching…`; results.classList.add('is-loading');
      const book = ($('.books-book', view) || {}).value || '';
      try {
        const d = await call(`/search?q=${encodeURIComponent(q)}&type=${type}&limit=30${book ? '&book=' + encodeURIComponent(book) : ''}`);
        if (my !== seq) return;
        const list = (Array.isArray(d) ? d : (d.results || d.hits || d.items || [])).map(normResult);
        status.textContent = `${list.length} result${list.length === 1 ? '' : 's'}` + (d.took_ms ? ` · ${d.took_ms} ms` : '');
        results.innerHTML = list.map((r, i) => `<div class="book-hit" data-i="${i}">
          <div class="book-hit-cite">${icon(r.type === 'figure' ? 'image' : 'book-open')}<span>${esc(r.book)}${r.page ? `, p. ${esc(r.page)}` : ''}</span>${r.chapter ? `<span class="book-hit-ch">${esc(r.chapter)}${r.section ? ' › ' + esc(r.section) : ''}</span>` : ''}</div>
          <div class="book-hit-text">${safeHl(r.text, q)}</div>
          ${r.figures.length ? `<div class="book-hit-figs">${r.figures.slice(0, 4).map(f => `<figure data-full="${esc(f.full || f.url)}"><img src="${esc(f.url)}" alt="" loading="lazy"><figcaption>${esc(f.label ? 'Figure ' + f.label : '')}</figcaption></figure>`).join('')}</div>` : ''}
          <div class="book-hit-actions">
            ${r.page ? `<button data-a="page">${icon('book-open')} Open page</button>` : ''}
            <button data-a="copy">${icon('copy')} Copy as quote</button>
            <button data-a="notes">${icon('search')} Find in notes</button>
          </div></div>`).join('') || '<div class="pane-empty">Nothing in the books matches that.</div>';
        results.onclick = e => {
          const hit = e.target.closest('.book-hit'); if (!hit) return; const r = list[+hit.dataset.i];
          const fig = e.target.closest('figure[data-full]'); if (fig) { const lb = h(`<div class="lightbox"><img src="${esc(fig.dataset.full)}" alt=""></div>`); lb.onclick = () => lb.remove(); document.body.appendChild(lb); return; }
          const a = e.target.closest('[data-a]'); if (!a) return;
          if (a.dataset.a === 'page') { store.set('bookHighlight', { book: r.book, page: String(r.page), text: r.plain }); B.go(`book/${r.book}/${r.page}`, null, e.ctrlKey || e.metaKey); }
          else if (a.dataset.a === 'copy') copy(quoteCallout(r.book, r.page, r.plain), 'Quote copied');
          else if (a.dataset.a === 'notes') { const s = $('#search'); document.querySelector('[data-act="pane-search"]').click(); setTimeout(() => { s.value = r.plain.split(/\s+/).slice(0, 6).join(' '); s.dispatchEvent(new Event('input')); }, 50); }
        };
      } catch (err) {
        if (my !== seq) return;
        status.textContent = ''; results.innerHTML = ''; results.appendChild(err.kind ? authPanel(err, run) : h(`<div class="pane-empty">${esc(err.message)}</div>`));
      } finally { results.classList.remove('is-loading'); }
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
    $('.books-go', view).onclick = run;
    $('.books-filters', view).addEventListener('click', e => { const b = e.target.closest('[data-type]'); if (!b) return; type = b.dataset.type; $$('[data-type]', view).forEach(x => x.classList.toggle('is-active', x === b)); run(); });
    const sel = $('.books-book', view); if (sel) sel.onchange = run;
    if (!C.api) results.appendChild(authPanel(new EngineError('unset'), run));
    else if (q0) run();
    setTimeout(() => input.focus(), 30);
  },
});

/* ---------- page view: book/<short name>/<printed page> */
B.registerView('book', {
  prefix: 'book/', icon: 'book-open', cls: 'books-host',
  title: id => { const [, b, p] = id.split('/'); return `${b} · p. ${p}`; },
  show(view, id) {
    const [, book, pageStr] = id.split('/'); const page = parseInt(pageStr, 10);
    const hl = store.get('bookHighlight', null);
    const quote = hl && hl.book === book && String(hl.page) === String(page) ? hl.text : '';
    view.innerHTML = `<div class="book-page-view">
      <div class="book-page-bar">
        <button class="clickable-icon" data-nav="-1" title="Previous page">${icon('chevron-left')}</button>
        <div class="book-page-title">${esc(book)} <span>p. ${page}</span></div>
        <button class="clickable-icon" data-nav="1" title="Next page">${icon('chevron-right')}</button>
        <div class="spacer"></div>
        ${readerUrl(book, page) ? `<a class="clickable-icon" href="${esc(readerUrl(book, page))}" target="_blank" rel="noopener" title="Open in the book reader">${icon('link-out')}</a>` : ''}
      </div>
      ${quote ? `<div class="book-page-quote">${icon('quote')}<div>${esc(quote)}</div></div>` : ''}
      <div class="book-page-body"><div class="book-page-loading"><span class="books-spinner"></span> Loading page…</div></div>
    </div>`;
    $('.book-page-bar', view).addEventListener('click', e => { const b = e.target.closest('[data-nav]'); if (!b) return; store.set('bookHighlight', null); B.go(`book/${book}/${page + +b.dataset.nav}`); });
    const body = $('.book-page-body', view);
    const load = async () => {
      body.innerHTML = `<div class="book-page-loading"><span class="books-spinner"></span> Loading page…</div>`;
      try {
        const d = normPage(await call(`/page/${encodeURIComponent(bookId(book))}/${page}`));
        const norm = s => s.replace(/\s+/g, ' ').trim();
        const q = quote ? norm(quote) : '';
        const paras = d.chunks.map(c => {
          const t = norm(c);
          if (q && t.includes(q)) { const i = t.indexOf(q); return `<p class="is-match">${esc(t.slice(0, i))}<mark>${esc(q)}</mark>${esc(t.slice(i + q.length))}</p>`; }
          return `<p>${esc(t)}</p>`;
        }).join('');
        body.innerHTML = `${d.img ? `<div class="book-page-image"><img src="${esc(d.img)}" alt="${esc(book)} page ${page}"></div>` : ''}${paras ? `<div class="book-page-text">${paras}</div>` : ''}` || '<div class="pane-empty">This page has no content.</div>';
        const img = $('.book-page-image img', body); if (img) img.onclick = () => { const lb = h(`<div class="lightbox"><img src="${esc(img.src)}" alt=""></div>`); lb.onclick = () => lb.remove(); document.body.appendChild(lb); };
        const m = $('.is-match', body); if (m) setTimeout(() => m.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
      } catch (err) { body.innerHTML = ''; body.appendChild(err.kind ? authPanel(err, load) : h(`<div class="pane-empty">${esc(err.message)}</div>`)); }
    };
    load();
  },
});

/* ---------- quotes and figures in notes: click to open the source page */
const SRC = /([A-Z][A-Za-z.'’&-]*(?: [A-Za-z.'’&-]+)*? \d+(?:e|th|st|nd|rd)?),\s*p\.\s*(\d+)/;
B.onHydrate(root => {
  $$('.callout[data-callout="quote"], .callout[data-callout="figure"]', root).forEach(c => {
    const title = $(':scope > .callout-title .callout-title-inner', c); if (!title) return;
    const m = title.textContent.match(SRC); if (!m) return;
    const book = m[1].trim(), page = m[2];
    c.classList.add('has-book-source');
    const btn = h(`<button class="callout-source-btn" title="Open ${esc(book)}, p. ${page}">${icon('book-open')}<span>p. ${page}</span></button>`);
    $(':scope > .callout-title', c).appendChild(btn);
    const text = () => { const body = $(':scope > .callout-content', c); return body ? body.textContent.replace(/\s+/g, ' ').trim() : ''; };
    const menu = anchor => {
      const items = [
        { icon: 'book-open', title: `Open ${book}, p. ${page}`, run: () => { store.set('bookHighlight', { book, page, text: c.dataset.callout === 'quote' ? text() : '' }); B.go(`book/${book}/${page}`, null, false); } },
        { icon: 'link-out', title: 'Open in a new tab', run: () => { store.set('bookHighlight', { book, page, text: c.dataset.callout === 'quote' ? text() : '' }); B.go(`book/${book}/${page}`, null, true); } },
        { icon: 'search', title: 'Find in the books', run: () => { store.set('bookQuery', (c.dataset.callout === 'quote' ? text() : title.textContent.replace(SRC, '')).split(/\s+/).slice(0, 10).join(' ')); B.go('books'); } },
        '-',
        { icon: 'copy', title: 'Copy citation', run: () => copy(`${book}, p. ${page}`, 'Citation copied') },
      ];
      if (c.dataset.callout === 'quote') items.push({ icon: 'quote', title: 'Copy as quote callout', run: () => copy(quoteCallout(book, page, text()), 'Quote copied') });
      if (readerUrl(book, page)) items.push({ icon: 'link-out', title: 'Open in the book reader', run: () => window.open(readerUrl(book, page), '_blank', 'noopener') });
      B.showMenu(anchor, items);
    };
    btn.addEventListener('click', e => { e.stopPropagation(); menu(btn); });
    if (c.dataset.callout === 'quote') c.addEventListener('click', e => {
      if (e.target.closest('a,button')) return;
      const sel = window.getSelection(); if (sel && String(sel).length > 2) return;
      menu({ x: e.clientX, y: e.clientY });
    });
  });
});
})();
