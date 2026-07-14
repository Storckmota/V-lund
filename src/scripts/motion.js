// Motion: reveals com IntersectionObserver, etapa corrente do método
// e parallax muito leve no manifesto. Apenas transform e opacity.
export function initMotion() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  // Reveals
  const revealed = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
  );

  // Stagger leve para grupos: irmãos data-reveal ganham atraso incremental.
  document.querySelectorAll('[data-reveal="group"]').forEach((group) => {
    group.querySelectorAll('[data-reveal="rise"]').forEach((el, i) => {
      el.style.setProperty('--reveal-delay', `${Math.min(i * 90, 450)}ms`);
    });
    group.classList.add('in');
  });

  revealed.forEach((el) => {
    if (el.dataset.reveal !== 'group') io.observe(el);
  });

  // Método: destaca uma única etapa, a mais próxima do centro da viewport.
  const steps = document.querySelectorAll('[data-steps] .step');
  if (steps.length) {
    const stepIO = new IntersectionObserver(
      (entries) => {
        const entering = entries.find((entry) => entry.isIntersecting);
        if (!entering) return;
        steps.forEach((step) => {
          step.classList.toggle('current', step === entering.target);
        });
      },
      { rootMargin: '-46% 0px -46% 0px' }
    );
    steps.forEach((step) => stepIO.observe(step));
  }

  // Parallax muito leve, apenas com ponteiro fino (desktop).
  const plxTargets = document.querySelectorAll('[data-parallax]');
  if (plxTargets.length && window.matchMedia('(pointer: fine)').matches) {
    let raf = null;
    const update = () => {
      raf = null;
      const vh = window.innerHeight;
      plxTargets.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        el.style.setProperty('--plx', `${(-progress * 0.06 * vh).toFixed(1)}px`);
      });
    };
    window.addEventListener(
      'scroll',
      () => {
        if (raf === null) raf = requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
  }
}
