import puppeteer from 'puppeteer-core';
import { irPara } from './lib-scroll.mjs';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });

async function cenario(nome, fn) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('volund-intro', '1'); } catch (e) {} });
  let erros = 0;
  page.on('pageerror', (e) => {
    erros += 1;
    console.log(`[${nome}] PAGEERROR: ${e.message}`);
    console.log((e.stack || '').split('\n').slice(1, 7).join('\n'));
  });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await wait(800);
  await fn(page);
  console.log(`[${nome}] erros=${erros}`);
  await page.close();
}

// exatamente a sequência do passo de resize do QA final
await cenario('resize-completo', async (page) => {
  await irPara(page, '.prjp', 0);
  await page.setViewport({ width: 1024, height: 768 });
  await wait(1400);
  await page.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  await wait(1600);
  await page.setViewport({ width: 844, height: 390, hasTouch: true, isMobile: true });
  await wait(1400);
  await page.setViewport({ width: 1440, height: 900 });
  await wait(1600);
});

// só a troca desktop -> mobile (troca de contexto do matchMedia)
await cenario('desktop-para-mobile', async (page) => {
  await irPara(page, '.prch', 0);
  await page.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  await wait(2000);
});

// e a volta
await cenario('mobile-para-desktop', async (page) => {
  await page.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  await wait(1500);
  await page.setViewport({ width: 1440, height: 900 });
  await wait(2000);
});

await browser.close();
