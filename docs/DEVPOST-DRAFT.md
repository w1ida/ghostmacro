# Devpost submission draft — GhostMacro (Kiroween 2026, Frankenstein)

> DRAFT — prepared 2026-11-07 (SGT) from the verified repo state.
> Do NOT submit as-is: fill in the [TODO] links (live demo URL after deployment,
> YouTube video URL, blog URL, social post URL) and the 2–3 sentences in
> `docs/KIRO-USAGE.md` §9 in chen's own words.
> Verified 2026-11-07: `npm test` 68/68 passing (10 files), `npm run build` green,
> public repo https://github.com/w1ida/ghostmacro, MIT license, `/.kiro` at root.
> Deadline: Dec 4, 2026 2:00 PM PT = Dec 5, 2026 06:00 SGT.
> Category: Frankenstein. Solo. Do NOT tick Best Student / Best Startup / Best Ghost.

## Project overview (Devpost Step 2)

- **Project name:** GhostMacro — VBA Séance
- **Tagline:** Talk to your dead Excel VBA macros — and bring them back as a modern TypeScript/React web app.
- **Built With tags:** Kiro, Kiro CLI, TypeScript, React, Vite, Vitest, fast-check
- **Try it out links:**
  - Live demo: [TODO — Vercel URL, e.g. https://ghostmacro.vercel.app]
  - Code: https://github.com/w1ida/ghostmacro
- **Video demo:** [TODO — public YouTube link, < 3 min]

## Project story (Devpost Step 3 — paste as Markdown)

### Inspiration

Every company has a haunted spreadsheet: an Excel workbook from 2009 whose VBA
macros nobody dares to touch, whose author left years ago, and whose business
still runs on it. GhostMacro holds a séance for that dead code — and brings it
back as a working modern web app. It is Frankenstein in the literal sense:
stitching a 1993 language onto a 2026 stack.

### What it does

Upload a `.bas` file (or paste VBA code, or pick one of three haunted samples —
Expense Tracker, Inventory Manager, Invoice Generator) and GhostMacro:

1. Parses the macro into an AST (Sub/Function, Dim, If, For/Do loops,
   `Range`/`Cells`, `MsgBox`/`InputBox`, `WorksheetFunction`).
2. Transpiles it to TypeScript/React, shown side-by-side with the original VBA
   in a line-by-line diff.
3. Runs the resurrected app live in the browser — add a row, the total updates.
   No backend, no API key, no login; everything runs client-side.
4. Fails gracefully on what it cannot convert: `GoTo`, ActiveX/UserForms,
   `CreateObject`, file I/O and Win32 API calls get a conversion report naming
   the exact line number and a suggested rewrite — never a silent wrong answer.

The supported subset is documented in the README; anything outside it is
reported, not silently dropped.

### How we built it

Built spec-first with Kiro: `.kiro/specs/ghostmacro-v1/` holds requirements →
design → tasks, reviewed before any implementation. Steering files
(`.kiro/steering/`) lock the stack (TypeScript, Vite, React, Vitest,
fast-check), keep conversion logic out of React components, and forbid
`eval()` of generated code — so the live preview is driven by the transpiled
data model, never by executing generated code.

Phases 3–4 (upload panel, diff view, live preview, conversion report, theme
polish, property tests, hardening) were built with **Kiro CLI**
(`kiro-cli chat --no-interactive --trust-all-tools`). The skeleton and Phase 2
transpiler work were built before Kiro CLI was logged in, so they are not
presented as Kiro work — see `docs/KIRO-USAGE.md` for the honest split.

A Kiro Crew agent (`.kiro/agents/crew-converter.json`) batch-converts a folder
of macros and leaves one report per file (`crew/reports/` + `SUMMARY.md`):
28/28, 30/30 and 24/24 lines converted for the three samples, zero unsupported
constructs, zero warnings, each excerpt byte-identical to fresh pipeline
output. Honest caveat, also recorded in `docs/KIRO-USAGE.md`: the `kirocrew`
CLI itself could not complete a run in this headless environment (sandbox
blocked file writes; non-interactive mode auto-denied tool calls), so the
reports were produced by Kiro CLI following the Crew agent contract through
the real parse/transpile pipeline — not by a successful `kirocrew run`.

### Challenges we ran into

- VBA's `Cells(row, n)` inside loops looks innocent until the generated code
  treats the loop variable as a row object. The fix maps it to indexed row
  access (`rows[row-2]`) and reuses `Dim`'d loop variables instead of
  shadowing them — verified by a `tsc --noEmit` acceptance test on generated
  output for all three samples.
- `Round` in VBA is banker's rounding (2.5 → 2, 3.5 → 4), not JavaScript's
  `Math.round`. The runtime helper in `src/lib/vba-runtime.ts` implements it,
  including a 1.225 floating-point edge case.
- Scope honesty: no full VBA transpiler was attempted in 28 days. The
  supported-subset table is the contract, and "fail gracefully with a line
  number" matters more than "convert everything".

### Accomplishments that we're proud of

- 68/68 tests passing, including 7 fast-check property tests (deterministic
  transpilation, operator/expression preservation, no-throw on arbitrary,
  shuffled and truncated input) and hardening tests for empty, oversized,
  comments-only and `GoTo` files.
- Three samples convert end-to-end with zero errors, zero unsupported
  constructs and zero warnings.
- A live preview that is genuinely the transpiled logic running — with a
  10,000-iteration safety cap on loops — and an AA-contrast (5.41:1) UI.

### What we learned

Spec-first beats vibe coding for a transpiler: the spec caught the
`Range`-mapping design decision before any UI existed, and the task file's
"tests + build must pass before a task is done" gate kept every phase honest.
Property-based testing catches what unit tests miss — determinism and
expression preservation across the whole input space, not just the examples.

### What's next for GhostMacro

- Public deployment (Vercel) and this Devpost draft saved early.
- Demo video (< 3 min, YouTube public), Bonus Blog post, Social Blitz post.
- Wider VBA subset coverage, driven by the same rule: new construct = spec
  task + test + README row, or it does not ship.

## How Kiro was used (Devpost "How Kiro was used" field)

Paste the condensed version below; the full honest record is
`docs/KIRO-USAGE.md` in the repo.

> GhostMacro was built spec-first in Kiro: requirements → design → tasks in
> `.kiro/specs/ghostmacro-v1/`, steering files that keep the transpiler's
> subset honest, and a custom Crew agent that batch-converts macros into
> per-file reports. Phases 3–4 — upload panel, diff view, live preview,
> conversion report, property tests and hardening — were implemented with
> Kiro CLI. The skeleton and Phase 2 transpiler predate the Kiro CLI login
> and are not claimed as Kiro work. The Crew batch reports were produced by
> Kiro CLI following the Crew agent contract (the `kirocrew` CLI could not
> complete a run headless); see `docs/KIRO-USAGE.md` §5 for the full record.

## Submission checklist (Devpost Step 4 / Kiroween rules)

- [x] Category: Frankenstein
- [x] Public GitHub repo: https://github.com/w1ida/ghostmacro — MIT detected, `/.kiro` at root
- [ ] Working app URL (deployment — Vercel recommended, see below)
- [ ] Demo video: YouTube public, < 3 min (script in `docs/PLAN.md`)
- [ ] "How Kiro was used" write-up (above)
- [ ] Bonus prizes: Best Demo, Best Kiro Crew App (`crew/` + reports), Bonus Blog (link), Social Blitz (link)
- [ ] Do NOT tick: Best Student / Best Startup / Best Ghost — chen is not eligible
- [ ] Submitter type: Individual

## Deployment note (for the live URL)

GhostMacro is a pure static Vite SPA: no backend, no database, no API key,
no environment variables, no client-side router. Verified 2026-11-07:
`npm run build` → `dist/` (index.html 0.77 kB, JS 169.63 kB).
Vercel Hobby (free, $0, personal non-commercial — a hackathon demo qualifies):
import `w1ida/ghostmacro` from GitHub, framework auto-detected as Vite,
build command `npm run build`, output directory `dist`, Deploy. No
`vercel.json` needed. Do NOT deploy it to the Cloady workspace — adding a
second app there would make the whole workspace billable and jeopardise the
free Xray node.
