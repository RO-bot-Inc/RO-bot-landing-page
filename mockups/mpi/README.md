# /mpi/ mockup sources

Design-time tooling for the MPI pillar page. The live source of truth is the design board
(https://claude.ai/artifact/6KDYbW5G8WHbBFtgkqivzx); `board/` is a mirror taken 2026-11-16.

| File | What it is |
|---|---|
| `board/Main.dc.html` | The full page artboard (hero A, Dave's copy, photo how-it-works, FAQ, CTA, sources). |
| `board/HowA/B/C.dc.html` | The three how-it-works treatments. C was chosen and folded into Main. |
| `board/Photos.dc.html` | Contact sheet of every generated photo candidate with codes. |
| `board/Screens.dc.html` | Device screen options per step (1C, 2F chosen; 3A kept; step 4 open). |
| `board/canvas.json` | Artboard positions and stickies. |
| `build-board.js` | Turned the original HTML mockup into the first `Main.dc.html`. Historical. |
| `build-how.py` | Builds HowA/B/C from Main's CSS and HowA's phone markup, then folds treatment C (photos, laptop, chip paths) into Main. Strips old treatment rules before appending so rebuilds never stack. |
| `build-screens.py` | Builds `Screens.dc.html`: all device screen options with their keyframes. 1C and 2F timelines are generated from sentence lists at the top of each block. |
| `gen.mjs`, `p*.txt` | Fal nano-banana-pro image generation (4:5 or 5:4, 1K) and the prompts for the four chosen photos. Needs `FAL_KEY` from `../../app/.env`. |

The Python builders expect the scratchpad layout they were written in:

```
scratchpad/
  artifact-files/<artifact id>/project/Main.dc.html   # latest board copy from an Artifact read
  board/project/*.dc.html                              # files to publish
```

To reuse them in a new session: read the artifact's `project/Main.dc.html` with the Artifact tool, copy it to `board/project/Main.dc.html`, keep `HowA.dc.html` beside it (the phone markup source), run the script, publish from `board/`.

Photo assets for the build are in `public/images/mpi/`.
