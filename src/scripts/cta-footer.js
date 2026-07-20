// CTA (seção própria) e FOOTER com a rajada de vento.
//
// Morphing sem plugin: MorphSVGPlugin é do GSAP Club (licença paga) e não
// está no projeto — em vez de instalar algo indisponível, os paths foram
// desenhados com a MESMA estrutura de comandos (M, 3×C, L, 3×C, Z) e o
// mesmo número de pontos. Com isso o próprio GSAP interpola o atributo "d"
// numericamente, sem plugin, sem WebGL e sem canvas. A forma nasce estreita
// numa borda, ganha corpo, afina e dissipa: deslocamento de ar, não onda.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// estados alternativos de cada camada: mesma gramática de comandos
const ESTADOS = {
  a: [
    'M-40 104 C 200 96, 340 62, 580 58 C 820 54, 1000 88, 1240 74 C 1400 64, 1510 44, 1640 34 L 1640 44 C 1510 56, 1400 76, 1240 86 C 1000 100, 820 66, 580 70 C 340 74, 200 108, -40 116 Z',
    'M-40 86 C 200 118, 340 46, 580 76 C 820 106, 1000 58, 1240 84 C 1400 100, 1510 62, 1640 48 L 1640 60 C 1510 76, 1400 114, 1240 98 C 1000 72, 820 120, 580 90 C 340 60, 200 132, -40 100 Z',
  ],
  b: [
    'M-40 134 C 210 130, 350 108, 600 102 C 840 96, 1020 122, 1260 112 C 1420 105, 1520 90, 1640 82 L 1640 89 C 1520 98, 1420 113, 1260 120 C 1020 131, 840 105, 600 111 C 350 117, 210 139, -40 143 Z',
    'M-40 120 C 210 148, 350 94, 600 118 C 840 142, 1020 98, 1260 120 C 1420 134, 1520 104, 1640 94 L 1640 102 C 1520 114, 1420 144, 1260 130 C 1020 108, 840 152, 600 128 C 350 104, 210 158, -40 130 Z',
  ],
  c: [
    'M-40 74 C 170 70, 310 44, 540 40 C 780 36, 950 60, 1170 50 C 1350 42, 1470 26, 1640 16 L 1640 21 C 1470 32, 1350 48, 1170 56 C 950 66, 780 42, 540 46 C 310 50, 170 76, -40 80 Z',
    'M-40 60 C 170 92, 310 30, 540 58 C 780 86, 950 38, 1170 62 C 1350 82, 1470 40, 1640 28 L 1640 34 C 1470 48, 1350 90, 1170 68 C 950 44, 780 94, 540 64 C 310 34, 170 100, -40 66 Z',
  ],
};

export function initCtaFooter() {
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const limpezas = [cenaCta(), cenaFooter(), rajada()].filter(Boolean);
    return () => limpezas.forEach((fn) => fn());
  });
}

/* ---------- CTA ---------- */

function cenaCta() {
  const bloco = $('[data-cta-block]');
  if (!bloco) return undefined;

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    scrollTrigger: { trigger: '.cta', start: 'top 78%', once: true },
  });

  // o bloco cresce por máscara e o conteúdo assenta depois
  tl.from(bloco, { clipPath: 'inset(50% 0 50% 0)', duration: 1, ease: 'power2.out' }, 0);
  tl.from($('[data-cta-eyebrow]', bloco), { autoAlpha: 0, y: 14, duration: 0.6 }, 0.35);
  tl.from($$('[data-cta-title]', bloco), { yPercent: 115, duration: 0.9, stagger: 0.1 }, 0.4);
  tl.from($('[data-cta-text]', bloco), { autoAlpha: 0, y: 20, duration: 0.7 }, 0.72);
  tl.from($('[data-cta-btn]', bloco), { autoAlpha: 0, y: 20, duration: 0.7 }, 0.86);

  return () => tl.scrollTrigger?.kill();
}

/* ---------- footer ---------- */

function cenaFooter() {
  const ft = $('.ft');
  if (!ft) return undefined;

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    scrollTrigger: { trigger: '.ft-topline', start: 'top 94%', once: true },
  });
  tl.from($('[data-ft-line]', ft), {
    scaleX: 0,
    transformOrigin: 'left center',
    duration: 1.1,
    ease: 'power2.inOut',
  }, 0);
  tl.from($('.ft-mark', ft), { yPercent: 115, duration: 0.9 }, 0.22);
  tl.from($$('[data-ft-col]', ft), { autoAlpha: 0, y: 22, duration: 0.75, stagger: 0.1 }, 0.32);
  tl.from($('[data-ft-base]', ft), { autoAlpha: 0, duration: 0.7 }, 0.7);

  return () => tl.scrollTrigger?.kill();
}

/* ---------- rajada ---------- */

function rajada() {
  const gust = $('[data-ft-gust]');
  if (!gust) return undefined;

  const camadas = [
    { el: $('[data-gust-a]', gust), estados: ESTADOS.a, dur: 5.5 },
    { el: $('[data-gust-b]', gust), estados: ESTADOS.b, dur: 6.8 },
    { el: $('[data-gust-c]', gust), estados: ESTADOS.c, dur: 4.6 },
  ].filter((c) => c.el);

  if (!camadas.length) return undefined;

  const tweens = [];

  // 1) travessia amarrada ao scroll: a rajada entra pela esquerda,
  //    atravessa e dissipa conforme o footer sobe
  camadas.forEach((c, i) => {
    tweens.push(
      gsap.fromTo(
        c.el,
        { xPercent: -12 - i * 5, opacity: 0 },
        {
          xPercent: 6 + i * 3,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: '.ft',
            start: 'top bottom',
            end: 'top 40%',
            scrub: 0.7,
          },
        },
      ),
    );
  });

  // 2) deformação contínua entre os dois estados — só enquanto o footer
  //    está visível, para não consumir quadro fora da viewport
  const deformacoes = camadas.map((c) =>
    gsap.to(c.el, {
      attr: { d: c.estados[1] },
      duration: c.dur,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      paused: true,
    }),
  );

  const st = ScrollTrigger.create({
    trigger: '.ft',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      deformacoes.forEach((t) => (self.isActive ? t.play() : t.pause()));
    },
  });

  // a aba oculta também não deve manter a deformação rodando
  const onVis = () => {
    if (document.hidden) deformacoes.forEach((t) => t.pause());
    else if (st.isActive) deformacoes.forEach((t) => t.play());
  };
  document.addEventListener('visibilitychange', onVis);

  return () => {
    tweens.forEach((t) => t.scrollTrigger?.kill());
    deformacoes.forEach((t) => t.kill());
    st.kill();
    document.removeEventListener('visibilitychange', onVis);
  };
}
