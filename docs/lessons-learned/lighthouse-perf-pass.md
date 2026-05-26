# Lighthouse Performance Pass

**Status:** Shipped (PR #37)
**Date:** 2026-05-26

## Context

Homepage was scoring 83 in Chrome DevTools Lighthouse (and 67 in the headless CLI). Initial payload was 7.2 MB dominated by unconverted PNGs and a 4.3 MB autoplay video. Goal: lift the score and cut the payload without changing any visuals.

Shipped: 21 PNG/JPG → WebP at appropriate dimensions, hero video re-encoded 28x smaller, LCP preload + width/height + decoding hints, Netlify cache headers, OEM marquee seam fix. Apples-to-apples Lighthouse: **67 → 86**, page weight 7.2 MB → 576 KB (92% smaller).

## What Worked

- **Astro `is:inline` was already in place** — no regressions to GA/Reddit pixels during the work.
- **`cwebp` with `-resize <width> 0` preserves aspect** — set only width, height computes automatically. Quality 70-85 was visually lossless for every image type tested (photos, logos, screenshots, hero backgrounds).
- **Stripping audio from a muted video** (`-an`) saved a meaningful slice of the encode and is invisible in HTML.
- **Per-file `width`/`height` HTML attrs** (not CSS) are what Lighthouse's "no explicit dimensions" audit checks. Even with `object-cover` overriding the displayed size, the attrs satisfy the audit and prevent CLS.
- **Establishing a like-for-like Lighthouse baseline first** caught a measurement artifact that almost looked like a regression (see Mistakes below).

## What Didn't

- First image audit was case-sensitive (`.png` lowercase) and missed three big `.PNG`-uppercase refs in `Solution.astro` totalling ~2.9 MB. Lighthouse round 1 still flagged "Improve image delivery" because of them. Re-ran the audit with case-insensitive grep.
- First marquee seam fix used 2 groups with `gap-16 + pr-16` math. Worked at viewports ≤ 1715px (one group's width) but left a visible empty stretch on 2560px+ monitors. Required a second iteration to bump to 3 groups + `translateX(-33.333%)`.

## Agent Mistakes to Prevent

- **Don't grep image refs case-sensitively.** Always use `grep -i` or include `[Pp][Nn][Gg]` when auditing static assets — `.PNG` uppercase is common from camera/Apple exports.
- **Don't assume `npx serve dist -l <port>` bound the port.** If another process already owns the port (e.g., an existing `astro dev` from a prior session), `serve` silently exits and your `curl` succeeds against the OTHER process. Always `lsof -ti :<port>` before relying on the new server's output. Better: use a deliberately-unused port for tests.
- **Don't compare DevTools Lighthouse to CLI Lighthouse.** The DevTools panel uses Chrome's built-in throttling profile, which is more lenient than the headless CLI's simulated 4G. A score of "83" in DevTools may be "67" via CLI on the same machine. Always re-baseline with the same tool, same machine, before drawing improvement conclusions.
- **Don't assume `astro preview` measures like production.** It serves over HTTP/1.1 with no gzip and no CDN edge. Local-preview Lighthouse will undershoot the eventual Netlify deploy. Useful for relative comparisons; misleading as an absolute target.
- **Don't assume the standard 2-copy CSS marquee is seamless.** It only works when viewport ≤ group_width. On wider viewports, the loop point exposes empty space. See the N-group marquee pattern below.

## Reusable Patterns

### N-Group Seamless CSS Marquee (CROSS-PROJECT — own file in shared/)

See `../../shared/lessons-learned/n-group-css-marquee.md`.

### WebP Conversion Cheat Sheet (Astro-stack-specific)

For an Astro static site where images are referenced from `.astro` components:

```bash
cwebp -quiet -q <Q> -resize <WIDTH> 0 input.png -o output.webp
```

Quality recommendations per image type:
- Photo / textured background, large display: `-q 60` (heavy compression OK)
- Photo / textured background, overlaid by dark scrim: `-q 70` (overlay hides artifacts)
- Product screenshot / UI mockup (sharp edges, text): `-q 82-85`
- Logo with alpha (PNG with transparency): `-q 85`, keep transparency

Right-sizing rule: target width = (max displayed CSS width in px) × 2 for retina. Anything larger is wasted bytes; anything smaller looks blurry on hi-DPI.

Per-page LCP preload (cleanest pattern in this Astro setup): add a `preloadImage?: string` prop to `BaseLayout`, then `<link rel="preload" as="image" href={preloadImage} fetchpriority="high">` in the head. Each page sets the prop to its above-the-fold image; pages without one omit the prop entirely.

## References

- PR: https://github.com/RO-bot-Inc/RO-bot-landing-page/pull/37
- Commit: `93e0b96`
- Files touched: `src/components/{BrandLogos,Hero,Solution,Testimonial}.astro`, `src/layouts/BaseLayout.astro`, `src/pages/{index,product}.astro`, `netlify.toml`, 21 new `.webp` files, `public/hero/waveform-white-on-black.mp4` re-encoded.
