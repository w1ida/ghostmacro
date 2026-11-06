# Product — GhostMacro (VBA Séance)

## What it is
GhostMacro resurrects dead Excel VBA macros as working modern TypeScript + React web apps. The user uploads a `.bas` / `.vba` file (or a pasted macro), and gets: a side-by-side VBA → TypeScript diff, a live runnable preview of the generated app, and a conversion report that is honest about what could not be converted.

## Who it is for
- **Primary:** anyone maintaining a legacy Excel workbook — finance / ops / small-business staff whose business runs on a macro whose author left years ago.
- **Secondary (judges):** developers who have seen VBA, know how painful it is, and can tell in 30 seconds whether the conversion is real or a fake.

## The problem, in one sentence
Millions of business-critical macros are written in a dead language, understood by nobody, and impossible to test, deploy, or share — so teams keep a haunted spreadsheet alive instead of replacing it.

## Core user journey (must work end-to-end, no dead ends)
1. Land on a single page. The promise is visible in one line: "Talk to your dead macros."
2. Click a built-in sample (Expense Tracker / Inventory Manager / Invoice Generator) **or** upload a `.bas` file.
3. The séance runs client-side in < 2 seconds for the samples: parser → transpiler → preview.
4. The user sees VBA on the left, generated TS/React on the right, and can press **Run the resurrected app** to use the generated app live (add a row, see totals update, export).
5. If the macro uses something unsupported, the user sees a **Conversion Report** naming the exact line, the construct, and a suggested rewrite — never a silent wrong conversion.

## What "good" looks like (judging lens)
- **Impact:** a real, named pain (legacy macros), not a toy demo. The 3 samples are real mini-apps, not "Hello World".
- **Innovation (Frankenstein):** VBA + React + property-based testing + a Kiro Crew background agent, stitched into one product. The stitching itself is the idea.
- **Design:** dark Halloween theme (deep purple / pumpkin orange / ghost white) that is *functional* — readable code, clear diff colours, big runnable preview. Spooky, not unreadable.
- **Presentation:** the demo is the product. A judge who has never seen the code should understand it from the 3-minute video alone.

## Non-goals (explicit scope cuts — do not build these in v1)
- A full VBA transpiler. The supported subset in `README.md` is the contract; everything else is reported, not faked.
- `.xlsm` binary parsing. v1 accepts `.bas` / `.vba` text exports (and pasted code). Reading the binary VBA project stream is a stretch goal only if Week 3 is ahead.
- User accounts, a backend, or a database. v1 is a static client-side app. No auth, no storage beyond local state.
- UserForms / ActiveX rendering. Reported as unsupported.
- Multi-file / multi-module projects in v1. One module per conversion; batch conversion is the Crew agent's job (Week 3).

## Tone
Playful Halloween copy ("séance", "resurrect", "haunted", "ghost"), but the engineering copy is dead serious: exact line numbers, exact unsupported constructs, exact test results. The joke is the theme; the transpiler is not a joke.
