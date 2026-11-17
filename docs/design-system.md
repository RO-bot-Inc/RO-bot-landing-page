# Website Design System

Reusable visual patterns for tenthgear.ai. Brand facts (logo, Palette C, banned visuals) live in `../shared/brand.md`; this file is for how the site applies them. One section per pattern: the rule, the values, where it is live, and why.

---

## Device mockups (laptop and phone frames)

**Rule:** Every illustrated device on the site (laptop lid and base, phone body) uses a graphite frame with a soft white glow. Never a charcoal or black frame.

| Part | Value |
|---|---|
| Frame body (laptop lid, phone body) | `#706e6f` |
| Laptop base | `linear-gradient(#7d7b7c, #555354)` |
| Laptop base notch | `#4a4849` |
| Edge highlight | `inset 0 0 0 1px rgba(255,255,255,.5)` |
| Glow, on dark backgrounds | `box-shadow: 0 0 70px 6px rgba(255,255,255,.22)` |
| Glow, on a laptop with its own shape | `filter: drop-shadow(0 0 30px rgba(255,255,255,.3))` |

No dark drop shadow under the device; the glow replaces it. Screens stay white (or the app's own dark UI) inside the frame.

**Live in:** `src/styles/mpi.css`, the /mpi/ hero (`.lap1`, `.hp`) and the four how-it-works steps (`.photo .phone`, `.photo .laptop`).

**Why (Dave, 2026-11-17):** charcoal `#333132` frames disappeared into the navy hero. Light silver `#c9c7c8` stood out but read too light. Graphite was picked from three shades as the darkest that still separates from navy. On photo backgrounds the glow barely shows; the frame color does the work, and the same treatment keeps devices consistent across the page.

**Note:** `#706e6f` sits between Palette C's charcoal and mid grey. It is a hardware rendering color, not a brand fill, so it does not extend the palette.
