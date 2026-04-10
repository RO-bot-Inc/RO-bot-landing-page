# RO.bot Website Development Context for Claude Code

**Last Updated:** March 29, 2026
**CEO/Founder:** Dave
**Project:** ro-bot.io marketing website redesign

---

## Brand Name

The product brand name is **RO.bot** (with a period, no hyphen). Use "RO.bot" in all user-facing copy.

- **Brand/product name:** RO.bot
- **Legal entity:** RO-bot Inc.
- **Domain:** ro-bot.io
- **Blog header:** RO.blog

Do not use "R.O. bot", "R.O.bot", "RO-bot", or "Ro-bot" in site copy.

---

## Quick Start

This is the marketing website for RO.bot, an AI-powered platform for automotive service departments. The website's job is to convert Fixed Ops Directors and Service Managers into demo requests.

**Before diving in, Dave will tell you:**
- What page or section we're working on
- Any recent feedback from prospects or team
- Specific constraints for this session

**Your role:** Implementation partner. Dave handles strategy and positioning. You build and refine.

---

## Part 1: Project Overview

### What This Site Does

ro-bot.io is a marketing site that serves buyers arriving through two paths:

1. **Specific pain:** They clicked an ad or blog post about a specific problem (warranty denials, story writing time, inspection completion rates). They need to see that RO.bot solves their problem.
2. **General discovery:** They heard about RO.bot from a colleague, a 20 Group meeting, or an influencer. They need to understand what RO.bot is.

Both paths lead to one conversion goal: **Book a Demo.**

### Positioning

**One-sentence:** Turn every technician into your most productive, most profitable tech.

**Category:** Voice-first AI platform for automotive service departments.

**Value framework:** Voice-first AI tools that help your techs find more work, sell more work, and get paid for more work.

| Pillar | Workflow | Buyer Value | Tech Value |
|--------|----------|-------------|------------|
| Find More Work | Voice-first MPI | Higher completion rates, more opportunities discovered | Faster inspections, no clipboard |
| Sell More Work | AI-guided Video Inspections | Higher approval rates on customer-pay work | Guided process, no guessing what to say |
| Get Paid for More Work | AI-powered 3Cs | Fewer warranty denials, better customer-pay stories | Zero typing, instant stories, more wrench time |

### Target Audience

**Primary buyer:** Fixed Ops Director at a small-to-medium dealer group (10-20 stores)
- High warranty volume, above-average denial rates (15%+)
- Concerned about warranty audits
- Technician retention challenges
- Forward-thinking about technology
- Decision-making authority under $1K/month per store

**Secondary buyer:** Service Manager
- Operational focus: tech productivity and daily workflow
- Often the champion who brings RO.bot to the Fixed Ops Director

**The user (not the buyer):** Automotive technician
- Under 35, tech-comfortable
- Motivated by earning more money, spending less time on screens

---

## Part 2: Technical Architecture

### Stack

- **Framework:** Astro (static site generator, zero JS by default)
- **Styling:** Tailwind CSS
- **Content:** Markdown files for blog posts
- **Deployment:** TBD (Vercel, Netlify, or Cloudflare Pages)
- **Analytics:** Google Analytics with demo-request conversion tracking
- **Form handling:** TBD (Formspree, Netlify Forms, or custom endpoint)
- **Domain:** ro-bot.io

### Site Structure

```
/                   - Homepage (primary conversion page)
/about              - About page (founder story, mission, team)
/blog               - Blog index (Wrench Time Reports)
/blog/[slug]        - Individual blog posts (markdown-driven)
/privacy            - Privacy policy
/terms              - Terms of service
```

### Project Structure

```
/
├── src/
│   ├── components/     # Reusable UI components
│   ├── layouts/        # Page layouts (base, blog post)
│   ├── pages/          # Route pages
│   ├── content/        # Blog posts (markdown)
│   └── styles/         # Global styles, design tokens
├── public/
│   ├── images/         # Product screenshots, hero images
│   ├── icons/          # Favicon, social sharing images
│   └── fonts/          # Self-hosted fonts (if any)
├── docs/               # Reference docs (positioning, strategy)
└── astro.config.mjs
```

---

## Part 3: Design System

### Visual Direction

**Reference model:** Jobber (getjobber.com) for structure and visual style.
- Clean, professional, spacious
- Outcome-first messaging
- Product screenshots as primary visual content
- Trades-professional audience (not startup/creative)

**What to avoid:**
- AI Purple Problem (dark backgrounds with neon purple/violet gradients)
- Pastel or retro color palettes (not serious enough for this audience)
- Quirky illustrations or animations
- Generic stock photos of auto shops
- Overuse of "AI" in visual branding

### Color Palette

TBD - To be finalized. Direction: clean, confident, automotive-appropriate without being cliche. Exploring options inspired by Jobber's approach.

### Typography

TBD - To be finalized. Direction: clean sans-serif. Professional but not corporate. Readable at all sizes on mobile.

### Layout Principles

1. **Mobile-first.** Design for phone screens first, then expand.
2. **Spacious.** Let content breathe. White space is a feature.
3. **Product-forward.** Real app screenshots over abstract graphics.
4. **Single CTA focus.** Every section should support one action: Book a Demo.

---

## Part 4: Homepage Structure

### Section 1: Hero

**Headline:** Turn Every Technician Into Your Most Productive, Most Profitable Tech

**Subhead:** RO.bot is voice-first AI that helps your techs find more work, sell more work, and get paid for more work.

**CTA:** Book Your Demo

**Visual:** Phone mockup showing the app in a shop environment. Communicate "mobile," "shop floor," "voice."

### Section 2: The Problem

**Headline:** Your Service Department Is Leaving Money on the Table

Narrative section painting the picture of revenue leaking at every stage: rushed inspections (missed findings), unclear videos (declined work), slow documentation (warranty denials).

Key stats to weave in:
- 12% warranty claim denial rate industry-wide
- 45+ minutes/day lost to typing stories
- 30-40% of recommended work declined by customers

### Section 3: Solution Framework (Three Pillars)

**Headline:** Faster Techs. Better Documentation. More Revenue Per RO.

Three sub-sections:
1. **Find More Work** - Voice-first MPI. Screenshot of mobile MPI carousel.
2. **Sell More Work** - AI-guided video inspections. Screenshot of teleprompter UI.
3. **Get Paid for More Work** - AI-powered 3Cs. Screenshot of report card.

### Section 4: Proof

**Headline:** Results from Real Shops

- Time savings: "30+ minutes per day saved on story writing"
- Quality: Report card screenshot showing grading
- Speed contrast: "45 minutes typing vs. seconds with RO.bot"
- User/manager quotes from pilot shops (as available)

### Section 5: How It Works

**Headline:** Up and Running in 10 Minutes

Three steps:
1. Download the app. No DMS integration required.
2. Techs record voice notes while they work.
3. RO.bot handles the rest.

### Section 6: CTA

**Headline:** Every RO Has More Revenue In It. Let Us Show You How Much.

**Subhead:** Book a 15-minute demo and see how RO.bot works with your team's real workflow.

**Form:** Name, Email, Shop/Dealership Name

---

## Part 5: Content Guidelines

### Voice and Tone

- Write for a Fixed Ops Director who has 30 seconds to decide if this is worth their time
- Lead with outcomes, not features
- Use the language of the shop floor: ROs, wrench time, bays, stories, warranty claims
- Be direct and concrete
- OK to be confident. This audience respects directness.

### Words and Phrases to Avoid

- "Revolutionize" / "revolutionary"
- "Game-changer"
- "Cutting-edge" / "state-of-the-art"
- "Seamless" / "seamlessly"
- "Leverage" (as a verb)
- "Harness the power of"
- "Empower" / "empowering"
- "Robust"
- "Solution" (be specific about what it actually does)
- Em dashes and en dashes
- Emojis

### Formatting Rules

- No em dashes or en dashes (use commas, periods, or restructure)
- No emojis anywhere on the site
- Use "AI" sparingly. It's a capability, not the headline.
- Headline hierarchy: H1 (hero promise) > H2 (section frames) > H3 (pillar names)

---

## Part 6: Key Visual Assets

### Priority Order

1. **Hero image:** Phone mockup in shop context showing the app
2. **Voice-to-story animation/video:** Tech speaks, waveform, finished graded story appears
3. **Report card screenshot:** 7-criteria grading with color-coded letter grades (strongest proof asset)
4. **MPI mobile screenshot:** Color-coded carousel with status cards
5. **Before/after story:** Hand-typed tech story vs. RO.bot generated story side-by-side
6. **Video teleprompter screenshot:** Guided recording overlay with shot list
7. **Owner page screenshot:** Customer-facing vehicle health report
8. **Technician tracker screenshot:** Performance dashboard for managers

### Asset Sources

Screenshots come from the main RO.bot app (separate repo). Coordinate with Dave to capture current production UI.

### What to Keep from Current Site

- "Book Your Demo" CTA structure and form
- Brand logos (Honda, Ford, Chevy, etc.) showing cross-manufacturer support
- Footer structure and legal pages
- Domain and any existing SEO equity

### What to Remove from Current Site

- "Specs At Your Fingertips" section (feature no longer in product)
- "Smarter Diagnostics, Less Guesswork" section (feature no longer in product)
- Exclusive warranty-only positioning
- "AI Co-Pilot for Automotive Technicians" tagline (too vague)

---

## Part 7: Blog (Wrench Time Reports)

### Structure

Blog posts are markdown files in `src/content/blog/`. Each post maps to one of the three pillars and targets a specific audience. Hero images and other assets live in `public/blog-assets/{N}-{slug}/`, numbered sequentially.

### Post Frontmatter

Schema is defined in `src/content/config.ts`. Required and optional fields:

```yaml
---
title: "Post Title"
date: "2026-04-10"
category: "Warranty"
tags: ["Warranty", "3Cs", "Fixed Ops"]
excerpt: "1-2 sentence hook shown on the blog index and used as fallback for meta description."
# Optional SEO/AEO fields
metaDescription: "150-160 char click-through optimized description. Falls back to excerpt if omitted."
ogImage: "/blog-assets/N-slug/og-image.jpg"  # Falls back to site default if omitted
primaryKeyword: "main target keyword"
secondaryKeywords: ["supporting keyword 1", "supporting keyword 2"]
updatedDate: "2026-05-01"  # Only set when the post is genuinely revised
faqs:
  - question: "What is X?"
    answer: "X is..."
---
```

When `faqs` is set, `BlogPost.astro` automatically renders FAQ schema.org markup for rich results.

### Workflow

The full end-to-end workflow for creating a new post (ideation, drafting, hero image via Nano Banana, infographic design, SEO/AEO optimization, two-way internal linking, distribution drafts, deploy) is captured in the `ro-bot-blog-post` skill. Invoke it when starting a new post.

### Writing Guidelines

- 800-1200 words per post
- Direct, knowledgeable tone
- Optimized for one target keyword
- Clear CTA to book a demo at the end
- Same voice/tone rules as the rest of the site

---

## Part 8: Development Methodology

### Working with Dave

Same approach as the main app:

**DO:**
- One change at a time, verify before moving on
- Show options, not just solutions
- Flag risks or concerns
- Ask clarifying questions when unsure

**DON'T:**
- Stack multiple changes without checking in
- Add features or complexity beyond what was asked
- Use banned words/phrases in copy
- Add emojis unless explicitly requested

### Testing Checklist

Before any deploy:
- [ ] Mobile responsive on iPhone and Android
- [ ] All images optimized and loading fast
- [ ] Demo form submits correctly
- [ ] Analytics tracking fires on page load and form submit
- [ ] No broken links
- [ ] Lighthouse score 90+ on performance
- [ ] Copy reviewed against banned words list
- [ ] OG/social sharing images set correctly

---

## Part 9: Technical Gotchas & Patterns

### CSS/Tailwind
- **ID selectors starting with digits are invalid CSS** - `#3cs` won't work. Use Tailwind classes like `scroll-mt-28` directly on elements instead.
- **ESM config files need ESM imports** - `tailwind.config.mjs` requires `import x from 'pkg'`, not `require('pkg')`.

### Astro Build
- **public/ files override generated pages** - If `/public/privacy.html` exists, it will override `/src/pages/privacy.astro`. Delete old static files when migrating.
- **Check build output** - `head -60 dist/page/index.html` to verify correct content before deploying.

### Netlify Deployment
- **CLI deploys can be overwritten by GitHub auto-deploy** - Always commit and push after verifying CLI deploy works.
- **Form detection requires re-deploy** - After enabling form detection in Netlify dashboard, trigger a new deploy.

### Debugging Deploy Issues
1. Check built output: `head dist/page/index.html`
2. Check live content: `curl -sL https://site.com/page | head -30`
3. Compare for mismatches
4. Search for conflicting files: `find public -name "*.html"`

---

## Part 10: Reference Documents

These documents contain the full strategic context:

- **Website Positioning & Plan:** `docs/marketing/ro-bot-website-plan.md` (in main app repo)
  - Dunford positioning framework, value pillars, homepage structure, visual asset list, validation checklist
- **Marketing Strategy:** `docs/marketing/ro-bot-marketing-strategy.md` (in main app repo)
  - Funnel design, hook messages by pillar, content calendar, LinkedIn strategy, measurement plan
- **Ad Test Data:** Appendix in the website plan doc
  - 14-execution Facebook test results. Revenue framing (167) and speed contrast (150) are top performers.

---

## Proven Messages (Use These)

### Tier 1: Proven Winners
- "Shops lose work when customers don't understand repairs" (revenue/video)
- "Techs lose nearly an hour a day on paperwork" (time/productivity)
- "45 minutes typing stories. Zero minutes with RO.bot." (speed contrast)
- "Turn every technician into your most productive, most profitable tech" (platform)
- "Every RO has more revenue in it" (revenue umbrella)

### Tier 2: Strong Supporting
- "Find more work. Sell more work. Get paid for more work." (value framework)
- "Better stories. Zero typing." (3Cs shorthand)
- "12% of warranty claims get denied. The #1 cause is bad documentation."
- "Faster techs. Better documentation. More revenue per RO."
