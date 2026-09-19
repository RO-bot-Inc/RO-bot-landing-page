// Drives the RO Leak Test phone path against a running server and saves a
// screenshot of every storyboard frame it reaches. Playwright is borrowed
// from the app repo next door.
//
//   npm run build
//   npx -y netlify-cli dev --offline --framework '#static' --dir dist --port 8899 > tmp/netlify-dev.log 2>&1 &
//   SERVER_LOG=tmp/netlify-dev.log node scripts/leak-test-flow.mjs
//
// BASE   server to test (default http://localhost:8899; a deploy preview works too)
// OUT    screenshot folder (default tmp/leak-test-shots)
// SERVER_LOG  netlify dev log, used to pick up the emailed resume link in log mode
import { mkdirSync, readFileSync } from 'node:fs';

const { chromium, devices } = await import(new URL('../../app/node_modules/playwright/index.mjs', import.meta.url).href);

const BASE = process.env.BASE || 'http://localhost:8899';
const OUT = process.env.OUT || 'tmp/leak-test-shots';
const LOG = process.env.SERVER_LOG || '';
mkdirSync(OUT, { recursive: true });

for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(`${BASE}/api/leak-test`)).ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 1000));
}
console.log('config:', await (await fetch(`${BASE}/api/leak-test`)).text());

const browser = await chromium.launch();
const phone = await browser.newContext({ ...devices['iPhone 14'], baseURL: BASE });
const page = await phone.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
const shot = (name, opts = {}) => page.screenshot({ path: `${OUT}/${name}.png`, ...opts });
const stamp = Date.now().toString(36);
const email = `chris+${stamp}@alvarezauto.com`;

await page.goto('/ai-summit/?utm_source=direct&utm_medium=vanity_url&utm_campaign=aas_2026');
await page.waitForTimeout(400);
await shot('00-hub');
console.log('hub doors:', await page.$$eval('a[data-door]', (as) => as.map((a) => a.getAttribute('href'))));

await page.goto('/ai-summit/leak-test/?utm_source=print&utm_medium=qr&utm_campaign=aas_2026&utm_content=diagnostic_card_v1');
await page.waitForTimeout(500);
await shot('01-offer');
await shot('01-offer-full', { fullPage: true });

await page.click('#lt-cta');
await page.waitForTimeout(600);
await shot('02-form');

await page.fill('#lt-name', 'Chris Alvarez');
await page.fill('#lt-email', 'chris@alvarezauto');
await page.fill('#lt-dealership', 'Alvarez Auto Group');
await page.click('#lt-submit');
await page.waitForTimeout(300);
await shot('03-validation');
console.log('errors:', await page.$$eval('.errmsg:not([hidden])', (es) => es.map((e) => e.textContent)));

await page.fill('#lt-email', email);
await page.fill('#lt-title', 'Fixed Ops Director');
await page.click('#lt-more');
await page.fill('#lt-phone', '(555) 010-0142');
await page.fill('#lt-dms', 'CDK');
await page.fill('#lt-lane', 'Xtime, myKaarma');
await shot('02b-form-optional', { fullPage: true });
await page.click('#lt-submit');
await page.waitForSelector('#lt[data-screen="enrolled"]', { timeout: 30000 });
await page.waitForTimeout(300);
await shot('04-enrolled');
console.log('enrolled:', await page.$eval('[data-name="enrolled"] .p', (e) => e.textContent));
console.log('peek href:', await page.$eval('#lt-peek', (a) => a.getAttribute('href')));

await page.reload();
await page.waitForSelector('#lt[data-screen="enrolled"]');

await page.click('#lt-fix');
await page.waitForTimeout(300);
await shot('04b-fix');
await page.fill('#lt-email', email.replace('chris+', 'chris.alvarez+'));
await page.click('#lt-submit');
await page.waitForSelector('#lt[data-screen="enrolled"]', { timeout: 30000 });
await page.waitForTimeout(300);
await shot('04c-enrolled-fixed');
console.log('fixed:', await page.$eval('[data-name="enrolled"] .p', (e) => e.textContent));

let link = '';
if (LOG) {
  const m = [...readFileSync(LOG, 'utf8').matchAll(/https?:\/\/\S+\/ai-summit\/leak-test\/resume\/#[A-Za-z0-9_-]+/g)];
  link = m.length ? m[m.length - 1][0] : '';
}
console.log('resume link:', link ? link.replace(/#.*/, '#<token>') : '(none in log; live email mode?)');
if (link) {
  const path = link.replace(/^https?:\/\/[^/]+/, '');
  await page.goto(path);
  await page.waitForSelector('#rs[data-screen="home"]', { timeout: 15000 });
  await page.waitForTimeout(300);
  console.log('address bar after load:', page.url());
  await shot('07-resume');
  await page.click('#rs-notyou');
  await page.waitForTimeout(200);
  await shot('16-invalid');
  await page.fill('#rs-email', email.replace('chris+', 'chris.alvarez+'));
  await page.click('#rs-send');
  await page.waitForSelector('#rs[data-screen="sent"]', { timeout: 15000 });
  await shot('16b-sent');
  await page.goto(path);
  await page.waitForSelector('#rs[data-screen="invalid"], #rs[data-screen="home"]', { timeout: 15000 });
  console.log('old link after fresh-link:', await page.$eval('#rs', (e) => e.dataset.screen), '(expect invalid)');
}

await page.goto('/ai-summit/leak-test/resume/#nope');
await page.waitForSelector('#rs[data-screen="invalid"]', { timeout: 15000 });

const desk = await browser.newContext({ viewport: { width: 1280, height: 800 }, baseURL: BASE });
const d = await desk.newPage();
await d.goto('/ai-summit/leak-test/');
await d.waitForTimeout(400);
await d.screenshot({ path: `${OUT}/01-offer-desktop.png`, fullPage: true });
await d.goto('/ai-summit/');
await d.screenshot({ path: `${OUT}/00-hub-desktop.png` });

await browser.close();
console.log('done ->', OUT);
