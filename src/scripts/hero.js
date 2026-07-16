/* Hero — as três lâminas de projeto: suspensão contínua + deslocamento
   por cursor com inércia (gsap.quickTo). Em touch, movimento autônomo
   lento; em reduced motion, composição estática. */

import gsap from 'gsap';
import { AMP, reducedMotion, finePointer } from './motion-tokens.js';

export function initHero() {
  const hero = document.querySelector('.hero');
  const wrap = document.querySelector('[data-hero-panels]');
  if (!hero || !wrap) return;

  const panels = Array.from(wrap.querySelectorAll('[data-panel]'));
  if (!panels.length) return;

  // alternância do projeto ativo (o reel silencioso)
  let active = 0;
  let heroVisible = true;
  const setActive = (i) => {
    active = i;
    panels.forEach((p, n) => p.classList.toggle('is-active', n === i));
  };

  const cycle = setInterval(() => {
    if (document.hidden || !heroVisible) return;
    setActive((active + 1) % panels.length);
  }, 3800);

  panels.forEach((p, i) => {
    p.addEventListener('pointerenter', () => setActive(i));
    p.addEventListener('focus', () => setActive(i));
  });

  const visObserver = new IntersectionObserver((entries) => {
    heroVisible = entries[0]?.isIntersecting ?? true;
  });
  visObserver.observe(hero);

  if (reducedMotion()) {
    clearInterval(cycle);
    setActive(0);
    return;
  }

  // suspensão + deslocamento compartilham o mesmo motor
  const movers = panels.map((p) => ({
    depth: parseFloat(p.dataset.depth) || 0.5,
    xTo: gsap.quickTo(p, 'x', { duration: 0.9, ease: 'power3' }),
    yTo: gsap.quickTo(p, 'y', { duration: 0.9, ease: 'power3' }),
    phase: Math.random() * Math.PI * 2,
  }));

  const pointer = { nx: 0, ny: 0 };
  const fine = finePointer();

  if (fine) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      pointer.nx = (e.clientX - r.left) / r.width - 0.5;
      pointer.ny = (e.clientY - r.top) / r.height - 0.5;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      pointer.nx = 0;
      pointer.ny = 0;
    });
  }

  const update = () => {
    if (!heroVisible || document.hidden) return;
    const t = gsap.ticker.time;
    movers.forEach((m, i) => {
      const bobY = Math.sin(t * 0.55 + m.phase) * AMP.drift * m.depth;
      const bobX = Math.cos(t * 0.4 + m.phase) * AMP.drift * 0.5 * m.depth;
      m.xTo(pointer.nx * AMP.displace * m.depth * (i % 2 ? -1 : 1) + bobX);
      m.yTo(pointer.ny * AMP.displace * 0.7 * m.depth + bobY);
    });
  };

  gsap.ticker.add(update);
}
