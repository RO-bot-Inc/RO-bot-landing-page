# Netlify Functions on this site: real limits, silent CLI failures

**Status:** Shipped (Future Headline, PR #108)
**Date:** 2026-09-18
<!-- recurrence: hits=1 prs=#108 guard=n/a: limits documented in docs/future-headline-runbook.md; the split-request pattern is the fix -->

## Context
First server-side code on the marketing site: a Netlify Function v2 calling two AI providers per request. Built on the docs' stated limits; the deploy preview disagreed.

## What Worked
- Functions v2 (`netlify/functions/*.mts` with `config.path`) work on a plain static Astro site with no adapter. Local dev: build, then `netlify dev --framework '#static' --dir dist` (Astro 7 `astro dev` daemonizes under non-interactive shells and netlify dev gives up).
- Rendering the final artifact in the browser (canvas + self-hosted woff2) instead of Sharp on Lambda: fonts are guaranteed, the function payload stays small, and the output is identical in mock and live mode.
- HMAC-signed tickets let a two-step flow pass server-only data (a scene brief) through the client without trusting it.

## What Didn't
- **Synchronous functions on this site stop at about 30 s, not the documented 60 s.** Two of six live generations died at 30.6 s on the deploy preview. Fix: split into requests that each budget 26 s.
- **`netlify env:set ... --scope functions` (and multi-context in one call) exits 0 and sets nothing** on this plan. Set one context per call, no `--scope`, then verify via `netlify api getEnvVars` (secrets read back masked, so compare metadata, not values).
- Env var changes need a redeploy to reach functions; a "kill switch" env var is therefore a two-minute switch, not instant. Revoking the provider key is the instant one.

## Agent Mistakes to Prevent
- Don't trust a hosting limit from docs or research for anything latency-bound; measure it on a deploy preview before designing around it.
- Don't put a bearer token in a page URL on a site that loads GTM/GA4: the full URL ships to analytics. Use the URL fragment or load the page without the tag.
- Don't read `.env` in a Bash command (blocked); pass values through shell substitution so they never enter the transcript.

## Reusable Pattern
- **Measured-budget split** / Use when a function chain of external calls may exceed the platform cutoff / Do the fast step first, return a signed ticket, let the client call the slow step, degrade gracefully if it fails.
- **Admission check:** Netlify-specific numbers; the pattern is general but obvious once the limit is known. No INDEX row.

## References
- Code: `netlify/functions/future-headline.mts`, `netlify/lib/future-headline/guard.ts`
- Runbook: `docs/future-headline-runbook.md`
