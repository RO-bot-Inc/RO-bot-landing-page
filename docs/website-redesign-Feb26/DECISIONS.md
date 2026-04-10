# Website Redesign Decisions Log

Decisions made during the planning session on February 8, 2026.

---

## Strategic Decisions

### Positioning Shift
- **From:** "AI Co-Pilot for Automotive Technicians" (user-focused, vague)
- **To:** "Voice-first AI platform for automotive service departments" (buyer-focused, specific)
- **Rationale:** The buyer is the Fixed Ops Director or Service Manager, not the technician. The headline speaks to the person writing the check.

### Three-Pillar Value Framework
- **Find More Work:** Voice-first MPI
- **Sell More Work:** AI-guided video inspections
- **Get Paid for More Work:** AI-powered 3Cs documentation
- **Rationale:** Maps to the actual product, ad-tested messaging, and a revenue narrative the buyer follows naturally.

### Features to Highlight vs. Omit

**Highlight on website:**
- Voice-first input (core differentiator across all pillars)
- AI story writing with 7-criteria grading/report card (strongest proof asset)
- AI-guided video inspections with teleprompter (unique in market)
- Voice-first MPI (no competitor does this)
- 10-minute onboarding / zero DMS integration
- Final Recommendations + Owner Page (ties pillars together)
- Technician tracker / performance dashboard (speaks to buyer)
- Three inference modes (shows product maturity)

**Omit from website:**
- Specs At Your Fingertips (no longer in product)
- Smarter Diagnostics (no longer in product)
- Saved stories library (implementation detail)
- Parts workflow (too niche)
- Admin knowledge base / TSB upload (power user feature)
- DTC code entry / diagnostic data (implementation detail)

---

## Design Decisions

### Visual Style Reference
- **Primary model:** Jobber (getjobber.com) for both structure and visual style
- **Why:** Clean, professional, spacious. Outcome-first. Speaks to trades professionals. Similar growth trajectory.
- **Rejected:** Jasper AI (too pastel/retro/quirky for automotive audience), Tekion (too enterprise/dark for current stage), Xtime (too corporate/institutional)
- **Secondary reference:** Numa (numa.com) for automotive AI positioning specifics

### Color Palette
- **Decision:** Open to exploring a new palette
- **Direction:** Clean, confident, automotive-appropriate. Avoid AI Purple Problem.
- **Status:** TBD, to be finalized in implementation

### Design Principles
1. Mobile-first (techs and buyers both browse on phones)
2. Product-forward (real screenshots, not abstract graphics)
3. Spacious (white space as a feature)
4. Single CTA focus ("Book Your Demo" everywhere)

---

## Technical Decisions

### Build Approach: Start Fresh
- **Decision:** Full rebuild, not a patch of the existing site
- **Rationale:** Content delta is too large (wrong features, wrong audience, two missing pillars). Current site was built with earlier coding skills. Cleaner to start fresh.
- **Preserve:** Domain (ro-bot.io), brand assets (logo, manufacturer logos), analytics (Google Analytics), demo form logic

### Tech Stack: Astro + Tailwind
- **Framework:** Astro (static site generator)
- **Styling:** Tailwind CSS
- **Blog:** Markdown files with frontmatter
- **Why Astro:** Purpose-built for content/marketing sites, zero JS by default (fast), simpler than Next.js for mostly-static content
- **Why not Webflow:** Dave is more comfortable with code-based workflow. Claude Code can build and iterate directly. No vendor lock-in or monthly fees.

### Deployment
- **Decision:** TBD (Vercel, Netlify, or Cloudflare Pages)
- **Requirement:** Fast, reliable, supports custom domain (ro-bot.io)

---

## Content Decisions

### Evidence Strategy (Tiered by Proof)
- **3Cs section:** Heavy on proof (active pilots, time savings data, report card, user feedback)
- **Video section:** Lead with concept and problem. Use ad test insight as proof. Add customer data as it comes.
- **MPI section:** Lead with speed and voice-first differentiator. Add proof as pilots generate data.
- **Rationale:** Every capability described is real and live. The proof weighting reflects where we are. Honest without being apologetic.

### Blog Strategy
- Weekly cadence, 800-1200 words per post
- Each post maps to one pillar, targets one audience
- 3Cs content first (strongest proof), then Video, then MPI
- See `CLAUDE.md` Part 7 for writing guidelines and the `ro-bot-blog-post` skill for the full workflow

---

## Competitive Intelligence

### Key Findings
- TruVideo, Xtime, MyKaarma, DealerFX, SingleThread are established incumbents in video/MPI
- On 3Cs/story writing, RO-bot is creating a new category (main competitor is PencilWrench: desktop-only, no voice, no AI)
- Numa (numa.com) is the closest AI-forward automotive comparable
- Revenue framing massively outperforms documentation/quality framing in ads (167 vs. baseline 100)

### Differentiation Points for Website
- Voice-first across all workflows (no competitor does this)
- AI story grading with 7-criteria report card (unique)
- AI-guided video with teleprompter (unique)
- Zero DMS integration / 10-minute onboarding (low friction vs. enterprise competitors)
