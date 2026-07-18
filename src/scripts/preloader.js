// Preloader: fragmentos convergem, o V se monta em tinta, sobe e dá lugar
// à marca completa — VÓLUND + Estúdio de Presença Digital — que entrega
// direto para a entrada da hero. Primeira visita por sessão.
// Sem GSAP: Web Animations API + timers, com fallback de segurança.

const EASE_OUT = 'cubic-bezier(0.215, 0.61, 0.355, 1)';
const EASE_IN = 'cubic-bezier(0.55, 0.055, 0.675, 0.19)';
const EASE_MASK = 'cubic-bezier(0.455, 0.03, 0.515, 0.955)';
const EASE_EXPO = 'cubic-bezier(0.22, 1, 0.36, 1)';

const CLUSTER = [
  { x: -52, y: -58, r: -18 },
  { x: -37, y: -19, r: -18 },
  { x: -22, y: 20, r: -18 },
  { x: -8, y: 56, r: -18 },
  { x: 50, y: -58, r: 18 },
  { x: 28, y: -4, r: 18 },
  { x: 8, y: 50, r: 18 },
];

export function initPreloader() {
  const root = document.documentElement;
  const pre = document.querySelector('[data-preloader]');
  if (!pre) return;

  if (!root.classList.contains('intro') || typeof pre.animate !== 'function') {
    root.classList.remove('intro');
    pre.remove();
    return;
  }

  try {
    sessionStorage.setItem('volund-intro', '1');
  } catch (e) {
    // segue
  }

  const frags = [...pre.querySelectorAll('.pre-frag')];
  const v = pre.querySelector('.pre-v');
  const brand = pre.querySelector('.pre-brand');
  const wordmark = pre.querySelector('.pre-wordmark');
  const tag = pre.querySelector('.pre-tag');
  const timers = [];
  let done = false;

  const at = (ms, fn) => timers.push(window.setTimeout(fn, ms));

  // a hero é solta antes do véu terminar de sair, para a entrada acontecer atrás dele
  const release = () => {
    pre.style.display = 'block';
    root.classList.remove('intro');
  };

  const finish = () => {
    if (done) return;
    done = true;
    timers.forEach(window.clearTimeout);
    release();
    pre.remove();
  };

  // 1) fragmentos convergem para o eixo do V
  frags.forEach((frag, i) => {
    const s = frag.style;
    const from = `translate(${s.getPropertyValue('--fx')}, ${s.getPropertyValue('--fy')}) rotate(${s.getPropertyValue('--fr')})`;
    const c = CLUSTER[i % CLUSTER.length];
    frag.animate(
      [
        { transform: from, opacity: 0 },
        { transform: `translate(${c.x}px, ${c.y}px) rotate(${c.r}deg)`, opacity: 0.92 },
      ],
      { delay: i * 35, duration: 500, easing: EASE_OUT, fill: 'both' },
    );
    frag.animate([{ opacity: 0 }], { delay: 550, duration: 280, easing: EASE_OUT, fill: 'forwards' });
  });

  // 2) o V se monta por máscara
  v.animate(
    [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)' }],
    { delay: 320, duration: 450, easing: EASE_MASK, fill: 'both' },
  );

  // 3) o V sobe e dá lugar à marca
  v.animate(
    [
      { transform: 'translateY(0)', opacity: 1 },
      { transform: 'translateY(-30px)', opacity: 0 },
    ],
    { delay: 940, duration: 340, easing: EASE_IN, fill: 'forwards' },
  );

  // 4) VÓLUND revelado por máscara, assinatura logo abaixo
  wordmark.animate(
    [{ transform: 'translateY(112%)' }, { transform: 'translateY(0)' }],
    { delay: 1100, duration: 600, easing: EASE_EXPO, fill: 'both' },
  );
  tag.animate(
    [
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    { delay: 1340, duration: 420, easing: EASE_OUT, fill: 'both' },
  );

  // 5) a composição abre direto a hero: marca sobe junto com o véu
  brand.animate(
    [
      { transform: 'translate(-50%, -50%)' },
      { transform: 'translate(-50%, calc(-50% - 16px))' },
    ],
    { delay: 2000, duration: 420, easing: EASE_MASK, fill: 'forwards' },
  );

  at(1980, release);

  const veil = pre.animate([{ opacity: 1 }, { opacity: 0 }], {
    delay: 2020,
    duration: 400,
    easing: EASE_MASK,
    fill: 'forwards',
  });
  veil.onfinish = finish;

  // segurança: nunca prender a página no preloader
  at(4000, finish);
}
