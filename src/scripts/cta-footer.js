// FOOTER — entrada da superfície em tinta + campo de brasa (canvas).
//
// (1) a superfície de tinta (.ftx-rise) sobe do papel num intervalo curto de
// scroll, conduzida por uma faixa de brasa curva (.ftx-blade); (2) o conteúdo
// entra — campo funcional, masthead por reveal vertical, faixa inferior; (3) o
// CAMPO DE BRASA: um campo tonal em baixa resolução, contínuo e dissipativo,
// pinta o fundo. A camada LED antiga revela o wordmark e a hairline pelo mesmo
// percurso real do cursor. Repouso (sem JS / reduced motion): canvas em branco,
// wordmark em papel e footer estático.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const clamp = gsap.utils.clamp;

export function initCtaFooter() {
  const mm = gsap.matchMedia();

  mm.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      hoverFine: '(hover: hover) and (pointer: fine)',
    },
    (ctx) => {
      const { motion, hoverFine } = ctx.conditions;
      const limpezas = [];
      if (motion) {
        limpezas.push(footerRise(), footerContent(), footerEmberField({ track: hoverFine }));
      }
      return () => limpezas.filter(Boolean).forEach((fn) => fn());
    },
  );
}

/* ---------- superfície de tinta sobe conduzida pela brasa ---------- */

function footerRise() {
  const rise = $('[data-ftx-rise]');
  const line = $('.ftx-blade-line', document);
  if (!rise) return undefined;

  gsap.set(rise, { yPercent: 100 });

  const tl = gsap.timeline({
    scrollTrigger: { trigger: '.ftx', start: 'top bottom', end: 'top 74%', scrub: 0.6 },
  });
  tl.to(rise, { yPercent: 0, ease: 'none', duration: 1 }, 0);
  if (line) tl.to(line, { autoAlpha: 0, ease: 'none', duration: 0.26 }, 0.74);

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
    gsap.set(rise, { clearProps: 'transform' });
    if (line) gsap.set(line, { clearProps: 'opacity,visibility' });
  };
}

/* ---------- entrada contida do conteúdo, depois da superfície ---------- */

function footerContent() {
  const ft = $('.ftx');
  if (!ft) return undefined;

  const stack = $('.ftx-mast-stack', ft);

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    scrollTrigger: { trigger: '.ftx', start: 'top 66%', once: true },
  });
  tl.from($('[data-ftx-top]', ft), { y: 24, autoAlpha: 0, duration: 0.72 }, 0);
  if (stack) tl.from(stack, { yPercent: 112, duration: 0.9 }, 0.12);
  tl.from($('[data-ftx-base]', ft), { y: 16, autoAlpha: 0, duration: 0.62 }, 0.34);

  return () => tl.scrollTrigger?.kill();
}

/* ---------- campo de brasa: superfície contínua com memória temporal ---------- */

function footerEmberField({ track }) {
  const ft = $('.ftx');
  const canvas = $('[data-ftx-canvas]', ft);
  const maskEl = $('.ftx-mast-mask', ft);
  const mast = $('.ftx-mast--paper', ft);
  const emberMast = $('.ftx-mast--ember', ft);
  const hairline = $('.ftx-base', ft);
  const wmPath = $('#vwordmark path');
  if (!ft || !canvas) return undefined;

  const cv = canvas.getContext('2d');
  if (!cv) return undefined;
  const basePath = wmPath ? new Path2D(wmPath.getAttribute('d')) : null;

  // Camadas LED recuperadas da versão antiga. O canvas continua responsável
  // apenas pelo campo orgânico; estas custom properties controlam a máscara
  // sobre o segundo SVG e o segmento da hairline.
  const BASE_W = 460;
  const BASE_H = 180;
  const led = { x: 0, y: 0, gi: 0, gel: 1, vx: 0, vy: 0 };
  const ledXTo = gsap.quickTo(led, 'x', { duration: 0.5, ease: 'power3' });
  const ledYTo = gsap.quickTo(led, 'y', { duration: 0.5, ease: 'power3' });
  const ledIntensityTo = gsap.quickTo(led, 'gi', { duration: 0.42, ease: 'power2' });
  const ledStretchTo = gsap.quickTo(led, 'gel', { duration: 0.45, ease: 'power2' });
  const ledVxTo = gsap.quickTo(led, 'vx', { duration: 0.5, ease: 'power3' });
  const ledVyTo = gsap.quickTo(led, 'vy', { duration: 0.5, ease: 'power3' });
  const ledStyle = ft.style;
  let offMastX = 0;
  let offMastY = 0;
  let offHairlineX = 0;
  let lastLedMove = -1e9;
  let ledRelaxed = true;
  let ledRendering = false;

  function measureLedLayers() {
    const fr = ft.getBoundingClientRect();
    if (emberMast) {
      const mr = emberMast.getBoundingClientRect();
      offMastX = mr.left - fr.left;
      offMastY = mr.top - fr.top;
    }
    if (hairline) offHairlineX = hairline.getBoundingClientRect().left - fr.left;
  }

  function renderLedLayers() {
    const gw = BASE_W * led.gel;
    const gh = BASE_H / Math.sqrt(led.gel);
    ledStyle.setProperty('--wgx', (led.x - offMastX).toFixed(1));
    ledStyle.setProperty('--wgy', (led.y - offMastY).toFixed(1));
    ledStyle.setProperty('--hgx', (led.x - offHairlineX).toFixed(1));
    ledStyle.setProperty('--gi', led.gi.toFixed(3));
    ledStyle.setProperty('--gw', gw.toFixed(1));
    ledStyle.setProperty('--gh', gh.toFixed(1));
    ledStyle.setProperty('--vx', led.vx.toFixed(2));
    ledStyle.setProperty('--vy', led.vy.toFixed(2));

    if (performance.now() - lastLedMove > 130 && !ledRelaxed) {
      ledRelaxed = true;
      ledIntensityTo(0);
      ledStretchTo(1);
      ledVxTo(0);
      ledVyTo(0);
    }
  }

  function startLedRender() {
    if (ledRendering) return;
    ledRendering = true;
    gsap.ticker.add(renderLedLayers);
  }

  function stopLedRender() {
    if (!ledRendering) return;
    ledRendering = false;
    gsap.ticker.remove(renderLedLayers);
  }

  // ---- medição: canvas (DPR) + recorte do wordmark, tudo em px do footer ----
  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let wordClip = null;
  let wordReady = false;

  function resize() {
    cssW = ft.clientWidth;
    cssH = ft.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    cv.setTransform(dpr, 0, 0, dpr, 0, 0);
    cv.imageSmoothingEnabled = true;
    cv.imageSmoothingQuality = 'high';
    buildField();
    buildClip();
    measureLedLayers();
  }

  // o recorte parte de .ftx-mast-mask (NÃO é transformado pelo reveal de
  // entrada — só a pilha interna translada), então o alinhamento é estável
  // mesmo durante a animação. Origem única: coordenadas locais do footer.
  function buildClip() {
    if (!basePath || !maskEl || !mast) {
      wordClip = null;
      wordReady = false;
      return;
    }
    const fr = ft.getBoundingClientRect();
    const mr = maskEl.getBoundingClientRect();
    const left = mr.left - fr.left;
    const top = mr.top - fr.top;
    const scale = mr.width / 1594; // viewBox do #vwordmark: 0 0 1594 381
    const m = new DOMMatrix().translateSelf(left, top).scaleSelf(scale);
    const clip = new Path2D();
    clip.addPath(basePath, m);
    wordClip = clip;
    const letterH = (mr.width * 381) / 1594;
    wordReady = mr.width > 0 && letterH > 0;
  }

  // ---- campo tonal: mesma família técnica da atmosfera da hero ----
  const ember = hexToRgb(getComputedStyle(ft).getPropertyValue('--ember-dark').trim() || '#c45543');
  const emberDeep = hexToRgb(getComputedStyle(ft).getPropertyValue('--ember-light').trim() || '#a03d2d');
  const TEX = 12;
  const DECAY = 0.905;
  const EPS = 0.012;
  let cols = 0;
  let rows = 0;
  let energy = new Float32Array(0);
  let grain = new Float32Array(0);
  let edge = new Float32Array(0);
  let field = null;
  let fieldCtx = null;
  let fieldImage = null;
  let live = false;

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

  function buildField() {
    cols = Math.max(2, Math.ceil(cssW / TEX));
    rows = Math.max(2, Math.ceil(cssH / TEX));
    const n = cols * rows;
    energy = new Float32Array(n);
    grain = new Float32Array(n);
    edge = new Float32Array(n);

    field = document.createElement('canvas');
    field.width = cols;
    field.height = rows;
    fieldCtx = field.getContext('2d');
    fieldImage = fieldCtx.createImageData(cols, rows);

    for (let ty = 0; ty < rows; ty += 1) {
      for (let tx = 0; tx < cols; tx += 1) {
        const i = ty * cols + tx;
        grain[i] = 0.72 + hash2(tx, ty, 1) * 0.42;
        edge[i] = 0.76 + hash2(tx, ty, 2) * 0.54;
      }
    }
    live = false;
  }

  function stamp(sx, sy, dirX, dirY, speed, strength = 1) {
    const velocity = Math.min(speed, 3.2);
    const base = 78 + velocity * 22;
    const front = base * (0.42 + velocity * 0.045);
    const back = base * (0.94 + velocity * 0.42);
    const width = 46 + velocity * 16;
    const reach = Math.max(back, width * 2.15);
    if (sx < -reach || sx > cssW + reach || sy < -reach || sy > cssH + reach) return;

    const gain = clamp(0.26, 1.15, (0.42 + velocity * 0.22) * strength);
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
        const len = along >= 0 ? front : back;
        const u = along / Math.max(len, 1);
        const weave = Math.sin((along + hash2(tx, ty, 3) * 90) * 0.032) * width * 0.2;
        const localWidth = width * edge[i] * (0.78 + 0.22 * Math.cos(along * 0.025 + hash2(tx, ty, 4) * 6.2));
        const q = (u * u) + ((side + weave) * (side + weave)) / (localWidth * localWidth);
        if (q >= 1) continue;
        const rim = smooth(1 - Math.sqrt(q));
        const density = grain[i] * (0.82 + 0.18 * Math.sin(tx * 0.63 + ty * 0.41));
        const add = rim * density * gain;
        energy[i] = Math.min(1, energy[i] + add * 0.72);

        live = true;
      }
    }
  }

  function inject(x0, y0, x1, y1, strength = 1, elapsed = 16) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy);
    const dirX = dist > 0.01 ? dx / dist : 1;
    const dirY = dist > 0.01 ? dy / dist : 0;
    const speed = dist / Math.max(elapsed, 12);
    const steps = Math.max(1, Math.ceil(dist / 38));
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      stamp(x0 + dx * t, y0 + dy * t, dirX, dirY, speed, strength);
    }
    ensureRunning();
  }

  function composeField() {
    const bg = fieldImage.data;
    bg.fill(0);
    let peak = 0;

    for (let i = 0; i < energy.length; i += 1) {
      const e = energy[i];
      if (e < EPS) {
        energy[i] = 0;
        continue;
      }
      if (e > peak) peak = e;
      const p = i * 4;
      if (e >= EPS) {
        const texture = 0.84 + grain[i] * 0.18;
        const core = smooth((e - 0.38) / 0.62);
        const emberMix = 0.24 + core * 0.54;
        const bgAlpha = Math.min(0.41, Math.pow(e, 1.18) * (0.43 + core * 0.08) * texture);

        bg[p] = Math.round(emberDeep.r * (1 - emberMix) + ember.r * emberMix);
        bg[p + 1] = Math.round(emberDeep.g * (1 - emberMix) + ember.g * emberMix);
        bg[p + 2] = Math.round(emberDeep.b * (1 - emberMix) + ember.b * emberMix);
        bg[p + 3] = Math.round(bgAlpha * 255);
        energy[i] = e * DECAY;
      } else {
        energy[i] = 0;
      }
    }

    fieldCtx.putImageData(fieldImage, 0, 0);
    live = peak >= EPS;
  }

  function drawField() {
    cv.clearRect(0, 0, cssW, cssH);
    if (!live) return false;

    composeField();
    cv.globalCompositeOperation = 'source-over';
    cv.globalAlpha = 1;
    cv.drawImage(field, 0, 0, cssW, cssH);

    if (wordReady && wordClip) {
      cv.save();
      cv.globalCompositeOperation = 'destination-out';
      cv.fill(wordClip);
      cv.restore();
    }

    cv.globalCompositeOperation = 'source-over';
    cv.globalAlpha = 1;
    return live;
  }

  // ---- loop de render ----
  let raf = 0;
  let running = false;

  function frame() {
    cv.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (drawField()) {
      raf = requestAnimationFrame(frame);
    } else {
      running = false;
      cv.clearRect(0, 0, cssW, cssH);
    }
  }

  function ensureRunning() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  // ---- cursor: fonte única de posição/velocidade ----
  let px = 0;
  let py = 0;
  let pt = 0;
  let primed = false;
  let ledPx = 0;
  let ledPy = 0;
  let ledPt = 0;
  let ledPrimed = false;

  function updateLed(x, y, now) {
    if (ledPrimed) {
      const dt = Math.max(now - ledPt, 8);
      const dx = x - ledPx;
      const dy = y - ledPy;
      const speed = Math.hypot(dx, dy) / dt;
      ledStretchTo(clamp(1, 1.34, 1 + speed * 0.5));
      ledVxTo(clamp(-10, 10, dx * 0.5));
      ledVyTo(clamp(-4, 4, dy * 0.4));
      ledIntensityTo(clamp(0.4, 1, 0.5 + speed * 1.8));
    }
    ledXTo(x);
    ledYTo(y);
    ledPx = x;
    ledPy = y;
    ledPt = now;
    ledPrimed = true;
    lastLedMove = now;
    ledRelaxed = false;
  }

  function onMove(e) {
    const fr = ft.getBoundingClientRect();
    const x = e.clientX - fr.left;
    const y = e.clientY - fr.top;
    if (x < 0 || y < 0 || x > cssW || y > cssH) return;
    const now = performance.now();
    updateLed(x, y, now);
    if (!primed) {
      px = x;
      py = y;
      pt = now;
      primed = true;
      inject(x, y, x + 0.1, y, 0.72, 16);
      return;
    }
    const dt = Math.max(now - pt, 8);
    const dist = Math.hypot(x - px, y - py);
    const strength = clamp(0.62, 1.28, 0.72 + (dist / dt) * 0.18);
    inject(px, py, x, y, strength, dt);
    px = x;
    py = y;
    pt = now;
  }

  const onLeave = () => {
    primed = false;
    ledPrimed = false;
  };

  // ---- visibilidade: ativa/pausa ----
  let active = false;
  function activate() {
    if (active) return;
    active = true;
    resize();
    if (track) {
      startLedRender();
      ft.addEventListener('pointermove', onMove, { passive: true });
      ft.addEventListener('pointerleave', onLeave, { passive: true });
    }
  }

  function deactivate() {
    if (!active) return;
    active = false;
    if (track) {
      ft.removeEventListener('pointermove', onMove);
      ft.removeEventListener('pointerleave', onLeave);
      stopLedRender();
    }
    if (raf) cancelAnimationFrame(raf);
    running = false;
    primed = false;
    ledPrimed = false;
    live = false;
    cv.setTransform(dpr, 0, 0, dpr, 0, 0);
    cv.clearRect(0, 0, cssW, cssH);
  }

  const io = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) activate();
      else deactivate();
    },
    { threshold: 0.28 },
  );
  io.observe(ft);

  const onResize = () => {
    if (active) resize();
  };
  window.addEventListener('resize', onResize, { passive: true });
  const onRefresh = () => {
    buildClip();
    measureLedLayers();
  };
  ScrollTrigger.addEventListener('refresh', onRefresh);

  return () => {
    io.disconnect();
    window.removeEventListener('resize', onResize);
    ScrollTrigger.removeEventListener('refresh', onRefresh);
    if (track) {
      ft.removeEventListener('pointermove', onMove);
      ft.removeEventListener('pointerleave', onLeave);
    }
    stopLedRender();
    gsap.killTweensOf(led);
    [
      '--wgx', '--wgy', '--hgx', '--gi', '--gw', '--gh', '--vx', '--vy',
    ].forEach((property) => ledStyle.removeProperty(property));
    if (raf) cancelAnimationFrame(raf);
    running = false;
    cv.setTransform(1, 0, 0, 1, 0, 0);
    cv.clearRect(0, 0, canvas.width, canvas.height);
  };
}

/* ---------- utilitários ---------- */

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
