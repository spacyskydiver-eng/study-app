/* Nova: Outlook pages. Mail (inbox list + reader + composer) and Calendar (month / agenda / year),
   fed by the Power Automate sync (/api/ms/*). The composer is shared with the assistant: a draft is
   always shown for checking and editing, and only goes out when Send is pressed (/api/ms/send queues
   it; the send flow picks it up within a few minutes). */
(() => {
'use strict';
const B = window.BV;
const { icon, esc, $, $$, h } = B;
const N = window.NovaUI;

const get = async path => { try { const r = await fetch(path, { credentials: 'same-origin', cache: 'no-store' }); const ct = r.headers.get('content-type') || ''; return ct.includes('json') ? await r.json() : null; } catch (e) { return null; } };
const post = async (path, body) => { try { const r = await fetch(path, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const ct = r.headers.get('content-type') || ''; return ct.includes('json') ? await r.json() : { error: 'The site returned ' + r.status + '.' }; } catch (e) { return { error: 'Network error.' }; } };
const tm = iso => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const localDay = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayOf = iso => localDay(new Date(iso));
const shortDate = iso => { const d = new Date(iso), n = new Date(); return localDay(d) === localDay(n) ? tm(iso) : d.getFullYear() === n.getFullYear() ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }); };
const longDate = iso => new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const nameOf = addr => { const a = String(addr || '').split(/[;,]/)[0].trim(); const local = a.split('@')[0] || a; return /^do-not-reply|noreply|no-reply/i.test(local) ? (a.split('@')[1] || a).split('.')[0].replace(/^./, c => c.toUpperCase()) : local.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); };
const MODS = { '4018': '#34D399', '4012': '#A78BFA', '4212': '#A78BFA', '4017': '#FBBF24', '4008': '#FB7185', '4010': '#38BDF8', '4011': '#38BDF8' };
const evColor = s => { const m = String(s || '').match(/BIO-?(\d{4})/i); return (m && MODS[m[1]]) || '#22D3EE'; };

const O = N.outlook = { pending: null, current: {} };

/* ---------------------------------------------------------------- composer (also used by the assistant) */
O.composer = function composer(draft = {}, opts = {}) {
  const el = h(`<form class="ol-compose${opts.inline ? ' is-inline' : ''}" autocomplete="off">
    <div class="ol-compose-head"><span class="nv-kicker">${esc(opts.title || 'Draft')}</span><span class="ol-compose-note">Check it, edit it, then send</span></div>
    <label class="ol-field"><span>To</span><input name="to" type="text" placeholder="name@uea.ac.uk" value="${esc(draft.to || '')}"></label>
    <label class="ol-field"><span>Cc</span><input name="cc" type="text" value="${esc(draft.cc || '')}"></label>
    <label class="ol-field"><span>Subject</span><input name="subject" type="text" value="${esc(draft.subject || '')}"></label>
    <textarea name="body" rows="${opts.inline ? 8 : 12}" placeholder="Write your message">${esc(draft.body || '')}</textarea>
    <div class="ol-compose-bar">
      <button type="submit" class="ol-btn ol-btn-send">${icon('send')}<span>Send</span></button>
      ${opts.onCancel ? `<button type="button" class="ol-btn ol-cancel">Discard</button>` : ''}
      <span class="ol-compose-msg" role="status"></span>
    </div>
  </form>`);
  const msg = $('.ol-compose-msg', el);
  const ta = $('textarea', el);
  const grow = () => { if (opts.inline) { ta.style.height = 'auto'; ta.style.height = Math.min(420, ta.scrollHeight + 4) + 'px'; } };
  ta.addEventListener('input', grow); setTimeout(grow, 0);
  el.value = () => ({ to: el.to.value.trim(), cc: el.cc.value.trim(), subject: el.subject.value.trim(), body: ta.value });
  el.fill = d => { ['to', 'cc', 'subject'].forEach(k => { if (d[k] != null) el[k].value = d[k]; }); if (d.body != null) ta.value = d.body; grow(); };
  if (opts.onCancel) $('.ol-cancel', el).onclick = () => opts.onCancel(el);
  el.addEventListener('submit', async e => {
    e.preventDefault();
    const d = el.value();
    if (!d.to) { msg.textContent = 'Add who it goes to.'; el.to.focus(); return; }
    if (!d.subject || !d.body.trim()) { msg.textContent = 'Add a subject and a message.'; return; }
    const btn = $('.ol-btn-send', el); btn.disabled = true; msg.textContent = 'Sending…';
    const r = await post('/api/ms/send', d);
    if (r && r.queued) {
      el.classList.add('is-sent');
      $$('input, textarea, button', el).forEach(x => { x.disabled = true; });
      msg.innerHTML = `${icon('check')} Sent to Outlook. It leaves your mailbox within a few minutes.`;
      opts.onSent && opts.onSent(d);
    } else { btn.disabled = false; msg.textContent = (r && r.error) || 'Couldn’t send.'; }
  });
  return el;
};
function composeModal(draft, title) {
  const wrap = h(`<div class="ol-modal" role="dialog" aria-label="${esc(title || 'New email')}"><div class="ol-modal-card"><button class="ol-modal-x" title="Close">${icon('x')}</button></div></div>`);
  const close = () => wrap.remove();
  const c = O.composer(draft, { title: title || 'New email', onCancel: close, onSent: () => setTimeout(close, 2200) });
  $('.ol-modal-card', wrap).appendChild(c);
  $('.ol-modal-x', wrap).onclick = close;
  wrap.addEventListener('pointerdown', e => { if (e.target === wrap) close(); });
  document.body.appendChild(wrap);
  setTimeout(() => (draft && draft.to ? c.body : c.to).focus(), 30);
}
O.compose = composeModal;
const quoteOf = m => `\n\n\nFrom: ${m.from}\nSent: ${longDate(m.received)}\nSubject: ${m.subject}\n\n${(m.text || m.preview || '').split('\n').map(l => '> ' + l).join('\n')}`;

/* ---------------------------------------------------------------- mail */
O.openEmail = (id, caption) => {
  if (B.currentId() === 'mail' && O.selectEmail) { O.selectEmail(id, true); return; }
  O.pending = { email: id };
  N.portal ? N.portal({ to: 'mail', caption: caption || '', then: () => B.go('mail') }) : B.go('mail');
};
B.registerView('mail', {
  title: () => 'Mail', icon: 'mail', cls: 'nv-view nv-view-ol',
  show(view) {
    let alive = true, msgs = [], filter = 'all', sel = null, query = '';
    view.innerHTML = `<div class="ol-page ol-mail">
      <header class="ol-head">
        <div><div class="nv-kicker">Outlook</div><h1>Mail <span class="ol-count"><span class="ol-n"></span><small>unread</small></span></h1></div>
        <div class="ol-search">${icon('search')}<input type="search" placeholder="Search mail" autocomplete="off"></div>
        <div class="ol-head-acts"><button class="ol-btn ol-btn-send ol-new">${icon('plus')}<span>New email</span></button></div>
      </header>
      <div class="ol-filters">${[['all', 'All'], ['unread', 'Unread'], ['today', 'Today'], ['blackboard', 'Blackboard']].map(([k, l]) => `<button class="ol-chip${k === 'all' ? ' is-on' : ''}" data-f="${k}">${l}</button>`).join('')}<span class="ol-sync"></span></div>
      <div class="ol-split">
        <div class="ol-list" role="listbox"><div class="ol-empty">Loading…</div></div>
        <article class="ol-reader"><div class="ol-empty ol-reader-empty">${icon('mail')}<span>Pick an email to read it</span></div></article>
      </div>
    </div>`;
    const list = $('.ol-list', view), reader = $('.ol-reader', view), page = $('.ol-mail', view);
    const rays = null, unreadN = N.counter ? N.counter($('.ol-n', view), 0) : null;
    const match = m => {
      if (filter === 'unread' && !m.unread) return false;
      if (filter === 'today' && dayOf(m.received) !== localDay(new Date())) return false;
      if (filter === 'blackboard' && !/blackboard/i.test(m.from)) return false;
      if (filter === 'uea' && !/@([\w-]+\.)*uea\.ac\.uk$/i.test(m.from)) return false;
      if (query) { const hay = (m.subject + ' ' + m.from + ' ' + m.to + ' ' + m.preview).toLowerCase(); return query.split(/\s+/).every(w => hay.includes(w)); }
      return true;
    };
    const renderList = () => {
      const shown = msgs.filter(match);
      let lastDay = '';
      list.innerHTML = shown.length ? shown.map(m => {
        const d = dayOf(m.received), today = localDay(new Date()), yest = localDay(new Date(Date.now() - 864e5));
        const head = d !== lastDay ? `<div class="ol-day">${d === today ? 'Today' : d === yest ? 'Yesterday' : new Date(m.received).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>` : '';
        lastDay = d;
        return `${head}<button class="ol-item${m.unread ? ' is-unread' : ''}${sel === m.id ? ' is-sel' : ''}" data-id="${esc(m.id)}" role="option"><span class="ol-item-top"><b>${esc(nameOf(m.from))}</b><time>${shortDate(m.received)}</time></span><span class="ol-item-sub">${m.attachments ? icon('paperclip') : ''}${esc(m.subject || '(no subject)')}</span><span class="ol-item-pre">${esc((m.preview || '').replace(/\s+/g, ' ').slice(0, 140))}</span></button>`;
      }).join('') : `<div class="ol-empty">${msgs.length ? 'Nothing matches.' : 'No mail synced yet.'}</div>`;
    };
    async function select(id, arrived) {
      sel = id; O.current = { emailId: id };
      $$('.ol-item', list).forEach(b => b.classList.toggle('is-sel', b.dataset.id === id));
      const it = $(`.ol-item[data-id="${CSS.escape(id)}"]`, list); if (it && arrived) { it.scrollIntoView({ block: 'center' }); it.classList.add('is-arrived'); setTimeout(() => it.classList.remove('is-arrived'), 1800); }
      page.classList.add('has-sel');
      reader.innerHTML = '<div class="ol-empty">Opening…</div>';
      const r = await get('/api/ms/mail?id=' + encodeURIComponent(id));
      if (!alive || sel !== id) return;
      const m = r && r.message;
      if (!m) { reader.innerHTML = '<div class="ol-empty">That email isn’t stored any more.</div>'; return; }
      const html = m.html && /<[a-z][^>]*>/i.test(m.html);
      reader.innerHTML = `<div class="ol-read-head">
          <button class="ol-back" title="Back to the list">${icon('arrow-left')}</button>
          <h2>${esc(m.subject || '(no subject)')}</h2>
          <div class="ol-read-meta"><span class="ol-avatar">${esc(nameOf(m.from).slice(0, 1))}</span><div><b>${esc(nameOf(m.from))}</b> <small>&lt;${esc(m.from)}&gt;</small><small>To ${esc(m.to || 'you')}${m.cc ? ' · Cc ' + esc(m.cc) : ''}</small></div><time>${longDate(m.received)}</time></div>
          <div class="ol-read-acts">
            <button class="ol-btn" data-act="reply">${icon('reply')}<span>Reply</span></button>
            <button class="ol-btn" data-act="replyall">${icon('reply')}<span>Reply all</span></button>
            ${html ? `<button class="ol-btn ol-icon" data-act="mode" title="Plain text">${icon('file')}</button>` : ''}
            <a class="ol-btn ol-icon" href="https://outlook.office.com/mail/" target="_blank" rel="noopener" title="Open in Outlook">${icon('external')}</a>
          </div>
        </div>
        <div class="ol-read-body"></div>
        <div class="ol-read-compose"></div>`;
      const body = $('.ol-read-body', reader);
      let asHtml = !!html;
      const paint = () => {
        if (asHtml) {
          const fr = document.createElement('iframe');
          fr.className = 'ol-frame'; fr.setAttribute('sandbox', 'allow-popups allow-popups-to-escape-sandbox'); fr.setAttribute('referrerpolicy', 'no-referrer'); fr.title = 'Email';
          fr.srcdoc = `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; font-src https: data:"><base target="_blank"><style>html{background:#fff}body{margin:18px 20px;font:14.5px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Calibri,Arial,sans-serif;color:#1d1f2b;word-wrap:break-word}img{max-width:100%;height:auto}table{max-width:100%}a{color:#5b3fd6}</style>${m.html}`;
          body.replaceChildren(fr);
        } else body.innerHTML = `<div class="ol-text">${esc(m.text || m.preview || '').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')}</div>`;
      };
      paint();
      const mine = /a\.taylor12@uea\.ac\.uk/i;
      reader.onclick = e => {
        if (e.target.closest('.ol-back')) { page.classList.remove('has-sel'); return; }
        const b = e.target.closest('[data-act]'); if (!b) return;
        const act = b.dataset.act;
        if (act === 'mode') { asHtml = !asHtml; b.title = asHtml ? 'Plain text' : 'Formatted'; paint(); return; }
        const all = act === 'replyall';
        const cc = all ? [m.to, m.cc].join(';').split(/[;,]/).map(s => s.trim()).filter(s => s && !mine.test(s) && s.toLowerCase() !== m.from.toLowerCase()).join('; ') : '';
        const slot = $('.ol-read-compose', reader);
        slot.replaceChildren(O.composer({ to: /do-not-reply|noreply|no-reply/i.test(m.from) ? '' : m.from, cc, subject: /^re:/i.test(m.subject) ? m.subject : 'Re: ' + m.subject, body: quoteOf(m) }, { title: all ? 'Reply all' : 'Reply', inline: true, onCancel: () => slot.replaceChildren() }));
        slot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const ta = $('textarea', slot); ta.focus(); ta.setSelectionRange(0, 0);
      };
    }
    O.selectEmail = select;
    list.onclick = e => { const b = e.target.closest('.ol-item'); if (b) select(b.dataset.id); };
    $('.ol-filters', view).onclick = e => { const c = e.target.closest('[data-f]'); if (!c) return; filter = c.dataset.f; $$('.ol-chip', view).forEach(x => x.classList.toggle('is-on', x === c)); renderList(); };
    $('.ol-search input', view).oninput = e => { query = e.target.value.trim().toLowerCase(); renderList(); };
    $('.ol-new', view).onclick = () => composeModal({}, 'New email');
    (async () => {
      const [st, r] = await Promise.all([get('/api/ms/status'), get('/api/ms/mail?limit=400')]);
      if (!alive) return;
      if (st && st.lastSync) $('.ol-sync', view).textContent = 'Synced ' + new Date(st.lastSync).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      msgs = (r && r.messages) || [];
      if (unreadN) unreadN.set(msgs.filter(m => m.unread).length);
      renderList();
      const want = O.pending && O.pending.email; O.pending = null;
      if (want) select(want, true);
      else if (!B.isMobile() && msgs[0]) select(msgs[0].id);
    })();
    return () => { alive = false; O.selectEmail = null; O.current = {}; rays && rays.destroy(); };
  },
});

/* ---------------------------------------------------------------- calendar */
O.openEvent = (id, start, caption) => {
  const p = { event: id || null, day: start ? dayOf(start) : null };
  if (B.currentId() === 'calendar' && O.focusEvent) { O.focusEvent(p); return; }
  O.pending = p;
  N.portal ? N.portal({ to: 'calendar', caption: caption || '', then: () => B.go('calendar') }) : B.go('calendar');
};
O.counts = async () => {
  const [m, c] = await Promise.all([get('/api/ms/mail?limit=120'), get('/api/ms/calendar?days=1')]);
  const today = localDay(new Date());
  return { unread: ((m && m.messages) || []).filter(x => x.unread).length, today: ((c && c.events) || []).filter(e => dayOf(e.start) === today).length };
};
// a soft SideRays wash behind the page header (follows the pointer a little)
function ambient(page) {
  if (!N.sideRays || !page) return null;
  const host = h('<div class="ol-rays" aria-hidden="true"></div>'); page.prepend(host);
  return N.sideRays(host, { rayColor1: '#A78BFA', rayColor2: '#67E8F9', origin: 'top-right', intensity: 1.9, spread: 2.4, density: 5, speed: 1, glow: 1, opacity: 0.9, mouseInfluence: 0.35, maxRatio: 1, budget: 4.5e5 });
}
B.registerView('calendar', {
  title: () => 'Calendar', icon: 'calendar', cls: 'nv-view nv-view-ol',
  show(view) {
    let alive = true, evs = [], byDay = new Map(), mode = B.isMobile() ? 'agenda' : 'month';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let cursor = new Date(today.getFullYear(), today.getMonth(), 1), selDay = localDay(today), selEv = null;
    view.innerHTML = `<div class="ol-page ol-cal">
      <header class="ol-head">
        <div><div class="nv-kicker">Outlook</div><h1 class="ol-cal-title">Calendar</h1></div>
        <div class="ol-cal-nav"><button class="ol-btn ol-icon" data-nav="-1" title="Previous">${icon('chevron-left')}</button><button class="ol-btn" data-nav="0">Today</button><button class="ol-btn ol-icon" data-nav="1" title="Next">${icon('chevron-right')}</button></div>
        <div class="ol-seg">${['month', 'agenda', 'year'].map(m => `<button data-mode="${m}"${m === mode ? ' class="is-on"' : ''}>${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}</div>
      </header>
      <div class="ol-cal-split"><div class="ol-cal-main"><div class="ol-empty">Loading…</div></div><aside class="ol-cal-side"></aside></div>
    </div>`;
    const main = $('.ol-cal-main', view), side = $('.ol-cal-side', view), title = $('.ol-cal-title', view);
    const rays = null, monthN = null;
    const countMonth = () => { if (!monthN) return; const y = cursor.getFullYear(), m = cursor.getMonth(); monthN.set(evs.filter(e => { const d = new Date(e.start); return d.getFullYear() === y && d.getMonth() === m; }).length); $('.ol-n-label', view).textContent = mode === 'year' ? 'events this month' : 'events in ' + cursor.toLocaleDateString('en-GB', { month: 'long' }); };
    const evLine = e => `<button class="ol-ev" data-ev="${esc(e.id)}" style="--ev:${evColor(e.subject)}"><time>${e.allDay ? 'All day' : tm(e.start)}</time><b>${esc(e.subject || '(no title)')}</b></button>`;
    function renderMonth() {
      title.textContent = cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      const first = new Date(cursor); const lead = (first.getDay() + 6) % 7;
      const start = new Date(first); start.setDate(1 - lead);
      const cells = [];
      for (let i = 0; i < 42; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i);
        const k = localDay(d), list = byDay.get(k) || [];
        if (i === 35 && d.getMonth() !== cursor.getMonth()) break;
        cells.push(`<div class="ol-cell${d.getMonth() !== cursor.getMonth() ? ' is-out' : ''}${k === localDay(today) ? ' is-today' : ''}${k === selDay ? ' is-sel' : ''}" data-day="${k}"><span class="ol-cell-n">${d.getDate()}</span>${list.slice(0, 3).map(e => `<span class="ol-pill" style="--ev:${evColor(e.subject)}" title="${esc(e.subject)}">${e.allDay ? '' : `<i>${tm(e.start)}</i>`}${esc(e.subject.replace(/^BIO-(\d{4}\w?)(\/BIO-\d{4}\w?)?\s*/, '$1 ').replace(/\s*-\s*Group \d+$/, '') || e.subject)}</span>`).join('')}${list.length > 3 ? `<span class="ol-more">+${list.length - 3} more</span>` : ''}</div>`);
      }
      main.innerHTML = `<div class="ol-month"><div class="ol-dow">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<span>${d}</span>`).join('')}</div><div class="ol-grid">${cells.join('')}</div></div>`;
    }
    function renderAgenda() {
      const from = mode === 'agenda' ? new Date(cursor.getFullYear(), cursor.getMonth(), 1) : cursor;
      title.textContent = from.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) + ' onwards';
      const startK = localDay(from.getMonth() === today.getMonth() && from.getFullYear() === today.getFullYear() ? today : from);
      const days = [...byDay.keys()].filter(k => k >= startK).sort().slice(0, 45);
      main.innerHTML = days.length ? `<div class="ol-agenda">${days.map(k => { const d = new Date(k + 'T12:00:00'); return `<section class="ol-ag-day${k === localDay(today) ? ' is-today' : ''}" data-day="${k}"><h3><b>${d.toLocaleDateString('en-GB', { weekday: 'short' })}</b>${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'short' })}</h3><div>${byDay.get(k).map(e => `<button class="ol-ag-ev" data-ev="${esc(e.id)}" style="--ev:${evColor(e.subject)}"><time>${e.allDay ? 'All day' : tm(e.start) + '–' + tm(e.end)}</time><b>${esc(e.subject)}</b>${e.location ? `<small>${esc(e.location)}</small>` : ''}</button>`).join('')}</div></section>`; }).join('')}</div>` : '<div class="ol-empty">Nothing coming up in your synced calendar.</div>';
    }
    function renderYear() {
      const y = cursor.getFullYear();
      // an academic year view: September to August
      const startY = cursor.getMonth() >= 8 ? y : y - 1;
      title.textContent = `${startY}/${String(startY + 1).slice(2)}`;
      const months = [];
      for (let i = 0; i < 12; i++) {
        const m = new Date(startY, 8 + i, 1), lead = (m.getDay() + 6) % 7, n = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
        let cells = '<i></i>'.repeat(lead);
        for (let d = 1; d <= n; d++) { const k = localDay(new Date(m.getFullYear(), m.getMonth(), d)), c = (byDay.get(k) || []).length; cells += `<button data-day="${k}" class="${k === localDay(today) ? 'is-today ' : ''}${c ? 'l' + Math.min(4, c) : ''}" title="${c ? c + ' event' + (c > 1 ? 's' : '') : ''}">${d}</button>`; }
        months.push(`<div class="ol-ym"><b data-month="${m.getFullYear()}-${m.getMonth()}">${m.toLocaleDateString('en-GB', { month: 'long' })} <small>${m.getFullYear()}</small></b><div class="ol-ym-dow">${'MTWTFSS'.split('').map(x => `<span>${x}</span>`).join('')}</div><div class="ol-ym-grid">${cells}</div></div>`);
      }
      main.innerHTML = `<div class="ol-year">${months.join('')}</div>`;
    }
    async function renderSide() {
      const list = byDay.get(selDay) || [];
      const d = new Date(selDay + 'T12:00:00');
      side.innerHTML = `<div class="ol-side-head"><div class="nv-kicker">${selDay === localDay(today) ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'long' })}</div><h2>${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</h2></div>
        ${list.length ? `<div class="ol-side-list">${list.map(evLine).join('')}</div>` : '<div class="ol-empty">Nothing on this day.</div>'}<div class="ol-ev-detail"></div>`;
      if (selEv && list.some(e => e.id === selEv)) showEvent(selEv);
    }
    async function showEvent(id) {
      selEv = id;
      if (arrive) { arrive = false; $$(`[data-ev="${CSS.escape(id)}"]`, view).forEach(b => { b.classList.add('is-arrived'); setTimeout(() => b.classList.remove('is-arrived'), 1800); }); }
      $$('.ol-ev', side).forEach(b => b.classList.toggle('is-sel', b.dataset.ev === id));
      const slot = $('.ol-ev-detail', side); if (!slot) return;
      const base = evs.find(e => e.id === id);
      slot.innerHTML = base ? `<div class="ol-evd" style="--ev:${evColor(base.subject)}"><h3>${esc(base.subject)}</h3><p class="ol-evd-when">${icon('clock')}${base.allDay ? 'All day' : `${new Date(base.start).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ${tm(base.start)}–${tm(base.end)}`}</p>${base.location ? `<p>${icon('map-pin')}${esc(base.location)}</p>` : ''}<div class="ol-evd-desc">Loading details…</div></div>` : '';
      const r = await get('/api/ms/calendar?id=' + encodeURIComponent(id));
      if (!alive || selEv !== id) return;
      const e = r && r.event, desc = $('.ol-evd-desc', slot); if (!desc) return;
      desc.innerHTML = e ? `${e.organizer ? `<p class="ol-evd-org">Organiser: ${esc(e.organizer)}</p>` : ''}${e.description ? `<div class="ol-text">${esc(e.description)}</div>` : '<p class="ol-faint">No description.</p>'}<p class="ol-evd-acts">${e.link ? `<a class="ol-btn" href="${esc(e.link)}" target="_blank" rel="noopener">${icon('external')}<span>Outlook</span></a>` : ''}</p>` : '<p class="ol-faint">Details unavailable.</p>';
    }
    const render = () => { (mode === 'month' ? renderMonth : mode === 'agenda' ? renderAgenda : renderYear)(); countMonth(); $$('.ol-seg button', view).forEach(b => b.classList.toggle('is-on', b.dataset.mode === mode)); };
    let arrive = false;
    O.focusEvent = p => { arrive = !!p.event; if (p.day) { selDay = p.day; const d = new Date(p.day + 'T12:00:00'); cursor = new Date(d.getFullYear(), d.getMonth(), 1); } selEv = p.event || null; if (mode === 'year') mode = 'month'; render(); renderSide(); };
    view.onclick = e => {
      const nav = e.target.closest('[data-nav]');
      if (nav) {
        const n = +nav.dataset.nav;
        if (!n) { cursor = new Date(today.getFullYear(), today.getMonth(), 1); selDay = localDay(today); renderSide(); }
        else cursor = mode === 'year' ? new Date(cursor.getFullYear() + n, cursor.getMonth(), 1) : new Date(cursor.getFullYear(), cursor.getMonth() + n, 1);
        render(); return;
      }
      const md = e.target.closest('[data-mode]'); if (md) { mode = md.dataset.mode; render(); return; }
      const mh = e.target.closest('[data-month]'); if (mh) { const [y, m] = mh.dataset.month.split('-').map(Number); cursor = new Date(y, m, 1); mode = 'month'; render(); return; }
      const ev = e.target.closest('[data-ev]'); if (ev) { const base = evs.find(x => x.id === ev.dataset.ev); if (base && dayOf(base.start) !== selDay) { selDay = dayOf(base.start); render(); renderSide().then(() => showEvent(base.id)); } else showEvent(ev.dataset.ev); return; }
      const dy = e.target.closest('[data-day]');
      if (dy) { selDay = dy.dataset.day; selEv = null; if (mode === 'year') { const d = new Date(selDay + 'T12:00:00'); cursor = new Date(d.getFullYear(), d.getMonth(), 1); mode = 'month'; } render(); renderSide(); }
    };
    (async () => {
      const from = new Date(today); from.setMonth(from.getMonth() - 14); const to = new Date(today); to.setMonth(to.getMonth() + 14);
      const r = await get(`/api/ms/calendar?from=${from.toISOString()}&to=${to.toISOString()}`);
      if (!alive) return;
      evs = (r && r.events) || [];
      byDay = new Map();
      for (const e of evs) {
        // multi-day events (all-day ranges) show on each day they cover
        const s = new Date(e.start), en = new Date(e.end);
        const d = new Date(s); d.setHours(0, 0, 0, 0);
        do { const k = localDay(d); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(e); d.setDate(d.getDate() + 1); } while (e.allDay ? d < en : d < en && d.getTime() < new Date(en).setHours(0, 0, 0, 0));
      }
      for (const l of byDay.values()) l.sort((a, b) => (b.allDay - a.allDay) || a.start.localeCompare(b.start));
      const want = O.pending && (O.pending.event || O.pending.day) ? O.pending : null; O.pending = null;
      if (want) O.focusEvent(want); else { render(); renderSide(); }
    })();
    return () => { alive = false; O.focusEvent = null; rays && rays.destroy(); };
  },
});
})();
