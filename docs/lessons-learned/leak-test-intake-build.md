# RO Leak Test intake: building stateful flows on this static site

**Status:** Shipped (PRs #111, #112, #113; 2026-09-19 to 20)
**Date:** 2026-09-20
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

## Agent Mistakes to Prevent
- Don't chain `git commit`/`git push` after `npm run build | tail`; the pipe hides the exit code. Build to a log file and test `$?`.
- Don't run `netlify dev` for tests without `LT_MODE=mock` when `.env` has real keys.
- Don't gate recovery paths (fresh-link, re-enroll) on token liveness; gate them on purge only.
- Don't hand-fix a Codex finding on this repo: run `/codex-fix` (the Workflow script must be copied under the working directory, e.g. `tmp/`, or the tool refuses it).

## Reusable Pattern
- **Conditional read-modify-write behind one store method** / Use when several writers (requests, jobs, tabs) touch one record without a transaction API / Preconditions live inside the mutator; retries are cheap; a compensating write targets only the irreversible step.
- **Admission check:** Netlify-Blobs- and Firestore-REST-specific mechanics; the shape (decide inside the conditional write) is general but already in the shared review dimensions. No INDEX row.

## References
- Code: `netlify/lib/leak-test/store.ts`, `netlify/functions/leak-test*.mts`, `src/scripts/leak-test/resume.ts`
- Runbook: `docs/leak-test-runbook.md`; decisions: `gtm/campaigns/automotive-ai-summit-2026/ro-leak-test-handoff.md` (Amendments)
- PRs: #111, #112, #113
