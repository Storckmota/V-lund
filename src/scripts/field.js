// Campo da hero: o V e a copy respondem ao ponteiro em planos opostos.
// Só com ponteiro fino, sem reduced motion; no touch a composição é estática.
export function initField() {
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const prm = matchMedia('(prefers-reduced-motion: reduce)');
  if (!fine.matches || prm.matches) return;

  const hero = document.querySelector('.hero');
  const planes = document.querySelectorAll('[data-plane]');
  if (!hero || !planes.length) return;

  const depth = { deep: 16, near: -6 };
  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;
  let raf = null;

  const tick = () => {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    planes.forEach((plane) => {
      const d = depth[plane.dataset.plane] || 0;
      plane.style.transform = `translate3d(${(cx * d).toFixed(2)}px, ${(cy * d).toFixed(2)}px, 0)`;
    });
    if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = null;
    }
  };

  const wake = () => {
    if (raf === null) raf = requestAnimationFrame(tick);
  };

  const onMove = (event) => {
    const rect = hero.getBoundingClientRect();
    tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    wake();
  };

  const onLeave = () => {
    tx = 0;
    ty = 0;
    wake();
  };

  const start = () => {
    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', onLeave);
  };

  if (document.documentElement.classList.contains('intro')) {
    document.addEventListener('volund:introdone', start, { once: true });
  } else {
    start();
  }
}
