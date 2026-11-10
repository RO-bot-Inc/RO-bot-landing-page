# Gated content upgrade: email-for-worksheet on a blog post

**Status:** Shipped (parts markup post, PRs #165, #167, #168)
**Date:** 2026-11-09
<!-- recurrence: hits=1 prs=#165,#167 guard=none -->

## Context
The warranty parts markup post offers a Google Sheet worksheet for an email. A Netlify form stores the lead; `netlify/functions/submission-created.mts` emails the visitor a Sheets copy link and an Excel export link through Resend.

## What Worked
- **`submission-created` is the event hook:** one per site, runs only on verified non-spam submissions, branches on `payload.form_name`. The links live only in the function, never in page source, so the gate holds.
- **One Google master, two links:** `.../d/{id}/copy` (forces the visitor's own copy) and `.../d/{id}/export?format=xlsx`. Both need the sheet's general access set to "Anyone with the link: Viewer". Without it the xlsx link returns 401.
- **Daily cap per address** (Netlify Blobs, sha256 key, fails open), so the form can't be used to flood an inbox from Dave's domain.
- **Building the sheet:** the service account can't create Drive files (no storage). Dave creates a blank sheet and shares it as Editor; then a googleapis script (from `app/node_modules`, key `~/.sheet-sync-key.json`) does the build. `repeatCell` with a formula fills relative refs down the way a drag would, so 1,000 rows of formulas cost one request. Keep formulas Excel-safe (no ARRAYFORMULA).

## What Didn't
- **Netlify renders only one reCAPTCHA widget per page.** Every blog post already has the footer newsletter form with `data-netlify-recaptcha`, so a second reCAPTCHA form gets no widget. Its submits come back as a 303 to the same page: no error, no submission, not even in spam. The worksheet form now has no reCAPTCHA (honeypot plus Netlify spam filter plus the daily cap).

## Agent Mistakes to Prevent
- Don't assume a Netlify form works because the build detected it. Submit it on the live site (headless is fine) and check `listSiteForms` for `submission_count`.
- Don't carry claims from a mockup into the asset unchecked. The mockup said Illinois names a total-over-total method; the statute only says "average percentage markup".
- Claude can't run `newsletter:announce`: auto mode blocks it. Hand Dave the `!` command, and pipe the slug in for `--send`.

## References
- Code: `netlify/functions/submission-created.mts`, `src/pages/worksheet-thanks.astro`, the `#ro-sample-worksheet` block in `src/content/blog/warranty-parts-markup-increase.md`
- Sheet: https://docs.google.com/spreadsheets/d/1XOsZ6S4_WjZi9JIHuMyYOzEscoGyC7sECqzaEVis0ew/edit
