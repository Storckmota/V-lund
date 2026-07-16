/* Campo visual compartilhado — um único canvas 2D atravessa a página.
   Lâminas de papel/tinta em suspensão lenta e ascendente; o cursor
   desloca com inércia e deixa rastro breve; uma única brasa acompanha.
   A intensidade responde à seção ativa (data-field-level) e as cores
   invertem quando a página mergulha na tinta (data-ink → body.is-ink). */

const INK = [23, 21, 15];
const PAPER = [250, 248, 244];
const EMBER_LIGHT = [160, 61, 45];
const EMBER_DARK = [196, 85, 67];

const lerp = (a, b, t) => a + (b - a) * t;

export function initField() {
  const canvas = document.querySelector('[data-field]');
  if (!canvas) return;

  let ctx;
  try {
    ctx = canvas.getContext('2d', { alpha: true });
  } catch (e) {
    ctx = null;
  }
  if (!ctx) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.body.classList.add('has-field');

  const state = {
    w: 0,
    h: 0,
    dpr: 1,
    intensity: 0,
    intensityTarget: 1,
    inkMix: 0,
    inkMixTarget: 0,
    running: false,
    t: 0,
  };

  const pointer = { x: 0, y: 0, sx: -9999, sy: -9999, active: false };
  const ember = {
    x: 0, y: 0, tx: 0, ty: 0, hist: [],
  };

  let frags = [];

  function makeFrag(seedY) {
    const depth = 0.35 + Math.random() * 0.65;
    return {
      x: Math.random() * state.w,
      y: seedY !== undefined ? seedY : Math.random() * state.h,
      len: (26 + Math.random() * 80) * depth,
      th: 1 + Math.random() * 2.2 * depth,
      ang: -Math.PI / 2 + (Math.random() - 0.5) * 0.9,
      drift: (7 + Math.random() * 12) * depth,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.2 + Math.random() * 0.3,
      depth,
      alpha: (0.05 + Math.random() * 0.13) * depth,
      wedge: Math.random() < 0.28,
      ox: 0, oy: 0, vx: 0, vy: 0,
    };
  }

  function resize() {
    state.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    state.w = window.innerWidth;
    state.h = window.innerHeight;
    canvas.width = Math.round(state.w * state.dpr);
    canvas.height = Math.round(state.h * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    const target = Math.max(22, Math.min(64, Math.round((state.w * state.h) / 30000)));
    frags = Array.from({ length: target }, () => makeFrag());
    ember.x = state.w * 0.7;
    ember.y = state.h * 0.4;
    if (reduce) drawStatic();
  }

  function fragColor(alpha) {
    const r = Math.round(lerp(INK[0], PAPER[0], state.inkMix));
    const g = Math.round(lerp(INK[1], PAPER[1], state.inkMix));
    const b = Math.round(lerp(INK[2], PAPER[2], state.inkMix));
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function emberColor(alpha) {
    const c = state.inkMix > 0.5 ? EMBER_DARK : EMBER_LIGHT;
    return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
  }

  function drawFrag(f, sway) {
    const a = f.alpha * state.intensity;
    if (a < 0.008) return;

    const x = f.x + f.ox + sway;
    const y = f.y + f.oy;
    const dx = Math.cos(f.ang) * f.len;
    const dy = Math.sin(f.ang) * f.len;

    // rastro breve quando o deslocamento é rápido
    const speed = Math.hypot(f.vx, f.vy);
    if (speed > 50) {
      ctx.strokeStyle = fragColor(a * 0.3);
      ctx.lineWidth = f.th * 0.7;
      ctx.beginPath();
      ctx.moveTo(x - f.vx * 0.06, y - f.vy * 0.06);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.strokeStyle = fragColor(a);
    if (f.wedge) {
      // recorte de serifa: triângulo afilado
      const px = -Math.sin(f.ang) * f.th * 2.4;
      const py = Math.cos(f.ang) * f.th * 2.4;
      ctx.fillStyle = fragColor(a);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx + px, y + dy + py);
      ctx.lineTo(x + dx - px, y + dy - py);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.lineWidth = f.th;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y + dy);
      ctx.stroke();
    }
  }

  function drawStatic() {
    ctx.clearRect(0, 0, state.w, state.h);
    state.intensity = 0.5;
    frags.forEach((f) => drawFrag(f, 0));
    ctx.fillStyle = emberColor(0.9);
    ctx.fillRect(state.w * 0.68, state.h * 0.38, 5, 5);
  }

  let last = performance.now();

  function frame(now) {
    if (!state.running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    state.t += dt;

    state.intensity = lerp(state.intensity, state.intensityTarget, Math.min(1, dt * 3));
    state.inkMix = lerp(state.inkMix, state.inkMixTarget, Math.min(1, dt * 3));

    // suavização do ponteiro (atraso, inércia)
    if (pointer.active) {
      pointer.sx = pointer.sx < -999 ? pointer.x : lerp(pointer.sx, pointer.x, Math.min(1, dt * 5));
      pointer.sy = pointer.sy < -999 ? pointer.y : lerp(pointer.sy, pointer.y, Math.min(1, dt * 5));
    }

    ctx.clearRect(0, 0, state.w, state.h);

    for (const f of frags) {
      // suspensão: deriva ascendente lenta + balanço
      f.y -= f.drift * dt;
      const sway = Math.sin(state.t * f.swaySpeed + f.swayPhase) * 5 * f.depth;

      if (f.y + f.oy < -f.len - 20) {
        f.y = state.h + f.len + 10;
        f.x = Math.random() * state.w;
        f.ox = 0; f.oy = 0; f.vx = 0; f.vy = 0;
      }

      // deslocamento pelo cursor: mola amortecida (empurra e retorna)
      if (pointer.active && state.intensity > 0.05) {
        const ddx = (f.x + f.ox) - pointer.sx;
        const ddy = (f.y + f.oy) - pointer.sy;
        const d2 = ddx * ddx + ddy * ddy;
        const r = 190 * f.depth;
        if (d2 < r * r) {
          const d = Math.sqrt(d2) || 1;
          const force = Math.exp(-d2 / (r * r * 0.5)) * 340 * f.depth;
          f.vx += (ddx / d) * force * dt;
          f.vy += ((ddy / d) - 0.35) * force * dt; // leve viés ascendente
        }
      }

      // mola de retorno + amortecimento
      f.vx += -f.ox * 3.2 * dt * 60 * 0.05;
      f.vy += -f.oy * 3.2 * dt * 60 * 0.05;
      const damp = Math.exp(-3.4 * dt);
      f.vx *= damp;
      f.vy *= damp;
      f.ox += f.vx * dt;
      f.oy += f.vy * dt;

      drawFrag(f, sway);
    }

    // a brasa: um único ponto de ignição
    if (pointer.active && state.intensity > 0.3) {
      ember.tx = pointer.sx + 26;
      ember.ty = pointer.sy - 30;
    } else {
      ember.tx = state.w * (0.62 + Math.sin(state.t * 0.11) * 0.2);
      ember.ty = state.h * (0.4 + Math.cos(state.t * 0.13) * 0.18);
    }
    ember.x = lerp(ember.x, ember.tx, Math.min(1, dt * 1.6));
    ember.y = lerp(ember.y, ember.ty, Math.min(1, dt * 1.6));
    ember.hist.push([ember.x, ember.y]);
    if (ember.hist.length > 7) ember.hist.shift();

    const ea = Math.min(1, state.intensity + 0.15);
    if (ea > 0.05) {
      if (ember.hist.length > 2) {
        ctx.strokeStyle = emberColor(ea * 0.35);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ember.hist[0][0], ember.hist[0][1]);
        for (const [hx, hy] of ember.hist) ctx.lineTo(hx, hy);
        ctx.stroke();
      }
      ctx.fillStyle = emberColor(ea);
      ctx.fillRect(ember.x - 2.5, ember.y - 2.5, 5, 5);
    }

    requestAnimationFrame(frame);
  }

  function start() {
    if (state.running || reduce) return;
    state.running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  function stop() {
    state.running = false;
  }

  // Intensidade por seção: a faixa central da viewport decide
  const levelObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          state.intensityTarget = parseFloat(entry.target.dataset.fieldLevel) || 0.15;
        }
      }
    },
    { rootMargin: '-42% 0px -42% 0px' },
  );
  document.querySelectorAll('[data-field-level]').forEach((el) => levelObserver.observe(el));

  // Ciclo papel → tinta no encerramento
  const inkVisible = new Set();
  const inkObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) inkVisible.add(entry.target);
        else inkVisible.delete(entry.target);
      }
      const ink = inkVisible.size > 0;
      document.body.classList.toggle('is-ink', ink);
      state.inkMixTarget = ink ? 1 : 0;
    },
    { rootMargin: '-35% 0px -25% 0px' },
  );
  document.querySelectorAll('[data-ink]').forEach((el) => inkObserver.observe(el));

  if (!reduce) {
    if (fine) {
      window.addEventListener('pointermove', (e) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.active = true;
      }, { passive: true });
      window.addEventListener('pointerleave', () => {
        pointer.active = false;
      });
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 180);
  });

  resize();
  start();
}
