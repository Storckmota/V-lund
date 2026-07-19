// Sistema de projetos: palco sticky (desktop) + índice como zona de
// ativação. O conteúdo é estático no HTML (contrato documentado no
// index.html): este módulo só liga o projeto ativo ao palco.
// Ativação: progressão de scroll (zona de cada entrada do índice),
// pointerenter, foco de teclado e clique. A troca no palco é por máscara
// (clip-path) com contramovimento da imagem; o hover interno das telas
// secundárias é CSS puro (wrappers sem tween concorrente).

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initProjects() {
  const cases = [...document.querySelectorAll('[data-prj-case]')];
  const count = document.querySelector('[data-prj-count]');
  if (count && cases.length) {
    count.textContent = String(cases.length).padStart(2, '0');
  }
  if (!cases.length) return;

  const mm = gsap.matchMedia();

  mm.add(
    {
      desktop: '(min-width: 900px)',
      motionOK: '(prefers-reduced-motion: no-preference)',
    },
    (ctx) => {
      const { desktop, motionOK } = ctx.conditions;
      if (!desktop || !motionOK) return undefined;

      const section = document.querySelector('.prj');
      const visuals = new Map(
        [...document.querySelectorAll('[data-prj-visual]')].map((v) => [
          v.dataset.prjVisual,
          v,
        ]),
      );
      let current = null;

      // a partir daqui o palco governa a apresentação; sem esta classe a
      // seção permanece em fluxo vertical (sem JS, mobile, reduced motion)
      section.classList.add('has-stage');

      const setActive = (slug, immediate = false) => {
        if (slug === current || !visuals.has(slug)) return;
        const vin = visuals.get(slug);
        const vout = current ? visuals.get(current) : null;
        current = slug;

        cases.forEach((c) => c.classList.toggle('is-active', c.dataset.prjCase === slug));
        visuals.forEach((v, key) => v.classList.toggle('is-active', key === slug));

        gsap.killTweensOf([vin, vout, vin.querySelector('.prj-vis-main img')]);
        gsap.set(vin, { zIndex: 2, autoAlpha: 1 });
        if (vout) gsap.set(vout, { zIndex: 1 });

        if (immediate) {
          gsap.set(vin, { clipPath: 'inset(0% 0 0 0)' });
          if (vout) gsap.set(vout, { autoAlpha: 0 });
          return;
        }

        gsap.fromTo(
          vin,
          { clipPath: 'inset(100% 0 0 0)' },
          { clipPath: 'inset(0% 0 0 0)', duration: 0.8, ease: 'power3.out' },
        );
        gsap.fromTo(
          vin.querySelector('.prj-vis-main img'),
          { yPercent: 9 },
          { yPercent: 0, duration: 0.85, ease: 'power3.out' },
        );
        if (vout) {
          gsap.to(vout, {
            autoAlpha: 0,
            duration: 0.45,
            delay: 0.25,
            ease: 'power2.out',
            onComplete: () => gsap.set(vout, { clipPath: 'inset(0% 0 0 0)' }),
          });
        }
      };

      setActive(cases[0].dataset.prjCase, true);

      // Ativação determinística: a última entrada cujo topo já cruzou a
      // linha de leitura vence. Resolve corretamente em scroll rápido,
      // scroll reverso, reload no meio da página e refresh do ScrollTrigger.
      // O trigger cobre a página inteira (start 0 / end max) para nunca
      // sair de range depois que o pin da tese recalcula as alturas.
      const LINE = 0.55;
      let lastY = -1;

      const pick = () => {
        // hover e foco têm precedência até o usuário rolar de novo
        const y = window.scrollY;
        if (y === lastY) return;
        lastY = y;
        const line = window.innerHeight * LINE;
        let chosen = cases[0];
        cases.forEach((c) => {
          if (c.getBoundingClientRect().top <= line) chosen = c;
        });
        setActive(chosen.dataset.prjCase);
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
      pick();

      const listeners = [];
      cases.forEach((c) => {
        const on = () => {
          lastY = window.scrollY;
          setActive(c.dataset.prjCase);
        };
        c.addEventListener('pointerenter', on);
        c.addEventListener('focusin', on);
        c.addEventListener('click', on);
        listeners.push(() => {
          c.removeEventListener('pointerenter', on);
          c.removeEventListener('focusin', on);
          c.removeEventListener('click', on);
        });
      });

      return () => {
        triggers.forEach((t) => t.kill());
        listeners.forEach((off) => off());
        cases.forEach((c) => c.classList.remove('is-active'));
        visuals.forEach((v) => {
          v.classList.remove('is-active');
          gsap.set(v, { clearProps: 'all' });
        });
        section.classList.remove('has-stage');
      };
    },
  );
}
