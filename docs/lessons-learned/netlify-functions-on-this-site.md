# Netlify Functions on this site: real limits, silent CLI failures

**Status:** Shipped (Future Headline, PR #108; env/context section from #120 and the Leak Test cutover)
**Date:** 2026-09-18 (env section added 2026-09-21)
<!-- recurrence: hits=2 prs=#108,#120 guard=n/a: limits documented in docs/future-headline-runbook.md; the split-request pattern is the fix -->

## Context
First server-side code on the marketing site: a Netlify Function v2 calling two AI providers per request. Built on the docs' stated limits; the deploy preview disagreed.

## What Worked
- Functions v2 (`netlify/functions/*.mts` with `config.path`) work on a plain static Astro site with no adapter. Local dev: build, then `netlify dev --framework '#static' --dir dist` (Astro 7 `astro dev` daemonizes under non-interactive shells and netlify dev gives up).
- Rendering the final artifact in the browser (canvas + self-hosted woff2) instead of Sharp on Lambda: fonts are guaranteed, the function payload stays small, and the output is identical in mock and live mode.
- HMAC-signed tickets let a two-step flow pass server-only data (a scene brief) through the client without trusting it.

## What Didn't
- **Synchronous functions on this site stop at about 30 s, not the documented 60 s.** Two of six live generations died at 30.6 s on the deploy preview. Fix: split into requests that each budget 26 s.
- Env var changes need a redeploy to reach functions; a "kill switch" env var is therefore a two-minute switch, not instant. Revoking the provider key is the instant one.

## Environment variables and contexts
- **This site has three contexts — production, deploy-preview, branch-deploy — and a key set in one is absent in the others.** Future Headline ran in MOCK mode on production from its 2026-09-19 merge until 2026-09-21 because `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` and `FH_SIGNING_SECRET` were set in deploy-preview and branch-deploy only. The symptom is silence: canned headlines, the photo untouched, no error anywhere. Set every key in all three contexts (one context per call, no `--scope`).
- **Both features expose a mode endpoint; check them on tenthgear.ai after any merge that touches keys.** `GET /api/future-headline` and `GET /api/leak-test` each report their own `mode`/live integrations — one being live says nothing about the other.
- **`netlify env:get` never returns a value.** Secret-marked vars read back as a mask (`****…xxxx`, 20 chars); unset vars return a "No value set …" sentence (~78 chars). Probing a provider key with it is meaningless; verify a write by length (`netlify env:get … | wc -c`), not by content.
- **`netlify env:set` exits 0 and sets nothing in several shapes.** `--scope functions`, and multiple contexts in one call, both no-op on this plan: one context per call, no `--scope`. A value piped out of `.env` (`grep | cut`) also silently failed, and `>/dev/null` hid it — build the value in a shell variable straight from the source file (e.g. the service-account key), pass that, then verify by length. `netlify api getEnvVars` shows the metadata (which contexts are set) that `env:get` cannot.
- **`.env` with no trailing newline silently corrupts the next append.** `printf '...' >> .env` glued a Firebase service-account JSON onto the end of the `NOTION_API_KEY` line: local Notion 401 ("Authorization header must use the format Bearer <token>") and the local store stuck on Blobs while production was fine. Diagnostic: `grep -c '^LT_FIREBASE_SERVICE_ACCOUNT=' .env` must be 1.
- **`netlify dev` reads `.env`, but a value already in the process environment wins.** An exported shell var quietly overrides the file you are editing.
- **`netlify logs:function` was removed:** `npx netlify logs --source functions --function <name> --since 10m` (it streams; run it in the background into a file and kill it after ~45 s). Every invocation logs a `Duration:` line, so the log is a timeline: a request that never invoked the function never arrived, which on a phone means the body never finished uploading (see `future-headline-latency.md`).
- Netlify builds occasionally fail with a bare `Timeout` error_message. Rebase and push to retrigger; auto-merge then proceeds.

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
