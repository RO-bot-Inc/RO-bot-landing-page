# Future Headline latency: the gate that only bought time, and the uplink that ate it
<!-- recurrence: hits=2 prs=#123,#129 guard=n/a: measure the pass rate of any AI-output gate before shipping it; budget the client timer for upload time (checklists in this doc) -->
**Status:** Shipped   **Date:** 2026-09-21 (gate), 2026-09-23 (uplink)

## Context
Future Headline generates a story (Claude) and a newspaper-style image (Gemini) from a group photo. Two latency lessons from the same feature: a vision quality gate that doubled the draw cost, and a cellular uplink that made the page give up before the server ever saw the request.

## What Worked
- **Measuring the gate on real inputs killed it.** A study over 7 real group photos: the PASS/FAIL vision check (`imageLooksRight`, a second Claude call over the generated image) FAILED 7 of 7 first draws, while the draws were fine on inspection (one had an extra arm). The check tripped on the lettering the image model adds to props, so production paid for two draws on every request. Removing it (PR #123) is the whole fix: 45 s to 30 s on cellular, 20.8 s wired.
- **Model choice measured, not assumed.** Opus vs Sonnet over 10 story pairs on identical inputs: Sonnet only ~2.6 s faster. Dave kept Opus.
- **Reading the function log as a timeline found the uplink problem (PR #129).** Dave's 4:05 PM cellular test: token GET logged at 4:04:38, the story invocation started 44 s later, no image invocation, and the two retries logged a token GET each and nothing else. Lambda runs only after the whole body has arrived, so "GET logged, POST never invoked" means the upload never finished. The page's own 40 s timer had fired first and shown the generic error. Server side was healthy the whole time.
- **The fix is on the client:** a 1024 px / JPEG 0.8 copy for the upload (77 KB vs 179 KB for a 6000 px test photo; the 1536 px canvas still prints the fallback page), a 75 s per-request timer (upload time plus the ~30 s function budget), and a named "connection too slow" screen so the failure is diagnosable from the phone. Verified with CDP uplink throttling: 150 kbps succeeds, 4 kbps shows the new screen.
- **A gate that does belong there:** the story step's `photo_ok` refuses photos containing children.

## What Didn't
- **A gate written from intuition and never scored.** Nobody looked at its pass rate until latency complaints forced the study.
- **Upload size was dismissed too early.** The 2026-09-21 study concluded "the client already downscales to 1536 px / ~100 KB, so upload was never the cost". True on Wi-Fi and wired; on a weak cellular uplink the upload was the entire cost. Latency findings carry the link they were measured on.
- **The generic error hid the cause.** Timeout, network failure, and non-JSON edge errors all surfaced as "Something went wrong on our end", so the report from the phone could not distinguish them.

## Agent Mistakes to Prevent
- Don't ship a PASS/FAIL check over AI output without a measured pass rate on real inputs. If it fails ~100% of good output, it is a 2x cost multiplier, not a gate.
- Don't let a gate judge cosmetics on output whose acceptance criterion is "does a human like it".
- Don't reason about latency from the pipeline diagram; time each stage, on the worst link the audience will use.
- Don't set a client request timer from the server budget alone; add the upload time of the payload on a slow uplink, and shrink the payload before raising the timer.
- Don't blame the server before reading the function log as a timeline: a missing invocation means the request never arrived.

## Reusable Pattern
- **Measure-before-you-gate checklist** / Before shipping any automated check over AI output / (1) Run it over 5+ real inputs. (2) Record its verdict and a human verdict per input. (3) If it rejects output a human accepts, fix or delete the criterion, don't tune the retry count. (4) Price the retry in wall-clock and provider spend. (5) Log the verdict in production.
- **Slow-uplink checklist** / Before shipping any phone page that uploads a photo or file to a function / (1) Measure the body size the phone actually sends. (2) Throttle the uplink (Playwright CDP `Network.emulateNetworkConditions`) to 150 kbps and to a rate that trips the timer; both paths must render something specific. (3) Client timer = upload time at the slow rate + server budget. (4) Name the timeout in the error copy.
- **Admission check:** "verify an LLM judge instead of trusting its verdict" is already an INDEX row (`app/docs/lessons-learned/layered-ai-structural-facts.md`); the uplink rule is standard mobile hygiene. No INDEX row.

## References
- Code: `netlify/functions/future-headline.mts`, `netlify/lib/future-headline/*` (`imageLooksRight` removed), `src/scripts/future-headline/app.ts` (`UPLOAD_PHOTO_EDGE`, `REQUEST_TIMEOUT_MS`)
- Runbook: `docs/future-headline-runbook.md`
- PRs: #123, #129
