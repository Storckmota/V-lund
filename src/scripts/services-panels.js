// SERVIÇOS — sequência finita de painéis verticais (desktop).
// Referência de comportamento: painéis que entram por baixo e cobrem o
// anterior. Finito: não volta ao primeiro, não avança sozinho, sem snap.
// Ritmo por painel: entrada ~22%, permanência legível ~56%, saída ~22%.
// Mobile e reduced motion: fluxo vertical, entradas curtas por máscara.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { adiado } from './scene-utils.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function initServicesPanels() {
  const section = $('.svcp');
  if (!section) return;

  const panels = $$('[data-svcp-panel]', section);
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

      section.classList.add('is-scene');
      const pin = $('[data-svcp-pin]', section);

      // empilhamento: o primeiro no lugar, os demais fora da viewport
      gsap.set(panels, { zIndex: (i) => i + 1 });
      gsap.set(panels.slice(1), { yPercent: 100 });

      // HOLD é o tempo parado depois que o painel assenta; MOVE é a
      // travessia. A razão MOVE/(MOVE+HOLD) fica em ~0.42, dentro da
      // faixa pedida quando se somam entrada do próximo e saída do atual.
      const MOVE = 0.42;
      const HOLD = 0.58;
      const steps = panels.length - 1;

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: `+=${steps * 88}%`,
          pin: true,
          scrub: 0.55,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
          anticipatePin: 1,
          // pins precisam refrescar na ordem do documento: um pin acima
          // muda a posição de todos os que vêm depois. Prioridade maior
          // refresca primeiro (tese=30, serviços=20, projetos=10, processo=5).
          refreshPriority: 20,
        },
      });

      panels.forEach((panel, i) => {
        if (i === 0) return;
        const at = (i - 1) * (MOVE + HOLD);
        // o painel sobe e cobre; o anterior recua de leve (profundidade)
        tl.to(panel, { yPercent: 0, duration: MOVE, ease: 'power2.inOut' }, at);
        tl.to(
          panels[i - 1],
          { yPercent: -12, scale: 0.97, duration: MOVE, ease: 'power2.inOut' },
          at,
        );
        // conteúdo do painel que chega: revelação curta ao assentar
        const mascaras = $$('.svcp-in', panel);
        if (mascaras.length) {
          tl.from(mascaras, { yPercent: 115, duration: MOVE * 0.6, stagger: 0.06 }, at + MOVE * 0.45);
        }
        const desc = $('.svcp-desc, .svcp-floor-text', panel);
        if (desc) tl.from(desc, { autoAlpha: 0, y: 24, duration: MOVE * 0.55 }, at + MOVE * 0.65);
        const wf = $('.wf', panel);
        if (wf) {
          tl.from(wf, { autoAlpha: 0, y: 40, duration: MOVE * 0.7 }, at + MOVE * 0.5);
        }
        // permanência: nada acontece durante o HOLD
        tl.to({}, { duration: HOLD }, at + MOVE);
      });

      // abertura entra antes do pin travar
      const abertura = panels[0];
      gsap.from($$('.svcp-in', abertura), {
        yPercent: 115,
        duration: 0.95,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: pin, start: 'top 75%', once: true },
      });
      gsap.from([$('.svcp-label', abertura), $('.svcp-open-sub', abertura)], {
        autoAlpha: 0,
        y: 20,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: pin, start: 'top 75%', once: true },
      });

      return () => {
        section.classList.remove('is-scene');
        gsap.set(panels, { clearProps: 'all' });
      };
    },
  );
}

// mobile: cada painel entra no fluxo, sem pin
function sequenciaVertical(panels) {
  const tweens = [];
  panels.forEach((panel) => {
    const mascaras = $$('.svcp-in', panel);
    if (mascaras.length) {
      tweens.push(
        gsap.from(mascaras, {
          yPercent: 115,
          duration: 0.85,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: panel, start: 'top 82%', once: true },
        }),
      );
    }
    const resto = [
      $('.svcp-label', panel),
      $('.svcp-open-sub', panel),
      $('.svcp-desc', panel),
      $('.svcp-floor-text', panel),
    ].filter(Boolean);
    if (resto.length) {
      tweens.push(
        gsap.from(resto, {
          autoAlpha: 0,
          y: 22,
          duration: 0.75,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: panel, start: 'top 82%', once: true },
        }),
      );
    }
    const wf = $('.wf', panel);
    if (wf) {
      tweens.push(
        gsap.from(wf, {
          autoAlpha: 0,
          y: 34,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: { trigger: wf, start: 'top 88%', once: true },
        }),
      );
    }
  });
  return () => tweens.forEach((t) => t.scrollTrigger?.kill());
}
