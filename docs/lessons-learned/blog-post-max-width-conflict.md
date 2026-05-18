# BlogPost.astro `max-w-3xl` was silently overridden by `max-w-none` for months

**Status:** Shipped
**Date:** 2026-05-17

## Context
While shipping a new blog post with a designed two-column visual element, noticed the entire post body was rendering at the full container width (~1216px at desktop 1280px viewport) instead of the apparent intent of `max-w-3xl` (768px). `BlogPost.astro:121` had both classes on the same element: `max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-lg prose-gray max-w-none`. The `max-w-none` (added to override Tailwind Typography's default `max-width: 65ch`) was winning over the explicit `max-w-3xl`, so every blog post on the site had been rendering full-width for an unknown period. Fixed by removing `max-w-none` and switching to `max-w-5xl` (1024px) per editorial preference (midpoint between full-width and 65ch).

## What Worked
- Playwright `boundingBox()` measurement was the fastest way to confirm "yes the body really is rendering at 1216px, not 768px" — eliminated the "maybe the design block is the problem" hypothesis in one shot.
- Testing the fix on a second post (`warranty-audit-playbook`) before claiming "site-wide" — confirmed the change affected all posts via the layout, not just the one I'd been editing.

## What Didn't
- The conflict was easy to miss because both classes were on the same line and the developer who wrote it (or me, later) clearly *thought* `max-w-3xl` would constrain the body. The conflict is silent — no Astro/Tailwind warning, no compile error. The bug has been live since the layout was authored.
- Tried to debug from inside the post first (changing column widths, image cropping) before stepping back and noticing the whole body was wrong. Wasted iterations.

## Agent Mistakes to Prevent
- **When a design element renders "too wide," check the parent containers before tweaking the element's own widths.** The element may be fine; its container is leaking. `boundingBox()` on the closest `.prose` (or whatever the body container is) tells you in one call.
- **Don't combine `max-w-{size}` with `max-w-none` on the same element expecting the size to win.** Tailwind's compiled CSS orders utilities by class name, and `none` comes after numeric sizes alphabetically — so `max-w-none` wins. If you need `max-w-none` to override the prose plugin's default, you also have to choose your own max-width and apply it on a child or via an arbitrary value like `max-w-[768px]`.
- **For Astro + Tailwind Typography, the canonical pattern is:** put `prose prose-lg` on a container, and put your own `max-w-{size}` on an ANCESTOR if you want the body constrained — not on the same element as `max-w-none`.

## Reusable Pattern
- **Name:** Verify the body container's width before debugging children
- **Use when:** A page or component renders wider/narrower than expected and the structural CSS is mostly Tailwind utilities.
- **Key insight:** `playwright.locator(parentSelector).boundingBox()` is faster than reading source and reasoning about CSS specificity. One render check beats five lines of speculation.
- **Admission check:** Stack-specific (Astro + Tailwind + Typography plugin). Non-obvious (would not be discovered in an hour of reading the codebase — the conflict is silent and the file has been "working" for months). Worth a doc, not an INDEX row (no INDEX exists yet, and this is one of three Astro-stack lessons — premature to introduce structure).

## References
- Code: `src/layouts/BlogPost.astro:121`
- Fix commit: `ea8710c` (part of the `automotive-technician-retention` blog post PR #32)
