// Abertura: traços → V → brasa → FLIP do V e da brasa para as âncoras da hero.
const EASE = 'cubic-bezier(0.19, 1, 0.22, 1)';
const INTRO_DONE = 'volund:introdone';

export function initPreloader() {
  const root = document.documentElement;
  const pre = document.querySelector('[data-preloader]');
  const done = () => document.dispatchEvent(new CustomEvent(INTRO_DONE));

  try {
    sessionStorage.setItem('volund-intro', '1');
  } catch (e) {
    // sessão indisponível: segue
  }

  if (!root.classList.contains('intro') || !pre) {
    if (pre) pre.remove();
    done();
    return;
  }

  pre.classList.add('is-active');

  const preV = pre.querySelector('[data-pre-v]');
  const preEmber = pre.querySelector('[data-pre-ember]');
  const heroV = document.querySelector('[data-hero-v]');
  const emberTarget = document.querySelector('[data-ember-target]');

  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    root.classList.add('reveal');
    root.classList.remove('intro');
    pre.remove();
    done();
  };

  const flip = (el, target) => {
    if (!el || !target) return;
    const from = el.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    if (!from.width || !to.width) return;
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const s = to.width / from.width;
    el.style.animation = 'none';
    el.style.transition = `transform 0.62s ${EASE}`;
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
  };

  const handoff = () => {
    if (finished) return;
    root.classList.add('reveal');
    flip(preV, heroV);
    flip(preEmber, emberTarget);
    setTimeout(() => {
      if (finished) return;
      finished = true;
      root.classList.remove('intro');
      pre.classList.add('is-out');
      setTimeout(() => {
        pre.remove();
        done();
      }, 380);
    }, 640);
  };

  if (preEmber) {
    preEmber.addEventListener('animationend', handoff, { once: true });
  }

  // fallback interno: nunca prender o visitante na abertura
  setTimeout(finish, 2800);
}
