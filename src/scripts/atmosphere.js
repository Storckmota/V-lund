// Atmosfera da hero em canvas 2D, duas camadas:
// 1) campos suaves de tom de papel (deriva lenta + parallax sutil);
// 2) superfície tonal contínua — um campo de baixa resolução ampliado
//    com interpolação, sem nenhum elemento discreto visível. Parada,
//    a composição tem duas decisões espaciais: uma banda diagonal que
//    nasce junto ao wordmark e sobe para a direita, e um contracampo
//    discreto no alto à esquerda; atrás da headline, silêncio.
//    O ponteiro age como pressão direcional sobre essa matéria:
//    adensa o tom à frente do gesto, abre um relevo mais claro atrás,
//    com memória ~1s e retorno amortecido. Sem pontos, sem círculos,
//    sem brilho.

import { stepPointerField } from './pointer-field.js';

const LOBES = [
  { hue: '242, 237, 227', alpha: 0.75, r: 0.62, cx: 0.22, cy: 0.3, ax: 0.05, ay: 0.045, sp: 0.11, ph: 0.4, depth: 26 },
  { hue: '239, 231, 216', alpha: 0.6, r: 0.5, cx: 0.78, cy: 0.24, ax: 0.045, ay: 0.055, sp: 0.09, ph: 2.1, depth: -34 },
  { hue: '246, 241, 233', alpha: 0.85, r: 0.68, cx: 0.5, cy: 0.72, ax: 0.04, ay: 0.035, sp: 0.07, ph: 4.2, depth: 18 },
  { hue: '233, 226, 211', alpha: 0.5, r: 0.44, cx: 0.12, cy: 0.82, ax: 0.05, ay: 0.04, sp: 0.13, ph: 1.3, depth: -22 },
  { hue: '236, 229, 215', alpha: 0.45, r: 0.4, cx: 0.88, cy: 0.78, ax: 0.055, ay: 0.05, sp: 0.1, ph: 5.4, depth: 30 },
];

const TEX = 22; // px CSS por texel do campo tonal
const DARK = [95, 89, 76]; // matéria: entre muted e body, nunca preto
const LIGHT = [250, 248, 244]; // abertura: o próprio papel
const BASE_MAX = 0.085; // teto tonal da composição parada
const PRESS_DARK = 0.12; // adensamento máximo somado pela pressão
const PRESS_LIGHT = 0.15; // abertura máxima atrás do gesto
const DECAY = 0.94; // memória ~1s a 60fps
const EPS = 0.02;

// hash determinístico por texel: composição estável entre resizes
const hash2 = (x, y, s) => {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

// composição parada: banda diagonal + contracampo + silêncio na headline
const baseValue = (u, v) => {
  // banda ampla do canto do wordmark (baixo-esquerda) à direita-meio
  const d1 = v - (1.12 - 0.66 * u);
  let val = Math.exp(-(d1 * d1) / 0.09);
  // contracampo discreto no alto à esquerda
  const du = u - 0.06;
  const dv = v - 0.08;
  val += 0.5 * Math.exp(-(du * du) / 0.045 - (dv * dv) / 0.055);
  // silêncio atrás do bloco da copy: máscara retangular suave
  const qx = smooth((0.34 - Math.abs(u - 0.5)) / 0.16);
  const qy = smooth((0.26 - Math.abs(v - 0.3)) / 0.18);
  val *= 1 - 0.82 * qx * qy;
  return clamp01(val);
};

export function initAtmosphere() {
  const canvas = document.querySelector('[data-atmos]');
  const hero = document.querySelector('.hero');
  if (!canvas || !hero) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');

  let w = 0;
  let h = 0;
  let dpr = 1;
  let raf = 0;
  let running = false;
  let inView = true;
  let heroTop = 0;

  // parallax dos campos, derivado do ponteiro compartilhado
  const parallax = { x: 0, y: 0 };
  let prevX = -1e4;
  let prevY = -1e4;
  let surfaceLive = false;

  // campo tonal em baixa resolução
  let cols = 0;
  let rows = 0;
  let baseV = new Float32Array(0); // composição parada por texel
  let irr = new Float32Array(0); // irregularidade da borda de influência
  let energy = new Float32Array(0); // pressão assinada: +adensa, -abre
  let field = null; // canvas pequeno recomposto quando há energia
  let fieldCtx = null;
  let fieldImage = null; // ImageData reutilizado (sem alocação por quadro)
  let still = null; // canvas pequeno pré-renderizado do estado parado
  let stillData = null; // RGBA do estado parado, fonte da recomposição

  const buildField = () => {
    cols = Math.max(2, Math.ceil(w / TEX));
    rows = Math.max(2, Math.ceil(h / TEX));
    const n = cols * rows;
    baseV = new Float32Array(n);
    irr = new Float32Array(n);
    energy = new Float32Array(n);

    field = document.createElement('canvas');
    field.width = cols;
    field.height = rows;
    fieldCtx = field.getContext('2d');
    fieldImage = fieldCtx.createImageData(cols, rows);

    still = document.createElement('canvas');
    still.width = cols;
    still.height = rows;
    const stillCtx = still.getContext('2d');
    const img = stillCtx.createImageData(cols, rows);

    for (let ty = 0; ty < rows; ty += 1) {
      for (let tx = 0; tx < cols; tx += 1) {
        const i = ty * cols + tx;
        // variação orgânica leve — ampliada com interpolação, nunca grão
        const organic = 0.8 + 0.4 * hash2(tx, ty, 1);
        baseV[i] = baseValue((tx + 0.5) / cols, (ty + 0.5) / rows) * organic;
        irr[i] = 0.7 + 0.6 * hash2(tx, ty, 2);
        const a = baseV[i] * BASE_MAX;
        const p = i * 4;
        img.data[p] = DARK[0];
        img.data[p + 1] = DARK[1];
        img.data[p + 2] = DARK[2];
        img.data[p + 3] = Math.round(a * 255);
      }
    }
    stillCtx.putImageData(img, 0, 0);
    stillData = img.data;
  };

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    heroTop = rect.top + window.scrollY;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    buildField();
  };

  const drawLobes = (t) => {
    const base = Math.min(w, h);
    for (const l of LOBES) {
      const drift = t * l.sp;
      const x = (l.cx + Math.sin(drift + l.ph) * l.ax) * w + parallax.x * l.depth;
      const y = (l.cy + Math.cos(drift * 0.9 + l.ph) * l.ay) * h + parallax.y * l.depth;
      const r = l.r * base;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${l.hue}, ${l.alpha})`);
      g.addColorStop(1, `rgba(${l.hue}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  };

  // pressão direcional sobre o campo: elipse alongada no eixo do gesto,
  // mais curta e concentrada à frente, mais longa atrás; borda irregular
  // por texel, mas contínua depois da ampliação
  const stamp = (sx, sy, dirX, dirY, speed) => {
    const R = 105 + Math.min(speed * 3.2, 75);
    const front = R * 0.6;
    const back = R * (1.2 + Math.min(speed * 0.055, 1));
    const perp = R * 0.75;
    const reach = Math.max(back, perp);
    if (sx < -reach || sx > w + reach || sy < -reach || sy > h + reach) return;
    // pressão é consequência do gesto: sem velocidade não há marca —
    // cursor parado nunca sustenta um foco na superfície
    const gain = Math.min(1, speed * 0.16);
    if (gain < 0.02) return;
    const tx0 = Math.max(0, Math.floor((sx - reach) / TEX));
    const tx1 = Math.min(cols - 1, Math.ceil((sx + reach) / TEX));
    const ty0 = Math.max(0, Math.floor((sy - reach) / TEX));
    const ty1 = Math.min(rows - 1, Math.ceil((sy + reach) / TEX));
    for (let ty = ty0; ty <= ty1; ty += 1) {
      for (let tx = tx0; tx <= tx1; tx += 1) {
        const i = ty * cols + tx;
        const relX = tx * TEX + TEX / 2 - sx;
        const relY = ty * TEX + TEX / 2 - sy;
        const along = relX * dirX + relY * dirY;
        const side = relY * dirX - relX * dirY;
        const lenA = along >= 0 ? front : back;
        const q = ((along * along) / (lenA * lenA) + (side * side) / (perp * perp)) / irr[i];
        if (q >= 1) continue;
        const fall = smooth(1 - Math.sqrt(q));
        // à frente comprime (adensa o tom); atrás abre (relevo claro)
        const e = along >= 0 ? fall * gain * 0.55 : -fall * gain * 0.5;
        const next = energy[i] + e;
        energy[i] = next > 1 ? 1 : next < -1 ? -1 : next;
        surfaceLive = true;
      }
    }
  };

  // recompõe o campo pequeno: estado parado + pressão, e decai a memória
  const composeField = () => {
    const data = fieldImage.data;
    data.set(stillData);
    let peak = 0;
    for (let i = 0; i < energy.length; i += 1) {
      const e = energy[i];
      const m = e < 0 ? -e : e;
      if (m < EPS) {
        energy[i] = 0;
        continue;
      }
      if (m > peak) peak = m;
      const p = i * 4;
      const net = baseV[i] * BASE_MAX + (e > 0 ? e * PRESS_DARK : e * PRESS_LIGHT);
      if (net >= 0) {
        data[p] = DARK[0];
        data[p + 1] = DARK[1];
        data[p + 2] = DARK[2];
        data[p + 3] = Math.round(Math.min(net, 0.24) * 255);
      } else {
        data[p] = LIGHT[0];
        data[p + 1] = LIGHT[1];
        data[p + 2] = LIGHT[2];
        data[p + 3] = Math.round(Math.min(-net, 0.2) * 255);
      }
      energy[i] = e * DECAY;
    }
    fieldCtx.putImageData(fieldImage, 0, 0);
    if (peak < EPS) surfaceLive = false;
  };

  const drawSurface = (pf, interactive) => {
    if (interactive && pf.active) {
      const cy = pf.y - (heroTop - window.scrollY);
      if (prevX > -9e3) {
        const seg = Math.hypot(pf.x - prevX, cy - prevY);
        if (seg > 16) {
          stamp((pf.x + prevX) / 2, (cy + prevY) / 2, pf.dirX, pf.dirY, pf.speed);
        }
      }
      stamp(pf.x, cy, pf.dirX, pf.dirY, pf.speed);
      prevX = pf.x;
      prevY = cy;
    }
    if (surfaceLive) {
      composeField();
      ctx.drawImage(field, 0, 0, w, h);
    } else {
      ctx.drawImage(still, 0, 0, w, h);
    }
  };

  const drawFrame = (t, pf, interactive) => {
    ctx.clearRect(0, 0, w, h);
    drawLobes(t);
    drawSurface(pf, interactive);
  };

  const loop = (now) => {
    const pf = stepPointerField(now);
    if (pf.active) {
      parallax.x += (pf.rawX / window.innerWidth - 0.5 - parallax.x) * 0.055;
      parallax.y += (pf.rawY / window.innerHeight - 0.5 - parallax.y) * 0.055;
    }
    drawFrame(now / 1000, pf, fine.matches);
    raf = requestAnimationFrame(loop);
  };

  const start = () => {
    if (running || reduced.matches || !inView || document.hidden) return;
    running = true;
    raf = requestAnimationFrame(loop);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  const idle = { active: false };

  resize();
  window.addEventListener('resize', () => {
    resize();
    if (!running) drawFrame(performance.now() / 1000, idle, false);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  // pausa quando a hero sai da viewport
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      if (inView) start();
      else stop();
    });
    io.observe(hero);
  }

  if (reduced.matches) {
    drawFrame(0, idle, false); // quadro único: campos + superfície parada
  } else {
    start();
  }

  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      stop();
      drawFrame(0, idle, false);
    } else {
      start();
    }
  });
}
