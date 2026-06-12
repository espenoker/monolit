// Live office clocks, updated on the minute.

export function initClocks() {
  const els = [...document.querySelectorAll('[data-tz]')];
  const formats = new Map();

  const tick = () => {
    const now = new Date();
    els.forEach((el) => {
      const tz = el.dataset.tz;
      if (!formats.has(tz)) {
        formats.set(
          tz,
          new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: tz,
          })
        );
      }
      el.textContent = formats.get(tz).format(now);
    });
  };

  tick();
  setTimeout(() => {
    tick();
    setInterval(tick, 60_000);
  }, (61 - new Date().getSeconds()) * 1000);
}
