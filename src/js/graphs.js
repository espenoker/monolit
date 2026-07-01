import { reducedMotion } from './scribbles.js';
import convexRaw   from '../assets/graphs/Convex curves.svg?raw';
import bellRaw     from '../assets/graphs/Bell_curve.svg?raw';
import noisyRaw    from '../assets/graphs/Noisy trend.svg?raw';
import scatterRaw  from '../assets/graphs/Scatter_trend.svg?raw';

// lineCount: how many leading paths are the trend line (rest are scatter dots)
const GRAPHS = [
  { raw: convexRaw },
  { raw: bellRaw },
  { raw: noisyRaw },
  { raw: scatterRaw, dotStart: 2 },
];

const DRAW_MS       = 2200;
const HOLD_MS       = 2300;
const DASH_MAX_LEN  = 40; // paths shorter than this are treated as dash segments

export function initGraphs() {
  const stage = document.querySelector('.graph-stage');
  if (!stage || reducedMotion) return;

  const section = stage.closest('section');
  let current = 0;
  let running = false;
  let pendingTimers = [];

  function scheduleTimer(fn, delay) {
    const t = setTimeout(fn, delay);
    pendingTimers.push(t);
  }

  function loadGraph({ raw, dotStart }) {
    pendingTimers.forEach(clearTimeout);
    pendingTimers = [];

    stage.innerHTML = raw;
    const svg = stage.querySelector('svg');
    if (!svg) return;
    svg.setAttribute('preserveAspectRatio', 'xMinYMax meet');

    const els = [...svg.querySelectorAll('path, line, polyline, polygon')];

    // Split into scatter dots (explicit range), dash segments (auto-detected by length), and lines
    const dotEls  = dotStart != null ? els.slice(dotStart) : [];
    const drawEls = dotStart != null ? els.slice(0, dotStart) : els;

    const dashEls = [];
    const lineEls = [];
    drawEls.forEach((el) => {
      try {
        const len = el.getTotalLength();
        if (len < DASH_MAX_LEN) { dashEls.push(el); }
        else                    { lineEls.push(el); }
      } catch (_) {
        lineEls.push(el);
      }
    });

    // Hide dots and dashes initially
    dotEls.forEach((el)  => { el.style.opacity = '0'; });
    dashEls.forEach((el) => { el.style.opacity = '0'; });

    // Animate main line paths with stroke-dashoffset
    lineEls.forEach((el) => {
      try {
        const len = el.getTotalLength();
        el.style.strokeDasharray  = len;
        el.style.strokeDashoffset = len;
      } catch (_) {}
    });

    // Force reflow before transitioning
    svg.getBoundingClientRect();

    lineEls.forEach((el) => {
      if (!el.style.strokeDasharray) return;
      el.style.transition = `stroke-dashoffset ${DRAW_MS}ms cubic-bezier(0.4,0,0.2,1)`;
      el.style.strokeDashoffset = '0';
    });

    // Stagger dashes top-to-bottom across DRAW_MS
    if (dashEls.length) {
      const sorted = [...dashEls].sort((a, b) => a.getBBox().y - b.getBBox().y);
      const spread = DRAW_MS * 0.9;
      sorted.forEach((el, i) => {
        const delay = (i / Math.max(sorted.length - 1, 1)) * spread;
        scheduleTimer(() => {
          el.style.transition = 'opacity 80ms ease';
          el.style.opacity = '1';
        }, delay);
      });
    }

    // Stagger scatter dots randomly across DRAW_MS
    if (dotEls.length) {
      const shuffled = [...dotEls].sort(() => Math.random() - 0.5);
      const spread = DRAW_MS * 0.9;
      shuffled.forEach((el, i) => {
        const delay = (i / Math.max(shuffled.length - 1, 1)) * spread;
        scheduleTimer(() => {
          el.style.transition = 'opacity 120ms ease';
          el.style.opacity = '1';
        }, delay);
      });
    }
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function cycle() {
    loadGraph(GRAPHS[current]);

    while (running) {
      await wait(DRAW_MS + HOLD_MS);
      if (!running) break;

      current = (current + 1) % GRAPHS.length;
      loadGraph(GRAPHS[current]);
    }
  }

  const io = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !running) {
        running = true;
        cycle();
      } else if (!entries[0].isIntersecting && running) {
        running = false;
      }
    },
    { threshold: 0.3 }
  );

  io.observe(section);
}
