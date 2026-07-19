// Resize, mudança de orientação, troca de aba e scroll rápido interrompido.
import puppeteer from 'puppeteer-core';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'shots');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('volund-intro', '1'); } catch (e) {} });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await wait(600);

const state = async (tag) => {
  const s = await page.evaluate(() => ({
    y: Math.round(window.scrollY),
    h: document.body.scrollHeight,
    ov: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    vis: document.querySelector('.prj-visual.is-active')?.dataset.prjVisual,
    svc: document.querySelector('[data-svc-stage]')?.dataset.svcState,
    teseScene: document.querySelector('.tese').classList.contains('is-scene'),
  }));
  console.log(`${tag}: y=${s.y} docH=${s.h} overflowX=${s.ov} vis=${s.vis} svc=${s.svc} teseScene=${s.teseScene}`);
};

// posiciona nos projetos
await page.evaluate(() => {
  const c = document.querySelectorAll('[data-prj-case]')[1];
  window.scrollTo(0, c.getBoundingClientRect().top + window.scrollY - innerHeight * 0.25);
});
await wait(1200);
await state('antes do resize');

// resize desktop -> desktop menor
await page.setViewport({ width: 1024, height: 768 });
await wait(1500);
await state('resize 1024x768');

// desktop -> mobile (troca de contexto do matchMedia)
await page.setViewport({ width: 390, height: 844 });
await wait(1800);
await state('resize 390x844 (mobile)');
await page.screenshot({ path: join(OUT, 'resize-to-mobile.png') });

// orientação: mobile paisagem
await page.setViewport({ width: 844, height: 390 });
await wait(1500);
await state('orientacao 844x390');

// de volta ao desktop
await page.setViewport({ width: 1440, height: 900 });
await wait(1800);
await state('volta 1440x900');

// scroll rápido interrompido
await page.evaluate(async () => {
  window.scrollTo(0, document.body.scrollHeight * 0.8);
  await new Promise((r) => setTimeout(r, 60));
  window.scrollTo(0, document.body.scrollHeight * 0.2);
  await new Promise((r) => setTimeout(r, 60));
  window.scrollTo(0, document.body.scrollHeight * 0.6);
});
await wait(1500);
await state('scroll rapido interrompido');

// troca de aba: esconde e volta
const other = await browser.newPage();
await other.goto('about:blank');
await wait(1200);
await page.bringToFront();
await wait(1200);
await state('retorno da aba');
await page.screenshot({ path: join(OUT, 'after-tab-return.png') });

console.log('erros:', errors.length ? errors : 'nenhum');
await browser.close();
