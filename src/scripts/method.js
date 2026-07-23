// COMO TRABALHAMOS — reveal textual por linhas mascaradas (Text Masking) com
// SplitText, robusto a quebras responsivas (Responsive Line Splits). Os
// elementos chegam com leveza, como conduzidos por uma corrente de ar (subida +
// pequeno deslocamento horizontal, aceleração e desaceleração) e assentam
// exatos na grade. Estado final completamente estático.
//
// Duas timelines, dois ScrollTriggers (abertura e tríptico). start observado
// para disparar com a seção claramente no viewport; once + invalidateOnRefresh.
// Splits revertidos ao completar (HTML semântico restaurado). Repouso (sem JS /
// reduced motion): o CSS entrega o estado final; a hairline já é cinza.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function initMethod() {
  const section = $('.cw');
  if (!section) return;
  // SplitText precisa das fontes carregadas para medir as quebras.
  const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  ready.then(() => build(section));
}

function build(section) {
  const mm = gsap.matchMedia();

  mm.add(
    {
      desktop: '(min-width: 900px)',
      motionOK: '(prefers-reduced-motion: no-preference)',
    },
    (ctx) => {
      const { desktop, motionOK } = ctx.conditions;
      if (!motionOK) return undefined;

      const amp = desktop ? 1 : 0.7; // motion contido no mobile
      let splits = [];
      let timelines = [];

      const setup = () => {
        splits = [];
        timelines = [];

        const mkSplit = (el) => {
          const s = SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: false });
          splits.push(s);
          return s;
        };

        // ---------- ABERTURA ----------
        const label = $('.cw-label', section);
        const headline = $('[data-cw-headline]', section);
        const lead = $('[data-cw-lead]', section);
        const hSplit = headline ? mkSplit(headline) : null;
        const lSplit = lead ? mkSplit(lead) : null;

        // BEAT 1 — abertura: dispara cedo, quando o cabeçalho entra claramente
        const openTl = gsap.timeline({
          scrollTrigger: {
            trigger: '.cw-head',
            start: desktop ? 'top 80%' : 'top 86%',
            once: true,
            invalidateOnRefresh: true,
          },
          onComplete: () => { hSplit && hSplit.revert(); lSplit && lSplit.revert(); },
        });
        if (label) openTl.from(label, { autoAlpha: 0, y: 14, duration: 0.55, ease: 'power2.out' }, 0);
        // headline: linhas sobem de baixo da máscara com leve deslocamento à esquerda
        if (hSplit) openTl.from(hSplit.lines, { yPercent: 100, x: -14 * amp, autoAlpha: 0, duration: 1.0, ease: 'expo.out', stagger: 0.16 }, 0.12);
        // texto da direita: linhas entram de direção ligeiramente oposta
        if (lSplit) openTl.from(lSplit.lines, { yPercent: 100, x: 12 * amp, autoAlpha: 0, duration: 0.85, ease: 'expo.out', stagger: 0.1 }, 0.42);
        timelines.push(openTl);

        // ---------- TRÍPTICO ----------
        const rule = $('.cw-tript-rule', section);
        const titles = $$('[data-cw-col-title]', section);
        const texts = $$('[data-cw-col-text]', section);
        const titleSplits = titles.map((t) => mkSplit(t));
        const textSplits = texts.map((t) => mkSplit(t));
        const colX = (i) => (i === 0 ? -10 : i === 2 ? 10 : 0) * amp; // abertura mínima

        // BEAT 2 — tríptico: só dispara quando o topo do bloco entra de fato na
        // zona de leitura (bem depois da abertura). O limiar mais baixo que o da
        // abertura é o que separa perceptivamente os dois momentos.
        const triTl = gsap.timeline({
          scrollTrigger: {
            trigger: '.cw-tript',
            start: desktop ? 'top 66%' : 'top 74%',
            once: true,
            invalidateOnRefresh: true,
          },
          onComplete: () => { titleSplits.forEach((s) => s.revert()); textSplits.forEach((s) => s.revert()); },
        });
        // 1 · hairline cinza se estende
        if (rule) triTl.from(rule, { scaleX: 0, transformOrigin: 'left center', duration: 0.85, ease: 'power3.out' }, 0);
        // 2 · títulos por linhas mascaradas, sequência curta com offset de coluna
        titleSplits.forEach((s, i) => {
          triTl.from(s.lines, { yPercent: 100, x: colX(i), autoAlpha: 0, duration: 0.7, ease: 'expo.out' }, 0.24 + i * 0.1);
        });
        // 3 · parágrafos por linhas; todas as colunas assentam alinhadas
        textSplits.forEach((s, i) => {
          triTl.from(s.lines, { yPercent: 100, x: colX(i) * 0.4, autoAlpha: 0, duration: 0.7, ease: 'expo.out', stagger: 0.07 }, 0.42 + i * 0.08);
        });
        timelines.push(triTl);
      };

      setup();

      // posições corretas depois que o layout relevante estabiliza
      const rafRefresh = requestAnimationFrame(() => ScrollTrigger.refresh());

      // re-split responsivo: só reconstrói enquanto algum reveal ainda não rodou
      let pend = 0;
      const onResize = () => {
        clearTimeout(pend);
        pend = setTimeout(() => {
          const pendingReveal = timelines.some((t) => t.scrollTrigger && !t.scrollTrigger.progress && t.progress() === 0);
          if (!pendingReveal) return;
          timelines.forEach((t) => { t.scrollTrigger?.kill(); t.kill(); });
          splits.forEach((s) => s.revert());
          setup();
          ScrollTrigger.refresh();
        }, 240);
      };
      window.addEventListener('resize', onResize, { passive: true });

      return () => {
        cancelAnimationFrame(rafRefresh);
        clearTimeout(pend);
        window.removeEventListener('resize', onResize);
        timelines.forEach((t) => { t.scrollTrigger?.kill(); t.kill(); });
        splits.forEach((s) => s.revert());
      };
    },
  );
}
