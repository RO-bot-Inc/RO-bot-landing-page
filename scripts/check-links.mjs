// Post-build guard: fails the build when the emitted HTML disagrees with the
// URL form Netlify actually serves (directory pages at `/path/`).
//
// Two checks, one per Search Console incident:
//   1. <link rel="canonical"> must equal the page's own served URL
//      (2026-09-06: /pricing and /product declared a slash-less canonical that 301'd).
//   2. Internal hrefs to extension-less paths must end in "/"
//      (2026-07-28: 7 of 10 unindexed pages traced to slash-less internal links).
// See docs/lessons-learned/search-console-indexing-traps.md.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SITE = 'https://tenthgear.ai';
const DIST = new URL('../dist/', import.meta.url).pathname;

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* htmlFiles(p);
    else if (name.endsWith('.html')) yield p;
  }
}

const hasExtension = (path) => /\.[a-z0-9]{1,5}$/i.test(path.split(/[?#]/)[0]);
const problems = [];

for (const file of htmlFiles(DIST)) {
  const rel = relative(DIST, file);
  if (!rel.endsWith('index.html')) continue; // 404.html etc. have no canonical form
  const served = `${SITE}/${rel.slice(0, -'index.html'.length)}`;
  const html = readFileSync(file, 'utf8');

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (canonical && canonical !== served) {
    problems.push(`${rel}: canonical ${canonical} != served ${served}`);
  }

  for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="(\/[^"]*)"/g)) {
    const path = href.split(/[?#]/)[0];
    if (path === '/' || hasExtension(path) || path.endsWith('/')) continue;
    problems.push(`${rel}: internal href "${href}" lacks trailing slash`);
  }
}

if (problems.length) {
  console.error(`check-links: ${problems.length} problem(s)\n  ` + problems.join('\n  '));
  process.exit(1);
}
console.log('check-links: OK');
