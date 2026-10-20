/* Nova mode components, ported from the React Bits specs to plain DOM (no React, no build
   step, matching the rest of this site). Lazy-loaded only once Nova mode is switched on, so
   Classic-mode visitors never fetch this file. See assets/nova.css for the matching styles. */
(() => {
'use strict';
window.NovaUI = window.NovaUI || {};

/* ---------------------------------------------------------------- Lattice Loader */
const LL_PATTERNS = {
  orbit: { 3: { cells: [0, 1, 2, 7, null, 3, 6, 5, 4], loop: 8, scale: 1.2 } },
  dots: { 3: { cells: [0, 1, 2, 0, 1, 2, 0, 1, 2], loop: 3, scale: 2.4 } },
  ripple: { 3: { cells: [2, 1, 2, 1, 0, 1, 2, 1, 2], loop: 4.8, scale: 1.5 } },
  snake: { 3: { cells: [0, 1, 2, 5, 4, 3, 6, 7, 8], loop: 9, scale: 1 } },
};
const LL_MARKS = { 3: { done: [2, 3, 5, 7], error: [0, 2, 4, 6, 8] } };

function latticeCreate(opts = {}) {
  const {
    label = 'Thinking', doneLabel = 'Done', errorLabel = 'Failed',
    pattern = 'orbit', shape = 'round', cellSize = 5, gap = 2, fontSize = 13,
    step = 90, showTimer = false,
  } = opts;
  const pat = (LL_PATTERNS[pattern] || LL_PATTERNS.orbit)[3];
  const cycle = Math.round(pat.loop * step * pat.scale);

  const root = document.createElement('span');
  root.className = 'lattice-loader';
  root.setAttribute('role', 'status');
  root.dataset.status = 'working';
  root.dataset.shape = shape;
  root.style.setProperty('--ll-cell', cellSize + 'px');
  root.style.setProperty('--ll-gap', gap + 'px');
  root.style.setProperty('--ll-font', fontSize + 'px');
  root.style.setProperty('--ll-cycle', cycle + 'ms');

  const grid = document.createElement('span');
  grid.className = 'lattice-loader__grid'; grid.setAttribute('aria-hidden', 'true');

  const run = document.createElement('span');
  run.className = 'lattice-loader__layer lattice-loader__run';
  pat.cells.forEach((unit, i) => {
    const cell = document.createElement('span');
    cell.className = 'lattice-loader__cell';
    if (unit == null) cell.dataset.hole = '';
    else cell.style.animationDelay = Math.round(unit * step * pat.scale) + 'ms';
    run.appendChild(cell);
  });

  const mark = document.createElement('span');
  mark.className = 'lattice-loader__layer lattice-loader__mark';
  const marks = LL_MARKS[3];
  pat.cells.forEach((_, i) => {
    const cell = document.createElement('span');
    cell.className = 'lattice-loader__cell';
    cell.dataset.i = i;
    mark.appendChild(cell);
  });

  grid.appendChild(run); grid.appendChild(mark);
  root.appendChild(grid);

  // icon-only mode (no label text) for tight spots like a 36px square button
  const textEls = {};
  if (label) {
    const labelEl = document.createElement('span');
    labelEl.className = 'lattice-loader__label'; labelEl.setAttribute('aria-hidden', 'true');
    const texts = { working: label, done: doneLabel, error: errorLabel };
    for (const k in texts) {
      const t = document.createElement('span');
      t.className = 'lattice-loader__text'; t.textContent = texts[k];
      if (k === 'working') t.dataset.active = '';
      textEls[k] = t; labelEl.appendChild(t);
    }
    root.appendChild(labelEl);
  }

  let timerEl = null;
  if (showTimer) {
    timerEl = document.createElement('span');
    timerEl.className = 'lattice-loader__timer'; timerEl.textContent = '0.0s';
    root.appendChild(timerEl);
  }

  let startedAt = performance.now(), timerId = null;
  function paint() {
    if (!timerEl) return;
    const ds = Math.floor((performance.now() - startedAt) / 100);
    timerEl.textContent = (ds < 600 ? (ds / 10).toFixed(1) + 's' : Math.floor(ds / 600) + 'm ' + ((ds % 600) / 10).toFixed(1) + 's');
  }
  if (showTimer) timerId = setInterval(paint, 100);

  function setStatus(status) {
    root.dataset.status = status;
    for (const k in textEls) textEls[k].toggleAttribute('data-active', k === status);
    const onSet = new Set(marks[status === 'error' ? 'error' : 'done'] || []);
    $$cells(mark).forEach((cell, i) => cell.toggleAttribute('data-on', onSet.has(i)));
    if (status !== 'working' && timerId) { clearInterval(timerId); timerId = null; }
  }
  function $$cells(layer) { return Array.from(layer.children); }

  return { el: root, setStatus, destroy() { if (timerId) clearInterval(timerId); } };
}

/** Convenience: a static "working" lattice + label, for call sites that just swap it out
    wholesale on completion rather than transitioning it to done/error in place. */
function latticeSpinner(label) {
  const inst = latticeCreate({ label });
  return inst.el;
}

window.NovaUI.lattice = { create: latticeCreate, spinner: latticeSpinner };
})();
