# Footage behind a CSS animation, and recording animations to MP4
<!-- recurrence: hits=1 prs=#206 guard=none -->
**Status:** Shipped   **Date:** 2026-11-17

## Context
/mpi/ step 2's phone screen got AI shop footage (cabin filter, belt, battery) behind its CSS caption/card animation, and every product animation on the site was screen-recorded to MP4 for the asset library.

## What Worked
- **One clip cut to the animation's timeline**, not one looping clip per shot: segment boundaries at the caption keyframe percentages × cycle length (10.91s), 0.25s dissolves, clip length = cycle length.
- **Lock the video to the CSS clock**: read `el.getAnimations()[0].currentTime % cycle` and re-seek the video when drift > 0.12s (on `playing` + every 1s). A late-loading video recovered from a forced 4s offset within a second. Code: `src/pages/mpi.astro`.
- Subtle motion from Kling image-to-video: trim to ~2.6s, slow 2× with `setpts`, dim with `filter: brightness(.72)` so overlays stay primary.
- Reduced motion: hide the `<video>`, show the poster as a background.
- Verify sync by pausing every animation (`document.getAnimations()`) at t = 0..cycle and reading computed opacities, not by eyeballing a recording.

## What Didn't
- Three independently looping clips cross-faded by CSS: the cuts matched the captions, but the footage's motion never lined up with the cards, and a late video drifts. Dave: "needs to be synced up".
- Playwright `recordVideo` with `deviceScaleFactor: 2` and `size` = 2× viewport: the page fills only the top-left quarter and the rest is grey padding. Record with `size` equal to the viewport (1×).

## Agent Mistakes to Prevent
- Don't sync footage to an animation by sharing a duration alone; cut it to the timeline and lock it to the clock from the start.
- Don't trust a crop of a recording before looking at a contact sheet of it (`fps=0.5,tile=8x1`).
- Flex rows on comparison boards stretch images vertically (`align-items: stretch`); set `align-items: flex-start`.

## References
- Code: `src/pages/mpi.astro` (clock lock), `src/styles/mpi.css` (`.vf .v2c`), `public/videos/mpi/step2.mp4`
- PRs: #206. Device frame pattern: `docs/design-system.md`.
