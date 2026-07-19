// Wordmark monumental: cada glifo reage à proximidade do ponteiro como
// matéria tipográfica atravessada por uma corrente de ar — sobe poucos
// pixels, inclina de leve, volta com amortecimento. Vizinhos respondem
// menos pela própria queda de influência com a distância.
// Lê a posição amortecida do campo de ponteiro compartilhado: a mesma
// pressão que percorre a superfície chega ao glifo com o mesmo atraso,
// e o vetor de movimento dá um viés mínimo à inclinação.
// Desktop com ponteiro fino apenas; sem reduced motion.

import { stepPointerField } from './pointer-field.js';

const RADIUS = 210; // raio de influência, px de tela
const MAX_RISE = 9; // deslocamento máximo, px de tela
const MAX_TILT = 0.85; // graus
const MAX_SCALE = 0.012;
const STIFF = 0.085;
const DAMP = 0.82;

export function initMonument() {
  const svg = document.querySelector('.monument-wordmark');
  const glyphs = svg ? [...svg.querySelectorAll('.mw-g')] : [];
  if (!svg || !glyphs.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  if (!fine.matches || reduced.matches) return;

  let svgRect = null;
  let unit = 1; // px de tela -> unidades do viewBox

  // centros dos glifos em unidades do viewBox (getBBox ignora transforms CSS)
  const centers = glyphs.map((g) => {
    const b = g.getBBox();
    return { cx: b.x + b.width / 2, cy: b.y + b.height / 2 };
  });

  const states = glyphs.map(() => ({ y: 0, vy: 0, r: 0, vr: 0, s: 0, vs: 0 }));

  const measure = () => {
    svgRect = svg.getBoundingClientRect();
    unit = svgRect.width > 0 ? 1594 / svgRect.width : 1;
  };

  let raf = 0;
  let running = false;
  let inView = true;
  let idleFrames = 0;

  const frame = (now) => {
    if (!svgRect) measure();
    const pf = stepPointerField(now);
    let active = false;

    for (let i = 0; i < glyphs.length; i += 1) {
      const c = centers[i];
      const sx = svgRect.left + (c.cx / 1594) * svgRect.width;
      const sy = svgRect.top + (c.cy / 381) * svgRect.height;
      const dx = pf.x - sx;
      const dy = pf.y - sy;
      const d = Math.hypot(dx, dy);

      let f = Math.max(0, 1 - d / RADIUS);
      f = f * f * (3 - 2 * f); // smoothstep: vizinhos respondem menos

      const ty = -MAX_RISE * f;
      // posição dá o tombo base; o vetor do gesto soma um viés mínimo
      const tr = Math.max(
        -MAX_TILT,
        Math.min(MAX_TILT, (-dx / RADIUS) * 1.6 * f * MAX_TILT * 2 + pf.vx * 0.02 * f),
      );
      const ts = MAX_SCALE * f;

      const st = states[i];
      st.vy = (st.vy + (ty - st.y) * STIFF) * DAMP;
      st.vr = (st.vr + (tr - st.r) * STIFF) * DAMP;
      st.vs = (st.vs + (ts - st.s) * STIFF) * DAMP;
      st.y += st.vy;
      st.r += st.vr;
      st.s += st.vs;

      if (Math.abs(st.y) > 0.01 || Math.abs(st.r) > 0.005 || Math.abs(st.s) > 0.0005 || f > 0) {
        active = true;
        glyphs[i].style.transform =
          `translateY(${(st.y * unit).toFixed(2)}px) rotate(${st.r.toFixed(3)}deg) scale(${(1 + st.s).toFixed(4)})`;
      }
    }

    idleFrames = active ? 0 : idleFrames + 1;
    if (idleFrames > 30) {
      running = false;
      return; // dorme até o próximo movimento de ponteiro
    }
    raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (running || !inView || document.hidden || reduced.matches) return;
    running = true;
    idleFrames = 0;
    raf = requestAnimationFrame(frame);
  };

  const onPointer = () => {
    svgRect = svg.getBoundingClientRect();
    unit = svgRect.width > 0 ? 1594 / svgRect.width : 1;
    wake();
  };

  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('resize', measure, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      running = false;
    } else {
      wake();
    }
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      if (!inView) {
        cancelAnimationFrame(raf);
        running = false;
      } else {
        wake();
      }
    });
    io.observe(svg);
  }

  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      cancelAnimationFrame(raf);
      running = false;
      glyphs.forEach((g) => {
        g.style.transform = '';
      });
    }
  });

  measure();
}
