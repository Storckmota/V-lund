// Corpo do site abaixo da hero: revelações por IntersectionObserver,
// progressão do processo, medição do CTA de fechamento e interação do
// mastro do footer. Nenhum código aqui toca a primeira dobra.
// Sem JS, todo o conteúdo permanece visível (estados iniciais são
// gated por html.js + prefers-reduced-motion no CSS).

export function initBelowFold() {
  initReveals();
  initProcess();
  initCloseButton();
  initFooterMast();
}

/* revela [data-bf] quando o wrapper entra na viewport */
function initReveals() {
  const els = [...document.querySelectorAll('[data-bf]')];
  if (!els.length) return;

  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('bf-in'));
    return;
  }

  // elementos mascarados ficam fora do clip do pai antes de revelar:
  // observa-se o wrapper .bf-mask, não o próprio span
  const watchOf = (el) => (el.parentElement?.classList.contains('bf-mask') ? el.parentElement : el);
  const groups = new Map();
  els.forEach((el) => {
    const w = watchOf(el);
    if (!groups.has(w)) groups.set(w, []);
    groups.get(w).push(el);
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (groups.get(entry.target) || []).forEach((el) => el.classList.add('bf-in'));
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
  );

  groups.forEach((_, w) => io.observe(w));

  // reload no meio da página: revela o que já está visível
  const scanVisible = () => {
    groups.forEach((items, w) => {
      const r = w.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) {
        items.forEach((el) => el.classList.add('bf-in'));
        io.unobserve(w);
      }
    });
  };
  requestAnimationFrame(scanVisible);
  window.addEventListener('hashchange', () => requestAnimationFrame(scanVisible));
}

/* etapas do processo acendem conforme entram; anteriores permanecem */
function initProcess() {
  const steps = [...document.querySelectorAll('.prc-step')];
  if (!steps.length) return;

  if (!('IntersectionObserver' in window)) {
    steps.forEach((s) => s.classList.add('prc-on'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('prc-on');
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.6, rootMargin: '0px 0px -10% 0px' },
  );

  steps.forEach((s) => io.observe(s));
}

/* percurso do módulo do CTA final (mesma gramática do CTA da hero,
   medido de forma independente para não tocar código da primeira dobra) */
function initCloseButton() {
  const btn = document.querySelector('.close-btn');
  if (!btn) return;
  const INSET = 56; // módulo 46 + padding 5 de cada lado
  const set = () => {
    btn.style.setProperty('--close-travel', `${Math.max(0, btn.clientWidth - INSET)}px`);
  };
  set();
  if ('ResizeObserver' in window) {
    new ResizeObserver(set).observe(btn);
  } else {
    window.addEventListener('resize', set, { passive: true });
  }
}

/* mastro do footer: fatias do wordmark sobem sob o ponteiro e assentam
   com amortecimento — princípio aprovado da v3, portado sem GSAP */
function initFooterMast() {
  const mast = document.querySelector('[data-ft-mast]');
  const footer = document.querySelector('.ft');
  if (!mast || !footer) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  if (!fine.matches || reduced.matches) return;

  const slices = [...mast.querySelectorAll('.ft-slice')];
  if (!slices.length) return;

  const target = new Float32Array(slices.length);
  const current = new Float32Array(slices.length);
  let raf = 0;
  let running = false;

  const frame = () => {
    let live = false;
    for (let i = 0; i < slices.length; i += 1) {
      current[i] += (target[i] - current[i]) * 0.16;
      if (Math.abs(target[i] - current[i]) > 0.05 || Math.abs(current[i]) > 0.05) live = true;
      slices[i].style.transform = `translateY(${current[i].toFixed(2)}px)`;
    }
    if (!live) {
      running = false;
      slices.forEach((s) => { s.style.transform = ''; });
      return;
    }
    raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (running || reduced.matches) return;
    running = true;
    raf = requestAnimationFrame(frame);
  };

  footer.addEventListener('pointermove', (e) => {
    const r = mast.getBoundingClientRect();
    if (r.height === 0) return;
    const nx = (e.clientX - r.left) / r.width;
    const vy = Math.max(0, 1 - Math.abs(e.clientY - (r.top + r.height * 0.5)) / (r.height * 1.4));
    for (let i = 0; i < slices.length; i += 1) {
      const cx = (i + 0.5) / slices.length;
      const d = nx - cx;
      target[i] = -Math.exp(-(d * d) / 0.02) * 22 * vy;
    }
    wake();
  }, { passive: true });

  footer.addEventListener('pointerleave', () => {
    target.fill(0);
    wake();
  });

  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      cancelAnimationFrame(raf);
      running = false;
      target.fill(0);
      current.fill(0);
      slices.forEach((s) => { s.style.transform = ''; });
    }
  });
}
