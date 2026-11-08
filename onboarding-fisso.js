// Onboarding "Numero fisso": il passo più vicino al centro dello schermo accende numero e indice
(() => {
  const grid = document.querySelector('[data-obf]');
  if (!grid) return;
  const steps = [...grid.querySelectorAll('.obf-step')];
  const idx = [...grid.querySelectorAll('.obf-idx li')];
  const num = grid.querySelector('[data-obf-num]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  steps.forEach((s, i) => s.setAttribute('data-n', String(i + 1)));
  let cur = 0, ticking = false;

  function frame() {
    ticking = false;
    const vh = innerHeight;
    let best = 0, bd = Infinity;
    steps.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - vh * 0.5);
      if (d < bd) { bd = d; best = i; }
    });
    if (best === cur) return;
    cur = best;
    steps.forEach((s, i) => s.classList.toggle('is-on', i === best));
    idx.forEach((s, i) => s.classList.toggle('is-on', i === best));
    if (reduce) { num.textContent = best + 1; return; }
    num.classList.add('is-swap');
    setTimeout(() => { num.textContent = best + 1; num.classList.remove('is-swap'); }, 180);
  }
  const ask = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);
  frame();
})();
