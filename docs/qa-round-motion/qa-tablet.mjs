// Capturas em tablet e desktop pequeno (768x1024, 1024x768, 1366x768)
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

for (const [w, h] of [[768, 1024], [1024, 768], [1366, 768]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('volund-intro', '1'); } catch (e) {} });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += innerHeight * 0.4) {
      window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80));
    }
  });
  await wait(600);
  for (const [name, sel] of [['svc', '.svc-index'], ['prj', '.prj-index'], ['prc', '[data-prc-ch="2"]'], ['cta', '.ft-cta']]) {
    await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'start' }), sel);
    await wait(800);
    await page.screenshot({ path: join(OUT, `t${w}-${name}.png`) });
  }
  await page.close();
  console.log(`${w}x${h} ok`);
}
await browser.close();
