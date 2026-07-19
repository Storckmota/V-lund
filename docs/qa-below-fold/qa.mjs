// QA da rodada below-fold: viewports, cenas, hovers, reduced motion,
// console e overflow. Usa o Chrome instalado via puppeteer-core.
// Uso: node docs/qa-below-fold/qa.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'shots');
mkdirSync(OUT, { recursive: true });
const URL = 'http://localhost:4173/';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const VIEWPORTS = [
  [390, 844], [430, 932], [768, 1024], [1024, 768],
  [1366, 768], [1440, 900], [1920, 1080], [2560, 1440],
];

const report = { consoleErrors: [], pageErrors: [], overflow: [], notes: [] };

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
});

async function newPage(w, h, reducedMotion = false) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  if (reducedMotion) {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  }
  await page.evaluateOnNewDocument(() => {
    try { sessionStorage.setItem('volund-intro', '1'); } catch (e) {}
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') report.consoleErrors.push(`[${w}x${h}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => report.pageErrors.push(`[${w}x${h}] ${err.message}`));
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 600));
  return page;
}

async function scrollToBottomAndBack(page) {
  // percorre a página em passos (dispara cenas), depois volta
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.5;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 300));
  });
}

for (const [w, h] of VIEWPORTS) {
  const page = await newPage(w, h);
  await scrollToBottomAndBack(page);
  const ov = await page.evaluate(() => {
    const d = document.documentElement;
    return { sw: d.scrollWidth, cw: d.clientWidth };
  });
  if (ov.sw > ov.cw + 1) report.overflow.push(`[${w}x${h}] scrollWidth ${ov.sw} > clientWidth ${ov.cw}`);
  if (w === 1440 || w === 390) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: join(OUT, `full-${w}x${h}.png`), fullPage: true });
  }
  await page.close();
}

// estados intermediários e hovers em 1440x900
{
  const page = await newPage(1440, 900);

  // âncoras de cada seção
  const sections = ['.tese', '.svc', '.prj', '.prc', '.std', '.close', '.ft'];
  // primeiro percorre tudo para disparar entradas
  await scrollToBottomAndBack(page);

  // cena da tese: estados intermediários (progresso do pin)
  const teseStates = [0.12, 0.4, 0.7, 0.98];
  for (let i = 0; i < teseStates.length; i += 1) {
    await page.evaluate((p) => {
      const st = window.__st_tese; // fallback: calcula via posição do pin
      const pin = document.querySelector('.tese-pin');
      const rect = pin.parentElement.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const total = pin.parentElement.offsetHeight - window.innerHeight;
      window.scrollTo(0, top + total * p);
    }, teseStates[i]);
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: join(OUT, `tese-state-${i + 1}.png`) });
  }

  // seções paradas
  for (const sel of sections) {
    await page.evaluate((s) => {
      const el = document.querySelector(s);
      el.scrollIntoView({ block: s === '.ft' || s === '.close' ? 'end' : 'start' });
    }, sel);
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: join(OUT, `section-${sel.slice(1)}.png`) });
  }

  // processo: estados intermediários
  const prcStates = [0.15, 0.5, 0.9];
  for (let i = 0; i < prcStates.length; i += 1) {
    await page.evaluate((p) => {
      const scene = document.querySelector('[data-prc-scene]');
      const wrap = scene.parentElement; // pin spacer é criado em volta
      const top = scene.getBoundingClientRect().top + window.scrollY;
      const total = Math.max(scene.offsetHeight, window.innerHeight * 4) - window.innerHeight;
      window.scrollTo(0, top + total * p);
    }, prcStates[i]);
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: join(OUT, `prc-state-${i + 1}.png`) });
  }

  // hovers
  await page.evaluate(() => document.querySelector('.svc-list').scrollIntoView({ block: 'center' }));
  await new Promise((r) => setTimeout(r, 600));
  const svcItem = await page.$('.svc-item');
  await svcItem.hover();
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: join(OUT, 'hover-svc.png') });

  await page.evaluate(() => document.querySelector('.prj-case').scrollIntoView({ block: 'center' }));
  await new Promise((r) => setTimeout(r, 800));
  const media = await page.$('.prj-media');
  await media.hover();
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: join(OUT, 'hover-prj.png') });

  await page.evaluate(() => document.querySelector('.close-mega').scrollIntoView({ block: 'center' }));
  await new Promise((r) => setTimeout(r, 800));
  const mega = await page.$('.close-mega');
  await mega.hover();
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: join(OUT, 'hover-close.png') });

  await page.close();
}

// reduced motion: conteúdo visível, sem cenas
{
  const page = await newPage(1440, 900, true);
  const sceneCheck = await page.evaluate(() => ({
    teseScene: document.querySelector('.tese').classList.contains('is-scene'),
    prcScene: document.querySelector('.prc').classList.contains('is-scene'),
  }));
  report.notes.push(`reduced-motion is-scene: ${JSON.stringify(sceneCheck)}`);
  await page.screenshot({ path: join(OUT, 'reduced-motion-full.png'), fullPage: true });
  // conteúdo íntegro?
  const visible = await page.evaluate(() => {
    const els = ['.tese-close', '.svc-name', '.prj-name', '.prc-step-name', '.std-title', '.close-mega', '.ft-mark'];
    return els.map((s) => {
      const el = document.querySelector(s);
      const cs = getComputedStyle(el);
      return `${s}: opacity=${cs.opacity} visibility=${cs.visibility}`;
    });
  });
  report.notes.push(...visible);
  await page.close();
}

await browser.close();
writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
