// QA dos painéis de Serviços: cada painel no seu momento de permanência.
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

// desktop: percorre o pin e captura no meio de cada permanência
{
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('ERRO:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text()); });
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('volund-intro', '1'); } catch (e) {} });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await wait(800);

  const geo = await page.evaluate(() => {
    const pin = document.querySelector('[data-svcp-pin]');
    const sp = pin.parentElement;
    return {
      pinTop: Math.round(sp.getBoundingClientRect().top + scrollY),
      total: sp.offsetHeight - innerHeight,
      panels: document.querySelectorAll('[data-svcp-panel]').length,
      isScene: document.querySelector('.svcp').classList.contains('is-scene'),
    };
  });
  console.log('svcp:', JSON.stringify(geo));

  // 5 painéis => 4 transições. Centro da permanência de cada painel.
  const marks = [0.02, 0.2, 0.45, 0.7, 0.93];
  for (let i = 0; i < marks.length; i += 1) {
    await page.evaluate(async (p) => {
      const pin = document.querySelector('[data-svcp-pin]');
      const sp = pin.parentElement;
      const top = sp.getBoundingClientRect().top + scrollY;
      const target = top + (sp.offsetHeight - innerHeight) * p;
      const start = scrollY;
      for (let k = 1; k <= 12; k += 1) {
        window.scrollTo(0, start + ((target - start) * k) / 12);
        await new Promise((r) => setTimeout(r, 70));
      }
      window.scrollTo(0, target);
    }, marks[i]);
    await wait(1100);
    await page.screenshot({ path: join(OUT, `svcp-d-${i + 1}.png`) });
  }
  await page.close();
}

// mobile
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
  const panels = await page.$$('[data-svcp-panel]');
  for (let i = 0; i < panels.length; i += 1) {
    await page.evaluate((k) => {
      document.querySelectorAll('[data-svcp-panel]')[k].scrollIntoView({ block: 'start' });
    }, i);
    await wait(800);
    await page.screenshot({ path: join(OUT, `svcp-m-${i + 1}.png`) });
  }
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log('overflow mobile:', ov);
  await page.close();
}

await browser.close();
