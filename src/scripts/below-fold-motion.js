// Motion do corpo abaixo da hero (GSAP + ScrollTrigger), na ordem da página:
// tese -> serviços -> projetos -> processo -> estúdio -> CTA/footer.
// Contextos via gsap.matchMedia: desktop ganha a cena pinned da tese, a
// ativação do palco de serviços e o stacking do processo; mobile recebe
// sequências lineares curtas; reduced motion não cria nada (o conteúdo é
// visível por padrão — estados iniciais só existem aqui, nunca no CSS).
// O palco de serviços troca de composição por CSS (data-svc-state): o GSAP
// nunca tweena elementos que têm transition no CSS.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function initBelowFoldMotion() {
  const mm = gsap.matchMedia();

  mm.add(
    {
      desktop: '(min-width: 900px)',
      mobile: '(max-width: 899.98px)',
      motionOK: '(prefers-reduced-motion: no-preference)',
    },
    (ctx) => {
      const { desktop, motionOK } = ctx.conditions;
      if (!motionOK) return undefined;

      const cleanups = [
        sceneTese(desktop),
      ].filter(Boolean);

      return () => cleanups.forEach((fn) => fn());
    },
  );
}

/* ---------- 02 · tese: cena narrativa curta ---------- */

function sceneTese(desktop) {
  const tese = $('.tese');
  if (!tese) return undefined;

  const l1 = $('[data-tese-l1]', tese);
  const l2 = $('[data-tese-l2]', tese);
  const title = $('.tese-title', tese);
  const lead = $('[data-tese-lead]', tese);
  const cenIntro = $('[data-tese-cen-intro]', tese);
  const cens = $$('[data-tese-cen]', tese);
  const close = $('[data-tese-close]', tese);
  const ember = $('.tese-ember', tese);

  if (!desktop) {
    // fluxo linear: headline em duas etapas, cenários por máscara + deslocamento
    gsap.from(l1, {
      yPercent: 115,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: l1, start: 'top 88%', once: true },
    });
    gsap.from(l2, {
      yPercent: 115,
      duration: 0.9,
      delay: 0.12,
      ease: 'power3.out',
      scrollTrigger: { trigger: l2, start: 'top 88%', once: true },
    });
    gsap.from(lead, {
      autoAlpha: 0,
      y: 36,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: lead, start: 'top 86%', once: true },
    });
    gsap.from(cenIntro, {
      autoAlpha: 0,
      duration: 0.7,
      scrollTrigger: { trigger: cenIntro, start: 'top 88%', once: true },
    });
    cens.forEach((cen) => {
      gsap.from($('.tese-cen-in', cen), {
        yPercent: 115,
        x: 28,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: cen, start: 'top 90%', once: true },
      });
    });
    gsap.from(close, {
      autoAlpha: 0,
      y: 28,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: close, start: 'top 90%', once: true },
    });
    gsap.from(ember, {
      scale: 0,
      duration: 0.5,
      ease: 'back.out(2)',
      scrollTrigger: { trigger: close, start: 'top 90%', once: true },
    });
    return undefined;
  }

  // desktop: cena curta — entrada (linhas por máscara), desenvolvimento
  // (cenários um por vez no mesmo palco), saída (fecho assume o foco)
  tese.classList.add('is-scene');
  const pinEl = $('[data-tese-pin]', tese);

  // as linhas saem da máscara em direções complementares antes do pin travar
  const intro = gsap.timeline({
    scrollTrigger: { trigger: pinEl, start: 'top 80%', end: 'top top', scrub: 0.5 },
  });
  intro
    .from(l1, { yPercent: 115, ease: 'none' }, 0)
    .from(l2, { yPercent: 115, ease: 'none' }, 0.25);

  gsap.set(l1, { x: '-4vw' });
  gsap.set(l2, { x: '4vw' });
  gsap.set([lead, cenIntro, close], { autoAlpha: 0, y: 44 });
  gsap.set(cens, { autoAlpha: 0, y: 52 });
  gsap.set(ember, { scale: 0 });

  const tl = gsap.timeline({
    defaults: { ease: 'power2.out' },
    scrollTrigger: {
      trigger: pinEl,
      start: 'top top',
      end: '+=150%',
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      fastScrollEnd: true,
      refreshPriority: 30,
    },
  });

  tl
    // entrada: as duas linhas se estabilizam no eixo
    .to(l1, { x: 0, duration: 1.1 }, 0)
    .to(l2, { x: 0, duration: 1.1 }, 0.1)
    // desenvolvimento: o argumento entra e o título entrega o foco
    .to(lead, { autoAlpha: 1, y: 0, duration: 0.8 }, 1.0)
    .to(title, { autoAlpha: 0.42, y: '-2.5vh', duration: 0.9 }, 1.9)
    .to(cenIntro, { autoAlpha: 1, y: 0, duration: 0.6 }, 2.0)
    // cenários: um por vez, saída completa antes do próximo
    .to(cens[0], { autoAlpha: 1, y: 0, duration: 0.7 }, 2.7)
    .to(cens[0], { autoAlpha: 0, y: -40, duration: 0.5, ease: 'power2.in' }, 4.1)
    .to(cens[1], { autoAlpha: 1, y: 0, duration: 0.7 }, 4.65)
    .to(cens[1], { autoAlpha: 0, y: -40, duration: 0.5, ease: 'power2.in' }, 6.05)
    .to(cens[2], { autoAlpha: 1, y: 0, duration: 0.7 }, 6.6)
    .to(cens[2], { autoAlpha: 0.35, duration: 0.6 }, 8.1)
    // saída: o fecho assume e a composição abre espaço para Serviços
    .to(lead, { autoAlpha: 0.35, duration: 0.6 }, 8.1)
    .to(close, { autoAlpha: 1, y: 0, duration: 0.8 }, 8.4)
    .to(ember, { scale: 1, duration: 0.4, ease: 'back.out(2)' }, 8.9)
    .to({}, { duration: 0.6 }, 9.4);

  return () => tese.classList.remove('is-scene');
}
