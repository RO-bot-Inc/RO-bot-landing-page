# /mpi/ page: design brief (P1 of the SEO/AEO plan)

Status as of 2026-11-16: mockup approved on the design board except the step 4 device screen. Build has not started.

**Design board (source of truth for layout and copy):** https://claude.ai/artifact/6KDYbW5G8WHbBFtgkqivzx
Board files are mirrored in `mockups/mpi/board/` (Main.dc.html is the page; the others are prototype sheets). The board is newer than the mirror whenever Dave has edited it: read the artifact before building.

## Locked decisions (do not re-litigate)

- **Hero A**: copy left, phone right, navy band. H1 "The Multi Point Inspection that builds itself" (spelled out for the searched head term). Kicker "Voice MPI for dealerships".
- **Copy is Dave's**: everything on the board's Main page is his final wording. Apply it verbatim. Headings in brief: "Techs hate filling out forms" / "Talk. Shoot. Send." / "Faster, more complete, more understandable" / "FAQs" / "See it in action".
- **How it works = treatment C**: a generated documentary photo per step in a 640 by 520 card, with the device from the photo popped out at the card's outer edge (40px past the card, 40px below). Phones for steps 1, 2, 4; a stylized laptop for step 3, scaled 0.85 and hung 72px below the card so it does not cover the photo's laptop. Odd steps: copy left, photo right, device bottom-right. Even steps mirrored. Grid is 1fr : 1.6fr.
- **Photos** (final picks, in `public/images/mpi/`): step 1 `how-1-walk-and-talk.jpg` (tech, hand on pickup tire, phone at mouth), step 2 `how-2-shoot-video.jpg` (tech filming under the hood), step 3 `how-3-laptop-bench.jpg` (tech leaning over a laptop on a steel bench, car on the lift behind), step 4 `how-4-customer-report.jpg` (customer's hands, kitchen table). Crop focus: 50% 68%, 50% 71%, 50% 40%, 100% 50%. Generated with Fal nano-banana-pro, prompts in `mockups/mpi/p*.txt`.
- **Device screens** (prototyped on the board's "Device screen options" sheet):
  - Step 1: **1C** live transcript. Three sentences build word by word at a fixed position; a finding chip pops in half a second after its trigger word; sentence clears, findings stay and stack. Items: tire tread front 4/32", tire tread rear 7/32", wheel balance, brake pads rear 2 mm.
  - Step 2: **2F** captions to findings. Caption builds at the bottom of the video; a white "New finding" card pops mid-screen, holds under a second, flies up and shrinks into a chip at the top; chips stack. Items must not repeat step 1: cabin air filter, serpentine belt, battery. Loop about 11 s. All animation in stylesheet classes, every animated element starts hidden (the board editor drops inline animations when an element is selected).
  - Step 3: **3A** kept as is: chips fly from the copy side into the laptop screen and become rows on the report summary, progress bar, "Save & Create Lines".
  - Step 4: **not chosen yet.** Candidates 4A (text to report card, current), 4B (approve from the phone), 4C, 4D on the sheet. 4B implies in-app approval; check product facts before picking it.
- **Mid-page CTA** after step 4: "That's the whole process. Twenty minutes to see it in action..." + Book a Demo + "Next: AI Story Writer →", packed left under a hairline rule, grey section background.
- **Stat**: "6 in 10 ROs leave with zero new recommendations" with footnote 1: DealerRater survey for Fixed Ops Journal (2019) via CBT News, Sept 2023. Dave removed the footnotes on the three figure tiles (14 minutes, +2 recs, 3x approvals); those are his figures, unsourced.
- **FAQ**: nine questions including "What is a multi point inspection?" (open by default, defines MPI in the first sentence), "What does an MPI include?", "How long does an MPI take?", "Does the customer get an MPI video?". Loud-shop answer still "Answer pending."
- **Sections**: nav, hero, problem, how it works (with mid CTA), why it gets done (three tiles), proof (Bob Sisk quote, McGrath Audi of Morton Grove), FAQ (white), CTA band (navy), sources, footer. DMS section removed; the DMS FAQ covers it.
- **Links**: "Next: AI Story Writer" appears in the mid CTA and the CTA band; both point at the 3C page (slug still to confirm). Product dropdown in nav: Overview, Voice MPI (this page), 3C Stories.
- **Palette**: heroes and bands stay on the live navy/teal tokens; device mocks use Palette C plus status red/yellow/green.

## Still open

- Step 4 device screen choice.
- Loud-shop FAQ answer.
- Sources for the three figure tiles, or accept them as unsourced claims.
- 3C page slug.
- Mobile layout for the photo cards (stacked: full-width photo, device overlapping the bottom corner, copy below). Not mocked.

## Stats

Verified stats live in the Notion "Stats" database (https://app.notion.com/p/41ad29c34d648146930ce60c8b62bb42). Add a row before putting a number in copy.

## Regenerating board files

`mockups/mpi/README.md` explains the generator scripts. They were written against the session scratchpad layout and expect the artifact's current `Main.dc.html` and the A prototype as inputs.
