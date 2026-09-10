# Blog subscribers: Netlify form to Resend Broadcast

**Status:** Shipped
**Date:** 2026-09-10
<!-- recurrence: hits=1 prs=#96,#99 guard=n/a: operational runbook, docs/newsletter-runbook.md -->

## Context
The subscribe bar had collected into Netlify Forms for a month with nothing reading it. Built `scripts/newsletter.mjs` (sync form to a Resend segment, send each post as a Broadcast) instead of adding an ESP or a Netlify Function. How-to lives in `docs/newsletter-runbook.md`; this doc is the why and the traps.

## What Worked
- **Sync at send time, not on signup.** `--send` runs the sync first, so no real-time bridge, no secret on Netlify, one code path. Revisit only if a welcome email is wanted.
- **Reuse what the workspace already owns.** Resend Pro, a verified sending domain, and the rebrand blast's segment-sync rules (additive, never touch `unsubscribed`) were all in place. No new dependency: plain `fetch` against both REST APIs, body field names copied from the resend SDK.
- **Reading the Netlify submissions before designing** changed the spec: 3 of 7 rows were bots with an EMPTY email. Bots POST straight to the form endpoint and skip the browser's `required`, so the sync validates addresses itself.

## What Didn't
- **Resend key scopes are a trap.** A "sending access" key 401s on `/segments` with "This API key is restricted to only send emails". Segment sync needs a Full-access key; the first key Dave created was sending-only and cost a round trip. The runbook now says so in the secret row.
- **Dave pasted the key under its own name** (`website-newsletter=...`) rather than into the `RESEND_API_KEY=` placeholder. When handing over a file for a secret paste, say exactly which line to replace, and re-read the file's key NAMES (values redacted) before running anything.

## Agent Mistakes to Prevent
- Don't write `\w` inside a JS template literal that builds a `RegExp`; it becomes a bare `w`. CodeQL caught the dead lookahead. Build regex sources with string concatenation.
- Don't trust a Playwright MCP screenshot of the `astro preview` server; it came back blank twice while DOM measurements were correct. Verify layout with `getBoundingClientRect` and move on.
- Don't describe an artifact to Dave by a name he never used ("the five email drafts"); name the folder (`docs/distribution/`) and what is in it.

## Decisions (Dave, 2026-09-10)
- Sender stays `dave@tenthgear.ai`. The newsletter shares the domain's reputation with personal mail but at this volume cannot hurt it; move to `news.tenthgear.ai` at a few hundred subscribers or the first spam complaint.
- Single opt-in. The thank-you page already says "You're on the list."
- Drafts written before the list existed live in `docs/distribution/archive/` so the script cannot send them.

## References
- Code: `scripts/newsletter.mjs`, `src/layouts/BlogPost.astro`, `docs/newsletter-runbook.md`
- PRs: website #96 (script + post-page subscribe bar), #99 (archive), shared #55 / #56 (deployment facts, Postmaster)
