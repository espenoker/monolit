// Generic draw-on engine for hand-drawn SVG scribbles.
// Every path inside an svg[data-scribble] carries pathLength="1", so the
// CSS initial state (dasharray 1 1 / dashoffset 1) hides it fully and the
// animation is a normalized 1 -> 0 sweep regardless of geometry or scale.

const EASE = 'cubic-bezier(0.5, 0.05, 0.55, 0.95)';

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Draws all paths of one scribble svg in sequence; duration is split
// across paths proportional to their data-w weight (default 1).
// Resolves when the whole scribble is on the page.
export function draw(svg) {
  const paths = [...svg.querySelectorAll('.draw-path')];

  if (reducedMotion) {
    paths.forEach((p) => (p.style.strokeDashoffset = '0'));
    svg.classList.add('is-drawn');
    return Promise.resolve();
  }

  const duration = Number(svg.dataset.duration || 700);
  const gap = svg.dataset.gap !== undefined ? Number(svg.dataset.gap) : 80;
  const weights = paths.map((p) => Number(p.dataset.w || 1));
  const total = weights.reduce((a, b) => a + b, 0);

  let t = Number(svg.dataset.delay || 0);
  const finished = paths.map((p, i) => {
    const d = (duration * weights[i]) / total;
    const anim = p.animate(
      [{ strokeDashoffset: 1.03 }, { strokeDashoffset: 0 }],
      { duration: d, delay: t, easing: EASE, fill: 'forwards' }
    );
    t += d + gap;
    return anim.finished.then(() => {
      p.style.strokeDashoffset = '0';
      anim.cancel();
    });
  });

  return Promise.all(finished).then(() => svg.classList.add('is-drawn'));
}

// Scroll-triggered scribbles. The hero ellipse opts out with
// data-scribble="manual" and is driven by hero-pen.js instead.
export function initScribbles() {
  const svgs = [...document.querySelectorAll('svg[data-scribble]')].filter(
    (svg) => svg.dataset.scribble !== 'manual'
  );

  if (reducedMotion) {
    svgs.forEach(draw);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          draw(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4, rootMargin: '0px 0px -8% 0px' }
  );

  svgs.forEach((svg) => io.observe(svg));
}
