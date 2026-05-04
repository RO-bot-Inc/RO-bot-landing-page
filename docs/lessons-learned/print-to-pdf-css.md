# Print-to-PDF CSS for Chrome (HTML one-pagers)

**Status:** Shipped (Castrol partner mockups, mockups/castrol-partner/)
**Date:** 2026-05-04

## Context
Built three letter-size HTML one-pagers designed to be reviewed on screen and printed-to-PDF for distribution. Needed clean page breaks, top margins on every page, and a running footer with page numbers on each page. Hit several Chrome print-rendering quirks that diverged from the CSS Paged Media spec.

## What Worked
- `@page { size: letter; margin: 0.55in 0.6in; }` for symmetric margins on every page.
- `print-color-adjust: exact` (and `-webkit-` prefix) on `*` to force backgrounds and accent colors to render in print.
- Forced page breaks via `page-break-before: always` on a heading element with a class hook.
- `.print-page` flex-column wrappers around each page's content with `min-height: calc(11in - 1.1in)` and `margin-top: auto` on the footer to push it to the bottom of each page.
- Hardcoded "Page 1 / 2" / "Page 2 / 2" strings in two separate footer divs.

## What Didn't
- **`position: fixed` for footers does not reliably repeat across printed pages in Chrome.** The element appears in flow-position on the first page, then either disappears or stays fixed to the screen viewport instead of each page. Spec says fixed elements should repeat per page; Chrome's print engine doesn't honor it.
- **`counter(page)` and `counter(pages)` returned `0 / 0`** when used inside a `::after` content rule. These counters are only reliable inside true `@page` margin boxes (`@bottom-center` etc.), which Chrome doesn't fully support.
- **First-pass print CSS hid `.stage` to remove the screen background**, but `.page` was nested inside `.stage`, so the page itself disappeared — print preview rendered as a blank gray box. Always trace the DOM tree before applying `display: none` in print rules.
- **Negative `bottom` values** (e.g. `bottom: -0.4in`) on a fixed footer were positioned relative to the page area (inside `@page` margins), not the paper edge — so what should have hung in the bottom margin actually appeared in the wrong place.

## Agent Mistakes to Prevent
- Don't reach for `position: fixed` + `counter(page)` to build print headers/footers in Chrome. The MDN/spec guidance is misleading. Use the `.print-page` flex-wrapper pattern below instead.
- Don't `display: none` an ancestor of the `.page` element in print rules. Hide siblings (toolbar, debug overlays) only.
- Don't assume `@page` margin boxes (`@top-left`, `@bottom-center`) work in Chrome. They don't.
- Don't trust on-screen padding to translate to print — `@page` margin handles paper edges; `.page` padding doubles up unless explicitly set to 0 in print.

## Reusable Pattern
- **Name:** Multi-page print-to-PDF wrapper
- **Use when:** Building HTML assets meant to be printed to PDF in Chrome with predictable page breaks and a footer on every page.
- **Key insight:** Wrap each page's content in a `.print-page` flex-column with `min-height` matching the print page area (paper height minus `@page` top+bottom margins). Use `margin-top: auto` on the footer to push it to the bottom of its page. Hardcode page numbers; don't rely on CSS counters.
- **Admission check:** Cross-project (any HTML print asset) and non-obvious (standard advice fails) — qualifies for an INDEX row if/when one exists.

```css
@media print {
  @page { size: letter; margin: 0.55in 0.6in; }
  .print-page {
    display: flex !important;
    flex-direction: column !important;
    min-height: calc(11in - 1.1in) !important;
  }
  .print-page.break { page-break-before: always; break-before: page; }
  .print-page > .footnote { margin-top: auto !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
```

```html
<div class="print-page">
  <!-- page 1 content -->
  <div class="footnote"><span>...</span><span>Page 1 / 2</span></div>
</div>
<div class="print-page break">
  <!-- page 2 content -->
  <div class="footnote"><span>...</span><span>Page 2 / 2</span></div>
</div>
```

## References
- Code: `mockups/castrol-partner/direction-a.html` (canonical implementation)
- Related: `mockups/castrol-partner/direction-b.html`, `direction-c.html`
- Memory: `project_channel_partner_assets.md` for the asset templates themselves
