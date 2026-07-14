/* Motion — revelar por recorte, deslocar planos, progressão do método.
   Tudo desativado com prefers-reduced-motion. */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktop = window.matchMedia('(min-width: 769px)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

export function initMotion() {
  if (reducedMotion.matches) return;

  initReveals();
  initPlanes();
  initHeroCursor();
  initMetodo();
}

function initReveals() {
  const targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  // threshold 0: elementos com clip-path têm intersectionRatio sempre 0,
  // então o disparo precisa ser pela entrada do bounding box no viewport.
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: '0px 0px -12% 0px' }
  );

  targets.forEach((el) => io.observe(el));
}

/* Parallax leve: planos do case deslocam em velocidades diferentes */
function initPlanes() {
  const planes = [
    ...document.querySelectorAll('.case-opening [data-plane]'),
    ...document.querySelectorAll('.case-opening [data-plane-slow]'),
  ];
  if (!planes.length) return;

  let ticking = false;

  const update = () => {
    ticking = false;
    const mid = window.innerHeight / 2;
    planes.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - mid) / window.innerHeight;
      const factor = el.hasAttribute('data-plane-slow') ? -60 : -28;
      el.style.setProperty('--plane-y', `${(offset * factor).toFixed(1)}px`);
    });
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}

/* O plano de projeto do hero responde ao cursor (somente ponteiro fino) */
function initHeroCursor() {
  if (!finePointer.matches) return;

  const hero = document.querySelector('.hero');
  const figure = document.querySelector('.hero-figure');
  if (!hero || !figure) return;

  let raf = 0;

  hero.addEventListener('pointermove', (event) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const x = (event.clientX / window.innerWidth - 0.5) * -14;
      const y = (event.clientY / window.innerHeight - 0.5) * -10;
      figure.style.setProperty('--plane-x', `${x.toFixed(1)}px`);
      figure.style.setProperty('--plane-y', `${y.toFixed(1)}px`);
    });
  });

  hero.addEventListener('pointerleave', () => {
    cancelAnimationFrame(raf);
    figure.style.setProperty('--plane-x', '0px');
    figure.style.setProperty('--plane-y', '0px');
  });
}

/* Método: a etapa ativa acompanha o avanço do scroll no palco sticky */
function initMetodo() {
  const track = document.querySelector('[data-metodo]');
  if (!track) return;

  const steps = [...track.querySelectorAll('[data-step]')];
  const bar = track.querySelector('[data-metodo-bar]');
  const count = track.querySelector('[data-metodo-atual]');
  if (steps.length < 2) return;

  let active = 0;
  let ticking = false;

  const update = () => {
    ticking = false;
    if (!desktop.matches) return;

    const rect = track.getBoundingClientRect();
    const range = rect.height - window.innerHeight;
    if (range <= 0) return;

    const progress = Math.min(1, Math.max(0, -rect.top / range));
    const index = Math.min(steps.length - 1, Math.floor(progress * steps.length));

    if (index !== active) {
      steps[active].classList.remove('is-active');
      steps[index].classList.add('is-active');
      active = index;
      if (count) count.textContent = String(index + 1).padStart(2, '0');
    }

    if (bar) {
      const fill = (index + 1) / steps.length;
      bar.style.transform = `scaleX(${fill.toFixed(3)})`;
    }
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}
