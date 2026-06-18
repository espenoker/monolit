// Hero interaction: the brand ellipse draws itself in on load, then the
// cursor becomes a pen and the hero accepts freehand ink. Fine pointers
// only — touch devices just get the animated scribble.

import { draw, reducedMotion } from './scribbles.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const MAX_POINTS = 12000; // safety valve per session

export function initHeroPen() {
  const hero = document.getElementById('hero');
  const scribble = hero.querySelector('svg[data-scribble="manual"]');

  const begin = () =>
    draw(scribble).then(() => {
      if (matchMedia('(pointer: fine)').matches) enablePen(hero);
    });

  if (reducedMotion) begin();
  else setTimeout(begin, 600);
}

function enablePen(hero) {
  const ink = document.createElementNS(SVG_NS, 'svg');
  ink.classList.add('hero-ink');
  ink.setAttribute('aria-hidden', 'true');
  hero.appendChild(ink);
  hero.classList.add('is-inkable');

  const clearBtn = hero.querySelector('.hero-clear');

  let path = null;
  let d = '';
  let last = null;
  let points = 0;

  const pos = (e) => {
    const r = ink.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  hero.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || points >= MAX_POINTS) return;
    if (e.target.closest('.hero-clear')) return;
    hero.setPointerCapture(e.pointerId);

    last = pos(e);
    d = `M ${last.x.toFixed(1)} ${last.y.toFixed(1)} l 0 0.01`;
    path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    ink.appendChild(path);
  });

  hero.addEventListener('pointermove', (e) => {
    if (!path) return;
    const p = pos(e);
    const dx = p.x - last.x;
    const dy = p.y - last.y;
    if (dx * dx + dy * dy < 6) return; // ignore sub-pixel jitter

    // Quadratic midpoint smoothing: curve through the midpoint of
    // consecutive samples with the previous sample as control point.
    const mx = (p.x + last.x) / 2;
    const my = (p.y + last.y) / 2;
    d += ` Q ${last.x.toFixed(1)} ${last.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    path.setAttribute('d', d);
    last = p;

    if (++points >= MAX_POINTS) endStroke();
  });

  const endStroke = () => {
    if (!path) return;
    path = null;
    clearBtn.classList.add('is-visible');
  };

  hero.addEventListener('pointerup', endStroke);
  hero.addEventListener('pointercancel', endStroke);

  clearBtn.addEventListener('click', () => {
    ink.replaceChildren();
    points = 0;
    clearBtn.classList.remove('is-visible');
  });
}
