/* Tables in notes: an "Expand" button above any table too wide or tall for its space, which opens it
   full screen. The scrolling, sticky header and readable column widths are in tables.css. */
(() => {
'use strict';
const B = window.BV;
const { icon, esc } = B;
function open(table, title) {
  const m = document.createElement('div');
  m.className = 'tbl-modal';
  m.innerHTML = `<div class="tbl-modal-box"><div class="tbl-modal-head"><span>${esc(title)}</span><button aria-label="Close">${icon('x')}</button></div><div class="markdown-rendered"><div class="el-table"></div></div></div>`;
  m.querySelector('.el-table').appendChild(table.cloneNode(true));
  const close = () => { m.remove(); document.removeEventListener('keydown', key, true); };
  const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('.tbl-modal-head button')) close(); });
  document.addEventListener('keydown', key, true);
  document.body.appendChild(m);
  // links inside still go to their notes
  m.querySelectorAll('a.internal-link').forEach(a => a.addEventListener('click', () => close()));
}
function setup(root, id) {
  root.querySelectorAll('.el-table').forEach(box => {
    if (box.closest('.tbl-modal') || (box.previousElementSibling && box.previousElementSibling.classList.contains('tbl-bar'))) return;
    const table = box.querySelector('table'); if (!table) return;
    const cols = table.rows[0] ? table.rows[0].cells.length : 0;
    const add = () => {
      if (box.previousElementSibling && box.previousElementSibling.classList.contains('tbl-bar')) return;
      if (cols < 4 && box.scrollWidth <= box.clientWidth + 2 && box.scrollHeight <= box.clientHeight + 2) return;
      const bar = document.createElement('div');
      bar.className = 'tbl-bar';
      bar.innerHTML = `${box.scrollWidth > box.clientWidth + 2 ? '<span>Scroll sideways for more</span>' : ''}<button type="button">${icon('maximize')}Expand table</button>`;
      bar.querySelector('button').addEventListener('click', e => { e.stopPropagation(); open(table, B.noteTitle ? B.noteTitle(id) : ''); });
      box.parentNode.insertBefore(bar, box);
    };
    // sizes are only known once the note is laid out
    requestAnimationFrame(() => requestAnimationFrame(add));
  });
}
B.onHydrate(setup);
})();
