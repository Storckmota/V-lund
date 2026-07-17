// Referência isolada da v3. Não importar na implementação ativa.
import gsap from 'gsap';
import { DUR, EASE } from './motion-tokens.js';

export function initPreloader() {
  const root = document.documentElement;
  const pre = document.querySelector('[data-preloader]');
  const lines = document.querySelectorAll('.hero .ht-in');
  const stages = document.querySelectorAll('.hero [data-stage]');

  const heroIn = (fast) => {
    const tl = gsap.timeline();
    tl.to(lines, {
      yPercent: 0,
      duration: fast ? DUR.micro : DUR.reveal,
      ease: EASE.out,
      stagger: 0.09,
    }, 0);
    tl.to(stages, {
      autoAlpha: 1,
      y: 0,
      duration: fast ? DUR.micro : DUR.reveal,
      ease: EASE.out,
      stagger: 0.07,
    }, fast ? 0 : 0.15);
    return tl;
  };

  if (!root.classList.contains('intro') || !pre) {
    if (pre) pre.remove();
    return;
  }

  try {
    sessionStorage.setItem('volund-intro', '1');
  } catch (e) {
    // segue
  }

  gsap.set(lines, { y: 0, yPercent: 110 });
  gsap.set(stages, { autoAlpha: 0, y: 14 });
  root.classList.remove('intro');
  gsap.set(pre, { display: 'block' });

  const frags = pre.querySelectorAll('.pre-frag');
  const v = pre.querySelector('.pre-v');
  const emberDot = pre.querySelector('.pre-ember');

  const cluster = [
    { x: -52, y: -58, r: -18 },
    { x: -37, y: -19, r: -18 },
    { x: -22, y: 20, r: -18 },
    { x: -8, y: 56, r: -18 },
    { x: 50, y: -58, r: 18 },
    { x: 28, y: -4, r: 18 },
    { x: 8, y: 50, r: 18 },
  ];

  const cleanup = () => {
    pre.remove();
  };

  const tl = gsap.timeline({ onComplete: cleanup });

  tl.to(frags, {
    autoAlpha: 0.92,
    x: (i) => cluster[i % cluster.length].x,
    y: (i) => cluster[i % cluster.length].y,
    rotation: (i) => cluster[i % cluster.length].r,
    duration: 0.5,
    ease: EASE.out,
    stagger: 0.035,
  }, 0);

  tl.to(v, {
    clipPath: 'inset(0% 0 0 0)',
    duration: 0.45,
    ease: EASE.mask,
  }, 0.32);

  tl.to(frags, { autoAlpha: 0, duration: 0.28, ease: EASE.out }, 0.55);
  tl.to(emberDot, { scale: 1, duration: 0.16, ease: EASE.out }, 0.78);
  tl.to(v, { y: -40, autoAlpha: 0, duration: 0.38, ease: EASE.in }, 1.0);
  tl.to(emberDot, { y: -64, autoAlpha: 0, duration: 0.34, ease: EASE.in }, 1.02);
  tl.to(pre, { autoAlpha: 0, duration: 0.4, ease: EASE.mask }, 1.12);
  tl.add(heroIn(false), 1.1);

  setTimeout(() => {
    if (document.body.contains(pre)) {
      tl.progress(1);
    }
  }, 3000);
}
