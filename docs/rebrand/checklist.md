# Rebrand Cutover Checklist

Worked top to bottom on rebrand day. Cross off each item as you go. Open one PR for the full cutover so the deploy is atomic.

**Definitions**
- `{NEW_NAME}` — the new product/brand name (e.g., "RO.bot" today)
- `{NEW_LEGAL}` — new legal entity (e.g., "RO-bot Inc." today)
- `{NEW_DOMAIN}` — new primary domain (e.g., "ro-bot.io" today)
- `{NEW_BLOG_HEADER}` — new blog header label (e.g., "RO.blog" today)

---

## 1. Brand source of truth (do this first)

- [ ] **`../../../shared/brand.md`** — replace the names table with the new conventions. Remove the "Rebrand pending" flag at the top once the cutover starts. Update banned-words list if any old-brand forms should be banned going forward.
- [ ] **`../../../shared/product-facts.md`** — search for any product references that name the brand directly.

After these two land, the rest of the checklist references the new names from these files.

## 2. Astro config + package metadata

- [ ] **`../../astro.config.mjs`** — update `site: 'https://{NEW_DOMAIN}'`.
- [ ] **`../../package.json`** — update `name`, `homepage`, `repository` URL if applicable.
- [ ] **`../../public/manifest.json`** — update `name`, `short_name`, `description`, icon paths, theme/background colors if changing.

## 3. Site-wide copy

Grep-driven sweep. Search both lowercase and uppercase variants.

```bash
# Run from /ro-bot/website/ — review every match before replacing.
grep -rn "ro-bot\.io\|RO\.bot\|RO-bot\|RO\.blog\|ro\.bot" --include="*.astro" --include="*.md" --include="*.mjs" --include="*.ts" --include="*.json" --include="*.html" --include="*.js" src/ public/ astro.config.mjs package.json
```

Known files (as of 2026-05-17 — re-run grep on the day to catch new additions):

**Layouts:**
- [ ] `src/layouts/BaseLayout.astro`
- [ ] `src/layouts/BlogPost.astro`

**Components:**
- [ ] `src/components/Navbar.astro` (logo + link)
- [ ] `src/components/Footer.astro` (copyright + links)
- [ ] `src/components/Hero.astro`
- [ ] `src/components/Solution.astro`
- [ ] `src/components/HowItWorks.astro`
- [ ] `src/components/Proof.astro`
- [ ] `src/components/Testimonial.astro`
- [ ] `src/components/FAQ.astro`
- [ ] `src/components/CTA.astro`

**Pages:**
- [ ] `src/pages/index.astro`
- [ ] `src/pages/about.astro`
- [ ] `src/pages/product.astro`
- [ ] `src/pages/pricing.astro`
- [ ] `src/pages/book-demo.astro`
- [ ] `src/pages/support.astro`
- [ ] `src/pages/thank-you.astro`
- [ ] `src/pages/privacy.astro`
- [ ] `src/pages/privacy-extension.astro`
- [ ] `src/pages/terms.astro`
- [ ] `src/pages/blog/index.astro`

**Blog posts (body copy + internal links + brand mentions):**
- [ ] `src/content/blog/voice-technology-service-bay.md`
- [ ] `src/content/blog/roi-digital-repair.md`
- [ ] `src/content/blog/ai-powered-diagnostics.md`
- [ ] `src/content/blog/why-auto-techs-hate-paperwork.md`
- [ ] `src/content/blog/from-skeptics-to-believers-beta-feedback.md`
- [ ] `src/content/blog/what-technician-conversations-taught-us.md`
- [ ] `src/content/blog/increase-revenue-per-repair-order.md`
- [ ] `src/content/blog/what-customers-want-inspection-videos.md`
- [ ] `src/content/blog/mpi-completion-rate-revenue.md`
- [ ] `src/content/blog/reduce-warranty-claim-denials.md`
- [ ] `src/content/blog/warranty-audit-playbook.md`
- [ ] `src/content/blog/automotive-technician-retention.md`
- [ ] `src/content/blog/effective-labor-rate.md`

**Distribution docs (already-drafted promo copy needs updated brand voice + handles):**
- [ ] `docs/distribution/automotive-technician-retention.md`
- [ ] `docs/distribution/effective-labor-rate.md`

## 4. Visual assets

- [ ] **Favicon** at `public/favicon.svg` / `.ico` — regenerate from new logo.
- [ ] **Browser/social default OG image** at `public/browser.png` (referenced in `src/layouts/BlogPost.astro` as the BlogPosting publisher logo) — swap for new brand.
- [ ] **Apple touch icons** — check `public/` for `apple-touch-icon*.png`.
- [ ] **Per-blog OG images** in `public/blog-assets/{N}-{slug}/` — only swap if they include brand chrome (logo overlay). Hero photos without brand chrome stay.
- [ ] **About-page founder photo / brand imagery** — review and update if any include logo treatments.

## 5. Schema.org / SEO metadata

- [ ] **`src/layouts/BlogPost.astro`** — `publisher.name` in the `BlogPosting` schema (currently "RO.bot"); `publisher.logo.url` (currently `https://ro-bot.io/browser.png`); the author `Person.name` if you're rebranding the byline.
- [ ] **`src/layouts/BaseLayout.astro`** — any Organization schema, social profile links.
- [ ] **Open Graph meta tags** — site name, default OG image URL.
- [ ] **Sitemap** auto-regenerates from `astro.config.mjs` `site` value — verify after deploy.
- [ ] **`robots.txt`** if present — update sitemap URL.

## 6. CLAUDE.md files (project rules)

- [ ] **`../../../CLAUDE.md`** (workspace root) — update any brand name mentions.
- [ ] **`../CLAUDE.md`** (website root) — update brand mentions, cardinal rules referencing RO.bot specifically.
- [ ] **`../../../app/CLAUDE.md`**, **`../../../GTM/CLAUDE.md`** — these are separate repos. Coordinate on rebrand day so all four CLAUDE.mds update together.

## 7. External services and infrastructure (not in this repo)

These live outside the website repo but need updating on rebrand day for the cutover to be complete.

- [ ] **DNS / domain** — `{NEW_DOMAIN}` purchased, registered, and pointed at Netlify.
- [ ] **Netlify** — new site name (if changing), updated env vars, 301 redirects from `ro-bot.io/*` to `{NEW_DOMAIN}/*` if the old domain stays parked.
- [ ] **Google Analytics / GA4** — new property or rename existing; update measurement ID in code if it changes.
- [ ] **Google Search Console** — verify new domain, request indexing of new URLs, set up redirects.
- [ ] **Email** — update sender names and reply-to addresses for Netlify Forms / any transactional email.
- [ ] **Social handles** — create new LinkedIn / Instagram / Facebook / Twitter handles under `{NEW_NAME}`. See `existing-posts-promotion-plan.md` for the backfill schedule.
- [ ] **GitHub repos** — rename `RO-bot-Inc/RO-bot-landing-page` if the org/repo name should change. Update any links in docs.
- [ ] **App / GTM repos** — same rebrand sweep needed in `../../../app/` and `../../../GTM/`. Coordinate timing.
- [ ] **Customer-facing emails / templates** in the app — out of scope for website, but flag to the app rebrand work.

## 8. Verification (post-deploy)

- [ ] **`curl -sL https://{NEW_DOMAIN}/ | head -30`** — confirm new brand renders, no stale references.
- [ ] **Build search**: `grep -rn "ro-bot\.io\|RO\.bot\|RO-bot\|RO\.blog" dist/` returns nothing.
- [ ] **Sitemap renders at `/sitemap-index.xml`** with the new domain.
- [ ] **Blog post links** still work (no broken internal links after edits).
- [ ] **Open Graph preview** — paste the homepage URL into the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) to verify OG image and metadata.

## 9. Memory + skill updates

- [ ] **Memory:** delete or update `project_rebrand.md` in the user's memory folder once the rebrand is complete.
- [ ] **`/ro-bot-blog-post` skill** at `~/.claude/skills/ro-bot-blog-post/SKILL.md` — update any brand name mentions in the workflow doc.
- [ ] **Sync skills:** if any user-level skills have brand references, sync via the `sync-skills` skill so they propagate.
