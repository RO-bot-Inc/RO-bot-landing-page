# Future Headline: the vision quality gate that only bought latency
<!-- recurrence: hits=1 prs=#123 guard=n/a: measure the pass rate of any AI-output gate before shipping it (checklist in this doc) -->
**Status:** Shipped   **Date:** 2026-09-21

## Context
Future Headline generates a story (Claude) and a newspaper-style image (Gemini) from a group photo. The image step shipped with a PASS/FAIL vision check — `imageLooksRight`, a second Claude call over the generated image — that triggered one redraw on FAIL. It had never been measured against real inputs.

## What Worked
- **Measuring the gate on real inputs killed it.** A study over 7 real group photos: the check FAILED 7 of 7 first draws, while the draws were fine on inspection (one had an extra arm). The check trips on the lettering the image model adds to props — a cosmetic criterion no viewer complains about — so production paid for two draws on every single request.
- **Removing it (PR #123) is the whole fix.** First draw ships; a second attempt happens only on provider error or timeout. 45 s → 30 s on cellular, 20.8 s on a wired link (story ~9.7 s on `claude-opus-5`, draw ~10.5 s on `gemini-3.1-flash-image`).
- **Model choice measured, not assumed.** Opus vs Sonnet over 10 story pairs (same photo, prediction, year, outcome): Sonnet was only ~2.6 s faster (5.7 s vs 8.3 s). Dave kept Opus — the quality difference was worth 2.6 s; the gate was not worth 15 s.
- **A gate that does belong there:** the story step's `photo_ok` refuses photos containing children. The prompt says "only children" and the model is stricter than that in practice, which is the right direction for that check.

## What Didn't
- **A gate written from intuition and never scored.** Nobody looked at its pass rate until latency complaints forced the study; until then it read as a safety feature.
- **Blaming the wrong cost.** Upload size was suspected first. The client already downscales photos to 1536 px / ~100 KB, so upload was never the cost — the second draw was.

## Agent Mistakes to Prevent
- Don't ship a PASS/FAIL check over AI output without a measured pass rate on real inputs. If it fails ~100% of good output, it is not a gate, it is a 2× cost multiplier that no error message ever mentions.
- Don't let a gate judge cosmetics (lettering, small artifacts) on output whose acceptance criterion is "does a human like it". Gate only on things that make the output unusable.
- Don't reason about latency from the pipeline diagram; time each stage. Here the "slow AI" was two fast calls, one of them entirely wasted.
- Don't swap models for speed without pairing outputs on identical inputs — the win here was 2.6 s, far less than the gate's cost.

## Reusable Pattern
- **Measure-before-you-gate checklist** / Use before shipping any automated check over AI output (vision PASS/FAIL, LLM judge, regex sanity check) / (1) Run it over ≥5 real inputs. (2) Record its verdict AND a human verdict per input. (3) If it rejects output a human accepts, the criterion is wrong — fix or delete it, don't tune the retry count. (4) Price the retry it triggers in wall-clock and provider spend. (5) Log the verdict in production so the rate stays visible.
- **Admission check:** the measurement discipline is general, but "verify an LLM judge instead of trusting its verdict" is already an INDEX row (`app/docs/lessons-learned/layered-ai-structural-facts.md`). No new INDEX row.

## References
- Code: `netlify/functions/future-headline.mts`, `netlify/lib/future-headline/*` (`imageLooksRight` removed)
- Runbook: `docs/future-headline-runbook.md`
- PR: #123
