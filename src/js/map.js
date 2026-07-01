import { reducedMotion } from './scribbles.js';

export function initMap() {
  const svg = document.querySelector('.world-map');
  if (!svg || reducedMotion) return;

  const paths = Array.from(svg.querySelectorAll('path, line'));

  // Pre-measure and set up dash state while invisible
  paths.forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
    p.style.opacity = '1';
  });

  const section = svg.closest('section') || svg.parentElement;

  const io = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();

      const DURATION = 2000; // ms total animation
      const MAX_STAGGER = 600; // ms max delay spread

      paths.forEach((p) => {
        const stagger = Math.random() * MAX_STAGGER;
        p.style.transition = `stroke-dashoffset ${DURATION}ms cubic-bezier(0.4,0,0.2,1) ${stagger}ms`;
        p.style.strokeDashoffset = '0';
      });

      const markers = Array.from(svg.querySelectorAll('.map-marker'));
      const oslo = markers.find((m) => m.dataset.city === 'Oslo');
      const osloX = oslo ? +oslo.getAttribute('x') + +oslo.getAttribute('width')  / 2 : 0;
      const osloY = oslo ? +oslo.getAttribute('y') + +oslo.getAttribute('height') / 2 : 0;
      const byDist = markers.slice().sort((a, b) => {
        const dist = (m) => {
          const cx = +m.getAttribute('x') + +m.getAttribute('width')  / 2;
          const cy = +m.getAttribute('y') + +m.getAttribute('height') / 2;
          return Math.hypot(cx - osloX, cy - osloY);
        };
        return dist(a) - dist(b);
      });
      const MARKER_START   = MAX_STAGGER + DURATION + 100;
      const MARKER_STAGGER = 120;
      byDist.forEach((m, i) => {
        setTimeout(() => m.classList.add('is-visible'), MARKER_START + i * MARKER_STAGGER);
      });
    },
    { threshold: 0.15 }
  );

  io.observe(section);
}
