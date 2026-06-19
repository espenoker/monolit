export function initLogomark() {
  const marks = Array.from(document.querySelectorAll('.hero__mark .mark, .impact__mark .mark'));
  if (!marks.length) return;

  const FRAMES = ['01','02','03','04','05','06','07','08','09'];
  const FRAME_MS = 65;

  function currentIndex(mark) {
    const use = mark.querySelector('use');
    if (!use) return 0;
    const id = use.getAttribute('href').replace('#Logo_animation_frame_', '');
    const idx = FRAMES.indexOf(id);
    return idx === -1 ? 0 : idx;
  }

  function play(mark, forward) {
    if (mark._timer) clearInterval(mark._timer);
    let idx = currentIndex(mark);

    mark._timer = setInterval(() => {
      idx = Math.max(0, Math.min(FRAMES.length - 1, idx + (forward ? 1 : -1)));
      const use = mark.querySelector('use');
      if (use) use.setAttribute('href', `#Logo_animation_frame_${FRAMES[idx]}`);
      if ((forward && idx >= FRAMES.length - 1) || (!forward && idx <= 0)) {
        clearInterval(mark._timer);
        mark._timer = null;
      }
    }, FRAME_MS);
  }

  // ── Hero mark: triggered by scroll (fires as soon as hero top edge leaves viewport) ──
  const heroMarks = Array.from(document.querySelectorAll('.hero__mark .mark'));
  const heroSection = document.querySelector('.hero');
  let heroVisible = true;

  heroMarks.forEach(mark => {
    const use = mark.querySelector('use');
    if (use) use.setAttribute('href', '#Logo_animation_frame_01');
    play(mark, true);
  });

  if (heroSection) {
    window.addEventListener('scroll', () => {
      const nowVisible = heroSection.getBoundingClientRect().top >= 0;
      if (nowVisible !== heroVisible) {
        heroVisible = nowVisible;
        heroMarks.forEach(mark => play(mark, nowVisible));
      }
    }, { passive: true });
  }

  // The impact mark is driven separately by building.js (scroll-band tower).
}
