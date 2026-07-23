// Recorder dedicado do Alexander Ringleb.
//
// Por que este projeto exige tratamento proprio:
//  - o site abre com um preloader (.site-preloader) que cicla palavras
//    (Operator, Investment, Partnership...) cobrindo a hero por ~8s;
//  - a hero tem marquees continuos que nunca congelam;
//  - o video do Playwright comprime o tempo de forma nao-linear justamente na
//    fase pesada (preloader + reveal), entao QUALQUER ancora baseada no tempo
//    do raw erra o inicio (foi o bug: desktop comecava no meio do site).
//
// Solucao deterministica: CDP Page.startScreencast. O screencast so comeca
// DEPOIS que o preloader sai e a hero real esta na viewport (gate). Dirigimos o
// scroll por exatamente DURATION segundos de relogio e reamostramos os frames
// capturados (com timestamp real) para 810 quadros a 30fps. O primeiro quadro e
// a hero por construcao; nada do preloader entra.
//
// Nao toca nos assets de Allure/Leonardo.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const URL = 'https://aringleb.vercel.app/';
const DURATION = 27;                 // s, desktop == mobile
const FPS = 30;
const FRAMES = DURATION * FPS;        // 810
const HOLD = 1.0;                     // s, hero e footer (spec: ~1s cada ponta)
const SCROLL = DURATION - HOLD * 2;   // 25s de progressao continua
const HERO_RE = /Built in hospitality/i;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../output/aringleb');
const RAW = path.join(OUT, '_raw');

const PROFILES = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false, dsf: 1, out: '960x600' },
  { name: 'mobile', width: 390, height: 844, isMobile: true, dsf: 3, out: '390x844' },
];

async function waitReady(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    const imgs = Array.from(document.images).map((im) => (im.complete && im.naturalWidth
      ? Promise.resolve()
      : new Promise((res) => { im.addEventListener('load', res, { once: true }); im.addEventListener('error', res, { once: true }); setTimeout(res, 5000); })));
    await Promise.all(imgs);
  });
}

async function disableSmoothAndCursor(page) {
  await page.addStyleTag({ content: 'html,body,*{scroll-behavior:auto !important}' });
  await page.addStyleTag({
    content: `.cursor-dot,.cursor-ring,.cursor-follower,.cursor-outline,.custom-cursor,#cursor,#custom-cursor{display:none !important}`,
  });
}

async function measure(page) {
  return page.evaluate(() => {
    const h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    return { scrollHeight: h, viewportHeight: window.innerHeight, distance: Math.max(0, h - window.innerHeight) };
  });
}

// Aquecimento numa pagina descartavel: ativa lazy loading e enche o cache do
// context. A pagina de captura nasce depois, limpa, sem heranca de scroll.
async function warm(context) {
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitReady(page);
  await disableSmoothAndCursor(page);
  const m = await measure(page);
  await page.evaluate(async ({ distance, viewportHeight }) => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const steps = Math.min(16, Math.max(4, Math.ceil(distance / viewportHeight)));
    for (let i = 1; i <= steps; i += 1) { window.scrollTo(0, Math.round((distance * i) / steps)); await delay(180); }
  }, m);
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.close();
}

// Gate visual real: o preloader (.site-preloader) cobre a hero por ~8s ciclando
// palavras; a headline existe no DOM atras dele, entao "visible" mente. So passa
// quando o preloader sai E o elementFromPoint no centro da headline retorna a
// propria headline (nada por cima).
async function waitHeroRevealed(page, viewportHeight) {
  const ok = await page.evaluate(async ({ src, vh }) => {
    const re = new RegExp(src, 'i');
    const findHead = () => [...document.querySelectorAll('h1,h2,span,div')]
      .find((n) => re.test(n.textContent || '') && n.getBoundingClientRect().height < 400);
    const deadline = Date.now() + 20000;
    let stable = 0;
    while (Date.now() < deadline) {
      const pre = document.querySelector('.site-preloader');
      const preGone = !pre || getComputedStyle(pre).display === 'none'
        || getComputedStyle(pre).visibility === 'hidden' || Number(getComputedStyle(pre).opacity) === 0;
      const h = findHead();
      let revealed = false;
      if (h && preGone) {
        const b = h.getBoundingClientRect();
        if (b.top < vh && b.bottom > 0) {
          const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
          revealed = !!top && (h.contains(top) || top.contains(h));
        }
      }
      stable = revealed ? stable + 1 : 0;
      if (stable >= 3) return true;
      await new Promise((r) => setTimeout(r, 250));
    }
    return false;
  }, { src: HERO_RE.source, vh: viewportHeight });
  if (!ok) throw new Error('Hero nao revelada (preloader ainda cobrindo)');
}

// Dirige o scroll por exatamente DURATION segundos: hold hero, progressao linear
// (sem rajada), hold footer. Roda inteiro dentro da pagina (um unico evaluate),
// sem round-trip por frame.
async function driveScroll(page, distance) {
  await page.evaluate(async ({ distance, holdMs, scrollMs }) => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    window.scrollTo(0, 0);
    await delay(holdMs);
    const start = performance.now();
    await new Promise((resolve) => {
      const step = (now) => {
        const p = Math.min(1, (now - start) / scrollMs);
        window.scrollTo(0, Math.round(distance * p));
        if (p < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
    window.scrollTo(0, distance);
    await delay(holdMs);
  }, { distance, holdMs: HOLD * 1000, scrollMs: SCROLL * 1000 });
}

// Reamostra os frames capturados (com timestamp real) para 810 quadros exatos a
// 30fps. Cada quadro de saida escolhe o frame capturado mais proximo no tempo,
// entao a cadencia fica correta mesmo com screencast irregular.
function resampleToSequence(frames, seqDir) {
  const t0 = frames[0].ts;
  const span = frames[frames.length - 1].ts - t0;
  let j = 0;
  for (let i = 0; i < FRAMES; i += 1) {
    const want = t0 + (i / (FRAMES - 1)) * span;
    while (j < frames.length - 1 && Math.abs(frames[j + 1].ts - want) <= Math.abs(frames[j].ts - want)) j += 1;
    fs.writeFileSync(path.join(seqDir, `f_${String(i + 1).padStart(5, '0')}.jpg`), frames[j].buf);
  }
}

function encode(seqDir, name, outWH) {
  const [w, h] = outWH.split('x');
  const mp4 = path.join(OUT, `${name}.mp4`);
  const webm = path.join(OUT, `${name}.webm`);
  const poster = path.join(OUT, `${name}-poster.webp`);
  const vf = `scale=${w}:${h}:flags=lanczos`;
  const seq = path.join(seqDir, 'f_%05d.jpg');
  execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', seq, '-an', '-vf', vf, '-c:v', 'libx264', '-profile:v', 'high', '-crf', '22', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-g', '60', '-keyint_min', '60', '-sc_threshold', '0', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
  execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', seq, '-an', '-vf', vf, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '32', '-deadline', 'good', '-row-mt', '1', '-pix_fmt', 'yuv420p', webm], { stdio: 'inherit' });
  execFileSync('ffmpeg', ['-y', '-i', mp4, '-frames:v', '1', '-quality', '82', poster], { stdio: 'inherit' });
}

async function recordProfile(p) {
  const browser = await chromium.launch({ headless: true, args: ['--disable-infobars', '--hide-scrollbars'] });
  const seqDir = fs.mkdtempSync(path.join(os.tmpdir(), `aringleb-${p.name}-`));
  try {
    const context = await browser.newContext({
      viewport: { width: p.width, height: p.height },
      isMobile: p.isMobile,
      hasTouch: p.isMobile,
      deviceScaleFactor: p.dsf,
    });
    await warm(context);

    const page = await context.newPage();
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await waitReady(page);
    await disableSmoothAndCursor(page);
    await page.evaluate('window.scrollTo(0,0)');
    await waitHeroRevealed(page, p.height);
    await page.waitForTimeout(400);
    const m = await measure(page);

    // Screencast so agora: o preloader ja saiu e a hero esta pronta.
    const client = await context.newCDPSession(page);
    const frames = [];
    client.on('Page.screencastFrame', async (f) => {
      const ts = f.metadata?.timestamp ?? Date.now() / 1000;
      frames.push({ ts, buf: Buffer.from(f.data, 'base64') });
      try { await client.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch (e) {}
    });
    await client.send('Page.startScreencast', { format: 'jpeg', quality: 90, everyNthFrame: 1 });

    await driveScroll(page, m.distance);

    await client.send('Page.stopScreencast').catch(() => {});
    await page.waitForTimeout(150);
    await context.close();

    if (frames.length < FRAMES * 0.5) throw new Error(`poucos frames (${frames.length}) para ${p.name}`);
    frames.sort((a, b) => a.ts - b.ts);
    resampleToSequence(frames, seqDir);

    console.log(`${p.name}: distance ${m.distance}px (doc ${m.scrollHeight}, vp ${m.viewportHeight}), ${frames.length} frames capturados`);
    encode(seqDir, `aringleb-${p.name}`, p.out);
    // master full-res para preservacao
    encode(seqDir, `aringleb-${p.name}-master`, `${p.width}x${p.height}`);
  } finally {
    await browser.close().catch(() => {});
    fs.rmSync(seqDir, { recursive: true, force: true });
  }
}

fs.mkdirSync(RAW, { recursive: true });
for (const p of PROFILES) await recordProfile(p);
console.log('done');
