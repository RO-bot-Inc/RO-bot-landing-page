# Existing Posts Promotion Plan

Framework + schedule for promoting the 16 existing blog posts under the new brand's social handles (LinkedIn, Instagram, Facebook) after rebrand day.

**Status as of 2026-07-30:** New brand name locked = **TenthGear** (Ronin is dead — see `../../../shared/rebrand/master-plan.md`). **No TenthGear social handle has been claimed or even checked** — that pass is the first prerequisite here; see `../../../shared/rebrand/social-handles.md`. Visual identity does not exist yet either, which blocks the pull-quote card templates below. Per-post copy gets drafted closer to each post's slot, once the brand voice and visual system are set.

---

## Strategy

The new social handles will launch with zero history. Backfilling with 16 pieces of already-validated content gives the new accounts a credibility foundation and a content cadence from day one. Goal: staggered releases themed by product pillar so the narrative arc tells a coherent story to new followers.

### Channel mix (default per post, override case by case)

- **LinkedIn** — every post. Buyer-facing channel; Fixed Ops Directors live here. First-comment link drop, no in-body URLs.
- **Instagram** — every post that pairs naturally with a visual (hero image or pulled stat card). Carousel format (3-5 cards) outperforms single image.
- **Facebook** — every post; reuse the LinkedIn copy with minor adaptation. Lower priority than LI but cheap to extend.
- **Reddit** — post-specific, no link drops (Reddit downranks them). Use comments on existing threads to seed traffic per post. See per-post distribution doc for which subreddits.
- **Email** (if a list exists by rebrand day) — bundle 2-3 thematically linked posts per email; do not send 12 separate emails.

### Thematic clustering (suggested arc)

Group posts by product pillar / narrative beat so a new follower binging the feed gets a coherent story.

| Cluster | Posts | Narrative beat |
|---|---|---|
| **A. Origin + thesis** (3) | what-technician-conversations-taught-us, from-skeptics-to-believers-beta-feedback, why-auto-techs-hate-paperwork | Why we built this. Who we listened to. What changed when they tried it. |
| **B. Find More Work** (2) | mpi-completion-rate-revenue, what-customers-want-inspection-videos | The inspection gap and the video-approval problem. |
| **C. Sell More Work** (4) | increase-revenue-per-repair-order, effective-labor-rate, voice-technology-service-bay, **recover-declined-service-work** | How to grow RO value without growing car count. |
| **D. Get Paid for More Work** (5) | reduce-warranty-claim-denials, warranty-audit-playbook, automotive-technician-retention, **warranty-diagnostic-time**, **warranty-labor-rate-reimbursement** | The warranty documentation tax, the audit risk, and how it ties to retention. |
| **E. Industry / category** (2) | ai-powered-diagnostics, roi-digital-repair | Macro framing for the category we operate in. |

*Bold = published since the Ronin-era version of this plan. The warranty cluster is now the largest and the best-supported (all five have hero assets; three have full distribution docs), which is why it leads the arc below.*

---

## Schedule template

`R` = the week of the rebrand launch. `R+1` is the week after, etc. Adjust target weeks as the rebrand date firms up and the launch cadence is set.

| Slug | Publish date | Pillar / cluster | Target promo week | Channels | Assets ready | Notes |
|---|---|---|---|---|---|---|
| warranty-diagnostic-time | 2026-07-16 | D — Get Paid | R+0 | LI, IG, FB, email | Hero + distribution doc done | **Lead piece.** Freshest content and fully supported. |
| automotive-technician-retention | 2026-05-17 | D — Get Paid | R+1 | LI, IG, FB, email | Hero, meme, distribution doc done | Full distribution doc; just retarget to new handles. |
| warranty-labor-rate-reimbursement | 2026-06-05 | D — Get Paid | R+2 | LI, IG, FB, email | Hero + distribution doc done | Concrete, high-intent buyer topic. |
| warranty-audit-playbook | 2026-04-10 | D — Get Paid | R+3 | LI, IG, FB | Hero done; needs pull-quote card | Strong companion to the retention post. |
| reduce-warranty-claim-denials | 2026-03-26 | D — Get Paid | R+4 | LI, IG, FB | Hero done; needs pull-quote card | Closes the warranty cluster. |
| recover-declined-service-work | 2026-06-20 | C — Sell More | R+5 | LI, IG, FB, email | Hero + distribution doc done | Opens the revenue cluster. |
| effective-labor-rate | 2026-05-29 | C — Sell More | R+6 | LI, IG, FB, email | Hero + distribution doc done | Strong buyer-facing piece (Fixed Ops Director). |
| increase-revenue-per-repair-order | 2026-03-20 | C — Sell More | R+7 | LI, IG, FB | Hero done; needs pull-quote card | Pair with effective-labor-rate if compressing. |
| mpi-completion-rate-revenue | 2026-03-24 | B — Find More | R+8 | LI, IG, FB | Hero done; needs pull-quote card | Starts the MPI cluster. |
| what-customers-want-inspection-videos | 2026-03-22 | B — Find More | R+9 | LI, IG, FB | Hero done; needs pull-quote card | Closes the MPI cluster. |
| what-technician-conversations-taught-us | 2026-03-18 | A — Origin | R+10 | LI, IG, FB | Hero done; needs pull-quote card | Founder-voice post; consider Dave's personal LI in addition to the brand account. |
| from-skeptics-to-believers-beta-feedback | 2025-06-02 | A — Origin | R+11 | LI, IG, FB | Hero done; needs pull-quote card | Pair with the founder post. |
| why-auto-techs-hate-paperwork | 2025-05-20 | A — Origin | R+12 | LI, IG, FB | Hero done; needs pull-quote card | Closes the origin cluster. |
| voice-technology-service-bay | 2025-01-25 | C — Sell More | R+13 | LI, IG, FB | No hero asset; needs creation | Oldest content; may need a light editorial refresh. |
| roi-digital-repair | 2025-01-28 | E — Category | R+14 | LI, IG, FB | No hero asset; needs creation | Light refresh; check the stats are still current. |
| ai-powered-diagnostics | 2025-01-30 | E — Category | R+15 | LI, IG, FB | No hero asset; needs creation | Light refresh. The "AI" framing needs to align with `brand.md`'s "use AI sparingly" rule. |

**On cadence:** 16 posts one-per-week runs ~16 weeks, past the original 8-12 week target. To hold 12,
pair within clusters (the three older warranty posts, and increase-revenue with effective-labor-rate).
Don't compress by dropping the origin cluster — it's the "why we changed the name" narrative, which is
the whole point of a rebrand backfill.

---

## Per-post copy generation

When each post comes up in the schedule, create or update `docs/distribution/{slug}.md` with the same structure as `docs/distribution/automotive-technician-retention.md`:

- **Primary launch visual** (hero, pulled quote, IG reel, etc.)
- **LinkedIn caption** under 1,200 chars, link in first comment
- **Email** subject (<50 chars), preview text (<90 chars), 3-4 paragraph body, unsubscribe footer
- **Pull quote card** concept(s)
- **Reddit** light-touch guidance (no link drops)
- **Tracking** notes for what to monitor at +7 and +30 days

For consistency, the `/ro-bot-blog-post` skill at `~/.claude/skills/ro-bot-blog-post/SKILL.md` (Phase 4.5) already specifies this format. Use that as the template generator.

---

## Pre-launch prep (do once, before week R)

- [ ] **New brand voice doc** — confirm voice, banned words, tone for TenthGear. Update `../../../shared/brand.md` on rebrand day (part of `checklist.md`).
- [ ] 🔴 **Social handle setup** — run the availability pass, then claim LI / IG / FB / X / TikTok / YouTube / Reddit under TenthGear. Profile copy, photos, cover images, link-in-bio. **Nothing is claimed or checked** → `../../../shared/rebrand/social-handles.md`.
- [ ] 🔴 **Visual templates** — a pull-quote card template using the new brand palette and typography. Reused for every post. **Blocked: no TenthGear palette or typeface exists** (master-plan Workstream 4).
- [ ] **Posting tool** — Buffer, Hootsuite, or just calendar reminders. Decide and set up once.
- [ ] **Tracking spreadsheet** — one row per post per channel per scheduled date with engagement metrics to fill in post-launch.

---

## Open questions for Dave (resolve before drafting per-post copy)

- Should existing posts get their on-site brand references updated (per `checklist.md`) or stay in their original form with the new brand only appearing in the promo copy? Recommendation: update on-site references (consistency), but flag this is non-trivial editorial work across the 14 posts that carry brand references.
- Founder vs brand account split: which posts go on Dave's personal LinkedIn vs the new brand account? (Founder posts probably belong on both.)
- Hero images for the three oldest posts (no asset in `public/blog-assets/`): commission new heroes during the rebrand window, or run lightly without?
- Should we backfill `RO.blog` references too, given that the blog header might also rebrand?
