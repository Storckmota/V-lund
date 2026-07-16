/* Footer — o masthead responde ao cursor por fatias: deslocamento
   temporário, sempre restaurado ao desenho original. Teclado, touch e
   reduced motion recebem a marca íntegra e estática. */

import gsap from 'gsap';
import { reducedMotion, finePointer } from './motion-tokens.js';

export function initFooter() {
  const footer = document.querySelector('[data-footer]');
  const mast = document.querySelector('[data-mast]');
  if (!footer || !mast) return;
  if (reducedMotion() || !finePointer()) return;

  const slices = Array.from(mast.querySelectorAll('.ft-slice'));
  if (!slices.length) return;

  const movers = slices.map((s) => gsap.quickTo(s, 'y', { duration: 0.55, ease: 'power3' }));

  footer.addEventListener('pointermove', (e) => {
    const r = mast.getBoundingClientRect();
    if (r.height === 0) return;
    const nx = (e.clientX - r.left) / r.width;
    // proximidade vertical: o efeito cresce perto do masthead
    const vy = Math.max(0, 1 - Math.abs(e.clientY - (r.top + r.height * 0.5)) / (r.height * 1.4));
    slices.forEach((s, i) => {
      const cx = (i + 0.5) / slices.length;
      const d = nx - cx;
      const lift = -Math.exp(-(d * d) / 0.02) * 22 * vy;
      movers[i](lift);
    });
  }, { passive: true });

  footer.addEventListener('pointerleave', () => {
    movers.forEach((to) => to(0));
  });
}
