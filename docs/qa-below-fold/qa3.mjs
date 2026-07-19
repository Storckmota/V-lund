// QA rodada 3: spot-check final (ghost contido, focus do CTA, fulls).
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'shots');
mkdirSync(OUT, { recursive: true });
const CHROME = ['C:', 'Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'].join('\\');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
});

async function newPage(w, h, touch = false) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, hasTouch: touch, isMobile: touch });
  await page.evaluateOnNewDocument(() => {
    try { sessionStorage.setItem('volund-intro', '1'); } catch (e) {}
  });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await wait(400);
  return page;
}

{
  const page = await newPage(1440, 900);
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  await wait(1500);

  await page.evaluate(() => document.querySelector('.svc-list').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await wait(900);
  const box = await (await page.$$('.svc-item'))[2].boundingBox();
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.5, { steps: 6 });
  await wait(1600);
  await page.screenshot({ path: join(OUT, 'hover-svc3.png') });

  await page.evaluate(() => {
    document.querySelector('.close-mega').scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await wait(1200);
  await page.evaluate(() => document.querySelector('.close-mega').focus({ preventScroll: true }));
  await wait(400);
  await page.screenshot({ path: join(OUT, 'focus-close2.png') });

  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(500);
  await page.screenshot({ path: join(OUT, 'full-1440-final.png'), fullPage: true });
  await page.close();
}

{
  const page = await newPage(390, 844, true);
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
  });
  await wait(2000);
  await page.evaluate(() => document.querySelector('.svc-list').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await wait(1500);
  await page.screenshot({ path: join(OUT, 'm390-svc-final.png') });
  await page.evaluate(() => document.querySelector('.prj-case').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await wait(1500);
  await page.screenshot({ path: join(OUT, 'm390-prj-final.png') });
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(500);
  await page.screenshot({ path: join(OUT, 'full-390-final.png'), fullPage: true });
  await page.close();
}

await browser.close();
console.log('qa3 done');
