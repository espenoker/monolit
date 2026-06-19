// Scroll-driven "Monolit" building animation for the impact section only.
// The tower builds up frame 01 -> 16 while the mark sits inside the
// 25%-75% viewport band, and un-builds (reverse) once it leaves the band
// in either direction. The 16 frames live in an inlined hidden sprite.

import sprite from '../assets/monolit-frames.svg?raw';
import { reducedMotion } from './scribbles.js';

const FRAMES = Array.from({ length: 16 }, (_, i) => String(i + 1).padStart(2, '0'));
const FRAME_MS = 45;

export function initBuilding() {
  const mark = document.querySelector('.impact__mark .mark');
  if (!mark) return;
  const use = mark.querySelector('use');
  if (!use) return;

  // Inject the frame sprite once so the local #Monolit_frameNN refs resolve.
  if (!document.getElementById('Monolit_frame16')) {
    const holder = document.createElement('div');
    holder.innerHTML = sprite;
    document.body.insertBefore(holder.firstElementChild, document.body.firstChild);
  }

  const setFrame = (i) => use.setAttribute('href', `#Monolit_frame${FRAMES[i]}`);

  let idx = 0;
  setFrame(0);

  if (reducedMotion) {
    // No animation: show the finished tower whenever it's on screen.
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setFrame(e.isIntersecting ? FRAMES.length - 1 : 0)),
      { threshold: 0.1 }
    );
    io.observe(mark);
    return;
  }

  let timer = null;
  let dir = 0; // -1 reverse, 0 idle, 1 forward

  function play(forward) {
    const want = forward ? 1 : -1;
    if (dir === want) return;
    dir = want;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      const next = idx + dir;
      if (next < 0 || next > FRAMES.length - 1) {
        clearInterval(timer);
        timer = null;
        dir = 0;
        return;
      }
      idx = next;
      setFrame(idx);
    }, FRAME_MS);
  }

  // Built while the mark's centre sits within the 25%-75% viewport band;
  // crossing 75% on the way in starts the build, crossing 25% reverses it.
  let built = false;
  function onScroll() {
    const r = mark.getBoundingClientRect();
    const p = (r.top + r.height / 2) / window.innerHeight;
    const inBand = p > 0.25 && p < 0.75;
    if (inBand && !built) {
      built = true;
      play(true);
    } else if (!inBand && built) {
      built = false;
      play(false);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();
}
