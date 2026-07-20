// QA do CTA e do footer: separação, botão em repouso/hover, rajada.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { irPara } from './lib-scroll.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'shots');
mkdirSync(OUT, { recursive: true });
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
});

async function abrir(w, h, opts = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, hasTouch: !!opts.touch, isMobile: !!opts.touch });
  if (opts.reduce) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  page.on('pageerror', (e) => console.log('ERRO:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text()); });
  await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('volund-intro', '1'); } catch (e) {} });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await wait(700);
  return page;
}

{
  const page = await abrir(1440, 900);
  await irPara(page, '.cta', 0);
  await page.screenshot({ path: join(OUT, 'cta-d-repouso.png') });

  const btn = await page.$('.cta-btn');
  const box = await btn.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await wait(800);
  await page.screenshot({ path: join(OUT, 'cta-d-hover.png') });
  await page.mouse.move(5, 5);

  // footer + rajada
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(1400);
  await page.screenshot({ path: join(OUT, 'ft-d-1.png') });
  await wait(2200);
  await page.screenshot({ path: join(OUT, 'ft-d-2.png') });

  console.log(await page.evaluate(() => {
    const d = document.querySelector('[data-gust-a]').getAttribute('d');
    return `rajada: paths=${document.querySelectorAll('.ft-gust-p').length} dLen=${d.length}`;
  }));
  await page.close();
}

// reduced motion
{
  const page = await abrir(1440, 900, { reduce: true });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(1200);
  await page.screenshot({ path: join(OUT, 'ft-d-reduced.png') });
  console.log('reduced: cta visivel =', await page.evaluate(() => {
    const b = document.querySelector('.cta-btn');
    const cs = getComputedStyle(b);
    return `${cs.opacity}/${cs.visibility}`;
  }));
  await page.close();
}

// mobile com touch
{
  const page = await abrir(390, 844, { touch: true });
  await irPara(page, '.cta', 0);
  await page.screenshot({ path: join(OUT, 'cta-m.png') });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(1200);
  await page.screenshot({ path: join(OUT, 'ft-m.png') });
  console.log('overflow mobile:', await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  await page.close();
}

await browser.close();
