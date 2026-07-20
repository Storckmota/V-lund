// ESTÚDIO — tópicos com preview contextual.
// Em ponteiro fino: hover e foco abrem o tópico e o preview acompanha o
// cursor de forma contida (quickTo, sem follower permanente); ao sair, some.
// Em touch, sem JS e em reduced motion: os detalhes ficam no fluxo, sempre
// visíveis, e nada depende do cursor. O gatilho é <button> real, com
// aria-expanded, então o teclado percorre e abre normalmente.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function initStudio() {
  const section = $('.estd');
  if (!section) return;

  const topics = $$('.estd-topic', section);
  if (!topics.length) return;

  const mm = gsap.matchMedia();

  // entrada da seção (todos os contextos com motion)
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: '.estd-block', start: 'top 80%', once: true },
    });
    tl.from('.estd-label', { autoAlpha: 0, x: -18, duration: 0.7 }, 0);
    tl.from($$('.estd-in', section), { yPercent: 115, duration: 0.95, stagger: 0.1 }, 0.1);
    tl.from('.estd-text', { autoAlpha: 0, y: 24, duration: 0.85 }, 0.4);
    tl.from('.estd-block', { clipPath: 'inset(0 0 100% 0)', duration: 1.05, ease: 'power2.out' }, 0);

    const trg = gsap.from(topics, {
      autoAlpha: 0,
      y: 26,
      duration: 0.75,
      stagger: 0.1,
      ease: 'power3.out',
      // sem clearProps o transform residual do tween deixa o tópico como
      // bloco contentor: o preview position:fixed passaria a ser posicionado
      // (e recortado) dentro dele em vez da viewport
      clearProps: 'transform,visibility',
      scrollTrigger: { trigger: '.estd-topics', start: 'top 86%', once: true },
    });

    return () => {
      tl.scrollTrigger?.kill();
      trg.scrollTrigger?.kill();
    };
  });

  // Preview flutuante: ponteiro fino, motion e largura de desktop.
  // A largura entra na condição porque uma janela estreita em desktop
  // também reporta pointer:fine — e ali a peça flutuante não caberia.
  mm.add(
    '(hover: hover) and (pointer: fine) and (min-width: 900px) and (prefers-reduced-motion: no-preference)',
    () => {
      section.classList.add('has-preview');

      let aberto = null;
      const quickTo = new Map();

      topics.forEach((topic) => {
        const preview = $('.estd-preview', topic);
        if (!preview) return;
        quickTo.set(topic, {
          x: gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3' }),
          y: gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3' }),
        });
      });

      // O preview acompanha o cursor, mas fica confinado à metade direita:
      // os títulos dos tópicos são alinhados à esquerda e não podem ser
      // cobertos. O eixo vertical segue o ponteiro, dentro da viewport.
      const posicaoPara = (preview, clientX, clientY) => {
        const w = preview.offsetWidth;
        const h = preview.offsetHeight;
        const minX = window.innerWidth * 0.52;
        const maxX = window.innerWidth - w - 32;
        const x = Math.max(minX, Math.min(maxX, clientX + 40));
        const y = Math.max(16, Math.min(window.innerHeight - h - 24, clientY - h / 2));
        return { x, y };
      };

      const posicionar = (topic, ev) => {
        const q = quickTo.get(topic);
        const preview = $('.estd-preview', topic);
        if (!q || !preview) return;
        const { x, y } = posicaoPara(preview, ev.clientX, ev.clientY);
        q.x(x);
        q.y(y);
      };

      const abrir = (topic, ev) => {
        if (aberto === topic) return;
        if (aberto) fechar(aberto);
        aberto = topic;
        topic.classList.add('is-open');
        $('.estd-trigger', topic)?.setAttribute('aria-expanded', 'true');
        const preview = $('.estd-preview', topic);
        if (preview && ev) {
          // posiciona antes de acender, para não haver salto
          gsap.set(preview, posicaoPara(preview, ev.clientX, ev.clientY));
          gsap.to(preview, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' });
        } else if (preview) {
          gsap.to(preview, { autoAlpha: 1, duration: 0.3 });
        }
      };

      const fechar = (topic) => {
        topic.classList.remove('is-open');
        $('.estd-trigger', topic)?.setAttribute('aria-expanded', 'false');
        const preview = $('.estd-preview', topic);
        if (preview) gsap.to(preview, { autoAlpha: 0, duration: 0.25, ease: 'power2.in' });
        if (aberto === topic) aberto = null;
      };

      const listeners = [];
      topics.forEach((topic) => {
        const onEnter = (e) => abrir(topic, e);
        const onMove = (e) => {
          if (aberto === topic) posicionar(topic, e);
        };
        const onLeave = () => fechar(topic);
        // teclado: sem cursor, o preview ancora no próprio tópico
        const onFocus = () => {
          if (aberto === topic) return;
          if (aberto) fechar(aberto);
          aberto = topic;
          topic.classList.add('is-open');
          $('.estd-trigger', topic)?.setAttribute('aria-expanded', 'true');
          const preview = $('.estd-preview', topic);
          if (preview) {
            const r = topic.getBoundingClientRect();
            gsap.set(preview, {
              x: Math.min(window.innerWidth - preview.offsetWidth - 24, r.right - preview.offsetWidth),
              y: Math.min(window.innerHeight - preview.offsetHeight - 24, Math.max(16, r.bottom + 12)),
            });
            gsap.to(preview, { autoAlpha: 1, duration: 0.3 });
          }
        };
        const onBlur = () => fechar(topic);

        topic.addEventListener('pointerenter', onEnter);
        topic.addEventListener('pointermove', onMove);
        topic.addEventListener('pointerleave', onLeave);
        topic.addEventListener('focusin', onFocus);
        topic.addEventListener('focusout', onBlur);
        listeners.push(() => {
          topic.removeEventListener('pointerenter', onEnter);
          topic.removeEventListener('pointermove', onMove);
          topic.removeEventListener('pointerleave', onLeave);
          topic.removeEventListener('focusin', onFocus);
          topic.removeEventListener('focusout', onBlur);
        });
      });

      // o preview nunca sobrevive à saída da seção
      const onScroll = () => {
        if (aberto) fechar(aberto);
      };
      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        onLeave: onScroll,
        onLeaveBack: onScroll,
      });

      return () => {
        listeners.forEach((off) => off());
        st.kill();
        topics.forEach((t) => {
          t.classList.remove('is-open');
          gsap.set($('.estd-preview', t), { clearProps: 'all' });
        });
        section.classList.remove('has-preview');
      };
    },
  );

  // Sem preview flutuante: o botão alterna o estado, mas a descrição já
  // nasce visível no CSS — nenhum conteúdo depende do clique.
  mm.add('(hover: none), (pointer: coarse), (max-width: 899px)', () => {
    const listeners = [];
    topics.forEach((topic) => {
      const btn = $('.estd-trigger', topic);
      if (!btn) return;
      const on = () => {
        const aberto = topic.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(aberto));
      };
      btn.addEventListener('click', on);
      listeners.push(() => btn.removeEventListener('click', on));
    });
    return () => listeners.forEach((off) => off());
  });
}
