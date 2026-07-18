// Atmosfera da hero em canvas 2D, duas camadas:
// 1) campos suaves de tom de papel (deriva lenta + parallax sutil);
// 2) retícula editorial latente — microcélulas sob o papel que despertam
//    localmente na passagem do ponteiro e apagam com inércia.
// Sem formas desenhadas, sem linhas, sem brilho.

const LOBES = [
  { hue: '242, 237, 227', alpha: 0.75, r: 0.62, cx: 0.22, cy: 0.3, ax: 0.05, ay: 0.045, sp: 0.11, ph: 0.4, depth: 26 },
  { hue: '239, 231, 216', alpha: 0.6, r: 0.5, cx: 0.78, cy: 0.24, ax: 0.045, ay: 0.055, sp: 0.09, ph: 2.1, depth: -34 },
  { hue: '246, 241, 233', alpha: 0.85, r: 0.68, cx: 0.5, cy: 0.72, ax: 0.04, ay: 0.035, sp: 0.07, ph: 4.2, depth: 18 },
  { hue: '233, 226, 211', alpha: 0.5, r: 0.44, cx: 0.12, cy: 0.82, ax: 0.05, ay: 0.04, sp: 0.13, ph: 1.3, depth: -22 },
  { hue: '236, 229, 215', alpha: 0.45, r: 0.4, cx: 0.88, cy: 0.78, ax: 0.055, ay: 0.05, sp: 0.1, ph: 5.4, depth: 30 },
];

// Retícula: espaçamento entre células e tinta das microcélulas.
const CELL = 18;
const DOT_INK = '52, 48, 41';
const BASE_ALPHA = 0.045; // estado latente, quase subliminar
const MAX_ALPHA = 0.17; // teto da célula desperta — contraste, nunca brilho

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

  // parallax dos campos, em [-0.5, 0.5]
  const pointer = { tx: 0, ty: 0, x: 0, y: 0 };

  // ponteiro em coordenadas do canvas, com inércia + velocidade
  const cursor = { tx: -1e4, ty: -1e4, x: -1e4, y: -1e4, vx: 0, vy: 0, speed: 0 };

  // grade de energia da retícula
  let cols = 0;
  let rows = 0;
  let energy = new Float32Array(0);
  let baseLayer = null;

  const buildBase = () => {
    baseLayer = document.createElement('canvas');
    baseLayer.width = Math.round(w * dpr);
    baseLayer.height = Math.round(h * dpr);
    const bctx = baseLayer.getContext('2d');
    if (!bctx) return;
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.fillStyle = `rgba(${DOT_INK}, ${BASE_ALPHA})`;
    for (let gy = 0; gy < rows; gy += 1) {
      for (let gx = 0; gx < cols; gx += 1) {
        bctx.beginPath();
        bctx.arc(gx * CELL + CELL / 2, gy * CELL + CELL / 2, 0.8, 0, Math.PI * 2);
        bctx.fill();
      }
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
    energy = new Float32Array(cols * rows);
    buildBase();
  };

  const drawLobes = (t) => {
    const base = Math.min(w, h);
    for (const l of LOBES) {
      const drift = t * l.sp;
      const x = (l.cx + Math.sin(drift + l.ph) * l.ax) * w + pointer.x * l.depth;
      const y = (l.cy + Math.cos(drift * 0.9 + l.ph) * l.ay) * h + pointer.y * l.depth;
      const r = l.r * base;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${l.hue}, ${l.alpha})`);
      g.addColorStop(1, `rgba(${l.hue}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  };

  const drawReticle = (interactive) => {
    if (baseLayer) ctx.drawImage(baseLayer, 0, 0, w, h);
    if (!interactive) return;

    // inércia do foco + leve ganho por velocidade
    cursor.vx = cursor.tx - cursor.x;
    cursor.vy = cursor.ty - cursor.y;
    cursor.x += cursor.vx * 0.14;
    cursor.y += cursor.vy * 0.14;
    const rawSpeed = Math.hypot(cursor.vx, cursor.vy);
    cursor.speed += (rawSpeed - cursor.speed) * 0.08;

    const radius = 165 + Math.min(cursor.speed * 0.6, 75);
    const gain = 0.85 + Math.min(cursor.speed * 0.002, 0.15);

    // injeta energia ao redor do foco
    if (cursor.x > -radius && cursor.x < w + radius && cursor.y > -radius && cursor.y < h + radius) {
      const gx0 = Math.max(0, Math.floor((cursor.x - radius) / CELL));
      const gx1 = Math.min(cols - 1, Math.ceil((cursor.x + radius) / CELL));
      const gy0 = Math.max(0, Math.floor((cursor.y - radius) / CELL));
      const gy1 = Math.min(rows - 1, Math.ceil((cursor.y + radius) / CELL));
      for (let gy = gy0; gy <= gy1; gy += 1) {
        for (let gx = gx0; gx <= gx1; gx += 1) {
          const dx = gx * CELL + CELL / 2 - cursor.x;
          const dy = gy * CELL + CELL / 2 - cursor.y;
          const d = Math.hypot(dx, dy);
          if (d < radius) {
            const fall = 1 - d / radius;
            const e = fall * fall * gain;
            const i = gy * cols + gx;
            if (e > energy[i]) energy[i] = e;
          }
        }
      }
    }

    // desenha células despertas e decai a energia
    ctx.fillStyle = `rgb(${DOT_INK})`;
    for (let i = 0; i < energy.length; i += 1) {
      const e = energy[i];
      if (e < 0.015) {
        energy[i] = 0;
        continue;
      }
      const gx = i % cols;
      const gy = (i / cols) | 0;
      ctx.globalAlpha = e * MAX_ALPHA;
      ctx.beginPath();
      ctx.arc(gx * CELL + CELL / 2, gy * CELL + CELL / 2, 0.8 + e * 0.85, 0, Math.PI * 2);
      ctx.fill();
      energy[i] = e * 0.915;
    }
    ctx.globalAlpha = 1;
  };

  const drawFrame = (t, interactive) => {
    ctx.clearRect(0, 0, w, h);
    drawLobes(t);
    drawReticle(interactive);
  };

  const loop = (now) => {
    pointer.x += (pointer.tx - pointer.x) * 0.055;
    pointer.y += (pointer.ty - pointer.y) * 0.055;
    drawFrame(now / 1000, fine.matches);
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

  const onPointer = (e) => {
    pointer.tx = e.clientX / window.innerWidth - 0.5;
    pointer.ty = e.clientY / window.innerHeight - 0.5;
    cursor.tx = e.clientX;
    cursor.ty = e.clientY - (heroTop - window.scrollY);
    if (cursor.x < -9e3) {
      cursor.x = cursor.tx;
      cursor.y = cursor.ty;
    }
  };

  resize();
  window.addEventListener('resize', () => {
    resize();
    if (!running) drawFrame(performance.now() / 1000, false);
  }, { passive: true });

  if (fine.matches) {
    window.addEventListener('pointermove', onPointer, { passive: true });
  }

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
    drawFrame(0, false); // quadro único estático: campos + retícula latente
  } else {
    start();
  }

  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      stop();
      drawFrame(0, false);
    } else {
      start();
    }
  });
}
