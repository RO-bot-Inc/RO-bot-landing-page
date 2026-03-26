# Website Improvement Plan

Based on the Majentics analysis (Human 77, SEO 66, AI Engines 78, AI Agents 72) and independent site audit conducted March 2026.

## Completed

### Quick Wins (Session 1)
- [x] OG tags + Twitter cards on all pages (BaseLayout.astro)
- [x] Canonical URLs on all pages (BaseLayout.astro)
- [x] Organization + SoftwareApplication JSON-LD schema (index.astro)
- [x] FAQPage JSON-LD schema + visible FAQ section (index.astro, FAQ.astro)
- [x] BlogPosting JSON-LD schema on all blog posts (BlogPost.astro)
- [x] Auto-generated sitemap with all pages and blog posts (removed static sitemap.xml, @astrojs/sitemap now generates)
- [x] LinkedIn link in footer (Footer.astro)
- [x] robots.txt updated to reference sitemap-index.xml

### Short-Term (Session 2)
- [x] Standalone /product page with all three pillars, Product schema, internal links to blog posts
- [x] Pricing page (demo-focused, no numbers, ROI framing)
- [x] Founder bio + headshot on About page with LinkedIn link
- [x] Blog SEO optimization: fixed banned words, broken links, added 2+ internal links per post
- [x] Nav updated: Product and Pricing links, mobile menu updated
- [x] Footer updated: Product links to /product page, Pricing link added
- [x] LinkedIn URL corrected to linkedin.com/company/ro-bot/ across footer and schema

---

## Remaining Short-Term

### 1. Replace Notion support page with hosted content

**Why:** Linking to an external Notion doc signals "early-stage startup." Hosting support content on ro-bot.io also captures SEO value from how-to searches.

**Blocked on:** Need Notion doc content from Dave (can't fetch programmatically).

**Files to change:**
- Rewrite `src/pages/support.astro` to include setup guide, FAQ, and contact info directly

**Acceptance criteria:**
- All content currently in the Notion doc is on ro-bot.io
- Organized with clear sections (Getting Started, Using Voice Notes, Troubleshooting)
- Internal links to relevant blog posts
- Contact/support email prominently displayed

---

### 2. Add YouTube and other social links once accounts exist

**Why:** Missing social links hurts E-E-A-T and brand verification.

**Files to change:**
- `src/components/Footer.astro`
- Organization schema sameAs array in `src/pages/index.astro`

**Acceptance criteria:**
- YouTube link added once channel exists
- Social links match sameAs array in Organization schema

---

## Longer-Term (Roadmap)

### 8. Named customer case study

**Why:** The single highest-leverage conversion improvement available. One named case study ("Smithtown Toyota increased warranty approval by 22%") is worth more than all five current blog posts for both conversion and AI citation.

**Requires:** Customer permission, data collection from a real pilot shop.

**Files to create:**
- `src/pages/customers.astro` or `src/pages/case-studies/[slug].astro`
- Blog post version for broader distribution

**Acceptance criteria:**
- Named dealership with real, quantified results
- Before/after metrics (denial rate, time saved, revenue impact)
- Quote from a named service manager or fixed ops director
- Case study JSON-LD schema

---

### 9. ROI calculator or interactive demo

**Why:** Middle-of-funnel conversion. Most first-time visitors are not ready to book a demo. A calculator or recorded demo walkthrough captures leads earlier.

**Options (pick one to start):**
- ROI calculator: input RO count, average denial rate, get estimated revenue recovery
- Recorded demo video: 2-3 minute walkthrough accessible without booking a call

**Files to create:**
- `src/pages/roi-calculator.astro` or `src/components/ROICalculator.astro`
- Or embed a video on a new `/demo` page

**Acceptance criteria:**
- Lower-friction conversion path exists beyond "Book a Demo"
- Email capture before accessing the resource
- Tracked as conversion event in GA

---

### 10. Middle-of-funnel lead capture

**Why:** "Book Your Demo" is the only CTA. Need downloadable content (one-pager, ROI guide) gated behind email.

**Requires:** Content creation (guide, one-pager, video).

**Files to create:**
- Landing page for the gated resource
- Email integration (Formspree, ConvertKit, or similar)

**Acceptance criteria:**
- At least one downloadable resource available
- Email captured and stored
- Follow-up nurture sequence (outside scope of website code)

---

### 11. Build blog publishing cadence to 2x/month

**Why:** Five posts over ~5 months is not enough for topical authority. Need consistent publishing targeting specific search queries.

**High-value topics not yet covered:**
- "How to reduce warranty claim denials at automotive dealerships"
- "Best MPI software for service departments"
- "How to increase revenue per repair order without adding staff"
- "Voice AI for automotive technicians: what to look for"
- "DMS integrations for service department productivity tools"

**Acceptance criteria:**
- Minimum 2 posts per month, consistently
- Each post targets a specific search query
- Each post has internal links to product page and other relevant posts
- Each post has proper frontmatter (excerpt, category, tags)

---

### 12. Help center rebuild

**Why:** Hosting support docs on the site captures SEO value from implementation/how-to searches and builds buyer confidence during evaluation.

**Files to create:**
- `src/pages/help/index.astro`
- `src/pages/help/[...slug].astro` (markdown-driven, similar to blog)
- `src/content/help/*.md`

**Acceptance criteria:**
- Organized by workflow (Getting Started, Voice Notes, Inspections, Video, 3Cs)
- Searchable or at minimum well-organized by category
- Internal links from product and support pages
- Each article has proper meta tags

---

## Priority Matrix (Remaining Items)

| Item | Effort | Impact | Addresses | Status |
|---|---|---|---|---|
| Replace Notion support page | Medium | Medium | Conversion, SEO | Blocked (need Notion content) |
| Add social links (YouTube etc.) | Low | Medium | E-E-A-T | Blocked (need accounts) |
| Named case study | Medium | Very High | Conversion, AEO, Trust | Needs customer data |
| ROI calculator / demo video | Medium | High | Conversion | Roadmap |
| Middle-of-funnel lead capture | Medium | High | Lead gen | Roadmap |
| Blog cadence 2x/month | Ongoing | High | SEO, AEO | Ongoing |
| Help center rebuild | High | Medium | SEO, Trust | Roadmap |
