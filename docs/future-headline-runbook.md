# Future Headline runbook

Automotive AI Summit 2026 (September 24). Route is printed on the postcards and permanently locked:
`https://tenthgear.ai/ai-summit/future-headline`

Product handoff: `../../gtm/campaigns/automotive-ai-summit-2026/future-headlines-handoff.md`

## Architecture

| Piece | Where | Notes |
|---|---|---|
| Page (static Astro, standalone, `noindex`) | `src/pages/ai-summit/future-headline.astro` | No Navbar/Footer, GTM only. First screen needs no JS library. |
| Client flow | `src/scripts/future-headline/app.ts` | Photo normalize (EXIF, max 1536 px JPEG), prediction, retry, share, download, GA4. |
| Deterministic renderer | `src/scripts/future-headline/render.ts` | Canvas, 1080 x 1350 PNG. Draws every word, date, stamp, and logo from self-hosted fonts. The image model only supplies the lead photo. |
| API | `netlify/functions/future-headline.mts` at `/api/future-headline` | Netlify Function v2. No Astro adapter. Holds all credentials. |
| Text adapter | `netlify/lib/future-headline/story.ts` | Claude, structured output, sees photo + prediction. |
| Image adapter | `netlify/lib/future-headline/image.ts` | Gemini image edit, 16:9, plus a cheap head-count check and one retry. |
| Story bank / mock adapter | `netlify/lib/future-headline/bank.ts` | Used when `FH_MODE=mock`, when keys are missing, and as the live fallback if the text model fails. |
| Guards | `netlify/lib/future-headline/guard.ts` | Signed page token, signed session cookie (3 per session), daily cap counter in Netlify Blobs, origin check. Netlify per-IP rate limit is set in the function's `config`. |

Nothing is stored. The photo, prediction, and result exist only for the length of the request. The only persisted value is a per-day integer counter. Logs contain status codes, outcome, year, and timings, never user content.

Degradation ladder: text model fails -> hand-written bank story. Image model fails, times out, or fails the head-count check twice -> the front page is composed with the attendee's own photo, newsprint-graded. The attendee gets a page either way. `degraded=yes` is reported to GA4.

## Credentials and provider setup (required for live mode)

Set these in Netlify: Site configuration -> Environment variables (scope: Functions). Never in the repo, never `PUBLIC_`/client-side.

| Variable | Required | Value |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | console.anthropic.com -> API keys. Create a key named `website-future-headline` in its own workspace and set a monthly spend limit on that workspace (suggest $50). |
| `GEMINI_API_KEY` | yes | aistudio.google.com -> API keys. **The key's project must have billing enabled (paid tier).** On the free tier Google may use uploads for product improvement and human review. Paid tier does not. Set a budget alert on the project. |
| `FH_SIGNING_SECRET` | yes | Any 32+ random characters: `openssl rand -hex 32`. |
| `FH_MODE` | no | `mock` forces the bank adapter. Unset = live when both keys exist. |
| `FH_ENABLED` | no | `false` = kill switch. |
| `FH_DAILY_CAP` | no | Default 400 generations per Eastern-time day. |
| `FH_SESSION_CAP` | no | Default 3. |
| `FH_DYSTOPIA_PROBABILITY` | no | Default 0.5. |
| `FH_TEXT_MODEL` | no | Default `claude-opus-5`. `claude-sonnet-5` is the faster, cheaper step-down if latency testing calls for it. |
| `FH_IMAGE_MODEL` | no | Default `gemini-3.1-flash-image`. |

Env var changes need a redeploy to reach functions: Deploys -> Trigger deploy -> Deploy site (about 2 minutes).

Expected cost at the defaults: roughly $0.10 to $0.15 per generation (image about $0.07, text plus check about $0.04). 300 generations is about $40. The daily cap bounds the worst case near $60 per day.

Provider data terms, checked 2026-09-17 (re-verify before launch):
- Gemini API paid tier: prompts and images are not used to improve products; logged for abuse monitoring for a limited period (55 days). https://ai.google.dev/gemini-api/terms
- Anthropic API: not used for training; standard retention up to 30 days.

**Live verification, 2026-09-17** (local `netlify dev`, six photos of 1, 2, and 4 people): 6 of 6 succeeded with no fallbacks, 16 to 28 seconds end to end (text step 6 to 11 s, image step 9 to 21 s). Head count held in all six. A photo with no people returns `bad_photo`; a prediction naming a real person or carrying a prompt injection returns `unsafe`. Gemini keys now start with `AQ.`, not `AIza`. The Gemini project is on prepay credits: when the balance hits zero the image step fails and the page degrades to the attendee's own photo, so top up before the event. Still unverified: real (non-illustrated) faces, and behavior from a deployed function rather than local dev. Re-run with `scripts/future-headline-live-test.mjs`.

**Function time limit, 2026-09-17:** Netlify ends this site's synchronous functions at about 30 s (observed on the deploy preview; the docs say 60 s). Generation is therefore two requests: step 1 returns the story plus an HMAC-signed image ticket (scene brief, prop labels, head count), step 2 restages the photo from that ticket. Each step budgets 26 s. The client retries the image step once, then prints with the attendee's own photo. Typical total is about 30 s.

**Photo lettering:** Claude writes up to four exact prop labels and the image model is told to letter only those. In practice Gemini also adds small background words, and an occasional one is misspelled. Headline, deck, kicker, date, and logos are always template-drawn and exact.

## Kill switch

Set `FH_ENABLED=false`, trigger a deploy. The page stays up and shows "The presses are paused right now." To stop spend instantly without a deploy, revoke the Gemini key in AI Studio: the experience keeps working in degraded mode with attendees' own photos.

## Local development

`astro dev` does not serve functions, and Astro 7 daemonizes under non-interactive shells, so build and serve statically:

```
npm run build
FH_MODE=mock npx -y netlify-cli dev --offline --framework '#static' --dir dist --port 8899
open http://localhost:8899/ai-summit/future-headline/
```

For live mode locally, put the three required variables in `.env` (gitignored) and drop `FH_MODE=mock`.

## Launch checklist

- [ ] Keys set in Netlify, paid tier confirmed on the Gemini project, spend limits set.
- [ ] Deploy preview: run six generations (one person, group of 2, group of 4+, preset and custom predictions). Check head count, faces, no lettering in photo, time under 45 s.
- [ ] GA4 DebugView shows the `future_headline_*` events. They are sent as gtag-style dataLayer commands to `G-28WMV6CTFP`. If they do not appear, add one GA4 Event tag in GTM with a custom-event trigger matching `^future_headline_`.
- [ ] Privacy page: add the event-specific paragraph (Dave to approve wording).
- [ ] `/ai-summit/leak-test/` exists. The post-result CTA and postcard Side A both point there.
- [ ] `/ai-summit/` exists. It is the URL printed on the generated front page and on both card sides.
- [ ] Physical postcard QR scanned on iPhone Safari and Android Chrome, on cellular. Test camera capture, library upload, Share sheet, Download, press-and-hold save.
- [ ] Trailing slash and no trailing slash both load.
- [ ] Kill switch rehearsed once.
