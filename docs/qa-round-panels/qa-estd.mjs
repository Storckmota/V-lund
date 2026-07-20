// QA do Estúdio: bloco, tópicos, preview no hover e no foco, mobile.
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

{
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('ERRO:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text()); });
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('volund-intro', '1'); } catch (e) {} });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += innerHeight * 0.4) {
      window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 70));
    }
  });
  await wait(600);

  await irPara(page, '.estd', 0);
  await wait(1000);
  await page.screenshot({ path: join(OUT, 'estd-d-repouso.png') });
  console.log('hasPreview:', await page.evaluate(() => document.querySelector('.estd').classList.contains('has-preview')));

  // hover em cada tópico
  const nomes = ['zero', 'direcao', 'tecnologia'];
  for (let i = 0; i < nomes.length; i += 1) {
    const box = await page.evaluate((k) => {
      const t = document.querySelectorAll('.estd-topic')[k];
      const r = t.getBoundingClientRect();
      return { x: Math.round(r.left + 200), y: Math.round(r.top + 28) };
    }, i);
    await page.mouse.move(box.x, box.y);
    await wait(300);
    await page.mouse.move(box.x + 60, box.y + 6);
    await wait(900);
    await page.screenshot({ path: join(OUT, `estd-d-hover-${nomes[i]}.png`) });
  }
  await page.mouse.move(5, 5);
  await wait(500);

  // foco por teclado no segundo tópico
  await page.evaluate(() => document.querySelectorAll('.estd-trigger')[1].focus());
  await wait(900);
  await page.screenshot({ path: join(OUT, 'estd-d-foco.png') });
  console.log('aria-expanded no foco:', await page.evaluate(() => document.querySelectorAll('.estd-trigger')[1].getAttribute('aria-expanded')));
  await page.close();
}

{
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('volund-intro', '1'); } catch (e) {} });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += innerHeight * 0.4) {
      window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 70));
    }
  });
  await wait(500);
  await irPara(page, '.estd', 0);
  await wait(800);
  await page.screenshot({ path: join(OUT, 'estd-m-1.png') });
  await irPara(page, '.estd-topic:nth-child(2)', 40);
  await wait(700);
  await page.screenshot({ path: join(OUT, 'estd-m-2.png') });
  console.log('overflow mobile:', await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  await page.close();
}

await browser.close();
