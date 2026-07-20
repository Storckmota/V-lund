import puppeteer from 'puppeteer-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('volund-intro', '1'); } catch (e) {} });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await wait(900);

console.log(await page.evaluate(() => {
  const pin = document.querySelector('[data-svcp-pin]');
  const sp = pin.parentElement;
  return {
    spClass: sp.className || '(pin-spacer)',
    spTop: Math.round(sp.getBoundingClientRect().top + scrollY),
    spH: sp.offsetHeight,
    pinH: pin.offsetHeight,
    inner: innerHeight,
    docH: document.body.scrollHeight,
  };
}));

for (const p of [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1]) {
  await page.evaluate(async (pr) => {
    const sp = document.querySelector('[data-svcp-pin]').parentElement;
    const top = sp.getBoundingClientRect().top + scrollY;
    const target = top + (sp.offsetHeight - innerHeight) * pr;
    const start = scrollY;
    for (let k = 1; k <= 12; k += 1) {
      window.scrollTo(0, start + ((target - start) * k) / 12);
      await new Promise((r) => setTimeout(r, 70));
    }
    window.scrollTo(0, target);
  }, p);
  await wait(1100);
  console.log(await page.evaluate((pr) => {
    const panels = [...document.querySelectorAll('[data-svcp-panel]')];
    const info = panels.map((el, i) => {
      const r = el.getBoundingClientRect();
      return `${i}:${Math.round(r.top)}`;
    }).join(' ');
    // qual painel cobre o centro da viewport
    const mid = panels.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= innerHeight / 2 && r.bottom >= innerHeight / 2;
    });
    const visivel = mid.length ? mid[mid.length - 1] : null;
    const nome = visivel ? (visivel.querySelector('.svcp-name, .svcp-open-title, .svcp-floor-title')?.textContent.trim().slice(0, 28)) : '-';
    return `p=${pr} y=${Math.round(scrollY)} tops[${info}] ativo="${nome}"`;
  }, p));
}
await browser.close();
