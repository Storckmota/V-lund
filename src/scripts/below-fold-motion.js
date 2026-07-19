// Motion do corpo abaixo da hero (GSAP + ScrollTrigger).
// Contextos via gsap.matchMedia: desktop ganha as cenas pinned (tese e
// processo); mobile recebe sequências lineares; reduced motion não cria
// nada (o conteúdo é visível por padrão — os estados iniciais só existem
// aqui, nunca no CSS). O cleanup dos contextos devolve o DOM ao estado
// de fluxo (classes .is-scene removidas, transforms revertidos).

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
        sceneServicos(),
        sceneProjetos(),
        sceneProcesso(desktop),
        sceneEstudio(desktop),
        sceneClose(),
        sceneFooter(),
      ].filter(Boolean);

      return () => cleanups.forEach((fn) => fn());
    },
  );
}

/* ---------- 02 · tese: cena narrativa ---------- */

function sceneTese(desktop) {
  const tese = $('.tese');
  if (!tese) return undefined;

  const l1 = $('[data-tese-l1]', tese);
  const l2 = $('[data-tese-l2]', tese);
  const lead = $('[data-tese-lead]', tese);
  const cenIntro = $('[data-tese-cen-intro]', tese);
  const cens = $$('[data-tese-cen]', tese);
  const close = $('[data-tese-close]', tese);
  const ember = $('.tese-ember', tese);

  if (!desktop) {
    // sequência linear: máscaras e slides curtos, sem pin
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
    cens.forEach((cen, i) => {
      gsap.from(cen, {
        autoAlpha: 0,
        x: i % 2 ? 44 : -44,
        duration: 0.85,
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

  // desktop: palco pinned com começo (título), desenvolvimento (lead +
  // cenários trocando de posse) e encerramento (fecho estabiliza)
  tese.classList.add('is-scene');
  const pinEl = $('[data-tese-pin]', tese);

  // aproximação: as linhas saem da máscara antes do pin travar
  const intro = gsap.timeline({
    scrollTrigger: { trigger: pinEl, start: 'top 80%', end: 'top top', scrub: 0.5 },
  });
  intro
    .from(l1, { yPercent: 115, ease: 'none' }, 0)
    .from(l2, { yPercent: 115, ease: 'none' }, 0.25);

  gsap.set(l1, { x: '-5vw' });
  gsap.set(l2, { x: '5vw' });
  gsap.set([lead, cenIntro, close], { autoAlpha: 0, y: 48 });
  gsap.set(cens, { autoAlpha: 0, y: 64 });
  gsap.set(ember, { scale: 0 });

  const tl = gsap.timeline({
    defaults: { ease: 'power2.out' },
    scrollTrigger: {
      trigger: pinEl,
      start: 'top top',
      end: '+=280%',
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });

  tl
    // as duas linhas se estabilizam no eixo
    .to(l1, { x: 0, duration: 1.4 }, 0)
    .to(l2, { x: 0, duration: 1.4 }, 0.1)
    // desenvolvimento: argumento entra
    .to(lead, { autoAlpha: 1, y: 0, duration: 1 }, 1.2)
    .to(cenIntro, { autoAlpha: 1, y: 0, duration: 0.8 }, 2.0)
    // cenários assumem o palco um por vez
    .to(cens[0], { autoAlpha: 1, y: 0, duration: 0.9 }, 2.6)
    .to(cens[0], { autoAlpha: 0, y: -52, duration: 0.7, ease: 'power2.in' }, 4.2)
    .to(cens[1], { autoAlpha: 1, y: 0, duration: 0.9 }, 4.85)
    .to(cens[1], { autoAlpha: 0, y: -52, duration: 0.7, ease: 'power2.in' }, 6.2)
    .to(cens[2], { autoAlpha: 1, y: 0, duration: 0.9 }, 6.85)
    // encerramento: o fecho estabiliza a composição
    .to(lead, { autoAlpha: 0.4, duration: 0.8 }, 7.6)
    .to(close, { autoAlpha: 1, y: 0, duration: 1 }, 7.9)
    .to(ember, { scale: 1, duration: 0.5, ease: 'back.out(2)' }, 8.4)
    .to({}, { duration: 0.8 }, 8.9); // respiro final antes de soltar o pin

  return () => tese.classList.remove('is-scene');
}

/* ---------- 03 · serviços: coreografia de índice ---------- */

function sceneServicos() {
  const svc = $('.svc');
  if (!svc) return undefined;

  gsap.from($('[data-svc-kicker]', svc), {
    autoAlpha: 0,
    x: -18,
    duration: 0.7,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.svc-head', start: 'top 84%', once: true },
  });
  gsap.from($('[data-svc-title]', svc), {
    yPercent: 115,
    duration: 0.95,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.svc-head', start: 'top 84%', once: true },
  });

  // linhas estruturais se desenham, entradas sobem em stagger,
  // descrições revelam por clip — nada da gramática central da tese
  const items = $$('[data-svc-item]', svc);
  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    scrollTrigger: { trigger: '.svc-list', start: 'top 80%', once: true },
  });
  tl.from($$('.svc-rule', svc), {
    scaleX: 0,
    transformOrigin: 'left center',
    duration: 1.1,
    stagger: 0.12,
    ease: 'power2.inOut',
  }, 0);
  items.forEach((item, i) => {
    const at = 0.25 + i * 0.16;
    tl.from($('.svc-idx', item), { autoAlpha: 0, y: 12, duration: 0.55 }, at);
    // anima o wrapper (.svc-main): o título tem transition de hover no CSS
    // e não pode ser alvo de tween de transform
    tl.from($('.svc-main', item), { autoAlpha: 0, y: 40, duration: 0.8 }, at + 0.05);
    tl.from($('.svc-desc', item), {
      clipPath: 'inset(0 100% 0 0)',
      autoAlpha: 0,
      duration: 0.85,
      ease: 'power2.out',
    }, at + 0.2);
  });

  gsap.from($('[data-svc-floor]', svc), {
    autoAlpha: 0,
    y: 26,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: { trigger: '[data-svc-floor]', start: 'top 88%', once: true },
  });

  const layers = $('[data-svc-layers]', svc);
  gsap.from($$('.svc-layers-lead, .svc-layers-close', layers), {
    autoAlpha: 0,
    y: 20,
    duration: 0.75,
    stagger: 0.12,
    ease: 'power3.out',
    scrollTrigger: { trigger: layers, start: 'top 86%', once: true },
  });
  gsap.from($$('.svc-tag', layers), {
    autoAlpha: 0,
    y: 14,
    duration: 0.55,
    stagger: 0.05,
    ease: 'power2.out',
    scrollTrigger: { trigger: layers, start: 'top 86%', once: true },
  });

  return undefined;
}

/* ---------- 04 · projetos: máscara na imagem, título em contramão ---------- */

function sceneProjetos() {
  const prj = $('.prj');
  if (!prj) return undefined;

  gsap.from($('[data-prj-title]', prj), {
    yPercent: 115,
    duration: 0.95,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.prj-header', start: 'top 84%', once: true },
  });
  gsap.from($('[data-prj-count]', prj), {
    autoAlpha: 0,
    duration: 0.7,
    delay: 0.3,
    scrollTrigger: { trigger: '.prj-header', start: 'top 84%', once: true },
  });

  $$('[data-prj-case]', prj).forEach((c) => {
    const media = $('[data-prj-media]', c);
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: c, start: 'top 78%', once: true },
    });
    tl.from(media, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 1.15,
      ease: 'power2.inOut',
    }, 0);
    // contramovimento no figure (o img tem transition de hover no CSS)
    tl.from($('.prj-shot--main', c), { yPercent: 10, duration: 1.15, ease: 'power2.out' }, 0);
    tl.from($('[data-prj-name]', c), { autoAlpha: 0, x: -44, duration: 0.85 }, 0.45);
    tl.from($$('[data-prj-fact]', c), {
      autoAlpha: 0,
      y: 22,
      duration: 0.7,
      stagger: 0.1,
    }, 0.6);
    tl.from($$('.prj-strip-shot', c), {
      autoAlpha: 0,
      y: 26,
      duration: 0.7,
      stagger: 0.1,
    }, 0.7);
  });

  return undefined;
}

/* ---------- 05 · processo: sequência operacional ---------- */

function sceneProcesso(desktop) {
  const prc = $('.prc');
  if (!prc) return undefined;

  gsap.from($('[data-prc-title]', prc), {
    yPercent: 115,
    duration: 0.95,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.prc-intro', start: 'top 84%', once: true },
  });
  gsap.from($('[data-prc-lead]', prc), {
    autoAlpha: 0,
    y: 26,
    duration: 0.85,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.prc-intro', start: 'top 84%', once: true },
  });

  const steps = $$('[data-prc-step]', prc);

  if (!desktop) {
    // fluxo linear: nome desliza no eixo horizontal, descrição sobe —
    // gramática diferente da tese (vertical) e dos serviços (clip)
    steps.forEach((step) => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { trigger: step, start: 'top 88%', once: true },
      });
      tl.from($('.prc-num', step), { autoAlpha: 0, duration: 0.5 }, 0);
      tl.from($('.prc-step-name', step), { autoAlpha: 0, x: 36, duration: 0.75 }, 0.08);
      tl.from($('.prc-step-desc', step), { autoAlpha: 0, y: 18, duration: 0.65 }, 0.26);
    });
    return undefined;
  }

  // desktop: palco pinned — cada etapa assume o centro, a anterior sai,
  // o vestígio acumula à direita e o número/trilho avança
  prc.classList.add('is-scene');
  const sceneEl = $('[data-prc-scene]', prc);
  const num = $('[data-prc-num]', prc);
  const fill = $('[data-prc-fill]', prc);
  const trail = $$('[data-prc-trail] li', prc);
  const total = steps.length;

  gsap.set(steps, { autoAlpha: 0, y: 90 });
  gsap.set(steps[0], { autoAlpha: 1, y: 0 });

  const STEP = 3; // unidades de timeline por etapa
  const tl = gsap.timeline({
    defaults: { ease: 'power2.out' },
    scrollTrigger: {
      trigger: sceneEl,
      start: 'top top',
      end: `+=${total * 70}%`,
      pin: true,
      scrub: 0.55,
      invalidateOnRefresh: true,
      onUpdate(self) {
        const idx = Math.min(total - 1, Math.floor(self.progress * total));
        num.textContent = String(idx + 1).padStart(2, '0');
        gsap.set(fill, { scaleY: self.progress });
        trail.forEach((li, i) => li.classList.toggle('prc-done', i <= idx));
      },
    },
  });

  steps.forEach((step, i) => {
    const t = i * STEP;
    if (i > 0) {
      tl.to(steps[i - 1], { autoAlpha: 0, y: -70, duration: 0.9, ease: 'power2.in' }, t);
      tl.to(step, { autoAlpha: 1, y: 0, duration: 1 }, t + 0.8);
      tl.from($('.prc-step-desc', step), { autoAlpha: 0, y: 22, duration: 0.7 }, t + 1.15);
    }
    tl.to({}, { duration: STEP - 1.5 }, t + 1.5); // pausa de leitura
  });

  return () => prc.classList.remove('is-scene');
}

/* ---------- 06 · estúdio: reorganização lenta + resposta ao ponteiro ---------- */

function sceneEstudio(desktop) {
  const std = $('.std');
  if (!std) return undefined;

  const words = $$('[data-std-w]', std);

  gsap.from($('[data-std-kicker]', std), {
    autoAlpha: 0,
    duration: 0.8,
    scrollTrigger: { trigger: std, start: 'top 82%', once: true },
  });

  // alinhamento se resolve devagar, preso ao scroll
  gsap.from(words[0], {
    x: desktop ? '-5vw' : '-7vw',
    autoAlpha: 0.2,
    ease: 'none',
    scrollTrigger: { trigger: '.std-title', start: 'top 92%', end: 'top 38%', scrub: 0.6 },
  });
  gsap.from(words[1], {
    x: desktop ? '5vw' : '7vw',
    autoAlpha: 0.2,
    ease: 'none',
    scrollTrigger: { trigger: '.std-title', start: 'top 92%', end: 'top 38%', scrub: 0.6 },
  });

  gsap.from($('[data-std-texto]', std), {
    autoAlpha: 0,
    y: 30,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: { trigger: '[data-std-texto]', start: 'top 86%', once: true },
  });

  $$('[data-std-p]', std).forEach((p, i) => {
    gsap.from(p, {
      autoAlpha: 0,
      y: 44,
      duration: 1.1,
      delay: (i % 2) * 0.12,
      ease: 'power3.out',
      scrollTrigger: { trigger: p, start: 'top 90%', once: true },
    });
  });

  // resposta tipográfica mínima: o bloco do título acompanha o ponteiro
  if (desktop && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const title = $('.std-title', std);
    const xTo = gsap.quickTo(title, 'x', { duration: 0.9, ease: 'power3' });
    const yTo = gsap.quickTo(title, 'y', { duration: 0.9, ease: 'power3' });
    const onMove = (e) => {
      const r = std.getBoundingClientRect();
      xTo(((e.clientX - r.left) / r.width - 0.5) * 10);
      yTo(((e.clientY - r.top) / r.height - 0.5) * 6);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };
    std.addEventListener('pointermove', onMove, { passive: true });
    std.addEventListener('pointerleave', onLeave);
    return () => {
      std.removeEventListener('pointermove', onMove);
      std.removeEventListener('pointerleave', onLeave);
    };
  }

  return undefined;
}

/* ---------- 07 · CTA final: hairline atravessa, link assume ---------- */

function sceneClose() {
  const close = $('.close');
  if (!close) return undefined;

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    scrollTrigger: { trigger: close, start: 'top 72%', once: true },
  });
  tl.from($('[data-close-l1]', close), { yPercent: 115, duration: 0.9 }, 0);
  tl.from($('[data-close-l2]', close), { yPercent: 115, duration: 0.9 }, 0.12);
  tl.from($('[data-close-apoio]', close), { autoAlpha: 0, y: 24, duration: 0.8 }, 0.35);
  tl.from($('.close-mega-line', close), {
    scaleX: 0,
    transformOrigin: 'left center',
    duration: 1.3,
    ease: 'power2.inOut',
  }, 0.5);
  tl.from($('.close-mega-text', close), { autoAlpha: 0, y: 56, duration: 1 }, 0.65);
  // só opacidade: a seta tem transition de transform no hover (CSS)
  tl.from($('.close-mega-arrow', close), { autoAlpha: 0, duration: 0.7 }, 0.95);
  tl.from($('[data-close-nota]', close), { autoAlpha: 0, duration: 0.7 }, 1.2);

  return undefined;
}

/* ---------- 08 · footer: entrada por camadas, discreta ---------- */

function sceneFooter() {
  const ft = $('.ft');
  if (!ft) return undefined;

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    scrollTrigger: { trigger: ft, start: 'top 88%', once: true },
  });
  tl.from($('[data-ft-line]', ft), {
    scaleX: 0,
    transformOrigin: 'left center',
    duration: 1.2,
    ease: 'power2.inOut',
  }, 0);
  tl.from($('.ft-mark', ft), { yPercent: 115, duration: 0.9 }, 0.25);
  tl.from($$('[data-ft-col]', ft), { autoAlpha: 0, y: 22, duration: 0.75, stagger: 0.1 }, 0.35);
  tl.from($('[data-ft-base]', ft), { autoAlpha: 0, duration: 0.7 }, 0.75);

  return undefined;
}
