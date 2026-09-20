# RO Leak Test runbook

Automotive AI Summit 2026 (September 24). Routes are printed on the postcards and permanently locked:
`https://tenthgear.ai/ai-summit/leak-test` (card QR) and `https://tenthgear.ai/ai-summit` (typed, two-door hub).

Product decisions: `../../gtm/campaigns/automotive-ai-summit-2026/ro-leak-test-handoff.md` (Amendments win).
Approved copy: `../../gtm/campaigns/automotive-ai-summit-2026/ro-leak-test-storyboard/storyboard.html`.

## Architecture

| Piece | Where | Notes |
|---|---|---|
| Hub | `src/pages/ai-summit/index.astro` | Static. UTMs pass through to either door. Never a redirect. |
| Landing + contact form + enrolled screen | `src/pages/ai-summit/leak-test/index.astro`, `src/scripts/leak-test/app.ts` | Frames 1 to 4. Form state lives in `localStorage` until enrollment succeeds; the enrolled screen in `sessionStorage`. |
| Private workspace | `src/pages/ai-summit/leak-test/resume.astro`, `src/scripts/leak-test/resume.ts` | Token arrives in the URL fragment, is moved to `sessionStorage` and stripped from the address bar by an inline script that runs before GTM. `Referrer-Policy: no-referrer`. Frames 7 to 16: overview with the three returning states, materials workspace (drop zone, links, notes, "Done sharing" confirm), Calendly inline embed with fallback link. `?view=book` or `?view=materials` opens a card directly (reminder links use it). |
| Uploads | `netlify/lib/leak-test/gcs.ts` + the browser | The function checks type, size, and the 5 GB total, then opens a **resumable session** in Cloud Storage with the browser's `Origin`; the browser PUTs 8 MB chunks straight to `storage.googleapis.com`, pauses, resumes, and retries from the session. `upload-done` verifies the object size. Without a bucket (`uploads: mock`) the browser walks the bar and only metadata is kept. |
| Dave's file page | `src/pages/ai-summit/leak-test/admin.astro`, `src/scripts/leak-test/admin.ts` | Frame 17. Signed link (`#ticket`, 400-day life) in the Notion row's "Open files" and in every notification. V4-signed download links, 10 minutes. "Revoke their links". No analytics. |
| Reminders | `netlify/functions/leak-test-reminders.mts`, hourly | Contact-only at 48 h and 7 d; booked-only 24 h after last activity; materials-only 24 h after "Done sharing"; nothing once both are done. Skips intakes with an upload in flight or closed by Dave in Notion. Each reminder carries a fresh link that does not revoke the enrollment link. `LT_REMINDERS=false` pauses. Manual run: `npx -y netlify-cli functions:invoke leak-test-reminders`. |
| Retention | `netlify/functions/leak-test-retention.mts`, daily | 60 days after the Delivered date Dave sets in Notion: files deleted from the bucket, links and notes cleared, every resume link revoked, log line on the Notion page. Contact details and the row stay. |
| API | `netlify/functions/leak-test.mts` at `/api/leak-test` | Function v2, no adapter. Actions: `enroll`, `fix`, `fresh-link`, `resume`, `upload-start`, `upload-ping`, `upload-done`, `upload-remove`, `save`, `materials-done`, `booked`, `admin-view`, `admin-revoke`. Per-IP rate limit in `config`. |
| Config and modes | `netlify/lib/leak-test/config.ts` | Each integration degrades to a stand-in when its secret is missing (see Modes). |
| Guards | `netlify/lib/leak-test/guard.ts` | Signed page token, signed 30-minute "fix" ticket, origin check, resume token generation and hashing. |
| Store | `netlify/lib/leak-test/store.ts`, `firestore.ts` | Firestore over REST with a service-account JWT (no firebase-admin). Netlify Blobs until the project exists. Memory for tests. |
| Email | `netlify/lib/leak-test/email.ts` | Resend. Enrollment email from `dave@tenthgear.ai` (Dave's verbatim copy); internal notification from `notifications@tenthgear.ai`. Plain text. No attachments, ever. |
| Notion | `netlify/lib/leak-test/notion.ts` | One row per enrollee in **RO Leak Test Intake**, three tries with backoff, never blocks enrollment. Writes only its own properties. |
| Shared constants | `src/scripts/leak-test/presets.ts` | Routes, field limits, Calendly URL. |

### Intake record

One document per enrollee (`leak_test_intakes/<id>` in Firestore, `intake/<id>` in Blobs): contact, first-touch source (UTMs, landing path, phone or desktop), the **hashes** of the resume tokens with issue and expiry dates (several can be live: the enrollment link plus reminder links; "fresh link", "fix it", Dave's revoke, and retention kill them all), materials and booking state, file metadata (object name in the bucket, size, done or pending), links, notes, reminder timestamps, the Notion page id, and an email log (kind, subject, Resend id). Tokens themselves are never stored. Objects live at `intakes/<intake id>/<file id>.<ext>` in the bucket; the original file name is metadata only.

Same email twice = same intake with a fresh link (old one revoked), not a duplicate row.

Workspace mutations use conditional writes with retry (Blobs etag `onlyIfMatch`, Firestore `currentDocument.updateTime`), so two uploads finishing at once cannot overwrite each other; the browser also uploads one file at a time. The local `netlify dev` sandbox returns no etags, so there the write is unconditional.

Netlify Blobs is one store for the whole site: deploy previews and production share intakes until Firestore takes over. Enrolling the same address on a preview refreshes the production intake's link.

### Booking

The Calendly inline embed posts `calendly.event_scheduled` to the page; the page sends the event and invitee URIs to `booked` (retried on outages, then kept in the browser and replayed on the next visit of the same intake). That is the only booking signal (webhooks need a paid plan). With `CALENDLY_API_TOKEN` set, the function reads the appointment time from Calendly's API and the workspace, the Notion row, and the reminder copy show it; without it the intake only knows a booking happened. **Not seen:** cancellations and reschedules made in Calendly, and bookings made through the fallback "open in a new tab" link (no message reaches the page). Follow-up once the API token exists: reconcile on resume by listing scheduled events for the participant's email.

### Links, revoke, and closure

A participant can hold several live links (enrollment plus reminders). "Fix it" on the enrolled screen (ten minutes, only before the workspace is used) and fresh-link retire the older links once the new email is out. Dave's **Revoke their links** kills every current link; the participant can still recover with fresh-link or by enrolling again with the same address, which is what revoke is for (a link in the wrong inbox). Only the retention purge closes an intake for good; the same address then starts a new one.

## Modes (what runs without keys)

| Integration | Live when | Otherwise |
|---|---|---|
| Store | `LT_FIREBASE_SERVICE_ACCOUNT` set | Netlify Blobs store `leak-test` (`LT_STORE=memory` for tests) |
| Email | `RESEND_API_KEY` set | Logged to the function console, including the resume link |
| Notion | `NOTION_API_KEY` set | Skipped; notification email says so |
| Captcha | `TURNSTILE_SECRET_KEY` set | Skipped; the widget is not rendered |

`LT_MODE=mock` forces every stand-in. `GET /api/leak-test` reports the current modes.

## Environment variables

Set in Netlify (Site configuration -> Environment variables). One context per `env:set` call, no `--scope` (it fails silently on this plan). Deploy-preview and branch-deploy first; production only after Dave approves.

| Variable | Required for launch | Value |
|---|---|---|
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | yes | dash.cloudflare.com -> Turnstile -> Add widget, hostname `tenthgear.ai` plus `*.netlify.app` for previews, managed mode. Free. |
| `RESEND_API_KEY` | yes | resend.com -> API keys. Sending permission, domain `tenthgear.ai` (verified 2026-08-02). The newsletter key in `website/.env` is full access and works for local tests. |
| `NOTION_API_KEY` | yes | Internal integration "TenthGear Leak Test Intake", already connected to the database. |
| `NOTION_DATA_SOURCE_ID` | no | Defaults to the RO Leak Test Intake data source `cc334923-33ba-4daa-be2a-873a65d0133b`. |
| `LT_FIREBASE_SERVICE_ACCOUNT` | before uploads | The service-account JSON for the dedicated project, as one line. See Firebase below. Turns on Firestore for intakes and Cloud Storage for uploads. |
| `LT_STORAGE_BUCKET` | no | Defaults to `<project id>.firebasestorage.app`. Set it if the console shows a different default bucket name. |
| `CALENDLY_API_TOKEN` | recommended | calendly.com -> Integrations & apps -> API & webhooks -> Personal access tokens -> Generate (free plan). Gives bookings a date and time. |
| `LT_REMINDERS` | no | `false` pauses the hourly reminder job. |
| `LT_RETENTION_DAYS` | no | Default 60. |
| `LT_SIGNING_SECRET` | yes | `openssl rand -hex 32`. |
| `LT_NOTIFY_TO` | no | Default `dave@tenthgear.ai`. |
| `LT_PUBLIC_ORIGIN` | no | Default is the request origin, so previews mail preview links. Set to `https://tenthgear.ai` in production if links ever come out wrong. |
| `LT_TOKEN_DAYS` | no | Default 60. |
| `LT_ENABLED` | no | `false` = kill switch. Page shows "Enrollment is paused right now." |

Env var changes need a redeploy to reach functions.

### Firebase (dedicated project, approved)

1. console.firebase.google.com -> Add project `tenthgear-leak-test`, no Analytics.
2. Build -> Firestore Database -> Create, production mode, `nam5` (US). Build -> Storage -> Get started, production mode (uploads, next build).
3. Project settings -> Service accounts -> Generate new private key. Paste the JSON, minified to one line, as `LT_FIREBASE_SERVICE_ACCOUNT` (locally in `.env`; on Netlify per context).
4. No indexes are needed for this build: the two lookups are single-field equality queries (`token.hash`, `emailKey`).

Nothing in the app's production Firebase project is touched.

## Local development

```
npm run build
LT_MODE=mock npx -y netlify-cli dev --offline --framework '#static' --dir dist --port 8899
open http://localhost:8899/ai-summit/leak-test/
```

`netlify dev` loads `.env`, and `.env` holds the real Resend and Notion keys, so **`LT_MODE=mock` is not optional** for flow tests: without it every test enrollment sends real email and writes a Notion row (it happened once, 2026-09-19). Drop it only to exercise Resend, Notion, or Turnstile on purpose, with your own address.

Flow test with screenshots: `SERVER_LOG=<netlify dev log> node scripts/leak-test-flow.mjs` (Playwright from `../app/node_modules`). The script refuses to run against a server in live email mode.

## Setup checklist (Dave's items; Claude cannot do these)

Type each `!` line in the Claude Code session. The `$(grep ...)` parts read a key out of `.env`, and `>/dev/null` matters: **`netlify env:set` echoes the full value** on success, straight into the session transcript (it did once, 2026-09-19). Tick the box in this file when done.

The page is live on tenthgear.ai since #111 merged (2026-09-19), so every key goes into all three contexts at once: production included.

- [x] **1. Resend and Notion keys, plus a signing secret** (done 2026-09-19; re-run after rotating a key)
  `! cd /Users/davidsonders/ro-bot/website && for c in deploy-preview branch-deploy production; do npx -y netlify-cli env:set RESEND_API_KEY "$(grep '^RESEND_API_KEY=' .env | cut -d= -f2- | tr -d '"')" --context $c >/dev/null; npx -y netlify-cli env:set NOTION_API_KEY "$(grep '^NOTION_API_KEY=' .env | cut -d= -f2- | tr -d '"')" --context $c >/dev/null; npx -y netlify-cli env:set LT_SIGNING_SECRET "$(openssl rand -hex 32)" --context $c >/dev/null; done; echo set`
- [x] **1b. Connect the Notion integration to the database** (done 2026-09-19). If the API ever answers `object_not_found ... make sure the database is shared with your integration`, open **RO Leak Test Intake** in Notion -> `...` menu -> Connections -> add "TenthGear Leak Test Intake".
- [x] **2. Turnstile** (done 2026-09-20, widget `TenthGear Leak Test`; dash.cloudflare.com -> Turnstile -> Add widget; name `TenthGear Leak Test`; hostnames `tenthgear.ai`, `netlify.app`, `localhost`; mode Managed). Then, with the two keys it shows:
  The site key is public (it ships in the page), so it can be typed; the secret goes through the clipboard. Copy the **secret key**, then with it still on the clipboard:
  `! cd /Users/davidsonders/ro-bot/website && SK='<site key>' && SEC="$(pbpaste | tr -d '[:space:]')" && printf 'TURNSTILE_SITE_KEY=%s\nTURNSTILE_SECRET_KEY=%s\n' "$SK" "$SEC" >> .env && for c in deploy-preview branch-deploy production; do npx -y netlify-cli env:set TURNSTILE_SITE_KEY "$SK" --context $c >/dev/null; npx -y netlify-cli env:set TURNSTILE_SECRET_KEY "$SEC" --context $c >/dev/null; done; echo set`
- [x] **3. Dedicated Firebase project** (done 2026-09-20: project `tenthgear-leak-test`, Blaze with a $25 alert, Firestore `nam5`, bucket `tenthgear-leak-test.firebasestorage.app` in US-EAST1; key at `~/.config/tenthgear/`)
  1. console.firebase.google.com -> Add project `tenthgear-leak-test`, Google Analytics off.
  2. Databases & Storage -> Firestore Database -> Create, Standard edition, location `nam5 (United States)`, production mode.
  3. Upgrade to Blaze (bottom-left), $25 budget alert. Then Databases & Storage -> Storage -> Get started, no-cost location, production mode.
  4. Gear -> Project settings -> Service accounts -> Generate new private key (downloads a JSON). Then:
  `! cd /Users/davidsonders/ro-bot/website && F=$(ls -t ~/Downloads/tenthgear-leak-test-*.json | head -1) && V="$(node -e 'process.stdout.write(JSON.stringify(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))))' "$F")" && printf 'LT_FIREBASE_SERVICE_ACCOUNT=%s\n' "$V" >> .env && for c in deploy-preview branch-deploy production; do npx -y netlify-cli env:set LT_FIREBASE_SERVICE_ACCOUNT "$V" --context $c 2>&1 | grep -v private_key; done && mkdir -p ~/.config/tenthgear && mv "$F" ~/.config/tenthgear/ && echo set`
  (`ls -t ... | head -1` picks the newest download; a bare `F=~/Downloads/*.json` does not glob in zsh, which is what `!` runs. Pass the value from the variable, not back out of `.env`: the `grep | cut` round trip made `env:set` fail silently on 2026-09-20. `grep -v private_key` drops the echo line that contains the key; check with `env:get ... | wc -c`, expect about 2356.)
- [x] **3b. Calendly API token** (done 2026-09-20, all Scheduling scopes + users:read) so bookings carry their date and time: calendly.com -> Integrations & apps -> API & webhooks -> Personal access tokens -> Generate token, name it `leak-test`, tick the Scheduling read scopes (all of Scheduling is fine). Copy the token, then, with it still on the clipboard:
  `! cd /Users/davidsonders/ro-bot/website && CAL="$(pbpaste | tr -d '[:space:]')" && printf 'CALENDLY_API_TOKEN=%s\n' "$CAL" >> .env && for c in deploy-preview branch-deploy production; do npx -y netlify-cli env:set CALENDLY_API_TOKEN "$CAL" --context $c >/dev/null; done; echo set`
  (`pbpaste` keeps the token out of the session transcript; a value typed into a `!` line is stored with the conversation.)
- [x] **4. Redeploy after any of the above** (preview redeployed 2026-09-20 via PR #116; production redeploys when it merges) (Claude can do this): Netlify -> Deploys -> Trigger deploy, or push any commit.

Already done by the agent: `LT_SIGNING_SECRET` in deploy-preview and branch-deploy (2026-09-19); step 1 overwrites it, which is fine.

## Launch checklist

- [ ] Keys set in the deploy-preview context; a real enrollment lands in Dave's inbox, the Notion row appears, the notification arrives.
- [ ] Turnstile renders invisibly on iPhone Safari and Android Chrome; a submit passes.
- [ ] `/ai-summit/leak-test` (no slash) and `/ai-summit/leak-test/` both load.
- [ ] Resume link from the email opens the private page on a different device; the address bar shows no token; GA4 DebugView shows `aas_resume_open` with no token in `page_location`.
- [ ] GA4 DebugView shows `aas_page_view`, `aas_qr_visit`, `aas_form_start`, `aas_contact_complete`.
- [ ] Fresh-link screen sends a new link and the old one stops working.
- [ ] Kill switch rehearsed once.
- [ ] Physical postcard QR scanned on iPhone and Android, on cellular.
