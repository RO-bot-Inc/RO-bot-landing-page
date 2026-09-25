# Phone-first event pages: scaling up for desktop without a second layout
<!-- recurrence: hits=1 prs=#128 guard=none -->
**Status:** Shipped   **Date:** 2026-09-23

## Context
The four `/ai-summit/` pages were built phone-first with fixed px sizes (520 to 820 px columns, phone type). On a monitor they sat small in the middle of the screen; Dave asked for every page to look right on both.

## What Worked
- **Every px length in the page stylesheet became rem, then three root-size steps scale the whole layout.** `html { font-size: 18px }` at 1024 px, 20 px at 1440, 22 px at 1800. Containers, type, borders, spacing and box shadows all grow together; the phone rendering at 16 px is byte-identical (full-page screenshots before/after matched on three pages; 226 antialiasing pixels on the fourth).
- **Mechanical conversion, not a redesign.** A 40-line script converted the `<style is:global>` block of each page (media-query params, the Calendly iframe height that Calendly sets in px itself, and the honeypot offset stayed px). Two hours of layout work would have produced a second layout to maintain.
- **Verification by screenshot diff.** Playwright full-page captures at 390 px before and after, compared pixel-for-pixel in a headless canvas (`pngdiff` in the session scratchpad), proved the phone layout untouched.

## What Didn't
- `clamp(44px, 13vw, 56px)` style rules only scale their px bounds; the vw middle does not. Fine here, but check each clamp.

## Agent Mistakes to Prevent
- Don't add a desktop breakpoint that only widens `max-width`: a wider column of phone-sized type looks worse, not better. Scale the root or do nothing.

## Reusable Pattern
- **rem-everything plus root steps** / Use when a phone-first page with px sizes needs to read well on desktop and a second layout is not worth maintaining / Convert px to rem inside the page stylesheet, keep media-query params and any px a third party sets, then step `html { font-size }` at 1024 / 1440 / 1800.
- **Admission check:** any project, but a front-end engineer would reach for it inside an hour. No INDEX row.

## References
- Code: `src/pages/ai-summit/index.astro`, `future-headline.astro`, `leak-test/index.astro`, `leak-test/resume.astro` (root steps at the end of each style block)
- PR: #128
