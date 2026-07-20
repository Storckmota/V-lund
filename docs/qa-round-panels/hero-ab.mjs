// A/B do runtime: a hero muda quando Lenis / below-fold estão ativos?
// Compara o conteúdo do canvas da atmosfera em três cenários.
import puppeteer from 'puppeteer-core';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'shots');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
});

async function probe(label, { blockLenis = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('volund-intro', '1'); } catch (e) {} });
  if (blockLenis) {
    await page.setRequestInterception(true);
    page.on('request', (r) => {
      if (r.url().includes('lenis')) r.abort();
      else r.continue();
    });
  }
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await wait(1600);

  const r = await page.evaluate(() => {
    const c = document.querySelector('[data-atmos]');
    const g = c.getContext('2d');
    const grid = [];
    for (let v = 0.05; v < 1; v += 0.1) {
      const row = [];
      for (let u = 0.05; u < 1; u += 0.1) {
        const d = g.getImageData(Math.round(u * c.width), Math.round(v * c.height), 1, 1).data;
        row.push(d[3]);
      }
      grid.push(row.join(','));
    }
    // luminância efetiva composta (o que o olho vê): lê o pixel da página
    return {
      grid,
      heroH: Math.round(document.querySelector('.hero').getBoundingClientRect().height),
      atmosOpacity: getComputedStyle(c).opacity,
      rafCount: 'n/a',
    };
  });

  // contraste real percebido: mede o PNG renderizado
  await page.screenshot({ path: join(OUT, `ab-${label}.png`) });
  console.log(`\n--- ${label} --- heroH=${r.heroH} atmosOpacity=${r.atmosOpacity}`);
  r.grid.forEach((row) => console.log(`   ${row}`));
  await page.close();
  return r.grid.join('|');
}

const a = await probe('com-lenis');
const b = await probe('sem-lenis', { blockLenis: true });
console.log(`\nCanvas identico entre cenarios: ${a === b}`);

await browser.close();
