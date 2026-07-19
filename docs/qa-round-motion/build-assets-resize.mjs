// Resize dos assets via servidor HTTP local (file:// é bloqueado no
// headless). Reduz main 1440 -> 760 e alt 1440 -> 900.
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'public', 'assets', 'projects');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const server = createServer((req, res) => {
  const name = decodeURIComponent(req.url.slice(1));
  if (name.startsWith('page/')) {
    const [, img, w, h] = name.split('/');
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(`<style>*{margin:0}</style><img src="/${img}" style="width:${w}px;height:${h}px;display:block">`);
    return;
  }
  try {
    const file = join(OUT, name);
    statSync(file);
    res.writeHead(200, { 'content-type': 'image/webp' });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(4599, r));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
});

async function resize(slug, kind, width, height, suffix) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(`http://localhost:4599/page/${slug}-${kind}-1440.webp/${width}/${height}`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: join(OUT, `${slug}-${kind}-${suffix}.webp`), type: 'webp', quality: 82 });
  await page.close();
  console.log(`${slug} ${kind} ${suffix} ok`);
}

for (const slug of ['allure', 'leonardo', 'aringleb']) {
  await resize(slug, 'main', 760, 475, '760');
  await resize(slug, 'alt', 900, 563, '900');
}

await browser.close();
server.close();
console.log('done');
