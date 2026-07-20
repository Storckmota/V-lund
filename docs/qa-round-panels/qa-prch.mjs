// QA do Processo horizontal: progressão da faixa e liberação do pin.
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

{
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('ERRO:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text()); });
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('volund-intro', '1'); } catch (e) {} });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await wait(900);

  console.log(await page.evaluate(() => {
    const t = document.querySelector('[data-prch-track]');
    const sp = document.querySelector('[data-prch-pin]').parentElement;
    return `prch: trackW=${t.scrollWidth} viewport=${innerWidth} dist=${t.scrollWidth - innerWidth} spH=${sp.offsetHeight} isScene=${document.querySelector('.prch').classList.contains('is-scene')}`;
  }));

  const marks = [0, 0.25, 0.5, 0.75, 1];
  for (let i = 0; i < marks.length; i += 1) {
    await page.evaluate(async (p) => {
      const sp = document.querySelector('[data-prch-pin]').parentElement;
      const top = sp.getBoundingClientRect().top + scrollY;
      const target = top + (sp.offsetHeight - innerHeight) * p;
      const start = scrollY;
      for (let k = 1; k <= 14; k += 1) {
        window.scrollTo(0, start + ((target - start) * k) / 14);
        await new Promise((r) => setTimeout(r, 70));
      }
      window.scrollTo(0, target);
    }, marks[i]);
    await wait(1200);
    console.log(await page.evaluate((p) => {
      const t = document.querySelector('[data-prch-track]');
      const m = new DOMMatrixReadOnly(getComputedStyle(t).transform);
      return `  marca ${p}: x=${Math.round(m.m41)}`;
    }, marks[i]));
    await page.screenshot({ path: join(OUT, `prch-d-${i + 1}.png`) });
  }

  // depois do pin: o fluxo vertical volta?
  await page.evaluate(async () => {
    const sp = document.querySelector('[data-prch-pin]').parentElement;
    const depois = sp.getBoundingClientRect().top + scrollY + sp.offsetHeight + 200;
    const start = scrollY;
    for (let k = 1; k <= 10; k += 1) {
      window.scrollTo(0, start + ((depois - start) * k) / 10);
      await new Promise((r) => setTimeout(r, 70));
    }
  });
  await wait(900);
  await page.screenshot({ path: join(OUT, 'prch-d-apos-pin.png') });
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
  await page.evaluate(() => document.querySelector('.prch').scrollIntoView({ block: 'start' }));
  await wait(800);
  await page.screenshot({ path: join(OUT, 'prch-m-1.png') });
  await page.evaluate(() => document.querySelectorAll('[data-prch-card]')[2].scrollIntoView({ block: 'start' }));
  await wait(800);
  await page.screenshot({ path: join(OUT, 'prch-m-2.png') });
  console.log('overflow mobile:', await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  await page.close();
}

await browser.close();
