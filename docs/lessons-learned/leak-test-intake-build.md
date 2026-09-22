# RO Leak Test intake: building stateful flows on this static site

**Status:** Shipped and cut over (PRs #111–#125; 2026-09-19 to 21)
**Date:** 2026-09-20 (cutover section added 2026-09-21)
<!-- recurrence: hits=1 prs=#113 guard=scripts/leak-test-flow.mjs (mock-mode end-to-end flow, run before every push) -->

## Context
First multi-step, multi-writer feature on the marketing site: private workspace behind a resume token, browser-to-GCS uploads, Calendly booking detection, two scheduled jobs, a Notion mirror. Netlify Blobs holds the records until the dedicated Firebase project exists. Codex blocked #113 three times before passing; the recovery Workflow and a seeded skeptic pass found a P0 the gate had not reached.

## What Worked
- **One `store.update(id, mutate)` for every write that can race.** Blobs `getWithMetadata` + `setJSON(..., { onlyIfMatch: etag })`, Firestore `PATCH ?currentDocument.updateTime=`, retry with jitter. Every precondition (record open, presenting token live, limits) is re-decided on the fresh copy inside the mutator, never on the snapshot the handler read first. The local `netlify dev` Blobs sandbox returns no etag: fall back to an unconditional write there, and say so.
- **Compensating actions only for the irreversible step.** In a job that claims, sends, then logs: a failed send releases the claim and retires only that token; a failed log after a delivered email is logged and left alone. `deliver()` never fails an enrollment whose email already went out.
- **Every stand-in is explicit.** `GET /api/leak-test` reports which integrations are live; `uploads` is `'gcs' | 'mock' | 'off'`, never a silent default. Production says "File upload isn't open yet" instead of simulating a transfer.
- **The flow script is the test suite.** No unit framework here; `scripts/leak-test-flow.mjs` drives the whole product in `LT_MODE=mock` and asserts the security properties (repeat enrollment returns no ticket, an admin ticket cannot drive `fix`). It refuses to run against a live-email server.
- **Every HMAC ticket carries an `aud` and every reader names the one it accepts.** A ticket minted for one screen can never satisfy another reader.

## What Didn't
- **Fixing the flagged handler only.** Round 1 fixed the API mutators; round 2 blocked on the same class in the scheduled jobs and the enrollment paths. Sweep the predicate ("any read-modify-write of this record") over every writer, jobs included, before pushing.
- **The fix diff as new surface.** The `adopt()` merge added for a P2 sweep introduced a client-side ordering race that Codex blocked as a P1 one round later. Responses now apply in send order and never drop a transfer the tab still owns.
- **My own P0 fix broke revoke.** Gating re-enrollment and fresh-link on "any live token" made Dave's revoke permanent and would have spawned duplicate intakes and Notion rows. Revoke means "kill the current links"; only the purge closes an intake.
- **`netlify dev` loads `.env`.** A local flow run sent real Resend email and hit Notion. `LT_MODE=mock` is mandatory for local runs; the script now checks the server's mode first.
- **Stacked branches on a squash-merging repo.** Twice a branch cut from an open PR's branch showed conflicts once that PR squash-merged; for files the later branch rewrote wholesale, `git checkout --ours` after `git merge origin/main` is the resolution. Check `git status` for `UU` before committing: a piped build hid a failed build once and conflict markers reached the remote.

## Cutover, 2026-09-20/21
Firebase project `tenthgear-leak-test` created; Firestore + GCS live in every Netlify context. What the live run taught, beyond the mock-mode build:

- **The upload layer needed zero fixes on first contact with real GCS.** 617 B PDF as a single PUT; 27 MB CSV in 8 MB chunks (308 per chunk); pause/resume and reload + re-pick both resumed at byte 8388608 via the `Content-Range: bytes */size` probe; V4 signed downloads matched sha256. Mock mode modeled the protocol, not just the happy path, and that is why it held (#116).
- **A third-party inline embed collapsed to 150 px because the parent had no definite height.** Calendly's injected iframe is `height:100%`; `#rs-cal` had only `min-height:640px`, which is not a definite height, so every browser fell back to the iframe default 150 px — header and avatar visible, no calendar. Fix: a real `height:700px` on the container plus following Calendly's `calendly.page_height` postMessage to resize (`src/scripts/leak-test/resume.ts`, `src/pages/ai-summit/leak-test/resume.astro`). Found on the first real booking, from Dave's iPhone, after the automated checks were green (#116). Cross-project write-up: `../../../shared/lessons-learned/iframe-embed-definite-height.md`.
- **Headless Chromium never renders that calendar at all.** Calendly bot-gates headless; `chromium.launch({ headless: false, channel: 'chrome' })` renders it. Cloudflare Turnstile (managed mode) challenges scripted browsers and the server rejects a missing token, so scripted end-to-end flows need `LT_MODE=mock`; for local runs against live keys, Cloudflare's always-pass test secret `1x0000000000000000000000000000000AA` works.
- **Bookings made on Calendly's own page (the fallback link) post no message, so nothing detected them.** `resume` now reconciles against the Calendly API — `/users/me`, `/scheduled_events?invitee_email=&status=active&min_start_time=`, `/invitees` — throttled by `booking.checkedAt` (10 min) (#118).
- **The kill switch worked and the copy didn't.** With `LT_ENABLED=false` the page showed the generic "between signals" connection message instead of "Enrollment is paused": `GET /api/leak-test` already answered `{error:'disabled'}` 503, but `fetchConfig()` threw a generic error and the UI could not tell the two apart. Rehearse a kill switch end to end, not just the endpoint (#118).
- **Retention purge ran for real.** Delivered date set in Notion → the job deleted the GCS object, revoked links, cleared notes, logged back to Notion; `markPurged` also had to zero the Notion Files/Links counts (#121). Bucket lifecycle rule deletes after 180 days as a backstop behind the 60-day purge. `gsutil` needed an isolated config to set it (`BOTO_CONFIG` pointing at a file with `gs_service_key_file`, `CLOUDSDK_CONFIG` an empty dir) — the machine's gcloud login makes plain `gsutil` refuse with "multiple types of configured credentials".
- **A text-only email with one long tokenized link gets filed as spam even when every auth check passes.** A tester's Yahoo spam-filed the enrollment email with SPF/DKIM/DMARC all passing and Google Postmaster fully compliant ("not enough outgoing email" to even have a reputation). The cause was shape, not auth: text-only mail built around a long token URL from a young `send.tenthgear.ai` subdomain. Every participant email now also carries a minimal HTML part (`textToHtml` in `netlify/lib/leak-test/email.ts`, links as real anchors, same words), opener softened (#124).
- **GA4 DebugView without touching the site:** drive pages with Playwright and rewrite every `/g/collect` request through `context.route` to append `_dbg=1`. Each new browser context shows up as its own "Debug Device"; `aas_resume_open` lands a few seconds after the page view.
- **Copy ruling (#116, #122, #125):** the TenthGear team is the actor on every participant surface; "Dave" only signs emails. Repeat enrollment reads "The email X is already enrolled. We just sent you a fresh private link to that address."; the enrolled screen carries a spam hint.

## Agent Mistakes to Prevent
- Don't chain `git commit`/`git push` after `npm run build | tail`; the pipe hides the exit code. Build to a log file and test `$?`.
- Don't run `netlify dev` for tests without `LT_MODE=mock` when `.env` has real keys.
- Don't gate recovery paths (fresh-link, re-enroll) on token liveness; gate them on purge only.
- Don't hand-fix a Codex finding on this repo: run `/codex-fix` (the Workflow script must be copied under the working directory, e.g. `tmp/`, or the tool refuses it).
- Don't treat `netlify env:get` output as a value. Secret vars read back as a mask (`****…xxxx`, 20 chars) and unset ones as a "No value set …" sentence (~78 chars); neither is the value, so probing a provider key with it proves nothing. Verify a write by length (`env:get … | wc -c`), not by content.
- Don't say "every integration is live" from one feature's status. `GET /api/leak-test` and `GET /api/future-headline` each report only their own `mode`; check both on tenthgear.ai after any merge that touches keys (Future Headline sat in MOCK mode on production for two days this way).
- Don't declare a third-party embed working from a headless screenshot, and don't declare it broken either. Headless is bot-gated by Calendly and challenged by Turnstile; a real booking from a phone found what the automated pass missed.
- Don't hand Dave a `!` command containing a bare glob like `F=~/Downloads/*.json` — zsh does not glob inside an assignment, so it silently assigns the literal pattern. Resolve the path first, or quote a single concrete filename.

## Reusable Pattern
- **Conditional read-modify-write behind one store method** / Use when several writers (requests, jobs, tabs) touch one record without a transaction API / Preconditions live inside the mutator; retries are cheap; a compensating write targets only the irreversible step.
- **Admission check:** Netlify-Blobs- and Firestore-REST-specific mechanics; the shape (decide inside the conditional write) is general but already in the shared review dimensions. No INDEX row.

## References
- Code: `netlify/lib/leak-test/store.ts`, `netlify/lib/leak-test/{gcs,firestore,email}.ts`, `netlify/functions/leak-test*.mts`, `src/scripts/leak-test/resume.ts`, `src/pages/ai-summit/leak-test/resume.astro`
- Runbook: `docs/leak-test-runbook.md`; decisions: `gtm/campaigns/automotive-ai-summit-2026/ro-leak-test-handoff.md` (Amendments)
- Related: `docs/lessons-learned/netlify-functions-on-this-site.md` (env contexts, CLI), `../../../shared/lessons-learned/iframe-embed-definite-height.md`
- PRs: #111, #112, #113 (build); #115, #116 (Firebase cutover, Calendly height, copy), #118 (fallback-booking reconciliation, kill-switch copy), #121 (purge + Notion counts), #124 (HTML email part), #122, #125 (copy)
