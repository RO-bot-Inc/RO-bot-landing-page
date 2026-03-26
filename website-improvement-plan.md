# Website Improvement Plan

Based on the Majentics analysis (Human 77, SEO 66, AI Engines 78, AI Agents 72) and independent site audit conducted March 2026.

## Completed (Quick Wins)

- [x] OG tags + Twitter cards on all pages (BaseLayout.astro)
- [x] Canonical URLs on all pages (BaseLayout.astro)
- [x] Organization + SoftwareApplication JSON-LD schema (index.astro)
- [x] FAQPage JSON-LD schema + visible FAQ section (index.astro, FAQ.astro)
- [x] BlogPosting JSON-LD schema on all blog posts (BlogPost.astro)
- [x] Auto-generated sitemap with all pages and blog posts (removed static sitemap.xml, @astrojs/sitemap now generates)
- [x] LinkedIn link in footer (Footer.astro)
- [x] robots.txt updated to reference sitemap-index.xml

---

## Short-Term (This Sprint)

### 1. Create standalone /product page

**Why:** High-value SEO target. Right now "Product" in the nav scrolls to /#solution. A standalone page can rank for "automotive service AI", "voice-first MPI software", "dealership technician app".

**Files to create/change:**
- Create `src/pages/product.astro`
- Update `src/components/Navbar.astro` to link to `/product` instead of `/#solution`

**Acceptance criteria:**
- Dedicated page with its own title, meta description, and canonical URL
- Three sections matching the three pillars (3Cs, Video, MPI) with deeper content than homepage
- Product JSON-LD schema
- Internal links to blog posts under each pillar
- CTA at the bottom

---

### 2. Optimize existing blog posts for SEO

**Why:** Five posts exist but none are optimized for search. Meta descriptions exist (via excerpt), but posts lack keyword targeting, internal links, and structured content.

**Files to change:**
- `src/content/blog/*.md` (all 5 posts)

**Acceptance criteria:**
- Each post has a primary target keyword in the title, first paragraph, and at least one subheading
- Each post has 2+ internal links (to other blog posts, product page, or homepage sections)
- Each post has a clear CTA at the end (already exists in BlogPost layout)
- Excerpts reviewed and tightened for search snippet display

---

### 3. Add DMS compatibility / integrations page

**Why:** "Does it work with my DMS?" is the #1 pre-purchase technical question. This page is also a strong SEO target for queries like "CDK integration technician tools".

**Files to create/change:**
- Create `src/pages/integrations.astro`
- Update `src/components/Navbar.astro` and `src/components/Footer.astro` with link

**Acceptance criteria:**
- Lists compatible DMS platforms (CDK, Reynolds, Tekion, DealerSocket, PBS, etc.)
- Clarifies that R.O. bot works independently of DMS (no integration required to start)
- Explains copy/paste workflow and any planned direct integrations
- Has its own meta description and OG tags
- CTA at the bottom

---

### 4. Replace Notion support page with hosted content

**Why:** Linking to an external Notion doc signals "early-stage startup." Hosting support content on ro-bot.io also captures SEO value from how-to searches.

**Files to change:**
- Rewrite `src/pages/support.astro` to include setup guide, FAQ, and contact info directly

**Acceptance criteria:**
- All content currently in the Notion doc is on ro-bot.io
- Organized with clear sections (Getting Started, Using Voice Notes, Troubleshooting)
- Internal links to relevant blog posts
- Contact/support email prominently displayed

---

### 5. Add founder bio to About page

**Why:** No team info = no E-E-A-T signal. Prospects need to know who built the product.

**Files to change:**
- `src/pages/about.astro`

**Acceptance criteria:**
- Founder name, photo, and brief bio (automotive industry experience, what led to building R.O. bot)
- Person JSON-LD schema
- Professional headshot (needs asset from Dave)

---

### 6. Add social media links across the site

**Why:** Missing social links hurts E-E-A-T and brand verification. LinkedIn is the primary channel for reaching fixed ops directors.

**Files to change:**
- `src/components/Footer.astro` (LinkedIn done, add others as accounts are created)
- `src/components/Navbar.astro` (optional)

**Acceptance criteria:**
- LinkedIn link in footer (done)
- YouTube link added once channel exists
- Social links match sameAs array in Organization schema

---

### 7. Create a pricing page (even placeholder)

**Why:** "RO-bot pricing" is a high-intent search query getting zero results from the site. Even a "Contact us for pricing" page captures that traffic.

**Files to create:**
- Create `src/pages/pricing.astro`
- Add link in Navbar and Footer

**Acceptance criteria:**
- Page exists at /pricing
- Communicates the general model (per-store subscription) without specific numbers if preferred
- "Talk to us" CTA leading to /book-demo
- Has its own title, meta description

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

## Priority Matrix

| Item | Effort | Impact | Addresses |
|---|---|---|---|
| Standalone /product page | Medium | High | SEO, Conversion |
| Blog SEO optimization | Low-Medium | High | SEO, AEO |
| DMS integrations page | Medium | High | Conversion, SEO |
| Replace Notion support page | Medium | Medium | Conversion, SEO |
| Founder bio on About page | Low | Medium | E-E-A-T, Trust |
| Pricing page (placeholder) | Low | Medium | SEO, Conversion |
| Named case study | Medium | Very High | Conversion, AEO, Trust |
| ROI calculator / demo video | Medium | High | Conversion |
| Middle-of-funnel lead capture | Medium | High | Lead gen |
| Blog cadence 2x/month | Ongoing | High | SEO, AEO |
| Help center rebuild | High | Medium | SEO, Trust |
