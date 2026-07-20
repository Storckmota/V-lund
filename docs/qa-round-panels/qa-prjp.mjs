// QA dos painéis de Projetos: cada projeto na permanência + hover.
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
    const sp = document.querySelector('[data-prjp-pin]').parentElement;
    return `prjp: painéis=${document.querySelectorAll('[data-prjp-panel]').length} isScene=${document.querySelector('.prjp').classList.contains('is-scene')} spH=${sp.offsetHeight}`;
  }));

  const marks = [0.03, 0.5, 0.95];
  for (let i = 0; i < marks.length; i += 1) {
    await page.evaluate(async (p) => {
      const sp = document.querySelector('[data-prjp-pin]').parentElement;
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
    const quem = await page.evaluate(() => {
      const ps = [...document.querySelectorAll('[data-prjp-panel]')];
      const vis = ps.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= innerHeight / 2 && r.bottom >= innerHeight / 2;
      });
      const el = vis[vis.length - 1];
      return el ? el.dataset.prjp : '-';
    });
    console.log(`  marca ${marks[i]} -> ${quem}`);
    await page.screenshot({ path: join(OUT, `prjp-d-${i + 1}.png`) });

    const shots = await page.$('.prjp-panel[style*="translate"] .prjp-shots, .prjp-shots');
    if (shots) {
      const box = await page.evaluate((sel) => {
        const ps = [...document.querySelectorAll('[data-prjp-panel]')];
        const vis = ps.filter((el) => {
          const r = el.getBoundingClientRect();
          return r.top <= innerHeight / 2 && r.bottom >= innerHeight / 2;
        });
        const el = vis[vis.length - 1];
        if (!el) return null;
        const s = el.querySelector('.prjp-shots').getBoundingClientRect();
        return { x: Math.round(s.left + s.width / 2), y: Math.round(s.top + s.height / 2) };
      });
      if (box && box.y > 0 && box.y < 900) {
        await page.mouse.move(box.x, box.y);
        await wait(1100);
        await page.screenshot({ path: join(OUT, `prjp-d-${i + 1}-hover.png`) });
        await page.mouse.move(5, 5);
        await wait(400);
      }
    }
  }
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
  for (let i = 0; i < 3; i += 1) {
    await page.evaluate((k) => document.querySelectorAll('[data-prjp-panel]')[k].scrollIntoView({ block: 'start' }), i);
    await wait(800);
    await page.screenshot({ path: join(OUT, `prjp-m-${i + 1}.png`) });
  }
  console.log('overflow mobile:', await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  await page.close();
}

await browser.close();
