# Rebrand Planning

**Status:** Active, Prep phase. As of **2026-07-30** the name is **TenthGear** (locked 2026-07-28).
Marketing domain **tenthgear.ai**, app domain **app.tenthgear.ai**. **The cutover date is not set** —
see the master plan for why.

> **Ronin is dead.** An earlier version of these docs was written for "Ronin" at getronin.app; Erik
> Pelton's July 2026 clearance search came back moderate-to-high risk and the file was closed. Every
> doc in this folder was rewritten for TenthGear on 2026-07-30. If you find a getronin.app or Ronin
> reference anywhere outside a clearly-labeled historical note, it's a miss — fix it.

Cross-workstream source of truth: `../../../shared/rebrand/master-plan.md`. That covers legal,
comms, DNS, design, and the app; this folder is website-only.

## What lives here

- **`checklist.md`** — every file, location, and asset that needs updating on rebrand day. Source of
  truth for the website cutover. File inventory re-grepped 2026-07-30.
- **`existing-posts-promotion-plan.md`** — framework + schedule for promoting the 16 existing blog
  posts under the new brand's social handles. Per-post copy gets drafted closer to each slot.

## Two things block the cutover, neither in this repo

1. **`tenthgear.ai` has no A record** — nothing can be served on it.
2. ~~**No TenthGear visual identity exists** — no logo, no wordmark, no palette.~~ Placeholder mark bridged the cutover (2026-07-30); final logo + Palette C delivered 2026-09-03 and swapped in (`../../shared/brand-assets/`).

A copy-only sweep can run ahead of both and deploy to the existing domain, at the cost of splitting
the atomic deploy in two. Decide that deliberately rather than by accident.

## How to use this folder

- **Before the cutover:** add to the checklist as you find more places referencing the old brand.
- **On cutover day:** work `checklist.md` top to bottom in a single branch. Open one PR with the full
  cutover so the deploy is atomic. Update memory entries and skill docs afterward.
- **After:** once `existing-posts-promotion-plan.md` is fully executed, delete this folder or move it
  to an archive subfolder.

## For new content written between now and cutover day

Default to the current brand (RO.bot / ro-bot.io / RO.blog) per `../../../shared/brand.md`, which
stays RO.bot-canonical **by design** until cutover. If a piece will publish very close to the
cutover, ask Dave whether to use the old name, the new name, or a placeholder. **Do not
pre-emptively switch to TenthGear without Dave's explicit go-ahead** — the rebrand is not public, and
the social handles are not claimed, so leaking it early costs squatting exposure.
