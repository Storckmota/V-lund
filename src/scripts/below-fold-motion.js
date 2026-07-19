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
        sceneServicos(desktop),
        sceneProjetos(desktop),
        sceneProcesso(desktop),
        sceneEstudio(),
        sceneCtaFooter(),
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

/* ---------- 03 · serviços: índice + palco compartilhado ---------- */

function sceneServicos(desktop) {
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
  gsap.from($('[data-svc-intro]', svc), {
    autoAlpha: 0,
    y: 18,
    duration: 0.8,
    delay: 0.2,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.svc-head', start: 'top 84%', once: true },
  });

  const items = $$('[data-svc-item]', svc);
  const rules = $$('.svc-item-rule', svc);

  gsap.from(rules, {
    scaleX: 0,
    transformOrigin: 'left center',
    duration: 1.1,
    stagger: 0.12,
    ease: 'power2.inOut',
    scrollTrigger: { trigger: '.svc-index', start: 'top 82%', once: true },
  });
  items.forEach((item, i) => {
    gsap.from(item, {
      autoAlpha: 0,
      y: 44,
      duration: 0.85,
      delay: 0.2 + i * 0.14,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.svc-index', start: 'top 82%', once: true },
    });
    if (!desktop) {
      gsap.from($$('.svc-mini i', item), {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.7,
        stagger: 0.07,
        ease: 'power2.out',
        scrollTrigger: { trigger: item, start: 'top 80%', once: true },
      });
    }
  });

  gsap.from($('[data-svc-floor]', svc), {
    autoAlpha: 0,
    y: 26,
    duration: 0.85,
    ease: 'power3.out',
    scrollTrigger: { trigger: '[data-svc-floor]', start: 'top 88%', once: true },
  });
  gsap.from($$('.svc-more > *', svc), {
    autoAlpha: 0,
    y: 16,
    duration: 0.7,
    stagger: 0.1,
    ease: 'power3.out',
    scrollTrigger: { trigger: '[data-svc-more]', start: 'top 90%', once: true },
  });

  if (!desktop) return undefined;

  // palco: entrada única (o interior é coreografado pelo CSS de estados)
  const stage = $('[data-svc-stage]', svc);
  const word = $('[data-svcs-word]', stage);
  const idxEl = $('[data-svcs-idx]', stage);
  const names = { a: 'Site institucional', b: 'Landing page', c: 'Experiência web' };
  const nums = { a: '01', b: '02', c: '03' };

  gsap.from(stage, {
    autoAlpha: 0,
    y: 36,
    duration: 0.95,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.svc-body', start: 'top 78%', once: true },
  });

  let state = 'a';
  let wordTl = null;
  const setState = (next) => {
    if (next === state) return;
    state = next;
    stage.dataset.svcState = next;
    items.forEach((it) => it.classList.toggle('is-active', it.dataset.svcItem === next));
    wordTl?.kill();
    wordTl = gsap.timeline();
    wordTl
      .to(word, { yPercent: -115, duration: 0.26, ease: 'power2.in' })
      .add(() => {
        word.textContent = names[next];
        idxEl.textContent = nums[next];
      })
      .fromTo(word, { yPercent: 115 }, { yPercent: 0, duration: 0.38, ease: 'power3.out' });
  };

  items[0].classList.add('is-active');

  // mesma regra dos projetos: a última entrada cujo topo cruzou a linha de
  // leitura vence — determinístico em scroll rápido, reverso e reload.
  // Trigger de página inteira: não sai de range quando o pin da tese
  // recalcula alturas. Hover e foco têm precedência até o próximo scroll.
  const LINE = 0.55;
  let lastY = -1;

  const pick = () => {
    const y = window.scrollY;
    if (y === lastY) return;
    lastY = y;
    const line = window.innerHeight * LINE;
    let chosen = items[0];
    items.forEach((it) => {
      if (it.getBoundingClientRect().top <= line) chosen = it;
    });
    setState(chosen.dataset.svcItem);
  };

  const triggers = [
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: pick,
      onRefresh: () => {
        lastY = -1;
        pick();
      },
    }),
  ];

  const listeners = [];
  items.forEach((item) => {
    const on = () => {
      lastY = window.scrollY;
      setState(item.dataset.svcItem);
    };
    item.addEventListener('pointerenter', on);
    item.addEventListener('focusin', on);
    listeners.push(() => {
      item.removeEventListener('pointerenter', on);
      item.removeEventListener('focusin', on);
    });
  });

  return () => {
    triggers.forEach((t) => t.kill());
    listeners.forEach((off) => off());
    wordTl?.kill();
    items.forEach((it) => it.classList.remove('is-active'));
  };
}

/* ---------- 04 · projetos: entrada + transição de saída ---------- */

function sceneProjetos(desktop) {
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

  if (desktop) {
    // o palco entra por máscara e entrega o primeiro projeto
    const stage = $('[data-prj-stage]', prj);
    gsap.from(stage, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 1.15,
      ease: 'power2.inOut',
      scrollTrigger: { trigger: '[data-prj-layout]', start: 'top 76%', once: true },
    });
    $$('[data-prj-case]', prj).forEach((c, i) => {
      gsap.from(c, {
        autoAlpha: 0,
        y: 40,
        duration: 0.85,
        delay: 0.25 + i * 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: '[data-prj-layout]', start: 'top 76%', once: true },
      });
    });

    // saída: o último projeto perde escala e entrega o Processo
    gsap.to(stage, {
      scale: 0.965,
      autoAlpha: 0.75,
      transformOrigin: 'center bottom',
      ease: 'none',
      scrollTrigger: {
        trigger: prj,
        start: 'bottom 62%',
        end: 'bottom 18%',
        scrub: 0.5,
      },
    });
    return undefined;
  }

  // mobile: três projetos em sequência vertical, cada um com motion próprio
  $$('[data-prj-case]', prj).forEach((c) => {
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: c, start: 'top 82%', once: true },
    });
    tl.from($('.prj-case-rule', c), {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 0.9,
      ease: 'power2.inOut',
    }, 0);
    tl.from($('.prj-meta', c), { autoAlpha: 0, y: 14, duration: 0.6 }, 0.1);
    tl.from($('.prj-name', c), { autoAlpha: 0, x: -32, duration: 0.75 }, 0.18);
    tl.from($$('.prj-seg, .prj-sum, .prj-link', c), {
      autoAlpha: 0,
      y: 20,
      duration: 0.65,
      stagger: 0.09,
    }, 0.3);
    tl.from($('.prj-media-main', c), {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.95,
      ease: 'power2.inOut',
    }, 0.4);
    tl.from($('.prj-media-alt', c), { autoAlpha: 0, y: 24, duration: 0.7 }, 0.6);
  });

  return undefined;
}

/* ---------- 05 · processo: três capítulos editoriais ---------- */

function sceneProcesso(desktop) {
  const prc = $('.prc');
  if (!prc) return undefined;

  gsap.from($('[data-prc-kicker]', prc), {
    autoAlpha: 0,
    x: -18,
    duration: 0.7,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.prc-intro', start: 'top 84%', once: true },
  });
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
    delay: 0.15,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.prc-intro', start: 'top 84%', once: true },
  });

  const chapters = $$('[data-prc-ch]', prc);
  if (desktop) prc.classList.add('is-scene');

  chapters.forEach((ch, i) => {
    const inner = $('.prc-ch-inner', ch);
    const masks = $$('.prc-ch-in', ch);
    const num = $('.prc-ch-num', ch);
    const desc = $('.prc-ch-desc', ch);
    const list = $('.prc-ch-list', ch);

    // conteúdo do capítulo: revelação amarrada à chegada da folha
    const reveal = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: desktop
        ? { trigger: ch, start: 'top 62%', end: 'top 6%', scrub: 0.55 }
        : { trigger: ch, start: 'top 80%', once: true },
    });
    reveal
      .from(num, { autoAlpha: 0, duration: 0.4 }, 0)
      .from(masks, { yPercent: 115, duration: 0.9, stagger: 0.12 }, 0.05)
      .from(desc, { autoAlpha: 0, y: 26, duration: 0.7 }, 0.45)
      .from(list, { autoAlpha: 0, y: 18, duration: 0.6 }, 0.65);

    // motivo estrutural: transformação própria por capítulo
    const motifTrigger = desktop
      ? { trigger: ch, start: 'top 70%', end: 'top -10%', scrub: 0.55 }
      : { trigger: ch, start: 'top 78%', once: true };

    if (i === 0) {
      const ticks = $$('.prcm-t1, .prcm-t2, .prcm-t3, .prcm-t4, .prcm-t5', ch);
      gsap.from(ticks, {
        x: (k) => [-90, 70, -50, 110, -70][k],
        y: (k) => [60, -40, 90, -70, 40][k],
        autoAlpha: 0,
        scaleX: 0.4,
        duration: 1,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: motifTrigger,
      });
    } else if (i === 1) {
      const tl = gsap.timeline({ scrollTrigger: motifTrigger, defaults: { ease: 'power2.out' } });
      tl.from($('.prcm-fr', ch), { scaleY: 0, transformOrigin: 'top center', duration: 0.9 }, 0)
        .from($('.prcm-b1', ch), { scaleX: 0, transformOrigin: 'left center', duration: 0.6 }, 0.5)
        .from($('.prcm-b2', ch), { scaleX: 0, transformOrigin: 'left center', duration: 0.55 }, 0.7)
        .from($('.prcm-b3', ch), { scaleX: 0, transformOrigin: 'left center', duration: 0.5 }, 0.9);
    } else {
      const tl = gsap.timeline({ scrollTrigger: motifTrigger, defaults: { ease: 'power2.out' } });
      tl.from($('.prcm-p1', ch), { xPercent: 62, autoAlpha: 0, duration: 0.9 }, 0)
        .from($('.prcm-p2', ch), { xPercent: -62, autoAlpha: 0, duration: 0.9 }, 0)
        .from($('.prcm-dot', ch), { scale: 0, duration: 0.5, ease: 'back.out(2)' }, 0.7)
        .from($('.prcm-line', ch), { scaleX: 0, transformOrigin: 'left center', duration: 0.7 }, 0.8);
    }

    // a folha anterior recolhe quando a próxima assume (só desktop)
    if (desktop && i > 0) {
      const prev = $('.prc-ch-inner', chapters[i - 1]);
      gsap.to(prev, {
        scale: 0.97,
        autoAlpha: 0.45,
        transformOrigin: 'center top',
        ease: 'none',
        scrollTrigger: {
          trigger: ch,
          start: 'top bottom',
          end: 'top top',
          scrub: 0.5,
        },
      });
    }
  });

  return () => prc.classList.remove('is-scene');
}

/* ---------- 06 · estúdio: desaceleração, rota única ---------- */

function sceneEstudio() {
  const std = $('.std');
  if (!std) return undefined;

  gsap.from($('[data-std-kicker]', std), {
    autoAlpha: 0,
    duration: 0.9,
    scrollTrigger: { trigger: std, start: 'top 80%', once: true },
  });
  gsap.from($('[data-std-l1]', std), {
    yPercent: 115,
    duration: 1,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.std-title', start: 'top 84%', once: true },
  });
  gsap.from($('[data-std-l2]', std), {
    yPercent: 115,
    duration: 1,
    delay: 0.14,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.std-title', start: 'top 84%', once: true },
  });
  gsap.from($('[data-std-texto]', std), {
    autoAlpha: 0,
    y: 26,
    duration: 0.95,
    ease: 'power2.out',
    scrollTrigger: { trigger: '[data-std-texto]', start: 'top 86%', once: true },
  });

  $$('[data-std-p]', std).forEach((p, i) => {
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: { trigger: p, start: 'top 88%', once: true },
    });
    tl.from($('.std-p-rule', p), {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 0.9,
      ease: 'power2.inOut',
    }, 0);
    tl.from($('.std-p-num', p), { autoAlpha: 0, duration: 0.5 }, 0.2);
    tl.from($('.std-p-text', p), { autoAlpha: 0, y: 22, duration: 0.8 }, 0.25 + i * 0.04);
  });

  return undefined;
}

/* ---------- 07 · CTA + footer ---------- */

function sceneCtaFooter() {
  const ft = $('.ft');
  if (!ft) return undefined;

  const cta = $('.ft-cta', ft);
  if (cta) {
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: cta, start: 'top 76%', once: true },
    });
    tl.from($('[data-cta-eyebrow]', cta), { autoAlpha: 0, duration: 0.7 }, 0);
    tl.from($('[data-cta-title]', cta), { yPercent: 115, duration: 0.95 }, 0.12);
    tl.from($('[data-cta-apoio]', cta), { autoAlpha: 0, y: 24, duration: 0.8 }, 0.4);
    tl.from($('[data-cta-link]', cta), { autoAlpha: 0, y: 30, duration: 0.85 }, 0.55);
    tl.from($('.ft-cta-line', cta), {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 1.1,
      ease: 'power2.inOut',
    }, 0.6);
  }

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    scrollTrigger: { trigger: '.ft-topline', start: 'top 94%', once: true },
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
