// Diagnóstico da hero: canvas presente? tem pixels? RAF rodando?
// dimensões corretas? sobreposição/corte?
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'shots');
mkdirSync(OUT, { recursive: true });
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
});

for (const [w, h] of [[1440, 900], [1366, 768], [1920, 1080], [2560, 1440], [390, 844]]) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log(`  ERRO ${w}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') console.log(`  CONSOLE ${w}: ${m.text()}`); });
  await page.setViewport({ width: w, height: h });
  await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('volund-intro', '1'); } catch (e) {} });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await wait(1500);

  const diag = await page.evaluate(() => {
    const c = document.querySelector('[data-atmos]');
    const hero = document.querySelector('.hero');
    const cs = getComputedStyle(c);
    const hs = getComputedStyle(hero);
    const rect = c.getBoundingClientRect();
    const hrect = hero.getBoundingClientRect();
    // amostra de pixels do canvas para saber se algo foi desenhado
    let painted = 0; let maxAlphaDelta = 0; let samples = [];
    try {
      const g = c.getContext('2d');
      const img = g.getImageData(0, 0, c.width, c.height).data;
      const step = Math.max(4, Math.floor(img.length / 4 / 4000) * 4);
      let minL = 255; let maxL = 0;
      for (let i = 0; i < img.length; i += step) {
        const a = img[i + 3];
        if (a > 0) painted += 1;
        const l = (img[i] + img[i + 1] + img[i + 2]) / 3;
        if (a > 8) { if (l < minL) minL = l; if (l > maxL) maxL = l; }
      }
      maxAlphaDelta = maxL - minL;
      // amostras em pontos-chave: banda diagonal (baixo-esq -> dir), silêncio central
      const pt = (u, v) => {
        const d = g.getImageData(Math.round(u * c.width), Math.round(v * c.height), 1, 1).data;
        return `${d[3]}`;
      };
      samples = [
        `bandaBaixaEsq(0.15,0.85)=${pt(0.15, 0.85)}`,
        `bandaMeio(0.5,0.62)=${pt(0.5, 0.62)}`,
        `bandaDir(0.85,0.4)=${pt(0.85, 0.4)}`,
        `contracampo(0.06,0.08)=${pt(0.06, 0.08)}`,
        `silencioCopy(0.5,0.3)=${pt(0.5, 0.3)}`,
      ];
    } catch (e) { samples = [`erro leitura: ${e.message}`]; }
    return {
      canvasAttr: `${c.width}x${c.height}`,
      canvasCSS: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
      heroBox: `${Math.round(hrect.width)}x${Math.round(hrect.height)}`,
      heroOverflow: hs.overflow, heroPos: hs.position,
      canvasOpacity: cs.opacity, canvasVis: cs.visibility, canvasZ: cs.zIndex,
      canvasDisplay: cs.display, canvasPos: cs.position,
      canvasTop: Math.round(rect.top), canvasLeft: Math.round(rect.left),
      painted, maxAlphaDelta, samples,
      wordmarkBottom: Math.round(document.querySelector('.hero-monument').getBoundingClientRect().bottom),
      htmlOverflow: getComputedStyle(document.documentElement).overflowX,
      bodyOverflow: getComputedStyle(document.body).overflowX,
    };
  });
  console.log(`\n=== ${w}x${h} ===`);
  Object.entries(diag).forEach(([k, v]) => console.log(`  ${k}: ${Array.isArray(v) ? v.join(' | ') : v}`));

  await page.screenshot({ path: join(OUT, `hero-atual-${w}.png`) });

  // com movimento do cursor
  if (w >= 1366) {
    for (let i = 0; i < 22; i += 1) {
      await page.mouse.move(180 + i * (w - 360) / 22, h * 0.72 - i * 8);
      await wait(16);
    }
    await wait(120);
    await page.screenshot({ path: join(OUT, `hero-cursor-${w}.png`) });
  }
  await page.close();
}

await browser.close();
