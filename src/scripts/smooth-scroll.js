// Física global de scroll (Lenis) integrada ao ticker do GSAP.
// Uma única instância, um único loop: o Lenis roda dentro do ticker e o
// ScrollTrigger é atualizado pelo evento de scroll do Lenis. O scroll real
// da página é preservado (sem wrapper transformado): sticky, fixed e as
// cenas pinned continuam funcionando. Em touch a inércia nativa permanece
// (syncTouch desligado); em prefers-reduced-motion nenhuma suavização é
// criada e as âncoras voltam ao comportamento nativo.

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis = null;

export function getLenis() {
  return lenis;
}

export function initSmoothScroll() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const raf = (time) => {
    lenis?.raf(time * 1000);
  };

  const start = () => {
    if (lenis) return;
    lenis = new Lenis({
      // levemente pesado, sem virar borracha: resposta rápida com peso curto
      lerp: 0.115,
      wheelMultiplier: 1,
      smoothWheel: true,
      // touch permanece nativo (inércia do sistema); nada de simulação
      syncTouch: false,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
  };

  const stop = () => {
    if (!lenis) return;
    gsap.ticker.remove(raf);
    lenis.destroy();
    lenis = null;
  };

  if (!reduce.matches) start();
  reduce.addEventListener('change', (e) => (e.matches ? stop() : start()));

  bindAnchors(reduce);

  // recálculo das cenas depois de fontes e do load completo (imagens)
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

function bindAnchors(reduce) {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    history.pushState(null, '', id);

    const settle = () => {
      // foco acompanha a âncora sem novo scroll
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };

    if (lenis && !reduce.matches) {
      lenis.scrollTo(target, {
        offset: -24,
        duration: 1.1,
        easing: (t) => 1 - Math.pow(1 - t, 4),
        onComplete: settle,
      });
    } else {
      target.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' });
      settle();
    }
  });
}
