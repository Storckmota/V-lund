// PROCESSO — scroll vertical mapeado em deslocamento horizontal.
// O wheel nunca é capturado: quem move a faixa é o ScrollTrigger, com o
// scroll nativo (e o Lenis) intactos. A distância do pin é medida a partir
// da largura real da faixa, então o encerramento sempre chega ao fim antes
// de o pin ser liberado. Mobile e reduced motion: sequência vertical.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { adiado } from './scene-utils.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function initProcessHorizontal() {
  const section = $('.prch');
  if (!section) return;

  const pin = $('[data-prch-pin]', section);
  const track = $('[data-prch-track]', section);
  const cards = $$('[data-prch-card]', section);
  if (!pin || !track) return;

  const mm = gsap.matchMedia();

  mm.add(
    {
      desktop: '(min-width: 900px)',
      motionOK: '(prefers-reduced-motion: no-preference)',
    },
    (ctx) => {
      const { desktop, motionOK } = ctx.conditions;
      if (!motionOK) return undefined;
      // A construção mobile é adiada um quadro: ao cruzar 900px, o contexto
      // desktop ainda está desfazendo o pin (o spacer é desembrulhado do
      // DOM). Criar gatilhos sobre elementos que estão dentro desse spacer
      // no mesmo tick faz o ScrollTrigger refrescar um alvo inconsistente.
      if (!desktop) return adiado(() => sequenciaVertical(section, cards));

      section.classList.add('is-scene');

      // distância = quanto a faixa precisa andar para o fim encostar na borda
      const distancia = () => Math.max(0, track.scrollWidth - window.innerWidth);

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: () => `+=${distancia()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
          anticipatePin: 1,
          refreshPriority: 5,
        },
      });

      tl.to(track, { x: () => -distancia() }, 0);

      // As revelações de cada card entram na MESMA timeline da faixa, em
      // posições derivadas da geometria. Evita containerAnimation: aquele
      // caminho cria gatilhos que apontam para a timeline da faixa e, na
      // troca de contexto do matchMedia (resize desktop -> mobile), o
      // ScrollTrigger tenta refrescar um filho cujo container já morreu.
      // Aqui não há filho: há uma timeline só, que morre inteira de uma vez.
      const dist = () => Math.max(1, distancia());
      const vw = () => window.innerWidth;
      // instante da timeline (0..1) em que a borda esquerda do elemento
      // cruza uma fração da viewport
      const quando = (el, fracao) => {
        const t = (el.offsetLeft - vw() * fracao) / dist();
        return Math.max(0, Math.min(1, t));
      };

      cards.forEach((card) => {
        const inicio = quando(card, 0.82);
        const fim = quando(card, 0.42);
        const dur = Math.max(0.06, fim - inicio);
        tl.from($('.prch-in', card), { yPercent: 115, duration: dur * 0.8, ease: 'power3.out' }, inicio);
        tl.fromTo($('.prch-card-rule', card),
          { scaleX: 0 }, { scaleX: 1, duration: dur * 0.9, ease: 'power2.out' }, inicio + dur * 0.1);
        tl.from($('.prch-card-desc', card),
          { autoAlpha: 0, y: 24, duration: dur * 0.7, ease: 'power3.out' }, inicio + dur * 0.15);
        tl.from($('.prch-card-tags', card),
          { autoAlpha: 0, y: 16, duration: dur * 0.6, ease: 'power3.out' }, inicio + dur * 0.3);
      });

      // encerramento: a marca cresce e as duas linhas assentam
      const fimEl = $('[data-prch-end]', section);
      if (fimEl) {
        const inicio = quando(fimEl, 0.88);
        const fim = quando(fimEl, 0.45);
        const dur = Math.max(0.06, fim - inicio);
        tl.fromTo($('.prch-end-mark', fimEl),
          { scaleX: 0 }, { scaleX: 1, duration: dur * 0.7, ease: 'power2.out' }, inicio);
        tl.from($$('.prch-in', fimEl),
          { yPercent: 115, duration: dur * 0.85, stagger: dur * 0.12, ease: 'power3.out' }, inicio + dur * 0.15);
      }


      // abertura da faixa
      gsap.from($$('.prch-intro .prch-in'), {
        yPercent: 115,
        duration: 0.95,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: pin, start: 'top 72%', once: true },
      });
      gsap.from($('.prch-label', section), {
        autoAlpha: 0,
        x: -18,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: pin, start: 'top 72%', once: true },
      });

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        section.classList.remove('is-scene');
        gsap.set(track, { clearProps: 'all' });
      };
    },
  );
}

function sequenciaVertical(section, cards) {
  const feitos = [];
  feitos.push(
    gsap.from($$('.prch-intro .prch-in', section), {
      yPercent: 115,
      duration: 0.85,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.prch-intro', start: 'top 84%', once: true },
    }),
  );
  cards.forEach((card) => {
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: card, start: 'top 84%', once: true },
    });
    tl.from($('.prch-in', card), { yPercent: 115, duration: 0.8 }, 0);
    tl.from($('.prch-card-desc', card), { autoAlpha: 0, y: 22, duration: 0.7 }, 0.12);
    tl.from($('.prch-card-tags', card), { autoAlpha: 0, y: 14, duration: 0.6 }, 0.24);
    tl.fromTo($('.prch-card-rule', card), { scaleX: 0 }, { scaleX: 1, duration: 0.85 }, 0.05);
    feitos.push(tl);
  });
  const fim = $('[data-prch-end]', section);
  if (fim) {
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: fim, start: 'top 86%', once: true },
    });
    tl.fromTo($('.prch-end-mark', fim), { scaleX: 0 }, { scaleX: 1, duration: 0.7 }, 0);
    tl.from($$('.prch-in', fim), { yPercent: 115, duration: 0.85, stagger: 0.12 }, 0.12);
    feitos.push(tl);
  }
  return () => feitos.forEach((t) => t.scrollTrigger?.kill());
}
