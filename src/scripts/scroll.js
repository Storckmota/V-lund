/* Revelações por máscara, serviços (lâmina de detalhe) e o traço de
   brasa do processo. Reduced motion: tudo visível, traço completo. */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from './motion-tokens.js';

export function initScroll() {
  initReveals();
  initServices();
  initTrace();
}

function initReveals() {
  // Não usa IntersectionObserver: elementos totalmente cortados por
  // clip-path não intersectam (Chrome) e saltos de âncora pulam o
  // observer. Checagem por rect, throttled por rAF, lista decrescente.
  let pending = Array.from(document.querySelectorAll('[data-reveal]'));
  if (!pending.length) return;

  if (reducedMotion()) {
    pending.forEach((el) => el.classList.add('is-in'));
    return;
  }

  let scheduled = false;

  const check = () => {
    scheduled = false;
    const limit = window.innerHeight * 0.92;
    pending = pending.filter((el) => {
      if (el.getBoundingClientRect().top < limit) {
        el.classList.add('is-in');
        return false;
      }
      return true;
    });
    if (!pending.length) {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    }
  };

  const schedule = () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(check);
    }
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  check();
}

function initServices() {
  const items = document.querySelectorAll('[data-serv-item]');
  const surfaces = document.querySelectorAll('[data-serv-surface]');
  if (!items.length || !surfaces.length) return;

  const setActive = (i) => {
    items.forEach((el) => el.classList.toggle('is-active', el.dataset.servItem === String(i)));
    surfaces.forEach((el) => el.classList.toggle('is-active', el.dataset.servSurface === String(i)));
  };

  items.forEach((item) => {
    const i = parseInt(item.dataset.servItem, 10);
    item.addEventListener('pointerenter', () => setActive(i));
    item.addEventListener('focusin', () => setActive(i));
  });
}

function initTrace() {
  const trace = document.querySelector('[data-trace]');
  if (!trace) return;

  const line = trace.querySelector('[data-trace-line]');
  const ember = trace.querySelector('[data-trace-ember]');
  const rail = trace.querySelector('.trace-rail');
  const steps = trace.querySelectorAll('[data-step]');

  if (reducedMotion()) {
    if (line) line.style.transform = 'scaleY(1)';
    if (ember && rail) ember.style.transform = `translateY(${rail.offsetHeight - 8}px)`;
    steps.forEach((s) => s.classList.add('is-lit'));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  gsap.to(line, {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: trace,
      start: 'top 68%',
      end: 'bottom 62%',
      scrub: 0.6,
    },
  });

  gsap.to(ember, {
    y: () => (rail ? rail.offsetHeight - 8 : 0),
    ease: 'none',
    scrollTrigger: {
      trigger: trace,
      start: 'top 68%',
      end: 'bottom 62%',
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });

  steps.forEach((step) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 66%',
      once: true,
      onEnter: () => step.classList.add('is-lit'),
    });
  });
}
