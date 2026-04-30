# Astro inline-script bundling silently breaks third-party tracking pixels

**Status:** Shipped
**Date:** 2026-04-30

## Context
Installed the Reddit Ads PageVisit pixel above the existing GA4 gtag block in `BaseLayout.astro`. The Reddit pixel was added with `is:inline`. Discovered that the *existing* GA4 block did not have `is:inline`, which meant Astro/Vite had been bundling it as `type="module"` in production for some time. Added `is:inline` to both GA4 scripts. Verified end-to-end with Playwright.

## What Worked
- Inspecting `dist/index.html` was sufficient to diagnose the bundling — no need for a live DevTools session to know what `typeof window.gtag` would return. Vite's minifier had renamed `function gtag` to `function a`, which is impossible to reach from outside the module.
- One-shot Playwright script (Bash + ephemeral `npm install --no-save playwright`) gave higher-fidelity verification than the user could have provided manually: confirmed `window.gtag` callable, `window.dataLayer` populated, AND that real beacons hit `google-analytics.com/g/collect` and `alb.reddit.com/rp.gif`.
- Splitting the work into two separate commits (Reddit add, then GA4 fix) kept the diff legible and let the GA4 fix carry a precise commit message about why pageviews kept working despite a broken install.

## What Didn't
- The bug had been latent for an unknown period. Pageview tracking masked it because GA4's async loader reads `window.dataLayer` regardless of whether `gtag` exists globally. Anyone trying to fire a custom event would have hit a silent `ReferenceError`. Lesson: "GA4 Realtime shows traffic" is NOT a sufficient health check for the install — must also verify `typeof window.gtag === "function"`.

## Agent Mistakes to Prevent
- **Don't add inline `<script>` tags to Astro `.astro` files without `is:inline` if the script defines globals or relies on top-level scope.** Astro's default behavior is to hoist them through Vite, which (a) wraps them as `type="module"`, scoping `function`/`var`/`let` declarations away from `window`, and (b) minifies identifiers, so even introspection won't find them. This breaks any third-party pixel, A/B test, chat widget, or analytics snippet that follows the standard `function name(){}` global pattern.
- **Don't trust a "diagnose then maybe fix" decision tree as a reason to skip the fix when static analysis is conclusive.** The minified output `function a(){...}` inside `<script type="module">` is mathematically incompatible with `typeof window.gtag === "function"`. No live browser check needed to confirm.
- **Don't trust GA4 Realtime as proof the install is healthy.** It only proves the dataLayer queue is being processed by gtag.js. The `gtag()` global can be entirely missing while pageviews still flow.

## Reusable Pattern
- **Name:** Always `is:inline` for third-party globals in Astro
- **Use when:** Adding any inline `<script>` to a `.astro` file whose body defines `window.X`, declares functions consumed elsewhere, or matches a vendor-supplied snippet (GA, GTM, Meta Pixel, Reddit, LinkedIn, Hotjar, Intercom, Segment, etc.).
- **Key insight:** The vendor's snippet was written assuming script-tag scope === global scope. Astro breaks that assumption silently. `is:inline` restores it.
- **Admission check:** Cross-project (any Astro site with tracking) ✓. Non-obvious (would not be discovered in an hour of reading our codebase — discovered only because we added a second pixel and noticed the pattern mismatch) ✓. → Worth a one-line entry in CLAUDE.md Part 9 (added).

## References
- Code: `src/layouts/BaseLayout.astro:69-83`
- Commits: `6c72eb1` (Reddit pixel add), `4a2d73d` (GA4 `is:inline` fix)
