# Tasks — GhostMacro v1

Phased plan Nov 6 – Dec 5, 2026. Implement in order. Each task is done only when its tests pass and `npm run build` succeeds. Do not start the next phase's UI polish until the current phase's parser/transpiler tasks are green.

## Phase 1 — Skeleton & spec (Nov 6–7) ✅ skeleton in this repo
- [x] 1.1 Create repo skeleton: README, LICENSE (MIT), .gitignore (no `.kiro` line), package.json, Vite + TS config.
- [x] 1.2 Write `.kiro/steering/` (product, tech, structure), `.kiro/specs/ghostmacro-v1/` (requirements, design, tasks), hooks, MCP settings, Crew agent definition.
- [x] 1.3 Write the 3 sample `.bas` files to fit the supported subset.
- [ ] 1.4 Create the public GitHub repo, push this skeleton, verify the MIT license is detected and `/.kiro` is visible at the root. (chen — needs your GitHub account; do not invent a username.)
- [ ] 1.5 Register / confirm Devpost registration for Kiroween 2026 and create a draft submission early (save drafts often).

## Phase 2 — Parser + transpiler core (Nov 8–14)
- [ ] 2.1 `vba-parser.ts`: tokenizer (lines, keywords, strings, numbers, operators, comments). Unit tests: tokenizes each sample with zero errors.
- [ ] 2.2 `vba-parser.ts`: `Sub`/`Function`, `Dim`/`Const`, assignment, `If/ElseIf/Else`. Unit tests per construct.
- [ ] 2.3 `vba-parser.ts`: `For`/`For Each`, `Do While/Until`, `Range`/`Cells`, `MsgBox`/`InputBox`, `WorksheetFunction.*`. Unit tests per construct.
- [ ] 2.4 `vba-parser.ts`: unsupported-construct detection (`GoTo`, `On Error`, `Declare`, `CreateObject`, file I/O, UserForm) with exact line numbers + parser recovery (continue after an error line). Test: a deliberately bad file parses without throwing.
- [ ] 2.5 `transpiler.ts`: type mapping, operator mapping (`=`→`===` in conditions, `<>`→`!==`, `&`→`+`, `And/Or/Not`→`&&/||/!`), procedure → exported function. Determinism test (transpile twice → identical).
- [ ] 2.6 `transpiler.ts`: `Range`/`Cells` → typed row model, `MsgBox`/`InputBox` → toast/modal mapping, `WorksheetFunction` → runtime helpers. Unit tests per mapping.
- [ ] 2.7 `vba-runtime.ts`: `vbaSum`, `vbaAverage`, `vbaCount`, `vbaLen`, `vbaUCase`, `vbaTrim`. Unit + property tests.
- [ ] 2.8 Acceptance: all 3 samples parse with zero errors and zero unsupported, and transpile to valid TS (`tsc --noEmit` on generated output in a test harness).

## Phase 3 — UI: upload, diff, preview, report (Nov 15–21)
- [ ] 3.1 `UploadPanel`: sample picker + file upload (`.bas,.vba`, 200 KB cap) + paste box. Test: selecting each sample loads its source.
- [ ] 3.2 `DiffView`: side-by-side VBA vs TS with line numbers. Test: renders both panes for the expense sample.
- [ ] 3.3 `GeneratedAppPreview`: data table + add-row form + totals driven by the transpiled model. Test: adding a row updates the total.
- [ ] 3.4 `ConversionReport`: counts + warnings + unsupported list with line numbers and suggested rewrites. Test: bad-file fixture shows the report, not a blank page.
- [ ] 3.5 `App.tsx` wiring + Halloween theme polish in `index.css`/`App.css` (contrast-checked). Manual: full demo flow in < 2 minutes, no console errors.
- [ ] 3.6 Deploy to Vercel/Netlify, verify the live URL loads the samples with no backend. Record the URL in the Devpost draft.

## Phase 4 — Crew app + property tests + hardening (Nov 22–26)
- [ ] 4.1 fast-check property tests: determinism, expression preservation, parser robustness (no-throw on mutated input). All green in `npm test`.
- [ ] 4.2 `crew/` folder + Crew agent run: copy the 3 samples to `crew/uploads/`, run `crew-converter`, verify `crew/reports/*.md` + `SUMMARY.md` are correct. This is the Best Kiro Crew App evidence — screenshot the reports for the video.
- [ ] 4.3 Add one more real-world sample if time allows (e.g. a payroll or stock-taking macro from a public source, rewritten to the subset) — only if 2.8 still passes. If not, cut it; do not jeopardise the 3 core samples.
- [ ] 4.4 Hardening pass: empty file, 200 KB+ file, file with only comments, file with `GoTo` — all handled gracefully. `npm run build` from a clean checkout.
- [ ] 4.5 Kiro write-up: fill in `docs/KIRO-USAGE.md` with concrete examples from this build (actual spec decisions, actual hooks that fired, actual MCP/Power usage).

## Phase 5 — Submission: video, blog, social, Devpost (Nov 27 – Dec 5, 06:00 SGT)
- [ ] 5.1 Demo video (< 3 min, YouTube public): script in `docs/PLAN.md` — problem (15s), séance on the expense sample (60s), upload-your-own + unsupported report (30s), Crew batch report (30s), close (15s). Record, upload, link in Devpost.
- [ ] 5.2 Devpost submission: category Frankenstein; bonus prizes ticked — Best Demo (automatic), Best Kiro Crew App (link the Crew repo folder / report), Bonus Blog (link), Social Blitz (link). Paste the Kiro write-up, add test credentials if any (none needed — no login), add the live app URL + GitHub URL.
- [ ] 5.3 Bonus Blog post (public, third-party platform, mentions Kiroween 2026): publish and link it. Target the first 100 for the 2,000-credit prize.
- [ ] 5.4 Social Blitz post with `#KiroweenHackathon26` at the start, about what Kiro changed in the workflow. Link it in the submission.
- [ ] 5.5 Final check (Dec 4): repo public + license detected + `/.kiro` at root + live URL works + video public + submission saved. Submit before 06:00 SGT Dec 5 — aim for Dec 4 12:00 SGT, not the last hour.

## Scope cuts (in priority order if time runs short)
1. Cut 4.3 (extra sample) first.
2. Cut the `.xlsm` binary idea entirely (already out of scope).
3. Cut Crew *UI* — keep the Crew *reports* (the prize evidence is the reports, not a dashboard).
4. Never cut: the 3 samples working end-to-end, the unsupported-construct report, the video, or the `/.kiro` requirement.
