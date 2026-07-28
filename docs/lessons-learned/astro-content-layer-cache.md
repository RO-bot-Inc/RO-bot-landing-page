# Astro's content-layer cache silently serves stale markdown after a pipeline change

**Status:** Shipped
**Date:** 2026-07-28

## Context
Google Search Console flagged 10 unindexed pages on ro-bot.io. Seven traced to internal links missing trailing slashes: Astro serves directory-format pages at `/about/`, Netlify 301s `/about` → `/about/`, so Googlebot followed every internal link into a redirect. Rather than hand-edit 68 links across 16 blog posts, the fix normalized internal hrefs inside the existing rehype plugin in `astro.config.mjs` — one change that also covers every future post.

The plugin change appeared to do nothing. The build succeeded, reported the right page count, and rewrote every file in `dist/` — but the blog-post HTML still carried the old non-slash links and the old `target="_blank"`.

## What Worked
- A filesystem side-effect probe (`appendFileSync` inside the plugin's `visit` callback) proved the plugin never executed at all. That reframed the problem from "my logic is wrong" to "my code is not running," which is a much faster thing to chase.
- Grepping the built HTML for a distinctive source string (`why we started RO.bot`) located the actual cache file: `node_modules/.astro/data-store.json`.
- Verifying against the Netlify **deploy preview** rather than only a local build. That is a real production build on the host that would actually have hit the cache.

## What Didn't
- `rm -rf .astro` looks like it clears the content-layer cache. It does not. Astro's `cacheDir` defaults to `node_modules/.astro`, so the project-root `.astro/` directory is a decoy — clearing it and rebuilding still served cached HTML, which wasted a full diagnostic cycle and briefly made the config edit look wrong.
- `dist/` timestamps updated on every build, which made it look like pages were being re-rendered. Astro was rewriting the page shells around *cached* markdown; only the markdown pipeline was skipped.
- `console.log` from inside `astro.config.mjs` does not surface in build output. The obvious instrumentation returned a false "no signal" instead of an answer.

## Agent Mistakes to Prevent
- **Don't trust a fresh `dist/` as proof that a markdown pipeline change took effect.** Astro's content layer caches *rendered* markdown. Changing `markdown.remarkPlugins` / `rehypePlugins` does not invalidate it — a plugin is a function, and Astro does not hash it into the cache key. The build is green, the page count is right, timestamps update, and the HTML is stale.
- **Don't clear `.astro/` and assume the cache is gone.** Clear `node_modules/.astro` (`cacheDir`). Both directories exist; only one matters.
- **Don't use `console.log` inside `astro.config.mjs` to test whether a plugin ran.** Use a filesystem write — `appendFileSync` to a scratch path is unambiguous.
- **Don't ship a markdown-pipeline change without clearing the cache in the build command.** Netlify caches `node_modules` between builds, so clearing it locally proves nothing about production. The failure mode is silent: green deploy, unchanged HTML, and a fix that looks shipped but isn't.

## Reusable Pattern
- **Name:** Clear `node_modules/.astro` in the build command when the markdown pipeline can change
- **Use when:** Any Astro project using content collections whose `remarkPlugins` / `rehypePlugins` are under active development, deployed on a host that caches `node_modules` (Netlify, Vercel, most CI).
- **Key insight:** The content-layer cache keys on the *content*, not on the pipeline that renders it. Editing the pipeline is invisible to the cache, so the cache confidently serves output produced by code that no longer exists.
- **Trade-off:** Losing incremental content caching costs nothing here — ro-bot.io builds in ~1s. On a large content site, prefer a deliberate cache-bust tied to pipeline changes over always clearing.
- **Admission check:** Cross-project (any Astro content-collection site) ✓. Non-obvious (the decoy `.astro/` directory actively misleads, and the failure is silent rather than an error) ✓.

## References
- Code: `astro.config.mjs` (`rehypeLinkPolicy`), `package.json` (`build` script)
- PR: RO-bot-Inc/RO-bot-landing-page#62
- Related: [`astro-inline-script-bundling.md`](astro-inline-script-bundling.md) — the other Astro-silently-transforms-your-code failure on this site
