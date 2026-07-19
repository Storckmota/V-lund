// Gera os assets locais dos projetos (WebP) a partir dos sites reais.
// Posições de scroll escolhidas na inspeção (docs/qa-round-motion/projects):
// Alexander não usa a primeira dobra (foto provisória) — só áreas
// finalizadas do corpo do site. Saída: public/assets/projects/.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'public', 'assets', 'projects');
mkdirSync(OUT, { recursive: true });
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// slug, url, scroll desktop main, scroll desktop alt, scroll mobile
const PLAN = [
  ['allure', 'https://allure-pink.vercel.app/', 0, 4500, 0],
  ['leonardo', 'https://dr-leonardo-guarconi.vercel.app/', 0, 6300, 0],
  ['aringleb', 'https://aringleb.vercel.app/', 2700, 9000, 3376],
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
});

async function settle(page, url, w, h) {
  await page.setViewport({ width: w, height: h });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.evaluate(() => document.fonts?.ready);
  await new Promise((r) => setTimeout(r, 2000));
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    for (let y = 0; y <= max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 1200));
}

async function shootAt(page, y, path) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await new Promise((r) => setTimeout(r, 1400));
  await page.screenshot({ path, type: 'webp', quality: 82 });
}

for (const [slug, url, mainY, altY, mobY] of PLAN) {
  const page = await browser.newPage();
  await settle(page, url, 1440, 900);
  await shootAt(page, mainY, join(OUT, `${slug}-main-1440.webp`));
  await shootAt(page, altY, join(OUT, `${slug}-alt-1440.webp`));
  await page.close();

  const mp = await browser.newPage();
  await settle(mp, url, 390, 844);
  await shootAt(mp, mobY, join(OUT, `${slug}-mob-390.webp`));
  await mp.close();
  console.log(`${slug}: capturas ok`);
}

// redimensiona: main 1440 -> 760 (475px) e alt 1440 -> 900 (563px)
async function resize(src, outPath, width, height) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  const html = `<style>*{margin:0}</style><img src="file:///${src.replace(/\\/g, '/')}" style="width:${width}px;height:${height}px;display:block">`;
  const tmp = join(OUT, '_resize.html');
  writeFileSync(tmp, html);
  await page.goto(`file:///${tmp.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: outPath, type: 'webp', quality: 82 });
  await page.close();
}

for (const [slug] of PLAN) {
  await resize(join(OUT, `${slug}-main-1440.webp`), join(OUT, `${slug}-main-760.webp`), 760, 475);
  await resize(join(OUT, `${slug}-alt-1440.webp`), join(OUT, `${slug}-alt-900.webp`), 900, 563);
  console.log(`${slug}: resize ok`);
}
rmSync(join(OUT, '_resize.html'), { force: true });

await browser.close();
console.log('assets done');
