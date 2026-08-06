# DMS Logo Pipeline (marquee section)

**Status:** Shipped (PR #76)
**Date:** 2026-08-05

## Context
The DMS integrations marquee (`src/components/DmsIntegrations.astro`) ships with favicon-derived brand marks in `public/dms-logos/` as stand-ins. Dave will supply final assets; this doc records how the current files were made and how to swap in finals.

## What Worked
- **Sourcing:** `https://www.google.com/s2/favicons?domain=<domain>&sz=128` (with `-L`; returns 301 first). Company-site `apple-touch-icon` scraping was mostly blocked or low-res.
- **White-circle treatment is baked into the PNG files, not CSS.** Marks with dark or opaque-white backgrounds are composited onto a white circle with PIL (trim borders → resize to ~60% of canvas → paste on white ellipse → circular alpha mask → 128px output). Circled: reynolds, dealertrack, pbs, quorum, autosoft, dealerbuilt, dominion. Bare (transparent sources): automate, tekion, cdk.
- CDK renders logo-only (no text label) at 1.2x — its mark contains the wordmark.
- Marquee loop: duplicate the platform list once, animate `translateX(-50%)`; use `margin-right` on items instead of flex `gap` so the -50% wrap point is exact (gap adds a half-gap jump at the seam). Duplicates are `aria-hidden` and `display: none` under `prefers-reduced-motion`.

## What Didn't
- **Clearbit logo API is dead** (`logo.clearbit.com` no longer resolves). Don't reach for it.
- Favicon JPEGs (Reynolds, PBS via Google) can never be transparent; several PNGs ship opaque white backgrounds.

## Agent Mistakes to Prevent
- Don't apply circle masking in CSS and assume it worked — sources with baked-in white backgrounds still show white *squares*. Check corner alpha first (PIL: corner pixels opaque-white vs transparent), then bake the circle into the file.
- PIL `thumbnail()` only shrinks; small favicons need `resize()` to scale up into the circle.

## Swapping in final assets
Replace `public/dms-logos/<slug>.png` (128px square). Transparent light-on-dark-legible marks go in as-is; anything dark or white-backed gets the circle treatment:

```python
from PIL import Image, ImageDraw, ImageOps
def white_circle(src, dst, logo_scale=0.6, S=512):
    im = Image.open(src).convert("RGBA")
    flatten = Image.alpha_composite(Image.new("RGBA", im.size, (255,255,255,255)), im).convert("RGB")
    bbox = ImageOps.invert(ImageOps.grayscale(flatten)).getbbox()
    if bbox: im = im.crop(bbox)
    k = int(S*logo_scale) / max(im.size)
    im = im.resize((round(im.width*k), round(im.height*k)), Image.LANCZOS)
    canvas = Image.new("RGBA", (S,S), (0,0,0,0))
    ImageDraw.Draw(canvas).ellipse([0,0,S-1,S-1], fill=(255,255,255,255))
    flat = Image.alpha_composite(Image.new("RGBA", im.size, (255,255,255,255)), im)
    canvas.paste(flat, ((S-im.width)//2, (S-im.height)//2), flat)
    mask = Image.new("L", (S,S), 0); ImageDraw.Draw(mask).ellipse([0,0,S-1,S-1], fill=255)
    canvas.putalpha(mask)
    canvas.resize((128,128), Image.LANCZOS).save(dst, optimize=True)
```

## References
- Code: `src/components/DmsIntegrations.astro`, `public/dms-logos/`
- PRs: website #76 (section), #77 (FAQ reconciliation); shared #38 (product-facts entry)
