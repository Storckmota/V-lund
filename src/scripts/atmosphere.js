// Atmosfera da hero em canvas 2D, duas camadas:
// 1) campos suaves de tom de papel (deriva lenta + parallax sutil);
// 2) superfície editorial latente — microcélulas de tinta em posições
//    levemente irregulares que despertam na passagem do ponteiro.
// A ativação não é um círculo: cada célula tem peso, raio e desvio
// próprios; o gesto deixa um rastro curto que apaga sozinho; células
// despertas deslocam-se minimamente, como pressão de ar sob o papel.
// Sem formas desenhadas, sem linhas, sem brilho.

const LOBES = [
  { hue: '242, 237, 227', alpha: 0.75, r: 0.62, cx: 0.22, cy: 0.3, ax: 0.05, ay: 0.045, sp: 0.11, ph: 0.4, depth: 26 },
  { hue: '239, 231, 216', alpha: 0.6, r: 0.5, cx: 0.78, cy: 0.24, ax: 0.045, ay: 0.055, sp: 0.09, ph: 2.1, depth: -34 },
  { hue: '246, 241, 233', alpha: 0.85, r: 0.68, cx: 0.5, cy: 0.72, ax: 0.04, ay: 0.035, sp: 0.07, ph: 4.2, depth: 18 },
  { hue: '233, 226, 211', alpha: 0.5, r: 0.44, cx: 0.12, cy: 0.82, ax: 0.05, ay: 0.04, sp: 0.13, ph: 1.3, depth: -22 },
  { hue: '236, 229, 215', alpha: 0.45, r: 0.4, cx: 0.88, cy: 0.78, ax: 0.055, ay: 0.05, sp: 0.1, ph: 5.4, depth: 30 },
];

const CELL = 18; // espaçamento nominal entre células
const DOT_INK = '52, 48, 41';
const BASE_MIN = 0.014; // repouso: presença menor que antes, sem parecer grade
const BASE_VAR = 0.022;
const MAX_ALPHA = 0.17; // teto da célula desperta — contraste, nunca brilho
const DECAY = 0.917; // memória curta do gesto
const PUSH = 2.6; // deslocamento máximo da célula desperta, px

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
  const cursor = { tx: -1e4, ty: -1e4, x: -1e4, y: -1e4, px: -1e4, py: -1e4, speed: 0 };

  // grade de células com identidade própria
  let cols = 0;
  let rows = 0;
  let energy = new Float32Array(0);
  let jitX = new Float32Array(0); // desvio fixo da posição nominal
  let jitY = new Float32Array(0);
  let wgt = new Float32Array(0); // reatividade própria: nem toda célula responde igual
  let rad = new Float32Array(0); // variação do raio de influência: limite difuso
  let siz = new Float32Array(0); // tamanho próprio do ponto
  let baseLayer = null;

  const buildCells = () => {
    const n = cols * rows;
    energy = new Float32Array(n);
    jitX = new Float32Array(n);
    jitY = new Float32Array(n);
    wgt = new Float32Array(n);
    rad = new Float32Array(n);
    siz = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
      jitX[i] = (Math.random() - 0.5) * CELL * 0.62;
      jitY[i] = (Math.random() - 0.5) * CELL * 0.62;
      const r = Math.random();
      wgt[i] = r < 0.18 ? 0.12 + r : 0.45 + Math.random() * 0.55; // ~18% quase não reagem
      rad[i] = 0.72 + Math.random() * 0.56;
      siz[i] = 0.55 + Math.random() * 0.5;
    }
  };

  const buildBase = () => {
    baseLayer = document.createElement('canvas');
    baseLayer.width = Math.round(w * dpr);
    baseLayer.height = Math.round(h * dpr);
    const bctx = baseLayer.getContext('2d');
    if (!bctx) return;
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let gy = 0; gy < rows; gy += 1) {
      for (let gx = 0; gx < cols; gx += 1) {
        const i = gy * cols + gx;
        bctx.globalAlpha = BASE_MIN + wgt[i] * BASE_VAR;
        bctx.fillStyle = `rgb(${DOT_INK})`;
        bctx.beginPath();
        bctx.arc(
          gx * CELL + CELL / 2 + jitX[i],
          gy * CELL + CELL / 2 + jitY[i],
          0.65 + siz[i] * 0.35,
          0,
          Math.PI * 2,
        );
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
    buildCells();
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

  // injeta energia ao longo do trecho percorrido pelo foco no quadro,
  // com peso e raio próprios por célula: limite difuso, nunca um círculo
  const stamp = (sx, sy, radius, gain) => {
    if (sx < -radius || sx > w + radius || sy < -radius || sy > h + radius) return;
    const gx0 = Math.max(0, Math.floor((sx - radius) / CELL));
    const gx1 = Math.min(cols - 1, Math.ceil((sx + radius) / CELL));
    const gy0 = Math.max(0, Math.floor((sy - radius) / CELL));
    const gy1 = Math.min(rows - 1, Math.ceil((sy + radius) / CELL));
    for (let gy = gy0; gy <= gy1; gy += 1) {
      for (let gx = gx0; gx <= gx1; gx += 1) {
        const i = gy * cols + gx;
        const r = radius * rad[i];
        const dx = gx * CELL + CELL / 2 + jitX[i] - sx;
        const dy = gy * CELL + CELL / 2 + jitY[i] - sy;
        const d = Math.hypot(dx, dy);
        if (d < r) {
          const fall = 1 - d / r;
          const e = fall * fall * gain * wgt[i];
          if (e > energy[i]) energy[i] = e;
        }
      }
    }
  };

  const drawReticle = (interactive) => {
    if (baseLayer) ctx.drawImage(baseLayer, 0, 0, w, h);
    if (!interactive) return;

    // inércia do foco
    cursor.px = cursor.x;
    cursor.py = cursor.y;
    cursor.x += (cursor.tx - cursor.x) * 0.14;
    cursor.y += (cursor.ty - cursor.y) * 0.14;
    const rawSpeed = Math.hypot(cursor.x - cursor.px, cursor.y - cursor.py);
    cursor.speed += (rawSpeed - cursor.speed) * 0.08;

    // rápido amplia a influência; lento revela detalhe local
    const radius = 150 + Math.min(cursor.speed * 3.4, 85);
    const gain = cursor.speed < 4 ? 1.0 : 0.86;

    // rastro: carimbos entre a posição anterior e a atual
    if (cursor.px > -9e3) {
      stamp(cursor.px + (cursor.x - cursor.px) * 0.5, cursor.py + (cursor.y - cursor.py) * 0.5, radius * 0.9, gain * 0.8);
    }
    stamp(cursor.x, cursor.y, radius, gain);

    // desenha células despertas: cada uma com alpha, tamanho e um
    // deslocamento mínimo para longe do foco — pressão, não spotlight
    ctx.fillStyle = `rgb(${DOT_INK})`;
    for (let i = 0; i < energy.length; i += 1) {
      const e = energy[i];
      if (e < 0.015) {
        energy[i] = 0;
        continue;
      }
      const gx = i % cols;
      const gy = (i / cols) | 0;
      const cx = gx * CELL + CELL / 2 + jitX[i];
      const cy = gy * CELL + CELL / 2 + jitY[i];
      const ddx = cx - cursor.x;
      const ddy = cy - cursor.y;
      const dd = Math.hypot(ddx, ddy) || 1;
      const push = e * PUSH * wgt[i];
      ctx.globalAlpha = e * MAX_ALPHA * (0.6 + 0.4 * wgt[i]);
      ctx.beginPath();
      ctx.arc(cx + (ddx / dd) * push, cy + (ddy / dd) * push, 0.65 + siz[i] * 0.35 + e * 0.8, 0, Math.PI * 2);
      ctx.fill();
      energy[i] = e * DECAY;
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
    drawFrame(0, false); // quadro único estático: campos + textura latente
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
