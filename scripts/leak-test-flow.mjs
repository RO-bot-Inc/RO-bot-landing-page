// Drives the RO Leak Test end to end against a running server and saves a
// screenshot of every storyboard frame it reaches: phone path, private
// workspace (mock uploads), booking, and Dave's file page. Playwright is
// borrowed from the app repo next door.
//
//   npm run build
//   LT_MODE=mock npx -y netlify-cli dev --offline --framework '#static' --dir dist --port 8899 > tmp/netlify-dev.log 2>&1 &
//   SERVER_LOG=tmp/netlify-dev.log node scripts/leak-test-flow.mjs
//
// BASE        server to test (default http://localhost:8899)
// OUT         screenshot folder (default tmp/leak-test-shots)
// SERVER_LOG  netlify dev log; the emailed links are read from it in log mode
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
const cfg = await (await fetch(`${BASE}/api/leak-test`)).json();
console.log('config:', JSON.stringify(cfg.mode));
// The fake addresses below must never reach Resend. With keys in .env,
// start the server as `LT_MODE=mock netlify dev ...` for this script.
if (cfg.mode.email !== 'log') {
  console.error('Server is in live email mode; refusing to enroll test addresses. Restart it with LT_MODE=mock.');
  process.exit(2);
}

const lastLink = (re) => {
  if (!LOG) return '';
  const m = [...readFileSync(LOG, 'utf8').matchAll(re)];
  return m.length ? m[m.length - 1][0] : '';
};
const pathOf = (url) => url.replace(/^https?:\/\/[^/]+/, '');

const browser = await chromium.launch();
const phone = await browser.newContext({ ...devices['iPhone 14'], baseURL: BASE });
const page = await phone.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
const shot = (name, opts = {}) => page.screenshot({ path: `${OUT}/${name}.png`, ...opts });
const stamp = Date.now().toString(36);
const email = `chris+${stamp}@alvarezauto.com`;

// ---------------------------------------------------------------- phone path
await page.goto('/ai-summit/?utm_source=direct&utm_medium=vanity_url&utm_campaign=aas_2026');
await page.waitForTimeout(400);
await shot('00-hub');
await page.goto('/ai-summit/leak-test/?utm_source=print&utm_medium=qr&utm_campaign=aas_2026&utm_content=diagnostic_card_v1');
await page.waitForTimeout(500);
await shot('01-offer');
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
await page.click('#lt-submit');
await page.waitForSelector('#lt[data-screen="enrolled"]', { timeout: 30000 });
await page.waitForTimeout(300);
await shot('04-enrolled');
console.log('enrolled:', await page.$eval('[data-name="enrolled"] .p', (e) => e.textContent));

// ------------------------------------------------------------- workspace
const link = lastLink(/https?:\/\/\S+\/ai-summit\/leak-test\/resume\/#[A-Za-z0-9_-]+/g);
console.log('resume link:', link ? link.replace(/#.*/, '#<token>') : '(none in log)');
if (!link) {
  await browser.close();
  process.exit(1);
}
// Laptop for the workspace, as in the storyboard.
const desk = await browser.newContext({ viewport: { width: 1280, height: 900 }, baseURL: BASE });
const d = await desk.newPage();
d.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
const dshot = (name, opts = {}) => d.screenshot({ path: `${OUT}/${name}.png`, ...opts });

await d.goto(pathOf(link));
await d.waitForSelector('#rs[data-screen="home"]', { timeout: 15000 });
console.log('address bar after load:', d.url());
await dshot('07-resume');

await d.click('#rs-materials-btn');
await d.waitForSelector('#rs[data-screen="materials"]');
await dshot('08-materials-empty', { fullPage: true });

const files = [
  { name: 'March ROs combined.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(48 * 1024, 1) },
  { name: 'Estimates export.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.alloc(12 * 1024, 2) },
  { name: 'ros-backup.zip', mimeType: 'application/zip', buffer: Buffer.alloc(1024, 3) },
];
await d.setInputFiles('#rs-file', files);
await d.waitForTimeout(400);
await dshot('09-uploading', { fullPage: true });
await d.waitForFunction(() => document.querySelectorAll('#rs-files .check').length === 2, null, { timeout: 20000 });
console.log('rows:', await d.$$eval('#rs-files li', (ls) => ls.map((l) => `${l.querySelector('.n').textContent} | ${l.querySelector('.s').textContent.trim()}`)));

await d.fill('#rs-links input', 'https://app.mykaarma.com/v/8d2f');
await d.click('#rs-add-link');
await d.fill('#rs-links .link-row:nth-child(2) input', 'xtime.com/inspection/abc');
await d.fill('#rs-notes', 'The combined PDF is all of March for the Chevy store. Video is from Xtime.');
await d.waitForFunction(() => document.getElementById('rs-saved').textContent.startsWith('Saved'), null, { timeout: 10000 });
await dshot('10-materials-filled', { fullPage: true });

await d.click('#rs-done');
await d.waitForSelector('#rs-confirm:not([hidden])');
console.log('confirm:', await d.$eval('#rs-confirm-text', (e) => e.textContent));
await dshot('11-confirm');
await d.click('#rs-confirm-yes');
await d.waitForSelector('#rs[data-screen="home"]', { timeout: 15000 });
await d.waitForTimeout(200);
console.log('banner (materials only):', await d.$eval('#rs-banner', (e) => e.textContent));
await dshot('14-materials-only');

// Booking: open the embed, then simulate the message Calendly posts on a booking.
await d.click('#rs-booking-btn');
await d.waitForSelector('#rs[data-screen="book"]');
await d.waitForTimeout(3500);
await dshot('12-booking');
await d.evaluate(() => {
  window.dispatchEvent(
    new MessageEvent('message', {
      origin: 'https://calendly.com',
      data: {
        event: 'calendly.event_scheduled',
        payload: { event: { uri: 'https://api.calendly.com/scheduled_events/TEST12345' }, invitee: { uri: 'https://api.calendly.com/scheduled_events/TEST12345/invitees/INV1' } },
      },
    }),
  );
});
await d.waitForSelector('#rs[data-screen="home"]', { timeout: 15000 });
await d.waitForTimeout(200);
console.log('banner (both):', await d.$eval('#rs-banner', (e) => e.textContent));
await dshot('15-both-complete');

// Reload keeps the state (session storage).
await d.reload();
await d.waitForSelector('#rs[data-screen="home"]', { timeout: 15000 });
console.log('pills after reload:', await d.$$eval('.pill', (ps) => ps.map((p) => p.textContent)));

// Dave's file page, from the notification email in the log.
const admin = lastLink(/https?:\/\/\S+\/ai-summit\/leak-test\/admin\/#[A-Za-z0-9_.-]+/g);
console.log('admin link:', admin ? 'found' : '(none in log)');
if (admin) {
  await d.goto(pathOf(admin));
  await d.waitForSelector('#ad[data-screen="home"]', { timeout: 15000 });
  await dshot('17-admin', { fullPage: true });
  console.log('admin status:', await d.$eval('#ad-status', (e) => e.textContent));
}

// Recovery screens on the phone.
await page.goto(pathOf(link));
await page.waitForSelector('#rs[data-screen="home"]', { timeout: 15000 });
await page.click('#rs-notyou');
await page.waitForTimeout(200);
await shot('16-invalid');
await page.fill('#rs-email', email);
await page.click('#rs-send');
await page.waitForSelector('#rs[data-screen="sent"]', { timeout: 15000 });
await page.goto(pathOf(link));
await page.waitForSelector('#rs[data-screen="invalid"], #rs[data-screen="home"]', { timeout: 15000 });
console.log('old link after fresh-link:', await page.$eval('#rs', (e) => e.dataset.screen), '(expect invalid)');

await browser.close();
console.log('done ->', OUT);
