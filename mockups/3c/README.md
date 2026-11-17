# /3c-story-writer/ page mockup sources

Design board (source of truth): https://claude.ai/artifact/5C5Z3yY8omtTDtXVt9Gqdc
`board/` mirrors the board's files (`Main.dc.html` is the latest version; `v1.dc.html`, `v2.dc.html`... are the review-round snapshots).

- `photos/`: Fal nano-banana-pro candidates (5:4, 1K) and their prompts. Used: a (step 1, tech talking at the SUV), c (step 2, Guide me), e (step 3, warranty admin). d is a spare.
- `tools/dc2html.py`: turns an artboard into a plain page for screenshots (helmet into head, `/_blob/` to local files).
- `tools/shoot.cjs`: full-page desktop (1280) and phone (390) screenshots with every CSS animation frozen at a fraction of its loop.
