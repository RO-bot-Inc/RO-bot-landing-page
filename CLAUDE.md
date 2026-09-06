# TenthGear Website — Claude Code Instructions

**Owner:** Dave (CEO/founder).
**Project:** tenthgear.ai marketing website.
**Stack:** Astro (static site, zero JS by default) + Tailwind CSS + Markdown blog posts.
**Deployed on:** Netlify. (App is on Replit; data on Firebase. See `../shared/deployment.md`.)
**Your role:** Implementation partner. Dave handles strategy and positioning. You build and refine.

---

## Read this BEFORE writing user-facing copy

Before drafting or revising any user-facing copy, page, or blog post that mentions a product feature, count, mode, or workflow name, read **`../shared/product-facts.md`**. If a fact there looks wrong, **stop and ask Dave** — do not propagate stale numbers from older docs or blog posts.

(Concrete example: warranty rubric grades **6 elements**, not 7. Older docs and one blog post said "7 criteria" / "seven criteria"; those have been fixed but new copy must not regress.)

---

## Shared Knowledge (cross-subproject)

This subproject sits inside `/ro-bot/` alongside `app/` and `GTM/`. Cross-cutting facts live in `../shared/`:

- **`../shared/product-facts.md`** — feature facts, grading counts, pillar names, AI mode names. Source of truth for copy.
- **`../shared/brand.md`** — TenthGear vs RO-bot, Inc., banned words, voice & tone, formatting rules. Canonical for all website copy decisions.
- **`../shared/deployment.md`** — Netlify, Replit, Firebase, analytics IDs, accounts.
- **`../shared/lessons-learned/INDEX.md`** — cross-project engineering patterns (includes the Astro inline-script bundling lesson).

When pulling code or screenshots from `../app/`, read `../app/CLAUDE.md` first for that subproject's rules.

---

## Cardinal Rules

**RULE #1 — `../shared/product-facts.md` is the source of truth for product facts.** Never write "7 criteria," "three pillars" details, mode names, or workflow names from memory or older docs. Read the file first.

**RULE #2 — `../shared/brand.md` is the source of truth for brand & voice.** Brand-name conventions (TenthGear vs RO-bot, Inc. vs tenthgear.ai), banned words, voice/tone, formatting rules (no em/en dashes, no emojis, "AI" used sparingly) all live there.

**RULE #3 — Mobile-first.** Design for phone screens first; expand to desktop. Buyers (Fixed Ops Directors) read on phones between meetings.

**RULE #4 — Inline `<script>` tags MUST use `is:inline` if they define globals.** Astro/Vite auto-bundles inline scripts as `type="module"`, scoping `function`/`var` away from `window` and minifying identifiers. Breaks every tracking pixel/widget (GA4, GTM, Meta, Reddit, LinkedIn, Hotjar, Intercom, Segment). Symptom: `typeof window.gtag === "undefined"` in production. See `../shared/lessons-learned/INDEX.md`.

**RULE #5 — New session = new branch; commit and push when done.** First action every session: `git branch --show-current`. If on `main` or a stale branch, branch (`chore/...`, `fix/...`, `feat/...`) before editing. Open a PR; let Dave merge.

---

## Project Overview

tenthgear.ai serves buyers via two paths, both leading to one CTA: **Book a Demo.**
1. **Specific pain:** they clicked an ad/post about warranty denials, story-writing time, inspection completion. Show TenthGear solves their problem.
2. **General discovery:** they heard about TenthGear from a colleague, 20 Group, or influencer. Help them understand what it is.

**Positioning** — one-sentence: *"Turn every technician into your most productive, most profitable tech."* Category: voice-first AI platform for automotive service departments. Three-pillar value framework (canonical names + outcomes in `../shared/product-facts.md`).

**Audience** — primary buyer: Fixed Ops Director at small-to-medium dealer groups (10–20 stores), high warranty volume, $1K/store/month decision authority. Secondary buyer: Service Manager (operational champion). User (not buyer): automotive technician under 35.

---

## Technical Architecture

### Stack
- **Framework:** Astro (zero JS by default)
- **Styling:** Tailwind CSS
- **Content:** Markdown for blog posts
- **Deployment:** Netlify (with form detection enabled)
- **Forms:** Netlify Forms
- **Analytics:** Google Analytics with demo-request conversion tracking
- **Domain:** tenthgear.ai

### Site Routes
```
/                   - Homepage (primary conversion)
/about              - Founder story, mission
/blog               - Blog index (Wrench Time Reports)
/blog/[slug]        - Individual posts
/privacy, /terms    - Legal
```

### Project Structure
```
src/
├── components/   # Reusable UI
├── layouts/      # Page layouts (base, blog post)
├── pages/        # Route pages
├── content/      # Blog posts (markdown) + config.ts (frontmatter schema)
└── styles/       # Global styles, design tokens
public/
├── images/       # Product screenshots, hero images
├── icons/        # Favicon, social sharing
└── blog-assets/{N}-{slug}/  # Per-post hero images, infographics
```

---

## Design System Notes

**Reference model:** Jobber (getjobber.com). Clean, professional, spacious; outcome-first messaging; product screenshots over abstract graphics; trades-professional audience.

**Logo:** final (2026-09-03). Masters and sized exports in `../shared/brand-assets/`; the site copies from `exports/`, never hand-exports. Navbar/footer use the white mark (`badge-white.svg`); default OG is the horizontal lockup.

**Color palette:** Palette C is locked in `../shared/brand.md` (black, charcoal, greys, white, plus status red/yellow/green). The live Tailwind `navy`/`teal` theme is placeholder-grade and migrates in a separate Phase 2 pass. **Typography:** still open. Direction: clean, confident, automotive-appropriate (not cliche); clean sans-serif, readable on mobile.

**Layout principles:**
1. Mobile-first.
2. Spacious — let content breathe; white space is a feature.
3. Product-forward — real app screenshots over abstract graphics.
4. Single CTA focus — every section supports one action: Book a Demo.

(Visual avoidance list — AI Purple Problem, pastel/retro palettes, quirky illustrations, generic stock — lives in `../shared/brand.md`.)

---

## Technical Gotchas

### CSS / Tailwind
- **ID selectors starting with digits are invalid CSS** — `#3cs` won't work. Use Tailwind's `scroll-mt-28` directly on elements instead.
- **ESM config files need ESM imports** — `tailwind.config.mjs` requires `import x from 'pkg'`, not `require('pkg')`.

### Astro Build
- **`public/` files override generated pages** — if `public/privacy.html` exists, it overrides `src/pages/privacy.astro`. Delete old static files when migrating.
- **Verify build output** — `head -60 dist/page/index.html` before deploying.
- **`is:inline` on globals-defining scripts** — see RULE #4.
- **Internal hrefs and `canonicalPath` need a trailing slash** (`/about/`, never `/about`) — the bare form 301s. Markdown is normalized by `rehypeLinkPolicy`; hand-written `.astro` values are caught by `scripts/check-links.mjs`, which fails the build.
- **Markdown pipeline changes need `node_modules/.astro` cleared** (the `build` script does it) — `rm -rf .astro` is a decoy and the stale render fails silently. See `docs/lessons-learned/astro-content-layer-cache.md`.

### Netlify Deployment
- **CLI deploys can be overwritten by GitHub auto-deploy.** Always commit and push after a verified CLI deploy.
- **Form detection requires re-deploy** after enabling in dashboard.

### Debugging deploy issues
1. Check built output: `head dist/page/index.html`
2. Check live: `curl -sL https://tenthgear.ai/page | head -30`
3. Compare for mismatches.
4. Search for conflicting files: `find public -name "*.html"`

---

## Where Things Live

| Need | Where |
|---|---|
| Homepage structure, full positioning plan | `../app/docs/marketing/ro-bot-website-plan.md` |
| Marketing strategy (funnel, content calendar, LinkedIn plan) | `../app/docs/marketing/ro-bot-marketing-strategy.md` |
| Visual assets priority order (for hero, product shots, etc.) | `docs/visual-assets-priority.md` |
| Blog post end-to-end workflow | `/ro-bot-blog-post` skill |
| Blog post frontmatter schema | `src/content.config.ts` (canonical) |
| GTM context (Reddit voice, ad patterns, content briefs) | `../GTM/` |
| Ad test data appendix | `../app/docs/marketing/ro-bot-website-plan.md` (revenue framing #167 + speed contrast #150 lead) |

---

## Proven Messages (use these)

### Tier 1: proven winners
- "Shops lose work when customers don't understand repairs" (revenue/video)
- "Techs lose nearly an hour a day on paperwork" (time/productivity)
- "45 minutes typing stories. Zero minutes with TenthGear." (speed contrast)
- "Turn every technician into your most productive, most profitable tech" (platform)
- "Every RO has more revenue in it" (revenue umbrella)

### Tier 2: strong supporting
- "Find more work. Sell more work. Get paid for more work." (value framework)
- "Better stories. Zero typing." (3Cs shorthand)
- "12% of warranty claims get denied. The #1 cause is bad documentation."
- "Faster techs. Better documentation. More revenue per RO."
