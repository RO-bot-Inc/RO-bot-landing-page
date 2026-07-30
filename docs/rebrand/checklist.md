# Rebrand Cutover Checklist — RO.bot → TenthGear

Worked top to bottom on rebrand day. Cross off each item as you go. **Open one PR for the full
cutover so the deploy is atomic.**

> **Rewritten for TenthGear 2026-07-30.** The previous version of this file was written for
> **Ronin**, which is dead (Pelton clearance search, July 2026, moderate-to-high risk). Cross-workstream
> source of truth: `../../../shared/rebrand/master-plan.md`. The file inventory below was
> **re-grepped 2026-07-30** and is current as of that date — re-run §3's grep on cutover day anyway.

**Resolved values**

- **Brand / product name:** **TenthGear** — one word, title case. `10thGear` is held defensively
  (domains) but is **not** the prose form. Old forms to remove: RO.bot, RO-bot, ro-bot, RO.blog.
- **Legal entity:** **RO-bot, Inc.** — *unchanged.* The rename is product-only. Legal-entity
  references in `privacy` / `terms` **stay "RO-bot, Inc."**
- **Primary marketing domain:** **tenthgear.ai** (was ro-bot.io)
- **App domain:** **app.tenthgear.ai** (was app.ro-bot.io)
- **Redirects:** ro-bot.io/* → 301 → tenthgear.ai. Decide which held TenthGear/10thGear variants
  also 301 in.
- **Blog header label:** **TBD** (decision D3 in the master plan). The blog index is separately
  titled "Wrench Time Reports" — confirm with Dave whether that name survives.

## 🔴 Before you start: two hard blockers

Neither is in this repo, and neither is negotiable.

1. **`tenthgear.ai` is not pointed.** As of 2026-07-30 it resolves to Porkbun nameservers with **no
   A record**. There is nowhere for this deploy to land. See master-plan Workstream 3.
2. **No TenthGear visual identity exists** — no logo, no wordmark, no locked palette. Sections §4
   (visual assets) and §5 (OG/schema imagery) cannot be completed without it, and neither can the
   redesign. See master-plan Workstream 4. **This is the critical path.**

A copy-only sweep (§1–3, §6) *can* run ahead of both and deploy to the existing domain. Doing so
splits the "atomic deploy" into two. That's a legitimate choice, just make it deliberately.

---

## 1. Brand source of truth (do this first)

- [ ] **`../../../shared/brand.md`** — replace the names table with the TenthGear conventions.
      Remove the pre-cutover framing. Add the old RO.bot forms to the banned-words list going forward.
- [ ] **`../../../shared/product-facts.md`** — search for product references that name the brand
      directly. **Do not touch the customer definition** (dealership service departments ONLY); it's
      already correct and it's load-bearing in the trademark filing.

After these two land, the rest of the checklist references the new names from these files.

## 2. Astro config + package metadata

- [ ] **`../../astro.config.mjs:47`** — `site: 'https://ro-bot.io'` → `'https://tenthgear.ai'`.
      The sitemap is generated from this value.
- [ ] **`../../public/manifest.json`** — `"name": "RO-bot"` → `"TenthGear"`. Also `theme_color`
      (`#2A9D8F`) and `background_color` (`#F4F4F9`), which are current-brand colors and will change
      with the new palette.
      ⚠️ **Pre-existing bug to fix while you're in here:** the manifest points at `Android.png` and
      `iPhone.png` at the web root, but those files live in `public/RObot logos/`. Only `browser.png`
      resolves. Fix the paths during the icon regeneration.
- [ ] **`../../package.json`** — currently has **no** brand references (verified 2026-07-30). Check
      `name` / `homepage` / `repository` anyway if the repo gets renamed.

## 3. Site-wide copy

Grep-driven sweep. Review every match before replacing.

```bash
# Run from /ro-bot/website/
grep -rn "ro-bot\.io\|RO\.bot\|RO-bot\|RO\.blog\|ro\.bot" --include="*.astro" --include="*.md" --include="*.mjs" --include="*.ts" --include="*.json" --include="*.html" --include="*.js" src/ public/ astro.config.mjs package.json
```

**Inventory re-grepped 2026-07-30 — 37 files.**

**Layouts:**
- [ ] `src/layouts/BaseLayout.astro`
- [ ] `src/layouts/BlogPost.astro`

**Components** (all 9 hit):
- [ ] `src/components/Navbar.astro` (logo + link)
- [ ] `src/components/Footer.astro` (copyright + links)
- [ ] `src/components/Hero.astro`
- [ ] `src/components/Solution.astro`
- [ ] `src/components/HowItWorks.astro`
- [ ] `src/components/Proof.astro`
- [ ] `src/components/Testimonial.astro`
- [ ] `src/components/FAQ.astro`
- [ ] `src/components/CTA.astro`

**Pages** (11 hit — note `src/pages/index.astro` is included):
- [ ] `src/pages/index.astro`
- [ ] `src/pages/about.astro`
- [ ] `src/pages/product.astro`
- [ ] `src/pages/pricing.astro`
- [ ] `src/pages/book-demo.astro`
- [ ] `src/pages/support.astro`
- [ ] `src/pages/thank-you.astro`
- [ ] `src/pages/privacy.astro` ← entity references stay "RO-bot, Inc."
- [ ] `src/pages/privacy-extension.astro` ← same
- [ ] `src/pages/terms.astro` ← same
- [ ] `src/pages/blog/index.astro`

**Blog posts — 14 of 16 have brand hits.** Body copy, internal links, brand mentions:
- [ ] `src/content/blog/ai-powered-diagnostics.md`
- [ ] `src/content/blog/effective-labor-rate.md`
- [ ] `src/content/blog/from-skeptics-to-believers-beta-feedback.md`
- [ ] `src/content/blog/mpi-completion-rate-revenue.md`
- [ ] `src/content/blog/recover-declined-service-work.md` ← *new since the Ronin list*
- [ ] `src/content/blog/reduce-warranty-claim-denials.md`
- [ ] `src/content/blog/roi-digital-repair.md`
- [ ] `src/content/blog/voice-technology-service-bay.md`
- [ ] `src/content/blog/warranty-audit-playbook.md`
- [ ] `src/content/blog/warranty-diagnostic-time.md` ← *new since the Ronin list*
- [ ] `src/content/blog/warranty-labor-rate-reimbursement.md` ← *new since the Ronin list*
- [ ] `src/content/blog/what-customers-want-inspection-videos.md`
- [ ] `src/content/blog/what-technician-conversations-taught-us.md`
- [ ] `src/content/blog/why-auto-techs-hate-paperwork.md`

*No brand hits, no action needed:* `increase-revenue-per-repair-order.md`,
`automotive-technician-retention.md`. (Both were on the Ronin checklist; they no longer match.)

**Distribution docs — 5 now, was 2.** Already-drafted promo copy needs the new brand voice + handles:
- [ ] `docs/distribution/automotive-technician-retention.md`
- [ ] `docs/distribution/effective-labor-rate.md`
- [ ] `docs/distribution/recover-declined-service-work.md`
- [ ] `docs/distribution/warranty-diagnostic-time.md`
- [ ] `docs/distribution/warranty-labor-rate-reimbursement.md`

## 4. Visual assets  🔴 blocked on master-plan Workstream 4

- [ ] **Favicon** — `public/favicon.ico`. *(Note: there is no `favicon.svg` despite what the Ronin
      checklist claimed. Consider adding one during regeneration.)*
- [ ] **`public/browser.png`** + **`public/browser.svg`** — used as the `BlogPosting` publisher logo
      in `src/layouts/BlogPost.astro` and allowlisted for Googlebot in `robots.txt`.
- [ ] **`public/apple-touch-icon.png`**
- [ ] **`public/RObot logos/`** — `Android.png`, `iPhone.png`, `head only.png`,
      `generated-icon.png`. The folder name itself is brand-stale; rename it and update every
      reference (see the manifest bug in §2).
- [ ] **`public/Color logo - no background.svg`**
- [ ] **Per-blog OG images** in `public/blog-assets/{N}-{slug}/` — only swap the ones with brand
      chrome (logo overlay). Hero photos without brand chrome stay.
- [ ] **About-page founder photo / brand imagery** — review for logo treatments.
- [ ] Validate the new mark at **16–32px** before committing to it (favicon, tab, app icon).

## 5. Schema.org / SEO metadata

- [ ] **`src/layouts/BlogPost.astro`** — `publisher.name` in the `BlogPosting` schema (currently
      "RO.bot"); `publisher.logo.url` (currently `https://ro-bot.io/browser.png`); the author
      `Person.name` if the byline changes.
- [ ] **`src/layouts/BaseLayout.astro`** — Organization schema, social profile links (which will
      point at the new handles — see `shared/rebrand/social-handles.md`).
- [ ] **Open Graph meta tags** — site name, default OG image URL.
- [ ] **`public/robots.txt`** — `Sitemap: https://ro-bot.io/sitemap-index.xml` → new domain. Also
      the Googlebot `Allow:` lines for `/favicon.ico` and `/browser.png` if those filenames change.
- [ ] **Sitemap** auto-regenerates from `astro.config.mjs` `site` — verify after deploy.

## 6. CLAUDE.md files (project rules)

- [ ] **`../../../CLAUDE.md`** (workspace root)
- [ ] **`../CLAUDE.md`** (website root) — brand mentions + any cardinal rule naming RO.bot
- [ ] **`../../../app/CLAUDE.md`**, **`../../../GTM/CLAUDE.md`** — separate repos. Coordinate on
      rebrand day so all four update together.

## 7. External services and infrastructure (not in this repo)

Tracked in `../../../shared/rebrand/master-plan.md` Workstream 3 — that's the source of truth.
Listed here so the cutover-day operator sees the whole surface:

- [ ] **DNS** — point `tenthgear.ai` at Netlify. 🔴 *Not done. No A record exists.*
- [ ] **Netlify** — site name, env vars, 301s from `ro-bot.io/*`.
- [ ] **GA4** — new or renamed property; update the measurement ID if it changes.
- [ ] **Google Search Console** — verify the new domain, submit the sitemap, request indexing.
- [ ] **Email** — sender names / reply-to for Netlify Forms.
- [ ] **Social handles** — see `../../../shared/rebrand/social-handles.md`. 🔴 *No TenthGear handle
      has been claimed or even checked.* Backfill schedule in `existing-posts-promotion-plan.md`.
- [ ] **GitHub repo** — rename `RO-bot-Inc/RO-bot-landing-page` if the org/repo name changes; update
      links in docs.
- [ ] **App + GTM repos** — same sweep needed. The app has 🔴 login/API breakers that must land in
      one window; runbook in master-plan Workstream 5.

## 8. Verification (post-deploy)

- [ ] **`curl -sL https://tenthgear.ai/ | head -30`** — new brand renders, no stale references.
- [ ] **Build search:** `grep -rn "ro-bot\.io\|RO\.bot\|RO-bot\|RO\.blog" dist/` returns nothing.
- [ ] **Sitemap** renders at `/sitemap-index.xml` with the new domain.
- [ ] **301s resolve** — spot-check a few deep `ro-bot.io` URLs, not just the homepage.
- [ ] **Blog post links** still work (no broken internal links after the edits).
- [ ] **Open Graph preview** — paste the homepage into the
      [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and
      [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).
- [ ] **Astro content-layer cache** — if edited markdown doesn't show up in the build, clear it.
      See `docs/lessons-learned/` (stale-markdown lesson).

## 9. Memory + skill updates

- [ ] **`/ro-bot-blog-post` skill** at `~/.claude/skills/ro-bot-blog-post/SKILL.md` — brand mentions
      in the workflow doc.
- [ ] **Sync skills** via the `sync-skills` skill so brand references propagate.
- [ ] **Claude memory** — update any rebrand-status entries once the cutover completes.
