// Live six-photo test for the Future Headline experience.
//
// Drives the real page against a local `netlify dev` server running in live
// mode, saves each finished front page, and prints timing plus whether the
// result was degraded (bank story or untransformed photo).
//
//   node scripts/future-headline-live-test.mjs <photos-dir> [out-dir] [base-url]
//
// Needs Playwright, which lives in the app repo: run with
//   NODE_PATH=../app/node_modules node scripts/future-headline-live-test.mjs ...
// Each run spends real money (about $0.10 to $0.15 per photo).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const [photosDir, outDir = 'tmp/future-headline-live', base = 'http://localhost:8899'] = process.argv.slice(2);
if (!photosDir) {
  console.error('usage: future-headline-live-test.mjs <photos-dir> [out-dir] [base-url]');
  process.exit(1);
}

const CUSTOM = [
  'Warranty claims will get paid the first time, every time.',
  'Every tech will have an AI assistant in the bay.',
  'Parts will order themselves before the tech asks.',
];

const photos = fs.readdirSync(photosDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
fs.mkdirSync(outDir, { recursive: true });

const mode = (await (await fetch(`${base}/api/future-headline`)).json()).mode;
console.log(`server mode: ${mode}`);
if (mode !== 'live') console.warn('WARNING: not live. Keys missing or FH_MODE=mock.');

const browser = await chromium.launch();
let i = 0;
for (const photo of photos) {
  // Fresh context per photo so the 3-per-session cap never interferes.
  const ctx = await browser.newContext({ ...devices['iPhone 14'], acceptDownloads: true });
  const page = await ctx.newPage();
  await page.route(/googletagmanager/, (r) => r.abort());
  let degraded = null;
  page.on('response', async (res) => {
    if (res.url().endsWith('/api/future-headline') && res.request().method() === 'POST' && res.ok()) {
      degraded = (await res.json()).degraded;
    }
  });
  await page.goto(`${base}/ai-summit/future-headline/`);
  await page.setInputFiles('#fh-file', path.join(photosDir, photo));
  await page.waitForSelector('[data-name="compose"]:not([hidden])');
  const custom = i % 2 === 1;
  if (custom) await page.fill('#fh-own', CUSTOM[(i >> 1) % CUSTOM.length]);
  else await page.locator('.chip').nth(i % 6).click();

  const started = Date.now();
  await page.click('[data-action="generate"]');
  await page.waitForSelector('[data-name="result"]:not([hidden]), #fh-fail:not([hidden])', { timeout: 100_000 });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  if (await page.locator('[data-name="result"]:not([hidden])').count()) {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#fh-download')]);
    const name = `${String(i + 1).padStart(2, '0')}-${path.parse(photo).name}.png`;
    await dl.saveAs(path.join(outDir, name));
    console.log(`${name}  ${seconds}s  ${custom ? 'custom' : 'preset'}  degraded=${degraded}`);
    console.log(`   ${await page.getAttribute('#fh-result', 'alt')}`);
  } else {
    console.log(`${photo}  FAILED after ${seconds}s: ${await page.textContent('#fh-fail-msg')}`);
  }
  await ctx.close();
  i++;
}
await browser.close();
