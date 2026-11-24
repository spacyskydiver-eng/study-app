/* Exam practice: exam-style papers answered in full, then auto-marked against a mark scheme.
   Papers come from data/exams.json (content/exams, built by tools/curate.py).
   Drafts, marks and history are kept in this browser and, when signed in on the Flashcards page,
   travel with the flashcard progress so they show on every device (see examSync below). */
(() => {
'use strict';
const B = window.BV;
const { icon, esc, $, $$, store } = B;
let X = null;
const byId = new Map();

async function load() {
  if (X) return X;
  const res = await fetch('data/exams.json', { cache: 'no-cache' });
  X = await res.json();
  for (const s of X.subjects) for (const p of s.papers) { p.subject = s.subject; p.module = s.module; byId.set(p.id, p); }
  return X;
}
const draftKey = id => 'exam:draft:' + id;
const hist = () => store.get('exam:history', {});
const changed = () => document.dispatchEvent(new Event('bv:exam-changed'));
let listView = null;
let ink = null;   // the handwriting layer on the open paper
const inkOff = () => { if (ink) { ink.detach(); ink = null; } };
const inkOn = (view, strokes, save) => { inkOff(); focusOn(); if (window.BVInk) ink = window.BVInk.attach(view, $('.exam-wrap', view), { strokes, save }); };
// a paper gets the whole screen: both side panels fold away while it is open and come back after
let focus = null;
function focusOn() { if (focus || !B.sides || B.isPhone()) return; focus = B.sides(); B.setSide('left', false); B.setSide('right', false); }
function focusOff() { if (!focus) return; const f = focus; focus = null; B.setSide('left', f.left); B.setSide('right', f.right); }
window.addEventListener('hashchange', () => { if (!decodeURIComponent(location.hash).includes('exam/')) { inkOff(); focusOff(); } });   // the papers list, if it is the view on screen (redrawn when another device's results arrive)

/* ------------------------------------------------------------ cross-device sync
   flashcards.js keeps a copy of all exam data in the signed-in progress blob. Nothing is ever dropped:
   attempts are merged by their time, an edited mark (ed) beats an older one, the newest draft wins,
   and a draft older than a submitted attempt is finished, so it goes. */
function snapshot() {
  const out = { history: hist(), last: {}, drafts: {}, ink: {} };
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      let m;
      if ((m = k.match(/^bv:exam:last:(.+)$/))) { const v = store.get('exam:last:' + m[1], null); if (v) out.last[m[1]] = v; }
      else if ((m = k.match(/^bv:exam:draft:(.+)$/))) { const v = store.get(draftKey(m[1]), null); if (v) out.drafts[m[1]] = { t: store.get('exam:draftAt:' + m[1], 0), a: v }; }
      else if ((m = k.match(/^bv:exam:ink:(.+)$/))) { const v = store.get('exam:ink:' + m[1], null); if (v && v.s) out.ink[m[1]] = v; /* an empty page is kept: it records a clear, so other devices clear too */ }
    }
  } catch (e) { /* storage unavailable */ }
  return out;
}
const newer = (a, b) => !a ? b : !b ? a : ((b.at || 0) - (a.at || 0) || (b.ed || 0) - (a.ed || 0)) > 0 ? b : a;
function merge(a, b) {
  a = a || {}; b = b || {};
  const out = { history: {}, last: {}, drafts: {}, ink: {} };
  const ha = a.history || {}, hb = b.history || {};
  for (const id of new Set([...Object.keys(ha), ...Object.keys(hb)])) {
    const byAt = new Map();
    for (const r of (ha[id] || []).concat(hb[id] || [])) { const o = byAt.get(r.at); if (!o || (r.ed || 0) > (o.ed || 0)) byAt.set(r.at, r); }
    out.history[id] = [...byAt.values()].sort((x, y) => x.at - y.at);
  }
  const la = a.last || {}, lb = b.last || {};
  for (const id of new Set([...Object.keys(la), ...Object.keys(lb)])) out.last[id] = newer(la[id], lb[id]);
  const da = a.drafts || {}, db = b.drafts || {};
  for (const id of new Set([...Object.keys(da), ...Object.keys(db)])) {
    const d = !da[id] ? db[id] : !db[id] ? da[id] : (db[id].t || 0) > (da[id].t || 0) ? db[id] : da[id];
    if (!(out.last[id] && out.last[id].at >= (d.t || 0))) out.drafts[id] = d;
  }
  // working out on a paper in progress: newest wins; once submitted it lives on the attempt (last.ink)
  const ia = a.ink || {}, ib = b.ink || {};
  for (const id of new Set([...Object.keys(ia), ...Object.keys(ib)])) {
    const d = !ia[id] ? ib[id] : !ib[id] ? ia[id] : (ib[id].t || 0) > (ia[id].t || 0) ? ib[id] : ia[id];
    if (!(out.last[id] && out.last[id].at >= (d.t || 0))) out.ink[id] = d;
  }
  return out;
}
function apply(m) {
  if (!m) return;
  const before = JSON.stringify(snapshot());
  store.set('exam:history', m.history || {});
  for (const [id, v] of Object.entries(m.last || {})) store.set('exam:last:' + id, v);
  const mine = snapshot().drafts;
  for (const id of Object.keys(mine)) if (!(m.drafts || {})[id]) { try { localStorage.removeItem('bv:' + draftKey(id)); localStorage.removeItem('bv:exam:draftAt:' + id); } catch (e) { /* ignore */ } }
  for (const [id, d] of Object.entries(m.drafts || {})) { store.set(draftKey(id), d.a); store.set('exam:draftAt:' + id, d.t || 0); }
  for (const id of Object.keys(snapshot().ink)) if (!(m.ink || {})[id]) { try { localStorage.removeItem('bv:exam:ink:' + id); } catch (e) { /* ignore */ } }
  for (const [id, v] of Object.entries(m.ink || {})) store.set('exam:ink:' + id, v);
  if (JSON.stringify(snapshot()) !== before && listView && listView.isConnected && X) list(listView);
}
B.examSync = { snapshot, merge, apply };
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const fmt = n => (Math.round(n * 2) / 2).toString();
const letter = j => '(' + 'abcdefghijkl'[j] + ')';

/* ------------------------------------------------------------ marking */
const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '' };
function parseNum(s) {
  if (s == null) return NaN;
  let t = String(s).trim().replace(/−/g, '-')
    .replace(/[⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, m => '^' + [...m].map(c => SUP[c]).join(''))
    .replace(/(\d),(?=\d{3}\b)/g, '$1');
  let m = t.match(/(-?\d*\.?\d+)\s*(?:x|×|\*)\s*10\s*(?:\^|\*\*)\s*\(?\s*(-?\d+)/i);
  if (m) return parseFloat(m[1]) * Math.pow(10, parseInt(m[2], 10));
  m = t.match(/^\s*10\s*(?:\^|\*\*)\s*(-?\d+)/);
  if (m) return Math.pow(10, parseInt(m[1], 10));
  m = t.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/i);
  return m ? parseFloat(m[0]) : NaN;
}
const AA = ['ALA', 'ARG', 'ASN', 'ASP', 'CYS', 'GLN', 'GLU', 'GLY', 'HIS', 'ILE', 'LEU', 'LYS', 'MET', 'PHE', 'PRO', 'SER', 'THR', 'TRP', 'TYR', 'VAL', 'SEC', 'PYL', 'STOP'];
const aaList = s => (String(s || '').toUpperCase().match(/[A-Z]{3,4}/g) || []).filter(w => AA.includes(w) && w !== 'STOP');
const ntSeq = s => String(s || '').toUpperCase().replace(/[53]\s*['′’]/g, '').replace(/[^ACGTU]/g, '');
const rx = r => { try { return new RegExp(r, 'i'); } catch (e) { return /$^/; } };

function markPart(p, ans) {
  const out = { got: 0, max: p.marks, hits: [] };
  const blank = ans == null || (typeof ans === 'string' && !ans.trim()) || (Array.isArray(ans) && !ans.some(a => a && a.trim()));
  if (blank) return out;
  if (p.type === 'mcq') out.got = +ans === p.answer ? p.marks : 0;
  else if (p.type === 'text') {
    let g = 0;
    const t = String(ans).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, c => SUP[c]).replace(/[′’]/g, "'").replace(/[–—−]/g, '-');
    out.hits = p.scheme.map(pt => { const ok = pt.kw.some(alt => alt.every(r => rx(r).test(t))); if (ok) g += pt.marks; return ok; });
    out.got = Math.min(p.marks, g);
  } else if (p.type === 'num') {
    const v = parseNum(ans);
    const tol = p.tol != null ? p.tol : (p.rtol != null ? Math.abs(p.value) * p.rtol : 1e-9 + Math.abs(p.value) * 0.005);
    out.got = isFinite(v) && Math.abs(v - p.value) <= tol ? p.marks : 0;
  } else if (p.type === 'seq') {
    if (p.mode === 'aa') {
      const a = aaList(ans);
      let best = 0;
      for (const acc of p.accept) {
        const want = acc.split(/\s+/);
        let ok = 0;
        want.forEach((w, i) => { if (a[i] === w) ok++; });
        if (a.length > want.length) ok = Math.max(0, ok - (a.length - want.length));
        best = Math.max(best, ok / want.length);
      }
      out.got = best === 1 ? p.marks : Math.floor(best * p.marks);
    } else {
      const s = ntSeq(ans);
      if (p.accept.some(a => ntSeq(a) === s)) out.got = p.marks;
      else if ((p.half || []).some(a => ntSeq(a) === s)) out.got = p.marks / 2;
    }
  } else if (p.type === 'label') {
    out.hits = p.labels.map((l, i) => { const a = (ans || [])[i] || ''; return !!a.trim() && l.accept.some(r => rx(r).test(a)); });
    out.got = out.hits.filter(Boolean).length;
  }
  return out;
}

/* ------------------------------------------------------------ list */
function list(view) {
  inkOff(); focusOff();
  listView = view;
  const H = hist();
  view.innerHTML = `<div class="exam-wrap">
    <div class="exam-head"><h1>Exam practice</h1><p>Answer every part in full, then submit to have it marked against the mark scheme. There is no time limit, and your answers are saved as you type.${store.get('fcUser', null) ? '' : ` Results stay on this device until you sign in on the <a href="${B.hashFor('flashcards')}" class="exam-sync-link">Flashcards</a> page, which syncs them too.`}</p></div>
    ${X.subjects.map(s => `<section class="exam-subject"><h2>${esc(s.subject)} <span>${esc(s.module || '')}</span></h2>
      <div class="exam-grid">${s.papers.map(p => {
        const h = H[p.id] || [];
        const best = h.length ? Math.max(...h.map(r => pct(r.score, r.max))) : null;
        const last = h[h.length - 1];
        const draft = store.get(draftKey(p.id), null);
        return `<a class="exam-paper-card" href="${B.hashFor('exam/' + p.id)}" data-id="exam/${esc(p.id)}">
          <div class="exam-paper-lec">${esc(p.lecture)}</div><div class="exam-paper-title">${esc(p.title)}</div>
          <div class="exam-paper-meta">${p.questions.reduce((n, q) => n + q.parts.length, 0)} questions · ${p.marks} marks${p.printable ? ' · printable' : ''}</div>
          <div class="exam-paper-score">${best == null ? (draft ? '<span class="exam-pill">In progress</span>' : '<span class="exam-pill dim">Not attempted</span>') : `<span class="exam-pill ok">Best ${best}%</span><span class="exam-pill dim">Last ${pct(last.score, last.max)}%</span>${draft ? '<span class="exam-pill">In progress</span>' : ''}`}</div></a>`;
      }).join('')}</div></section>`).join('')}
  </div>`;
  view.onclick = e => { const a = e.target.closest('.exam-paper-card'); if (a) { e.preventDefault(); B.go(a.dataset.id); } };
}

/* ------------------------------------------------------------ figure with numbered gaps */
function figure(src, labels, answers, reveal) {
  const boxes = labels.map((l, i) => {
    const [x, y, w, h] = l.box;
    let cls = 'occl-box', txt = `<b>${i + 1}</b>`;
    if (reveal) cls += reveal[i] ? ' is-right' : ' is-wrong';
    return `<span class="${cls}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%">${txt}</span>`;
  }).join('');
  return `<div class="occl exam-fig"><img src="${esc(src)}" alt="" loading="lazy">${boxes}</div>`;
}
const table = t => `<div class="exam-table-wrap"><table class="exam-table"><thead><tr>${t.head.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

/* ------------------------------------------------------------ paper */
function input(p, a) {
  const id = esc(p.id);
  if (p.type === 'mcq') return `<div class="exam-mcq">${p.options.map((o, i) => `<label class="exam-opt"><input type="radio" name="${id}" value="${i}" ${String(a) === String(i) ? 'checked' : ''}><b>${'ABCDEFG'[i]}</b><span>${o}</span></label>`).join('')}</div>`;
  if (p.type === 'text') return `<textarea class="exam-ans" data-p="${id}" rows="${Math.max(2, p.lines || 4)}" placeholder="Your answer">${esc(a || '')}</textarea>`;
  if (p.type === 'num') return `<div class="exam-num"><input class="exam-ans" data-p="${id}" type="text" inputmode="decimal" autocomplete="off" value="${esc(a || '')}" placeholder="Answer">${p.unit ? `<span>${esc(p.unit)}</span>` : ''}</div>`;
  if (p.type === 'seq') return `<input class="exam-ans exam-seq" data-p="${id}" type="text" autocomplete="off" spellcheck="false" value="${esc(a || '')}" placeholder="Answer">`;
  if (p.type === 'label') return `${figure(p.img, p.labels)}<div class="exam-labels">${p.labels.map((l, i) => `<label><b>${i + 1}</b><input class="exam-ans" data-p="${id}" data-i="${i}" type="text" autocomplete="off" value="${esc((a || [])[i] || '')}"></label>`).join('')}</div>`;
  return '';
}

function paper(view, p) {
  listView = null; view.onclick = null; view.oninput = null;
  const draft = store.get(draftKey(p.id), {});
  let qn = 0;
  view.innerHTML = `<div class="exam-wrap">
    <div class="exam-bar"><a href="${B.hashFor('exam')}" class="exam-back" data-go="exam">${icon('arrow-left')} All papers</a></div>
    <div class="exam-head"><div class="exam-paper-lec">${esc(p.subject)} · ${esc(p.lecture)}</div><h1>${esc(p.title)}</h1>
      <p>${p.questions.reduce((n, q) => n + q.parts.length, 0)} questions · ${p.marks} marks · no time limit. ${p.note ? esc(p.note) + ' ' : ''}Answer every part, then submit at the bottom. Write working out anywhere on the page with the Apple Pencil, margins included (or turn on the pen in the toolbar to use the mouse); it is saved with the paper.</p></div>
    ${p.printable ? paperTools() : ''}
    <form class="exam-form" autocomplete="off">
    ${p.questions.map(q => { qn++; return `${secHead(p, q, qn)}<section class="exam-q"><div class="exam-qn">${qn}</div><div class="exam-qbody">
      <div class="exam-stem">${q.stem}</div>
      ${q.table ? table(q.table) : ''}${q.img ? `<img class="exam-img" src="${esc(q.img)}" alt="" loading="lazy">` : ''}
      ${q.parts.map((pt, j) => `<div class="exam-part" data-part="${esc(pt.id)}">
        <div class="exam-part-stem">${q.parts.length > 1 ? `<span class="exam-letter">${letter(j)}</span>` : ''}<div>${pt.stem}</div><span class="exam-marks">[${pt.marks}]</span></div>
        ${input(pt, draft[pt.id])}<button type="button" class="exam-check-one" data-checkpart="${esc(pt.id)}">${icon('check')} Check</button><div class="exam-check-res" data-res="${esc(pt.id)}"></div></div>`).join('')}
      <div class="exam-check-row"><button type="button" class="exam-btn exam-check" data-check="${qn - 1}">${icon('check')} Check question ${qn}</button><span class="exam-check-score" data-qscore="${qn - 1}"></span></div>
    </div></section>`; }).join('')}
    <div class="exam-submit"><span class="exam-left"></span><button type="submit" class="exam-btn">${icon('check')} Submit for marking</button></div>
    </form></div>`;
  const form = $('.exam-form', view);
  inkOn(view, (store.get('exam:ink:' + p.id, null) || {}).s || [], s => { store.set('exam:ink:' + p.id, { t: Date.now(), s }); changed(); });
  const collect = () => {
    const a = {};
    for (const q of p.questions) for (const pt of q.parts) {
      if (pt.type === 'mcq') { const r = $(`input[name="${CSS.escape(pt.id)}"]:checked`, form); a[pt.id] = r ? r.value : ''; }
      else if (pt.type === 'label') a[pt.id] = $$(`[data-p="${CSS.escape(pt.id)}"]`, form).map(i => i.value);
      else { const el = $(`[data-p="${CSS.escape(pt.id)}"]`, form); a[pt.id] = el ? el.value : ''; }
    }
    return a;
  };
  const unanswered = a => p.questions.flatMap(q => q.parts).filter(pt => { const v = a[pt.id]; return Array.isArray(v) ? !v.some(x => x.trim()) : !String(v || '').trim(); }).length;
  const left = $('.exam-left', form);
  let checkSum = '';
  const status = () => { const n = unanswered(collect()); left.textContent = (n ? `${n} part${n > 1 ? 's' : ''} not answered` : 'All parts answered') + checkSum; };
  let t = null, armed = false;
  form.addEventListener('input', () => { clearTimeout(t); armed = false; t = setTimeout(() => { const d = collect(); d.__checked = [...checked]; store.set(draftKey(p.id), d); store.set('exam:draftAt:' + p.id, Date.now()); status(); changed(); }, 300); });
  status();
  // mark one part, or one question, at a time without submitting the paper (kept in the draft, so it survives a reload)
  const allParts = p.questions.flatMap((q, qi) => q.parts.map(pt => ({ pt, qi })));
  const checked = new Set((draft.__checked || []).map(String).filter(id => allParts.some(x => x.pt.id === id)));
  const showPart = (pt, a) => {
    const m = markPart(pt, a[pt.id]);
    const box = form.querySelector(`[data-res="${CSS.escape(pt.id)}"]`);
    const ok = m.got === pt.marks, part = m.got > 0 && !ok;
    box.innerHTML = `<div class="exam-verdict ${ok ? 'ok' : part ? 'part' : 'no'}">${ok ? '✓ Right' : part ? '◐ Partly right' : '✗ Not quite'} · ${m.got}/${pt.marks}</div>${schemeView(pt, m)}`;
    checked.add(pt.id);
  };
  const refresh = a => {
    let sumGot = 0, sumMax = 0;
    p.questions.forEach((q, qi) => {
      const done = q.parts.filter(pt => checked.has(pt.id));
      const got = done.reduce((n, pt) => n + markPart(pt, a[pt.id]).got, 0), max = done.reduce((n, pt) => n + pt.marks, 0);
      sumGot += got; sumMax += max;
      const sc = form.querySelector(`[data-qscore="${qi}"]`);
      sc.textContent = max ? `${got}/${max}${done.length < q.parts.length ? ' so far' : ''}` : '';
      sc.className = 'exam-check-score ' + (!max ? '' : got === max ? 'ok' : got ? 'part' : 'no');
    });
    checkSum = sumMax ? ` · checked so far ${sumGot}/${sumMax}` : ''; status();
    const d = collect(); d.__checked = [...checked]; store.set(draftKey(p.id), d); store.set('exam:draftAt:' + p.id, Date.now()); changed();
  };
  const checkPart = id => { const a = collect(), x = allParts.find(y => y.pt.id === id); if (x) { showPart(x.pt, a); refresh(a); } };
  const checkQ = qi => { const a = collect(); p.questions[qi].parts.forEach(pt => showPart(pt, a)); refresh(a); };
  form.addEventListener('click', e => { const b = e.target.closest('[data-checkpart]'); if (b) checkPart(b.dataset.checkpart); });
  form.addEventListener('click', e => { const b = e.target.closest('[data-check]'); if (b) checkQ(+b.dataset.check); });
  form.addEventListener('change', e => { const part = e.target.closest('[data-part]'); if (part) { const r = part.querySelector('.exam-check-res'); if (r) r.innerHTML = ''; } });
  if (checked.size) { const a = collect(); allParts.filter(x => checked.has(x.pt.id)).forEach(x => showPart(x.pt, a)); refresh(a); }
  form.addEventListener('submit', e => {
    e.preventDefault();
    const a = collect();
    const n = unanswered(a);
    if (n && !armed) { armed = true; left.textContent = `${n} part${n > 1 ? 's' : ''} not answered. Press submit again to mark anyway.`; left.classList.add('warn'); return; }
    const res = { at: Date.now(), answers: a, adj: {} };
    const work = (store.get('exam:ink:' + p.id, null) || {}).s;
    if (work && work.length) res.ink = work;   // the working out goes with this attempt
    try { localStorage.removeItem('bv:exam:ink:' + p.id); } catch (err) { /* ignore */ }
    store.set('exam:last:' + p.id, res);
    store.set(draftKey(p.id), null);
    try { localStorage.removeItem('bv:' + draftKey(p.id)); localStorage.removeItem('bv:exam:draftAt:' + p.id); } catch (err) { /* ignore */ }
    const marks = score(p, res);
    const H = hist(); (H[p.id] = H[p.id] || []).push({ at: res.at, score: marks.got, max: marks.max }); store.set('exam:history', H);
    changed();
    review(view, p, res);
  });
  view.querySelector('[data-go]').onclick = e => { e.preventDefault(); B.go('exam'); };
  wireTools(view, p);
}

function score(p, res) {
  let got = 0, max = 0;
  const parts = {};
  for (const q of p.questions) for (const pt of q.parts) {
    const m = markPart(pt, res.answers[pt.id]);
    if (res.ticks && res.ticks[pt.id]) m.hits = res.ticks[pt.id];
    if (res.adj[pt.id] != null) m.got = res.adj[pt.id];
    parts[pt.id] = m; got += m.got; max += pt.marks;
  }
  return { got, max, parts };
}

/* ------------------------------------------------------------ review */
function answerView(pt, a, m) {
  if (pt.type === 'mcq') return a === '' || a == null ? '<em class="exam-none">No answer</em>' : `<b>${'ABCDEFG'[+a]}</b> ${pt.options[+a]}`;
  if (pt.type === 'label') return `${figure(pt.img, pt.labels, a, m.hits)}<ol class="exam-label-review">${pt.labels.map((l, i) => `<li class="${m.hits[i] ? 'ok' : 'no'}"><span class="mine">${esc((a || [])[i] || '') || '<em>blank</em>'}</span><span class="right">${esc(l.answer)}</span></li>`).join('')}</ol>`;
  const s = String(a || '').trim();
  return s ? `<div class="exam-mine">${esc(s)}</div>` : '<em class="exam-none">No answer</em>';
}
function schemeView(pt, m) {
  if (pt.type === 'mcq') return `<div class="exam-ms"><div class="exam-ms-h">Answer</div><b>${'ABCDEFG'[pt.answer]}</b> ${pt.options[pt.answer]}${pt.explain ? `<p>${pt.explain}</p>` : ''}</div>`;
  if (pt.type === 'text') return `<div class="exam-ms"><div class="exam-ms-h">Mark scheme</div><ul class="exam-points">${pt.scheme.map((s, i) => `<li class="${m.hits[i] ? 'ok' : 'no'}">${icon(m.hits[i] ? 'check' : 'x')}<span>${s.text}${s.marks > 1 ? ` [${s.marks}]` : ''}</span></li>`).join('')}</ul>${pt.scheme.length > pt.marks ? `<div class="exam-ms-note">Any ${pt.marks} of ${pt.scheme.length} points.</div>` : ''}<div class="exam-ms-h">Model answer</div><p>${pt.model}</p></div>`;
  if (pt.type === 'num') return `<div class="exam-ms"><div class="exam-ms-h">Answer</div><b>${esc(String(pt.value))}${pt.unit ? ' ' + esc(pt.unit) : ''}</b>${pt.working ? `<p>${pt.working}</p>` : ''}</div>`;
  if (pt.type === 'seq') return `<div class="exam-ms"><div class="exam-ms-h">Answer</div><b>${esc(pt.model)}</b>${pt.note ? `<p>${esc(pt.note)}</p>` : ''}</div>`;
  return '';
}

function review(view, p, res) {
  listView = null; view.onclick = null; view.oninput = null;
  const draw = () => {
    const S = score(p, res);
    const H = hist(); const h = H[p.id] || [];
    const rec = h.find(r => r.at === res.at); if (rec && rec.score !== S.got) { rec.score = S.got; rec.ed = res.ed || Date.now(); store.set('exam:history', H); changed(); }
    let qn = 0;
    const per = pct(S.got, S.max);
    view.innerHTML = `<div class="exam-wrap">
      <div class="exam-bar"><a href="${B.hashFor('exam')}" class="exam-back" data-go="exam">${icon('arrow-left')} All papers</a><span class="spacer"></span><button class="exam-btn ghost" data-retry>${icon('rotate')} Try again</button></div>
      <div class="exam-result"><div class="exam-score"><b>${fmt(S.got)}</b><span>/ ${S.max}</span></div><div><div class="exam-paper-lec">${esc(p.lecture)}</div><h1>${esc(p.title)}</h1>
        <div class="exam-meter"><i style="width:${per}%"></i></div><p>${per}%.${res.paper ? ' Done on paper: multiple-choice and number answers were marked automatically; written answers carry the marks you ticked.' : ''} Text answers are marked by matching the key points of the mark scheme, so check each one and adjust the mark with − and + if the marker missed something.</p></div></div>
      ${p.printable ? paperTools(res.paper) : ''}
      ${p.questions.map(q => { qn++; return `${secHead(p, q, qn)}<section class="exam-q"><div class="exam-qn">${qn}</div><div class="exam-qbody">
        <div class="exam-stem">${q.stem}</div>${q.table ? table(q.table) : ''}${q.img ? `<img class="exam-img" src="${esc(q.img)}" alt="" loading="lazy">` : ''}
        ${q.parts.map((pt, j) => { const m = S.parts[pt.id]; const cls = m.got >= pt.marks ? 'full' : m.got > 0 ? 'part' : 'zero'; return `<div class="exam-part is-review ${cls}">
          <div class="exam-part-stem">${q.parts.length > 1 ? `<span class="exam-letter">${letter(j)}</span>` : ''}<div>${pt.stem}</div>
            <span class="exam-award"><button data-adj="${esc(pt.id)}" data-d="-0.5" title="Take off half a mark">−</button><b>${fmt(m.got)}/${pt.marks}</b><button data-adj="${esc(pt.id)}" data-d="0.5" title="Add half a mark">+</button></span></div>
          <div class="exam-review-grid"><div><div class="exam-ms-h">Your answer</div>${answerView(pt, res.answers[pt.id], m)}</div>${schemeView(pt, m)}</div>
        </div>`; }).join('')}
      </div></section>`; }).join('')}
    </div>`;
    view.querySelector('[data-go]').onclick = e => { e.preventDefault(); B.go('exam'); };
    view.querySelector('[data-retry]').onclick = () => paper(view, p);
    wireTools(view, p);
    inkOn(view, res.ink || [], s => { res.ink = s; res.ed = Date.now(); store.set('exam:last:' + p.id, res); changed(); });
    $$('[data-adj]', view).forEach(b => b.onclick = () => {
      const id = b.dataset.adj; const pt = p.questions.flatMap(q => q.parts).find(x => x.id === id);
      const cur = S.parts[id].got; const nv = Math.max(0, Math.min(pt.marks, cur + parseFloat(b.dataset.d)));
      res.adj[id] = nv; res.ed = Date.now(); store.set('exam:last:' + p.id, res);
      const top = view.scrollTop; draw(); view.scrollTop = top;
    });
  };
  draw();
  view.scrollTop = 0;
}

/* ------------------------------------------------------------ printable papers
   Papers flagged printable (content/exams/make_chemistry.py) can be printed to do by hand, with a
   mark scheme to print separately, and the answers from the paper entered here: multiple-choice and
   number answers are marked automatically, written answers are ticked off against the mark scheme.
   The result is saved like any other attempt. */
const L5 = 'ABCDE';
function secHead(p, q, qn) {
  if (!q.section) return '';
  const prev = p.questions[qn - 2];
  if (prev && prev.section === q.section) return '';
  const qs = p.questions.filter(x => x.section === q.section);
  const marks = qs.reduce((n, x) => n + x.parts.reduce((m, pt) => m + pt.marks, 0), 0);
  return `<h2 class="exam-section">Section ${esc(q.section)} <span>${q.section === 'A' ? `${qs.length} multiple-choice questions` : `${qs.length} short-answer questions`} · ${fmt(marks)} marks</span></h2>`;
}
function paperTools(done) {
  return `<div class="exam-tools"><span>${done ? 'This attempt was done on paper.' : 'Prefer pen and paper?'}</span>
    <button type="button" class="exam-btn ghost" data-print="paper">${icon('printer')} Print paper</button>
    <button type="button" class="exam-btn ghost" data-print="scheme">${icon('file')} Print mark scheme</button>
    <button type="button" class="exam-btn ghost" data-entry>${icon('pencil')} Mark my paper answers</button></div>`;
}
function wireTools(view, p) {
  if (!p.printable) return;
  $$('[data-print]', view).forEach(b => b.onclick = () => printPaper(p, b.dataset.print === 'scheme'));
  $$('[data-entry]', view).forEach(b => b.onclick = () => entry(view, p));
}

function printPaper(p, scheme) {
  const lines = n => `<div class="ln"></div>`.repeat(n);
  let qn = 0, sec = '';
  const body = p.questions.map(q => {
    qn++;
    let head = '';
    if (q.section && q.section !== sec) {
      sec = q.section;
      const qs = p.questions.filter(x => x.section === sec), mk = qs.reduce((n, x) => n + x.parts.reduce((m, pt) => m + pt.marks, 0), 0);
      head = `<h2 class="sec${sec !== 'A' ? ' brk' : ''}">Section ${sec} <small>(${fmt(mk)} marks)</small></h2>` +
        (sec === 'A' && !scheme ? '<p class="note">Answer every question. Each question has one correct answer and is worth 2.5 marks. Fill in your answers on the grid at the end of Section A.</p>' : '') +
        (sec === 'B' && !scheme ? '<p class="note">Answer every question in the space provided. Show your working and give units: marks are given for reasoning and calculations as well as for the final answer.</p>' : '');
    }
    const parts = q.parts.map((pt, j) => {
      const lab = q.parts.length > 1 ? `<b class="lt">${letter(j)}</b>` : '';
      const mk = `<span class="mk">[${fmt(pt.marks)}]</span>`;
      if (scheme) {
        let a = '';
        if (pt.type === 'mcq') a = `<b>${L5[pt.answer]}</b> ${pt.options[pt.answer]}${pt.explain ? `<div class="ex">${pt.explain}</div>` : ''}`;
        else if (pt.type === 'num') a = `<b>${esc(String(pt.value))}${pt.unit ? ' ' + esc(pt.unit) : ''}</b>${pt.working ? `<div class="ex">${pt.working}</div>` : ''}`;
        else if (pt.type === 'text') a = `<ul>${pt.scheme.map(s => `<li>${s.text} <i>[${s.marks}]</i></li>`).join('')}</ul>${pt.scheme.length > pt.marks ? `<div class="ex">Any ${pt.marks} of these points.</div>` : ''}<div class="ex"><b>Model answer:</b> ${pt.model}</div>`;
        return `<div class="pt">${lab}<div class="ps">${pt.stem} ${mk}<div class="ans">${a}</div></div></div>`;
      }
      let space = '';
      if (pt.type === 'mcq') space = `<ol class="opts">${pt.options.map((o, i) => `<li><b>${L5[i]}</b> ${o}</li>`).join('')}</ol>`;
      else if (pt.type === 'num') space = lines(Math.max(3, Math.ceil(pt.marks) + 2)) + `<div class="fa">Answer: <span></span>${pt.unit ? ' ' + esc(pt.unit) : ''}</div>`;
      else space = lines(pt.lines || 4);
      return `<div class="pt">${lab}<div class="ps">${pt.stem} ${mk}${space}</div></div>`;
    }).join('');
    const tbl = q.table ? `<table class="tb"><tr>${q.table.head.map(c => `<th>${c}</th>`).join('')}</tr>${q.table.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>` : '';
    const grid = !scheme && q.section === 'A' && (!p.questions[qn] || p.questions[qn].section !== 'A') ? answerGrid(p) : '';
    return `${head}<div class="q"><div class="qn">${qn}.</div><div class="qb">${q.stem ? `<div class="st">${q.stem}</div>` : ''}${tbl}${parts}</div></div>${grid}`;
  }).join('');
  const eq = (p.equations || []).length ? `<h2 class="sec brk">Appendix: equations and constants</h2><table class="eq">${p.equations.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>` : '';
  const cover = scheme ? `<h1>${esc(p.code || '')} ${esc(p.subject)}: ${esc(p.title)}<br><small>Mark scheme</small></h1>` :
    `<h1>${esc(p.code || '')} ${esc(p.subject)}<br>${esc(p.title)}</h1>
     <table class="cv"><tr><th>Time allowed</th><td>${esc(p.duration || '')}</td></tr><tr><th>Total</th><td>${fmt(p.marks)} marks</td></tr><tr><th>Date</th><td></td></tr><tr><th>Start time</th><td></td></tr></table>
     <p class="note">Answer ALL questions. Notes are not permitted. Calculators are allowed. An appendix of equations and constants is at the end of the paper.</p>`;
  const css = `@page{size:A4;margin:16mm 15mm}*{box-sizing:border-box}body{font:11pt/1.45 Georgia,'Times New Roman',serif;color:#000;margin:0}
    h1{font-size:17pt;text-align:center;margin:0 0 14px}h1 small{font-size:12pt;font-weight:normal}h2.sec{font-size:13pt;border-bottom:1.5px solid #000;padding-bottom:3px;margin:20px 0 8px}h2 small{font-weight:normal}
    .brk{break-before:page}.note{font-style:italic;margin:4px 0 12px}.cv{border-collapse:collapse;margin:10px auto 14px}.cv th,.cv td{border:1px solid #000;padding:5px 10px;text-align:left}.cv td{min-width:60mm}
    .q{display:flex;gap:8px;margin:0 0 14px;break-inside:avoid}.qn{font-weight:bold;min-width:24px}.qb{flex:1}.st{margin-bottom:6px}
    .pt{display:flex;gap:6px;margin:6px 0 10px}.lt{min-width:22px}.ps{flex:1}.mk{float:right;font-weight:bold;margin-left:8px}
    .opts{list-style:none;padding:0;margin:6px 0 0;display:grid;gap:3px}.opts b{display:inline-block;width:20px}
    .ln{border-bottom:1px solid #888;height:8.5mm}.fa{margin-top:8px;text-align:right}.fa span{display:inline-block;width:50mm;border-bottom:1px solid #000}
    .tb,.eq{border-collapse:collapse;margin:6px 0}.tb th,.tb td,.eq th,.eq td{border:1px solid #000;padding:4px 8px;text-align:left;vertical-align:top}.eq th{white-space:nowrap}
    .grid{break-inside:avoid;margin:14px 0}.grid table{border-collapse:collapse;margin:0 auto}.grid td{padding:3px 7px;text-align:center}.grid td:first-child{font-weight:bold;text-align:right}
    .bub{display:inline-block;width:6.5mm;height:6.5mm;border:1px solid #000;border-radius:50%;font-size:8pt;line-height:6.3mm}
    .ans{margin-top:5px;padding:6px 9px;border-left:3px solid #000;background:#f2f2f2}.ans ul{margin:2px 0;padding-left:18px}.ex{font-size:10pt;margin-top:3px}
    img{max-width:100%}sub,sup{line-height:0}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(p.title)}${scheme ? ' mark scheme' : ''}</title><style>${css}</style></head><body>${cover}${body}${scheme ? '' : eq}</body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.open(); w.document.write(html); w.document.close(); w.onload = () => w.print(); setTimeout(() => { try { w.focus(); w.print(); } catch (e) { /* closed */ } }, 600); return; }
  // pop-ups blocked: print from a hidden frame instead
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0';
  document.body.appendChild(f);
  f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close();
  setTimeout(() => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 2000); }, 400);
}
function answerGrid(p) {
  const qs = p.questions.map((q, i) => ({ q, n: i + 1 })).filter(x => x.q.section === 'A');
  const half = Math.ceil(qs.length / 2), cols = [qs.slice(0, half), qs.slice(half)];
  const row = x => x ? `<td>${x.n}</td>${x.q.parts[0].options.map((_, i) => `<td><span class="bub">${L5[i]}</span></td>`).join('')}` : '<td></td>';
  return `<div class="grid"><h2 class="sec">Section A answer grid</h2><p class="note">Fill in one circle for each question.</p><table>${cols[0].map((x, i) => `<tr>${row(x)}<td style="width:14mm"></td>${row(cols[1][i])}</tr>`).join('')}</table></div>`;
}

// enter the answers from a paper attempt
function entry(view, p) {
  inkOff(); focusOn(); listView = null;
  const key = 'exam:pdraft:' + p.id;
  const d = store.get(key, {});
  const ticks = d.ticks || {}, ans = d.ans || {};
  const save = () => store.set(key, { ans, ticks });
  let qn = 0;
  const mcqRow = (pt, compact) => `<div class="exam-bubbles${compact ? '' : ' wide'}">${pt.options.map((o, i) => `<button type="button" data-b="${esc(pt.id)}" data-i="${i}" class="${String(ans[pt.id]) === String(i) ? 'on' : ''}" title="${esc(o.replace(/<[^>]+>/g, ''))}">${L5[i]}</button>`).join('')}</div>`;
  const textBox = pt => `<div class="exam-tickbox"><div class="exam-ms-h">Tick each point your answer makes${pt.scheme.length > pt.marks ? ` (any ${pt.marks})` : ''}</div>
      ${pt.scheme.map((s, i) => `<label><input type="checkbox" data-t="${esc(pt.id)}" data-i="${i}" ${(ticks[pt.id] || [])[i] ? 'checked' : ''}><span>${s.text}${s.marks > 1 ? ` [${s.marks}]` : ''}</span></label>`).join('')}
      <details><summary>Model answer</summary><p>${pt.model}</p></details></div>`;
  const aRows = p.questions.map((q, i) => ({ q, n: i + 1 })).filter(x => x.q.section === 'A' && x.q.parts.length === 1 && x.q.parts[0].type === 'mcq');
  view.innerHTML = `<div class="exam-wrap">
    <div class="exam-bar"><a href="${B.hashFor('exam/' + p.id)}" class="exam-back" data-back>${icon('arrow-left')} Back to the paper</a></div>
    <div class="exam-head"><div class="exam-paper-lec">${esc(p.subject)} · ${esc(p.lecture)}</div><h1>${esc(p.title)}: mark a paper attempt</h1>
      <p>Copy your answers across from the paper. Multiple-choice and number answers are marked automatically. For written answers, tick each mark-scheme point your answer makes. The result is saved with your other attempts.</p></div>
    ${aRows.length ? `<h2 class="exam-section">Section A <span>tap the letter you chose</span></h2><div class="exam-agrid">${aRows.map(x => `<div class="exam-arow"><b>${x.n}</b>${mcqRow(x.q.parts[0], true)}</div>`).join('')}</div>` : ''}
    ${p.questions.map(q => { qn++; if (aRows.some(x => x.q === q)) return ''; return `${secHead(p, q, qn)}<section class="exam-q"><div class="exam-qn">${qn}</div><div class="exam-qbody">
      <div class="exam-stem">${q.stem}</div>${q.table ? table(q.table) : ''}
      ${q.parts.map((pt, j) => `<div class="exam-part"><div class="exam-part-stem">${q.parts.length > 1 ? `<span class="exam-letter">${letter(j)}</span>` : ''}<div>${pt.stem}</div><span class="exam-marks">[${fmt(pt.marks)}]</span></div>
        ${pt.type === 'mcq' ? mcqRow(pt) : pt.type === 'text' ? textBox(pt) : `<div class="exam-num"><input class="exam-ans" data-n="${esc(pt.id)}" type="text" inputmode="decimal" autocomplete="off" value="${esc(ans[pt.id] || '')}" placeholder="Your final answer">${pt.unit ? `<span>${esc(pt.unit)}</span>` : ''}</div>`}</div>`).join('')}
    </div></section>`; }).join('')}
    <div class="exam-submit"><span class="exam-left"></span><button type="button" class="exam-btn" data-done>${icon('check')} Mark and save</button></div></div>`;
  const parts = p.questions.flatMap(q => q.parts);
  const left = $('.exam-left', view);
  const status = () => { const n = parts.filter(pt => pt.type !== 'text' && !String(ans[pt.id] ?? '').trim()).length; left.textContent = n ? `${n} answer${n > 1 ? 's' : ''} not entered` : 'All answers entered'; };
  status();
  view.onclick = e => {
    const b = e.target.closest('[data-b]');
    if (b) { const id = b.dataset.b; ans[id] = ans[id] === b.dataset.i ? '' : b.dataset.i; $$(`[data-b="${CSS.escape(id)}"]`, view).forEach(x => x.classList.toggle('on', x.dataset.i === ans[id])); save(); status(); }
  };
  view.oninput = e => {
    const t = e.target;
    if (t.dataset.n) ans[t.dataset.n] = t.value;
    if (t.dataset.t) { const a = ticks[t.dataset.t] = ticks[t.dataset.t] || []; a[+t.dataset.i] = t.checked; }
    save(); status();
  };
  view.querySelector('[data-back]').onclick = e => { e.preventDefault(); paper(view, p); };
  let armed = false;
  view.querySelector('[data-done]').onclick = () => {
    const missing = parts.filter(pt => pt.type !== 'text' && !String(ans[pt.id] ?? '').trim()).length;
    if (missing && !armed) { armed = true; left.textContent = `${missing} answer${missing > 1 ? 's' : ''} not entered. Press again to mark anyway.`; left.classList.add('warn'); return; }
    const res = { at: Date.now(), answers: {}, adj: {}, ticks: {}, paper: true };
    for (const pt of parts) {
      if (pt.type === 'text') {
        const tk = pt.scheme.map((_, i) => !!(ticks[pt.id] || [])[i]);
        res.ticks[pt.id] = tk;
        res.answers[pt.id] = 'Written on paper';
        res.adj[pt.id] = Math.min(pt.marks, pt.scheme.reduce((n, s, i) => n + (tk[i] ? s.marks : 0), 0));
      } else res.answers[pt.id] = ans[pt.id] ?? '';
    }
    store.set('exam:last:' + p.id, res);
    store.set(key, null);
    try { localStorage.removeItem('bv:' + key); } catch (err) { /* ignore */ }
    const marks = score(p, res);
    const H = hist(); (H[p.id] = H[p.id] || []).push({ at: res.at, score: marks.got, max: marks.max, paper: true }); store.set('exam:history', H);
    changed();
    review(view, p, res);
  };
  view.scrollTop = 0;
}

/* ------------------------------------------------------------ views */
const fail = view => { view.innerHTML = '<div class="pane-empty">Could not load the exam papers.</div>'; };
B.registerView('exam', {
  title: () => 'Exam practice', icon: 'clipboard-list', cls: 'exam-host',
  show(view) { inkOff(); view.innerHTML = '<div class="fc-loading"><span class="books-spinner"></span> Loading papers…</div>'; load().then(() => list(view)).catch(() => fail(view)); },
});
B.registerView('exam-paper', {
  prefix: 'exam/', icon: 'clipboard-list', cls: 'exam-host',
  title: id => { const p = byId.get(id.slice(5)); return p ? `Exam: ${p.title}` : 'Exam practice'; },
  show(view, id) {
    inkOff();
    view.innerHTML = '<div class="fc-loading"><span class="books-spinner"></span> Loading paper…</div>';
    load().then(() => {
      const p = byId.get(id.slice(5));
      if (!p) { view.innerHTML = '<div class="pane-empty">No such paper.</div>'; return; }
      B.refreshTabs();
      const last = store.get('exam:last:' + p.id, null);
      const draft = store.get(draftKey(p.id), null);
      if (last && !draft) review(view, p, last); else paper(view, p);
    }).catch(() => fail(view));
  },
});
document.dispatchEvent(new Event('bv:exam-ready'));
})();
