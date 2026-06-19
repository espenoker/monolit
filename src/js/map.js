// Scroll-triggered draw-on animation for the world map.
// Uses a clip-path inset sweep on the wrapper div (not the img) so the
// IntersectionObserver — which can misread intersection ratio when the
// target itself carries clip-path — sees the unclipped section instead.
import { reducedMotion } from './scribbles.js';

export function initMap() {
  const wrap = document.querySelector('.world-map-wrap');
  if (!wrap || reducedMotion) return;

  const section = wrap.closest('section') || wrap.parentElement;

  wrap.setAttribute('data-map-draw', '');

  const reveal = () => wrap.classList.add('is-drawn');

  const io = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        io.disconnect();
        reveal();
      }
    },
    { threshold: 0.15 }
  );

  io.observe(section);
}
