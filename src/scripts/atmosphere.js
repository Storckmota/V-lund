// Atmosfera da hero em canvas 2D, duas camadas:
// 1) campos suaves de tom de papel (deriva lenta + parallax sutil);
// 2) campo de pressão editorial — matéria granular assentada em zonas
//    assimétricas do papel: margens e base mais densas, clareira sob a
//    headline. O ponteiro não acende uma grade: age como pressão
//    direcional sobre a superfície — influência elíptica alongada na
//    direção do gesto, compressão à frente, abertura atrás, borda
//    difusa e memória curta (~0,9s) que assenta com amortecimento.
// Sem formas desenhadas, sem linhas, sem brilho.

import { stepPointerField } from './pointer-field.js';

const LOBES = [
  { hue: '242, 237, 227', alpha: 0.75, r: 0.62, cx: 0.22, cy: 0.3, ax: 0.05, ay: 0.045, sp: 0.11, ph: 0.4, depth: 26 },
  { hue: '239, 231, 216', alpha: 0.6, r: 0.5, cx: 0.78, cy: 0.24, ax: 0.045, ay: 0.055, sp: 0.09, ph: 2.1, depth: -34 },
  { hue: '246, 241, 233', alpha: 0.85, r: 0.68, cx: 0.5, cy: 0.72, ax: 0.04, ay: 0.035, sp: 0.07, ph: 4.2, depth: 18 },
  { hue: '233, 226, 211', alpha: 0.5, r: 0.44, cx: 0.12, cy: 0.82, ax: 0.05, ay: 0.04, sp: 0.13, ph: 1.3, depth: -22 },
  { hue: '236, 229, 215', alpha: 0.45, r: 0.4, cx: 0.88, cy: 0.78, ax: 0.055, ay: 0.05, sp: 0.1, ph: 5.4, depth: 30 },
];

// Zonas tonais da composição parada, em coordenadas normalizadas.
// Ganho negativo abre a clareira central onde vive a headline.
const FIELDS = [
  { u: 0.06, v: 0.22, ru: 0.3, rv: 0.55, g: 0.85 },
  { u: 0.95, v: 0.5, ru: 0.27, rv: 0.62, g: 0.72 },
  { u: 0.34, v: 0.98, ru: 0.52, rv: 0.27, g: 0.8 },
  { u: 0.71, v: 0.03, ru: 0.34, rv: 0.2, g: 0.5 },
  { u: 0.52, v: 0.4, ru: 0.46, rv: 0.4, g: -1.15 },
];

const CELL = 17; // espaçamento nominal entre células
const DOT_INK = '52, 48, 41';
const MAX_ALPHA = 0.34; // teto da célula desperta — contraste de tinta, nunca brilho
const DECAY = 0.93; // memória do gesto: ~0,9s até apagar a 60fps
const RETURN = 0.9; // retorno amortecido do microdeslocamento
const MAX_PUSH = 2.6; // deslocamento máximo da célula, px

// hash determinístico por célula: a composição é estável entre resizes
const hash2 = (x, y, s) => {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

const density = (u, v) => {
  let d = 0.22;
  for (const f of FIELDS) {
    const du = (u - f.u) / f.ru;
    const dv = (v - f.v) / f.rv;
    d += f.g * Math.exp(-(du * du + dv * dv));
  }
  return d < 0 ? 0 : d > 1 ? 1 : d;
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

  // posição amortecida anterior, para carimbar o trecho percorrido
  let prevX = -1e4;
  let prevY = -1e4;
  let surfaceLive = false;

  // células com identidade própria; wgt 0 marca célula ausente
  let cols = 0;
  let rows = 0;
  let energy = new Float32Array(0);
  let offX = new Float32Array(0);
  let offY = new Float32Array(0);
  let posX = new Float32Array(0);
  let posY = new Float32Array(0);
  let wgt = new Float32Array(0); // reatividade própria: nem toda célula responde igual
  let rad = new Float32Array(0); // variação do raio de influência: limite difuso
  let siz = new Float32Array(0); // tamanho próprio do ponto
  let pres = new Float32Array(0); // presença tonal em repouso (zona + hash)
  let baseLayer = null;

  const buildCells = () => {
    const n = cols * rows;
    energy = new Float32Array(n);
    offX = new Float32Array(n);
    offY = new Float32Array(n);
    posX = new Float32Array(n);
    posY = new Float32Array(n);
    wgt = new Float32Array(n);
    rad = new Float32Array(n);
    siz = new Float32Array(n);
    pres = new Float32Array(n);
    for (let gy = 0; gy < rows; gy += 1) {
      for (let gx = 0; gx < cols; gx += 1) {
        const i = gy * cols + gx;
        const nx = gx * CELL + CELL / 2;
        const ny = gy * CELL + CELL / 2;
        const den = density(nx / w, ny / h);
        // ocupação segue a zona, com piso: regiões limpas ficam quase
        // invisíveis em repouso, mas a superfície latente existe em toda
        // parte — a pressão do gesto encontra matéria onde passar
        if (hash2(gx, gy, 1) > 0.3 + den * 0.6) continue;
        // dispersão maior onde a matéria rareia: nada de retícula
        const scatter = CELL * (0.68 + (1 - den) * 0.5);
        posX[i] = nx + (hash2(gx, gy, 2) - 0.5) * scatter;
        posY[i] = ny + (hash2(gx, gy, 3) - 0.5) * scatter;
        const r = hash2(gx, gy, 4);
        wgt[i] = r < 0.15 ? 0.1 + r : 0.35 + hash2(gx, gy, 5) * 0.65;
        rad[i] = 0.7 + hash2(gx, gy, 6) * 0.6;
        siz[i] = 0.5 + hash2(gx, gy, 7) * 0.6;
        pres[i] = den * (0.55 + 0.45 * hash2(gx, gy, 8));
      }
    }
  };

  const buildBase = () => {
    baseLayer = document.createElement('canvas');
    baseLayer.width = Math.round(w * dpr);
    baseLayer.height = Math.round(h * dpr);
    const bctx = baseLayer.getContext('2d');
    if (!bctx) return;
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.fillStyle = `rgb(${DOT_INK})`;
    for (let i = 0; i < wgt.length; i += 1) {
      if (wgt[i] === 0) continue;
      bctx.globalAlpha = 0.022 + pres[i] * 0.07;
      bctx.beginPath();
      bctx.arc(posX[i], posY[i], 0.65 + siz[i] * 0.5 + pres[i] * 0.4, 0, Math.PI * 2);
      bctx.fill();
    }
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
    cols = Math.ceil(w / CELL);
    rows = Math.ceil(h / CELL);
    buildCells();
    buildBase();
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

  // pressão direcional: elipse alongada na direção do gesto, mais curta
  // e intensa à frente, mais longa e branda atrás. rad[] por célula
  // mantém a borda difusa e irregular — nunca um círculo.
  const stamp = (sx, sy, dirX, dirY, speed) => {
    const R = 120 + Math.min(speed * 3, 70);
    const front = R * 0.62;
    const back = R * (1.15 + Math.min(speed * 0.05, 0.85));
    const perp = R * 0.72;
    const reach = Math.max(back, perp);
    if (sx < -reach || sx > w + reach || sy < -reach || sy > h + reach) return;
    // pressão é consequência do gesto: parado quase não marca a superfície
    const gain = Math.min(1, 0.3 + speed * 0.28);
    const gx0 = Math.max(0, Math.floor((sx - reach) / CELL));
    const gx1 = Math.min(cols - 1, Math.ceil((sx + reach) / CELL));
    const gy0 = Math.max(0, Math.floor((sy - reach) / CELL));
    const gy1 = Math.min(rows - 1, Math.ceil((sy + reach) / CELL));
    for (let gy = gy0; gy <= gy1; gy += 1) {
      for (let gx = gx0; gx <= gx1; gx += 1) {
        const i = gy * cols + gx;
        if (wgt[i] === 0) continue;
        const relX = posX[i] - sx;
        const relY = posY[i] - sy;
        const along = relX * dirX + relY * dirY;
        const side = relY * dirX - relX * dirY;
        const lenA = along >= 0 ? front : back;
        const q = ((along * along) / (lenA * lenA) + (side * side) / (perp * perp)) / rad[i];
        if (q >= 1) continue;
        const fall = 1 - Math.sqrt(q);
        let e = fall * fall * gain * wgt[i];
        e *= along >= 0 ? 1.15 : 0.8;
        if (e > energy[i]) energy[i] = e > 1 ? 1 : e;
        // frente comprime contra o movimento; atrás abre a favor,
        // com leve componente perpendicular — dispersão, não cauda
        const k = fall * wgt[i] * 0.3;
        if (along >= 0) {
          offX[i] -= dirX * k * 2.4;
          offY[i] -= dirY * k * 2.4;
        } else {
          const s = side >= 0 ? 1 : -1;
          offX[i] += (dirX * 0.6 - dirY * s * 0.5) * k * 1.6;
          offY[i] += (dirY * 0.6 + dirX * s * 0.5) * k * 1.6;
        }
        const m = Math.hypot(offX[i], offY[i]);
        if (m > MAX_PUSH) {
          offX[i] *= MAX_PUSH / m;
          offY[i] *= MAX_PUSH / m;
        }
        surfaceLive = true;
      }
    }
  };

  const drawSurface = (pf, interactive) => {
    if (baseLayer) ctx.drawImage(baseLayer, 0, 0, w, h);
    if (!interactive || !pf.active) return;

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

    if (!surfaceLive) return;

    // células despertas: alpha e tamanho contidos, deslocamento mínimo
    // com retorno amortecido — pressão assentando, não spotlight
    ctx.fillStyle = `rgb(${DOT_INK})`;
    let live = 0;
    for (let i = 0; i < energy.length; i += 1) {
      const e = energy[i];
      if (e < 0.015) {
        if (e !== 0) {
          energy[i] = 0;
          offX[i] = 0;
          offY[i] = 0;
        }
        continue;
      }
      live += 1;
      // curva suave: a área ativa inteira participa, sem pico isolado
      const a = Math.sqrt(e);
      ctx.globalAlpha = a * MAX_ALPHA * (0.55 + 0.45 * wgt[i]);
      ctx.beginPath();
      ctx.arc(posX[i] + offX[i], posY[i] + offY[i], 0.65 + siz[i] * 0.5 + a * 0.8, 0, Math.PI * 2);
      ctx.fill();
      energy[i] = e * DECAY;
      offX[i] *= RETURN;
      offY[i] *= RETURN;
    }
    ctx.globalAlpha = 1;
    if (live === 0) surfaceLive = false;
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

  const still = { active: false };

  resize();
  window.addEventListener('resize', () => {
    resize();
    if (!running) drawFrame(performance.now() / 1000, still, false);
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
    drawFrame(0, still, false); // quadro único estático: campos + zonas de matéria
  } else {
    start();
  }

  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      stop();
      drawFrame(0, still, false);
    } else {
      start();
    }
  });
}
