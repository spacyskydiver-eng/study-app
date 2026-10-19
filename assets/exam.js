/* Exam practice: exam-style papers answered in full, then auto-marked against a mark scheme.
   Papers come from data/exams.json (content/exams, built by tools/curate.py).
   Drafts, marks and history are kept in this browser. */
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
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const fmt = n => (Math.round(n * 2) / 2).toString();
const letter = j => '(' + 'abcdefgh'[j] + ')';

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
  const H = hist();
  view.innerHTML = `<div class="exam-wrap">
    <div class="exam-head"><h1>Exam practice</h1><p>Answer every part in full, then submit to have it marked against the mark scheme. There is no time limit, and your answers are saved as you type.</p></div>
    ${X.subjects.map(s => `<section class="exam-subject"><h2>${esc(s.subject)} <span>${esc(s.module || '')}</span></h2>
      <div class="exam-grid">${s.papers.map(p => {
        const h = H[p.id] || [];
        const best = h.length ? Math.max(...h.map(r => pct(r.score, r.max))) : null;
        const last = h[h.length - 1];
        const draft = store.get(draftKey(p.id), null);
        return `<a class="exam-paper-card" href="${B.hashFor('exam/' + p.id)}" data-id="exam/${esc(p.id)}">
          <div class="exam-paper-lec">${esc(p.lecture)}</div><div class="exam-paper-title">${esc(p.title)}</div>
          <div class="exam-paper-meta">${p.questions.length} questions · ${p.marks} marks</div>
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
  const draft = store.get(draftKey(p.id), {});
  let qn = 0;
  view.innerHTML = `<div class="exam-wrap">
    <div class="exam-bar"><a href="${B.hashFor('exam')}" class="exam-back" data-go="exam">${icon('arrow-left')} All papers</a></div>
    <div class="exam-head"><div class="exam-paper-lec">${esc(p.subject)} · ${esc(p.lecture)}</div><h1>${esc(p.title)}</h1>
      <p>${p.questions.length} questions · ${p.marks} marks · no time limit. Answer every part, then submit at the bottom.</p></div>
    <form class="exam-form" autocomplete="off">
    ${p.questions.map(q => { qn++; return `<section class="exam-q"><div class="exam-qn">${qn}</div><div class="exam-qbody">
      <div class="exam-stem">${q.stem}</div>
      ${q.table ? table(q.table) : ''}${q.img ? `<img class="exam-img" src="${esc(q.img)}" alt="" loading="lazy">` : ''}
      ${q.parts.map((pt, j) => `<div class="exam-part" data-part="${esc(pt.id)}">
        <div class="exam-part-stem">${q.parts.length > 1 ? `<span class="exam-letter">${letter(j)}</span>` : ''}<div>${pt.stem}</div><span class="exam-marks">[${pt.marks}]</span></div>
        ${input(pt, draft[pt.id])}</div>`).join('')}
    </div></section>`; }).join('')}
    <div class="exam-submit"><span class="exam-left"></span><button type="submit" class="exam-btn">${icon('check')} Submit for marking</button></div>
    </form></div>`;
  const form = $('.exam-form', view);
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
  const status = () => { const n = unanswered(collect()); left.textContent = n ? `${n} part${n > 1 ? 's' : ''} not answered` : 'All parts answered'; };
  let t = null, armed = false;
  form.addEventListener('input', () => { clearTimeout(t); armed = false; t = setTimeout(() => { store.set(draftKey(p.id), collect()); status(); }, 300); });
  status();
  form.addEventListener('submit', e => {
    e.preventDefault();
    const a = collect();
    const n = unanswered(a);
    if (n && !armed) { armed = true; left.textContent = `${n} part${n > 1 ? 's' : ''} not answered. Press submit again to mark anyway.`; left.classList.add('warn'); return; }
    const res = { at: Date.now(), answers: a, adj: {} };
    store.set('exam:last:' + p.id, res);
    store.set(draftKey(p.id), null);
    try { localStorage.removeItem('bv:' + draftKey(p.id)); } catch (err) { /* ignore */ }
    const marks = score(p, res);
    const H = hist(); (H[p.id] = H[p.id] || []).push({ at: res.at, score: marks.got, max: marks.max }); store.set('exam:history', H);
    review(view, p, res);
  });
  view.querySelector('[data-go]').onclick = e => { e.preventDefault(); B.go('exam'); };
}

function score(p, res) {
  let got = 0, max = 0;
  const parts = {};
  for (const q of p.questions) for (const pt of q.parts) {
    const m = markPart(pt, res.answers[pt.id]);
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
  const draw = () => {
    const S = score(p, res);
    const H = hist(); const h = H[p.id] || [];
    const rec = h.find(r => r.at === res.at); if (rec && rec.score !== S.got) { rec.score = S.got; store.set('exam:history', H); }
    let qn = 0;
    const per = pct(S.got, S.max);
    view.innerHTML = `<div class="exam-wrap">
      <div class="exam-bar"><a href="${B.hashFor('exam')}" class="exam-back" data-go="exam">${icon('arrow-left')} All papers</a><span class="spacer"></span><button class="exam-btn ghost" data-retry>${icon('rotate')} Try again</button></div>
      <div class="exam-result"><div class="exam-score"><b>${fmt(S.got)}</b><span>/ ${S.max}</span></div><div><div class="exam-paper-lec">${esc(p.lecture)}</div><h1>${esc(p.title)}</h1>
        <div class="exam-meter"><i style="width:${per}%"></i></div><p>${per}%. Text answers are marked by matching the key points of the mark scheme, so check each one and adjust the mark with − and + if the marker missed something.</p></div></div>
      ${p.questions.map(q => { qn++; return `<section class="exam-q"><div class="exam-qn">${qn}</div><div class="exam-qbody">
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
    $$('[data-adj]', view).forEach(b => b.onclick = () => {
      const id = b.dataset.adj; const pt = p.questions.flatMap(q => q.parts).find(x => x.id === id);
      const cur = S.parts[id].got; const nv = Math.max(0, Math.min(pt.marks, cur + parseFloat(b.dataset.d)));
      res.adj[id] = nv; store.set('exam:last:' + p.id, res);
      const top = view.scrollTop; draw(); view.scrollTop = top;
    });
  };
  draw();
  view.scrollTop = 0;
}

/* ------------------------------------------------------------ views */
const fail = view => { view.innerHTML = '<div class="pane-empty">Could not load the exam papers.</div>'; };
B.registerView('exam', {
  title: () => 'Exam practice', icon: 'clipboard-list', cls: 'exam-host',
  show(view) { view.innerHTML = '<div class="fc-loading"><span class="books-spinner"></span> Loading papers…</div>'; load().then(() => list(view)).catch(() => fail(view)); },
});
B.registerView('exam-paper', {
  prefix: 'exam/', icon: 'clipboard-list', cls: 'exam-host',
  title: id => { const p = byId.get(id.slice(5)); return p ? `Exam: ${p.title}` : 'Exam practice'; },
  show(view, id) {
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
})();
