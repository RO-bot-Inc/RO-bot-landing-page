# SEO and AEO Plan

**Owner:** Dave. **Written:** 2026-10-08. **Status:** active; work through the projects in order, one at a time.

**Goal:** when a fixed ops director or service manager searches Google, or asks ChatGPT, Perplexity or Gemini, for a better way to do MPIs or 3C stories, TenthGear is the answer they find. This is a marathon; this plan is the first six months.

---

## What we know (evidence, 2026-10-07)

1. **We have almost no organic presence yet.** Search Console, last 90 days: 87 clicks, 2,050 impressions. 71 of the clicks went to the homepage, nearly all on brand searches (tenthgear, ro bot, ro-bot). Nothing has been done strategically, so this is a baseline, not a verdict.
2. **The one non-brand topic with traction is warranty labor rate increases.** That post earned 912 impressions at positions 8 to 24, mostly before the 2026-10-07 rewrite. "labor rate submission" (position 9.6) and "warranty rate submission" (8.0) sit just off page one.
3. **Product-language terms have no Google volume.** Keyword Planner (US, 12 months): "speech to text MPI," "MPI with AI," "hands free technician software," "best service lane software," "AI warranty story writer" and every "warranty story" phrasing are below the reporting floor. 54 of 82 tested terms showed no volume.
4. **Buyers search with established words, mostly on the MPI side.** See the appendix. "multi point inspection" (1K to 10K), "mpi video," "multi point inspection checklist," "digital vehicle inspection" (100 to 1K each). On the story side, people search the 3C words ("concern cause correction," "complaint cause correction," "3cs automotive"), not "warranty story," and only at 10 to 100 a month.
5. **AI answer engines are a separate channel that Keyword Planner can't see.** Long conversational questions ("is there an app that turns tech voice notes into an MPI report?") have no keyword volume but are exactly where our differentiator wins.
6. **Competitors are thin on reviews and content.** myKaarma has 4 G2 reviews. Mid-tier content is mostly dormant; only Xtime (Cox research budget) and Tekion publish steadily (GTM competitive research, 2026-10).

## Strategy in one paragraph

Lead with the two wedge pillars, **self-building MPI reports** and **self-building 3C stories** (working names; see `../../../shared/product-facts.md`, Market position). Give each pillar a dedicated page titled with the words buyers already search, and surround it with guides, a free tool, and honest comparisons. The MPI pillar can win on Google and AI answers; the 3C pillar leans on AI answers, Reddit and direct outreach because its Google volume is small. The full-platform story stays secondary: "works alongside your scheduling, communication and payment tools," never a claim of breadth we don't have. Everything we publish carries something only TenthGear has: real (anonymized) stories and grades, real inspection videos, real product screenshots.

## Rules for every page

- Product facts come from `shared/product-facts.md`; brand and voice from `shared/brand.md`. External stats are verified against the primary source before shipping.
- **Dealership, said plainly.** Much DVI search volume is independent shops; every page names franchise dealership service departments so it attracts the right reader.
- **One page per topic, not per phrasing.** Variants ("voice MPI," "hands-free MPI," "AI MPI") go into headings, copy and FAQ of one page. Near-duplicate pages get treated as doorway pages.
- **A plain category sentence near the top**, e.g. "TenthGear is a voice-first MPI app for franchise dealership service departments." AI engines quote sentences like this.
- **Structured data:** SoftwareApplication on product pages, FAQPage where there is an FAQ, Article on guides.
- **Comparisons are factual, dated and sourced,** fair about where the other product is stronger, with no competitor logos. No "better than X" claims without proof.
- Visual changes get an artifact mockup with labeled options first; implement only Dave's pick.

---

## Projects

Each project ships as its own PR (or PRs) and gets checked off here.

### P1. Two pillar product pages  ← first

- [ ] **`/mpi/` page** (slug to confirm). Title and H1 built from searched terms ("MPI," "MPI video," "digital vehicle inspection"); "self-building" is the differentiator in the copy: the report builds itself from what the tech says in the video or voice notes; the tech reviews it. Sections: the problem (MPIs that don't get done, or get done badly), how it works (voice MPI, guided video, customer report), the time-savings and adoption benefit, dealership proof, DMS line, FAQ, Book a Demo.
- [ ] **`/3c-story-writer/` page** (slug to confirm). Title and H1 use the 3C words ("concern, cause, correction"); covers AI Story Writer plus the real-time grader (6 criteria for diagnostic warranty stories; see product facts for other pay types), the 7 minutes per RO claim (Story Writer scope only), fewer chargebacks, FAQ, Book a Demo.
- [ ] **`/product/` becomes the hub** that introduces the platform and links to both pillar pages. Navbar and homepage link to both.
- [ ] SoftwareApplication + FAQPage schema on both pages; add to sitemap; request indexing in Search Console.
- **Process:** mockup with naming and layout options → Dave picks → build → ship.
- **Dave inputs:** naming pick; product screenshots or short clips; any customer quote or result we can use on each page.
- **Done when:** both pages live, indexed, linked from nav, home and /product/.

### P2. AI answer and indexing groundwork

- [ ] Bing Webmaster Tools: verify the site, submit the sitemap (ChatGPT search runs on Bing's index).
- [ ] IndexNow on deploy, so Bing and others hear about new pages immediately.
- [ ] `llms.txt` with the category sentences and links to the pillar pages and best guides.
- [ ] Organization schema check (done 2026-10-07: alternateName, legalName) plus SoftwareApplication on the pillar pages from P1.
- [ ] **AEO baseline:** about 25 buyer questions run through ChatGPT, Perplexity and Gemini; log who gets named and cited in `docs/seo/aeo-tracker.md`. Repeat monthly.
- [ ] GA4: confirm referrals from chatgpt.com, perplexity.ai and gemini.google.com are visible, and that organic demo requests are attributable.
- **Dave inputs:** Bing Webmaster login (Dave logs in, Claude drives).

### P3. MPI content cluster (Google + AI answers)

All link to `/mpi/`. Roughly one a week, alternating with P4.
- [ ] **Multi point inspection checklist for dealerships**, with a printable version. Targets "multi point inspection checklist" (100 to 1K) and "mpi checklist."
- [ ] **MPI video guide:** what to say and show, shot list, customer approval angle. Targets "mpi video" (100 to 1K), "vehicle inspection video." Builds on the existing inspection-video post.
- [ ] **Digital vehicle inspection for dealerships:** what a DVI should do, how dealership needs differ from independent shops. Targets "digital vehicle inspection," "DVI software."
- [ ] **What is a multi point inspection** (definition page for the 1K to 10K head term and for AI answers).
- [ ] Refresh `mpi-completion-rate-revenue` to link into the cluster.

### P4. 3C stories and warranty content cluster

All link to `/3c-story-writer/` (warranty rate pieces link to the labor rate post).
- [ ] **Concern, cause, correction: how to write a 3C story,** with examples by repair type. Targets "concern cause correction," "complaint cause correction," "3cs automotive."
- [ ] **3C example library:** anonymized real stories, before and after, with grades. Our strongest proof asset; needs Dave's OK on which customer data can be used.
- [ ] **Warranty chargebacks: why they happen and how documentation prevents them.** Refresh `reduce-warranty-claim-denials` (position 26) into this cluster.
- [ ] **Labor rate cluster follow-ups** (existing traction): a "labor rate submission" section or page (position 8 to 10 today); a warranty parts markup increase page (position 48 today).
- [ ] **Automaker-specific story guides** (Ford, GM, Stellantis, Toyota, Honda, Hyundai/Kia), one at a time, each verified against primary sources like the state lookup.

### P5. Free tools (link magnets)

- [ ] **Warranty Story Checker:** paste a story, get a basic grade. Decision needed: cost and abuse limits of calling the grader from the public site.
- [ ] **Effective labor rate calculator** on or beside the ELR post ("calculate effective labor rate" ranks 18 to 28 today).
- [ ] Printable MPI checklist (ships with P3).

### P6. Comparisons and "works alongside" pages

- [ ] TenthGear vs ChatGPT for 3C stories
- [ ] TenthGear vs WarrantyWriter
- [ ] TenthGear vs TruVideo (inspection video)
- [ ] Xtime Inspect vs TenthGear; myKaarma MPI vs TenthGear (scoped to the MPI and video overlap only)
- [ ] Works alongside Xtime / myKaarma / Dealer-FX (scheduling, communications and payments stay with them)
- **Dave inputs:** appetite for naming myKaarma and Xtime directly; any first-hand competitive facts.

### P7. DMS integration pages and partner listings

- [ ] One page per DMS (10, per product facts), only with real per-DMS details: what syncs, where the story lands, setup. No templated pages.
- [ ] Listings in DMS partner marketplaces (CDK Fortellis, Reynolds RCI, Tekion, others as available).
- **Dave inputs:** per-DMS integration facts; partner program status for each.

### P8. Off-site authority (ongoing, mostly Dave-led)

- [ ] G2 and Capterra listings; ask customers for reviews (target 10 each).
- [ ] Consistent entity facts on Crunchbase, LinkedIn and Wikidata: "TenthGear (formerly RO-bot), voice-first AI for dealership service departments."
- [ ] Promote the state labor rate lookup to state dealer associations, 20 Groups and fixed-ops newsletters.
- [ ] Trade press guest articles (CBT News, Fixed Ops Journal) and podcast guest spots.
- [ ] YouTube: a real MPI walkthrough and a "how to write a 3C story" video.
- [ ] Reddit: continue the GTM program; link to guides where genuinely useful.

### P9. Original research

- [ ] A report from anonymized grading data (for example, the most common reasons stories fall short, by repair type). Trade press and AI engines cite proprietary numbers for years. Needs customer data-use clearance.

---

## Measurement

| What | Where | When |
|---|---|---|
| Impressions, clicks and position for pillar and cluster terms | Search Console | Monthly |
| Rank for each page's primary keyword | `docs/seo/keyword-tracker.md` | Quarterly |
| Who AI engines name and cite for the 25 baseline questions | `docs/seo/aeo-tracker.md` | Monthly |
| Referrals from AI engines; organic demo requests | GA4 | Monthly |
| Keyword volumes for new topics | Keyword Planner (plan saved in the RO-bot Ads account, 2026-10-07) | Before each new cluster |

## Open decisions for Dave

1. Public names for the two pillars (P1 mockup will show options).
2. Pillar page URLs.
3. Which customer stories, videos and results can be used, anonymized or named (P1, P4, P9).
4. Whether the Story Checker can call the real grader from the public site (P5).
5. How directly to name myKaarma and Xtime (P6).

---

## Appendix: Keyword Planner results (US, last 12 months, pulled 2026-10-07)

Ranges only (no active campaign). Terms not listed showed no measurable volume.

| Term | Monthly searches | Competition |
|---|---|---|
| multi point inspection | 1K to 10K | Low |
| vehicle inspection report | 1K to 10K | High (likely mostly consumers) |
| multi point inspection checklist | 100 to 1K | High |
| mpi video | 100 to 1K | Low |
| digital vehicle inspection | 100 to 1K | Low |
| digital vehicle inspection software | 100 to 1K | Medium |
| vehicle inspection app | 100 to 1K | Low |
| mpi app, mpi software, mpi report, mpi checklist, video mpi | 10 to 100 each | Low |
| digital multi point inspection, dvi app | 10 to 100 each | Low |
| dvi software | 10 to 100 | Medium |
| vehicle inspection video | 10 to 100 | Low |
| ai vehicle inspection | 10 to 100 | Medium |
| complaint cause correction, concern cause correction, 3cs automotive | 10 to 100 each | Low |
| warranty chargeback | 10 to 100 | Low |
| service lane software | 10 to 100 | High |
| dealership service software | 10 to 100 | High |
| service department software, service lane technology | 10 to 100 each | Medium |
| xtime inspect, cdk service edge | 10 to 100 each | Low |

No measurable volume (selection): speech to text MPI, MPI with AI, MPI video with AI, inspection video with AI, hands free technician software, voice first technician apps, AI first service lane tools, best service lane software, warranty story writer, AI warranty story writer, how to write a warranty story, warranty story examples, 3C story generator, technician notes software, dictation software for mechanics, xtime alternative, mykaarma alternative, truvideo alternative.
