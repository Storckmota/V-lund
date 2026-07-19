// Mede o percurso do módulo do CTA dividido: largura do botão menos o
// módulo (42px) e os respiros laterais (5px + 5px). O CSS anima só
// transform — sem layout shift; o valor acompanha resize e carregamento
// da fonte via ResizeObserver.

const INSET = 52; // módulo 42 + padding 5 de cada lado

export function initCtaSplit() {
  const btn = document.querySelector('.btn-split');
  if (!btn) return;

  const set = () => {
    btn.style.setProperty('--cta-travel', `${Math.max(0, btn.clientWidth - INSET)}px`);
  };

  set();
  if ('ResizeObserver' in window) {
    new ResizeObserver(set).observe(btn);
  } else {
    window.addEventListener('resize', set, { passive: true });
  }
}
