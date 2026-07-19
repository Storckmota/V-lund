// QA rodada 2: estados das cenas via pin-spacer, hover real de serviços,
// mobile com emulação de touch (hover:none), reload no meio da página.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'shots');
mkdirSync(OUT, { recursive: true });
const URL = 'http://localhost:4173/';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const report = { consoleErrors: [], pageErrors: [], notes: [] };

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
});

async function newPage(w, h, { touch = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, hasTouch: touch, isMobile: touch });
  await page.evaluateOnNewDocument(() => {
    try { sessionStorage.setItem('volund-intro', '1'); } catch (e) {}
  });
  page.on('console', (m) => { if (m.type() === 'error') report.consoleErrors.push(`[${w}x${h}] ${m.text()}`); });
  page.on('pageerror', (e) => report.pageErrors.push(`[${w}x${h}] ${e.message}`));
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 500));
  return page;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function sweep(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.5;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
  });
}

// posição de um pin: usa o pin-spacer que envolve o elemento
async function scrollScene(page, sel, progress) {
  await page.evaluate(({ sel, progress }) => {
    const el = document.querySelector(sel);
    const spacer = el.closest('.pin-spacer') || el;
    const top = spacer.getBoundingClientRect().top + window.scrollY;
    const total = spacer.offsetHeight - window.innerHeight;
    window.scrollTo(0, top + Math.max(0, total) * progress);
  }, { sel, progress });
  await wait(750);
}

// ---- desktop 1440: cenas e hovers ----
{
  const page = await newPage(1440, 900);
  await sweep(page);

  for (const [i, p] of [0.1, 0.38, 0.66, 0.97].entries()) {
    await scrollScene(page, '.tese-pin', p);
    await page.screenshot({ path: join(OUT, `tese-s${i + 1}.png`) });
  }
  for (const [i, p] of [0.08, 0.3, 0.55, 0.95].entries()) {
    await scrollScene(page, '[data-prc-scene]', p);
    await page.screenshot({ path: join(OUT, `prc-s${i + 1}.png`) });
  }

  // hover de serviços com movimento real do mouse
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(300);
  await page.evaluate(() => document.querySelector('.svc-list').scrollIntoView({ block: 'center' }));
  await wait(700);
  const box = await (await page.$('.svc-item')).boundingBox();
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.5, { steps: 8 });
  await wait(1200);
  await page.screenshot({ path: join(OUT, 'hover-svc2.png') });

  // hover projeto (verifica crop novo)
  await page.evaluate(() => document.querySelector('.prj-case').scrollIntoView({ block: 'center' }));
  await wait(700);
  const mb = await (await page.$('.prj-media')).boundingBox();
  await page.mouse.move(mb.x + mb.width * 0.5, mb.y + mb.height * 0.5, { steps: 8 });
  await wait(1100);
  await page.screenshot({ path: join(OUT, 'hover-prj2.png') });

  // repouso do projeto (crop corrigido)
  await page.mouse.move(10, 10);
  await wait(1200);
  await page.screenshot({ path: join(OUT, 'prj-rest.png') });

  // reload no meio da página: conteúdo precisa se resolver
  await page.evaluate(() => document.querySelector('.std').scrollIntoView());
  await wait(300);
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(900);
  await page.screenshot({ path: join(OUT, 'reload-mid.png') });
  const vis = await page.evaluate(() => {
    const r = document.querySelector('.std-title').getBoundingClientRect();
    const cs = getComputedStyle(document.querySelector('.std-title'));
    return { top: Math.round(r.top), opacity: cs.opacity };
  });
  report.notes.push(`reload-mid .std-title: ${JSON.stringify(vis)}`);

  // navegação por teclado: tab até o CTA final
  await page.evaluate(() => document.querySelector('.close-mega').focus());
  await wait(400);
  await page.screenshot({ path: join(OUT, 'focus-close.png') });

  await page.close();
}

// ---- mobile 390 com touch: strip do projeto no fluxo + seções ----
{
  const page = await newPage(390, 844, { touch: true });
  const media = await page.evaluate(() => ({
    hoverNone: matchMedia('(hover: none)').matches,
    coarse: matchMedia('(pointer: coarse)').matches,
  }));
  report.notes.push(`mobile 390 media: ${JSON.stringify(media)}`);
  await sweep(page);
  for (const sel of ['.tese', '.svc', '.prj', '.prc', '.std', '.close', '.ft']) {
    await page.evaluate((s) => document.querySelector(s).scrollIntoView(), sel);
    await wait(700);
    await page.screenshot({ path: join(OUT, `m390-${sel.slice(1)}.png`) });
  }
  const strip = await page.evaluate(() => {
    const el = document.querySelector('.prj-strip');
    return getComputedStyle(el).display;
  });
  report.notes.push(`mobile .prj-strip display: ${strip}`);
  await page.close();
}

// ---- 768 touch: tablet ----
{
  const page = await newPage(768, 1024, { touch: true });
  await sweep(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(400);
  await page.screenshot({ path: join(OUT, 'full-768.png'), fullPage: true });
  await page.close();
}

// ---- desktop full após correções ----
{
  const page = await newPage(1440, 900);
  await sweep(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(400);
  await page.screenshot({ path: join(OUT, 'full-1440-v2.png'), fullPage: true });
  await page.close();
}

await browser.close();
writeFileSync(join(OUT, 'report2.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
