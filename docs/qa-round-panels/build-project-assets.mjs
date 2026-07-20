// Assets dos projetos: hero real dos três sites (desktop + mobile) e uma
// tela interna de cada um para a coreografia de hover.
// Saída: public/assets/projects/
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'public', 'assets', 'projects');
mkdirSync(OUT, { recursive: true });
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// slug, url, y da tela interna (desktop)
const PLAN = [
  ['allure', 'https://allure-pink.vercel.app/', 4500],
  ['leonardo', 'https://dr-leonardo-guarconi.vercel.app/', 6300],
  ['aringleb', 'https://aringleb.vercel.app/', 9000],
];

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
});

async function abrir(url, w, h) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.evaluate(() => document.fonts?.ready);
  await wait(2200);
  // percorre para disparar lazy/animações e volta ao topo
  await page.evaluate(async () => {
    const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    for (let y = 0; y <= max; y += innerHeight * 0.6) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 110));
    }
    window.scrollTo(0, 0);
  });
  await wait(1800);
  return page;
}

for (const [slug, url, altY] of PLAN) {
  // hero desktop
  const d = await abrir(url, 1440, 900);
  await d.screenshot({ path: join(OUT, `${slug}-hero-1440.webp`), type: 'webp', quality: 84 });
  // tela interna
  await d.evaluate((y) => window.scrollTo(0, y), altY);
  await wait(1500);
  await d.screenshot({ path: join(OUT, `${slug}-inner-1440.webp`), type: 'webp', quality: 84 });
  await d.close();

  // hero mobile
  const m = await abrir(url, 390, 844);
  await m.screenshot({ path: join(OUT, `${slug}-hero-390.webp`), type: 'webp', quality: 84 });
  await m.close();
  console.log(`${slug}: hero + interna + mobile`);
}

await browser.close();
console.log('assets ok');
