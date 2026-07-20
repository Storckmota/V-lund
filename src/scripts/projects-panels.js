// PROJETOS — painéis completos. O painel seguinte sobe de baixo e
// substitui toda a composição do anterior (imagem, texto, fundo, meta).
// Desktop: seção pinada com overscroll controlado. Mobile e reduced
// motion: sequência vertical, telas no fluxo, nada depende de hover.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { adiado } from './scene-utils.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function initProjectPanels() {
  const section = $('.prjp');
  if (!section) return;

  const panels = $$('[data-prjp-panel]', section);
  if (panels.length < 2) return;

  const mm = gsap.matchMedia();

  mm.add(
    {
      desktop: '(min-width: 900px)',
      motionOK: '(prefers-reduced-motion: no-preference)',
    },
    (ctx) => {
      const { desktop, motionOK } = ctx.conditions;
      if (!motionOK) return undefined;
      // adiado: ao cruzar 900px o contexto desktop ainda desfaz o pin
      if (!desktop) return adiado(() => sequenciaVertical(panels));

      section.classList.add('is-scene', 'has-panels');
      const pin = $('[data-prjp-pin]', section);

      gsap.set(panels, { zIndex: (i) => i + 1 });
      gsap.set(panels.slice(1), { yPercent: 100 });

      const MOVE = 0.44;
      const HOLD = 0.56;
      const steps = panels.length - 1;

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: `+=${steps * 92}%`,
          pin: true,
          scrub: 0.55,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
          anticipatePin: 1,
          refreshPriority: 10,
        },
      });

      panels.forEach((panel, i) => {
        if (i === 0) return;
        const at = (i - 1) * (MOVE + HOLD);
        tl.to(panel, { yPercent: 0, duration: MOVE, ease: 'power2.inOut' }, at);
        // o painel que sai recua: a substituição fica legível como troca
        tl.to(
          panels[i - 1],
          { yPercent: -14, scale: 0.96, duration: MOVE, ease: 'power2.inOut' },
          at,
        );
        tl.from($$('.prjp-in', panel), { yPercent: 115, duration: MOVE * 0.6, stagger: 0.07 }, at + MOVE * 0.45);
        tl.from($('.prjp-meta', panel), { autoAlpha: 0, x: -20, duration: MOVE * 0.5 }, at + MOVE * 0.5);
        tl.from($('.prjp-sum', panel), { autoAlpha: 0, y: 22, duration: MOVE * 0.55 }, at + MOVE * 0.6);
        tl.from($('.prjp-link', panel), { autoAlpha: 0, y: 18, duration: MOVE * 0.5 }, at + MOVE * 0.7);
        tl.from($('.prjp-shots', panel), {
          clipPath: 'inset(100% 0 0 0)',
          duration: MOVE * 0.8,
          ease: 'power2.out',
        }, at + MOVE * 0.4);
        tl.to({}, { duration: HOLD }, at + MOVE);
      });

      // primeiro painel: entra antes do pin travar
      const primeiro = panels[0];
      gsap.from($$('.prjp-in', primeiro), {
        yPercent: 115,
        duration: 0.95,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: pin, start: 'top 72%', once: true },
      });
      gsap.from([$('.prjp-meta', primeiro), $('.prjp-sum', primeiro), $('.prjp-link', primeiro)], {
        autoAlpha: 0,
        y: 22,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: pin, start: 'top 72%', once: true },
      });
      gsap.from($('.prjp-shots', primeiro), {
        clipPath: 'inset(100% 0 0 0)',
        duration: 1.1,
        ease: 'power2.out',
        scrollTrigger: { trigger: pin, start: 'top 72%', once: true },
      });

      return () => {
        section.classList.remove('is-scene', 'has-panels');
        gsap.set(panels, { clearProps: 'all' });
      };
    },
  );
}

function sequenciaVertical(panels) {
  const feitos = [];
  panels.forEach((panel) => {
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: panel, start: 'top 82%', once: true },
    });
    tl.from($$('.prjp-in', panel), { yPercent: 115, duration: 0.85, stagger: 0.08 }, 0);
    tl.from($('.prjp-meta', panel), { autoAlpha: 0, x: -18, duration: 0.6 }, 0.1);
    tl.from([$('.prjp-sum', panel), $('.prjp-link', panel)].filter(Boolean), {
      autoAlpha: 0,
      y: 20,
      duration: 0.7,
      stagger: 0.09,
    }, 0.25);
    tl.from($('.prjp-shots', panel), {
      clipPath: 'inset(100% 0 0 0)',
      duration: 0.95,
      ease: 'power2.out',
    }, 0.3);
    tl.from($$('.prjp-flow-shot', panel), { autoAlpha: 0, y: 24, duration: 0.7, stagger: 0.1 }, 0.55);
    feitos.push(tl);
  });
  return () => feitos.forEach((t) => t.scrollTrigger?.kill());
}
