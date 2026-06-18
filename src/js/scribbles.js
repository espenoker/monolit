// Generic draw-on engine for hand-drawn SVG scribbles.
// Paths with vector-effect:non-scaling-stroke need pixel-space dasharray/dashoffset
// (the browser interprets those values in screen pixels, not pathLength units).
// Paths without it use pathLength="1" normalization: dashoffset 1.03 → 0.

const EASE = 'cubic-bezier(0.5, 0.05, 0.55, 0.95)';

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Returns the path length in screen pixels, accounting for the SVG's CTM scale.
function pixelLength(path) {
  const ctm = path.getScreenCTM();
  const scale = ctm ? Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) : 1;
  return path.getTotalLength() * scale;
}

// Sets pixel-accurate dasharray/dashoffset for non-scaling paths (overriding
// the CSS 1/1.03 values which would be interpreted as 1px and leave the path
// visible). Returns the start dashoffset value for the animation keyframe.
function prepPath(path) {
  if (getComputedStyle(path).vectorEffect !== 'non-scaling-stroke') return 1.03;
  const len = pixelLength(path);
  path.style.strokeDasharray = `${len} ${len * 1.05}`;
  path.style.strokeDashoffset = len;
  return len;
}

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
    const startOffset = prepPath(p);
    const d = (duration * weights[i]) / total;
    const anim = p.animate(
      [{ strokeDashoffset: startOffset }, { strokeDashoffset: 0 }],
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
  // Pre-initialize non-scaling paths so their CSS 1px dasharray doesn't flash
  // visible before draw() is called.
  document.querySelectorAll('[data-scribble] .draw-path').forEach(prepPath);

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
