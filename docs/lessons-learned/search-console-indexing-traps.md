# Search Console indexing traps: self-inflicted redirects, lost referrers, and un-removable URLs

**Status:** Shipped
**Date:** 2026-07-28

## Context
Google Search Console emailed two new "reasons preventing your pages from being indexed" for ro-bot.io: *Page with redirect* and *Not found (404)*. Pulling the actual URL lists (rather than guessing from the email) showed 10 unindexed pages, and **7 of the 10 traced to a single cause** — internal links written without trailing slashes. Fixed across the site; also found and fixed an analytics bug and an unprotected subdomain along the way.

## What Worked
- **Reading the real report before theorizing.** The email named two reasons; the drilldown named the exact URLs, and the pattern (`/terms`, `/pricing`, `/blog/...` — all non-slash) made the root cause obvious in seconds. A codebase-only diagnosis would have produced a plausible list of suspects instead of the answer.
- **The indexed-pages list was worth more than the error list.** It showed `/blog/warranty-labor-rate-reimbursement` AND `/blog/warranty-labor-rate-reimbursement/` both indexed as separate pages — proof of duplication — plus `https://app.ro-bot.io/`, which changed the subdomain fix entirely (see below).
- **Verifying against Netlify deploy previews.** A PR preview is a real production build, so the fix could be proven before merge rather than after.

## What Didn't
- **`Disallow: /` was my first instinct for the app subdomain, and it was wrong.** A disallowed URL cannot be recrawled, so Google never sees a removal signal and an already-indexed URL lingers as a URL-only listing. Caught only because the indexed-pages list showed `https://app.ro-bot.io/` was *already* in the index. Had it been un-indexed, `Disallow` would have been correct — the right control depends on current index state, which you have to look up.
- **"Page with redirect" is not fixed by making the URL stop redirecting.** `/about` → `/about/` is correct and permanent. The fix is to stop *linking* to the redirecting form. Expect Google's *Validate Fix* to report Failed for this reason even when the work is correct — judge it by whether the count drifts down, not by the badge.

## Agent Mistakes to Prevent
- **Don't diagnose a Search Console notice from the codebase alone.** The email names reasons, not URLs. Open the drilldown and read the actual list — the URL pattern usually *is* the diagnosis, and it prevents fixing a theory instead of the problem.
- **Don't reach for `robots.txt Disallow` to remove something from the index.** It blocks crawling, not indexing, and blocking *prevents* removal. Use `X-Robots-Tag: noindex` on a **crawlable** response; `Disallow` is only correct for content that was never indexed.
- **Don't assume a `sc-domain:` property covers only the marketing site.** A domain property covers **every subdomain**. An app subdomain with a catch-all returning HTTP 200 for every path is an unbounded crawl surface landing in the same property — and if it has public share routes, a privacy exposure too.
- **Don't apply `target="_blank" rel="noopener noreferrer"` to internal links.** A rehype/remark plugin named "open links in new tab" will happily match every `<a>` unless it filters on `href`. `rel="noreferrer"` strips the referrer on internal navigation, so blog → conversion-page traffic reports as **direct** in GA4 and the content that drove it gets no credit. This is silent: nothing errors, the numbers are just quietly wrong.

## Reusable Pattern
- **Name:** Match internal links to the canonical URL form the host actually serves
- **Use when:** Any static site where the generator emits directory-style URLs (`/about/index.html`) and the host 301s the bare path — Astro, Hugo, Eleventy, Jekyll on Netlify/Vercel/Cloudflare.
- **Key insight:** Canonicals and sitemap being correct is not enough. If internal links point at the non-canonical form, the crawler follows *your own links* into a redirect on every page, and the duplicate can get independently indexed.
- **Prevention:** Normalize in the markdown pipeline so content can't regress; hand-written template links need a lint or a convention. Verify with `grep` over the BUILT output, not the source.
- **Admission check:** Cross-project (any static site + Search Console) ✓. Non-obvious (the `Disallow`-can't-remove trap is counterintuitive and the referrer loss is invisible) ✓.

## References
- Code: `astro.config.mjs` (`rehypeLinkPolicy`), `netlify.toml` (redirects), `app/client/public/robots.txt`, `app/server/index.ts` (noindex middleware)
- PRs: RO-bot-landing-page#62, #63; RObot_032025#1242
- Related: [`astro-content-layer-cache.md`](astro-content-layer-cache.md) — why the plugin fix silently no-opped at first
