# Tasks — GhostMacro v1

Phased plan Nov 6 – Dec 5, 2026. Implement in order. Each task is done only when its tests pass and `npm run build` succeeds. Do not start the next phase's UI polish until the current phase's parser/transpiler tasks are green.

## Phase 1 — Skeleton & spec (Nov 6–7) ✅ skeleton in this repo
- [x] 1.1 Create repo skeleton: README, LICENSE (MIT), .gitignore (no `.kiro` line), package.json, Vite + TS config.
- [x] 1.2 Write `.kiro/steering/` (product, tech, structure), `.kiro/specs/ghostmacro-v1/` (requirements, design, tasks), hooks, MCP settings, Crew agent definition.
- [x] 1.3 Write the 3 sample `.bas` files to fit the supported subset.
- [x] 1.4 Create the public GitHub repo, push this skeleton, verify the MIT license is detected and `/.kiro` is visible at the root. (Done Nov 6: repo https://github.com/w1ida/ghostmacro created via `gh repo create` after chen authorized the gh device code; MIT detected, `/.kiro` at root verified; Phase 3 commit c1ff71a and Phase 4 commit 960adba pushed.)
- [ ] 1.5 Register / confirm Devpost registration for Kiroween 2026 and create a draft submission early (save drafts often).

## Phase 2 — Parser + transpiler core (Nov 8–14)
- [ ] 2.1 `vba-parser.ts`: tokenizer (lines, keywords, strings, numbers, operators, comments). Unit tests: tokenizes each sample with zero errors.
- [ ] 2.2 `vba-parser.ts`: `Sub`/`Function`, `Dim`/`Const`, assignment, `If/ElseIf/Else`. Unit tests per construct.
- [ ] 2.3 `vba-parser.ts`: `For`/`For Each`, `Do While/Until`, `Range`/`Cells`, `MsgBox`/`InputBox`, `WorksheetFunction.*`. Unit tests per construct.
- [ ] 2.4 `vba-parser.ts`: unsupported-construct detection (`GoTo`, `On Error`, `Declare`, `CreateObject`, file I/O, UserForm) with exact line numbers + parser recovery (continue after an error line). Test: a deliberately bad file parses without throwing.
- [ ] 2.5 `transpiler.ts`: type mapping, operator mapping (`=`→`===` in conditions, `<>`→`!==`, `&`→`+`, `And/Or/Not`→`&&/||/!`), procedure → exported function. Determinism test (transpile twice → identical).
- [x] 2.6 `transpiler.ts`: `Range`/`Cells` → typed row model, `MsgBox`/`InputBox` → toast/modal mapping, `WorksheetFunction` → runtime helpers. Unit tests per mapping. (Done Nov 6: real `showToast`/`showPrompt` implementations replace the `declare` stubs; InputBox procedures are now `async`; the import lists only helpers actually used. `Format`/`Left`/`Right`/`Mid`/`LCase`/`Replace`/`Round`/`Max`/`Min` mapped too.)
- [x] 2.7 `vba-runtime.ts`: `vbaSum`, `vbaAverage`, `vbaCount`, `vbaLen`, `vbaUCase`, `vbaTrim` — plus `vbaFormat`, `vbaLCase`, `vbaLeft`, `vbaRight`, `vbaMid`, `vbaReplace`, `vbaRound` (banker's rounding), `vbaMax`, `vbaMin`. Unit + property tests in `vba-runtime.test.ts`. (Done Nov 6, 29 tests green.)
- [x] 2.8 Acceptance: all 3 samples parse with zero errors and zero unsupported, and transpile to valid TS (`tsc --noEmit` on generated output in a test harness). (Done Nov 6: loop-aware `Cells(row, n)` → `rows[row - 2]` index access, `Range("B2").Value` → `rows[0]`, `For` reuses a Dim'd loop variable instead of shadowing it, and the `StockValue` bug where `Cells(i, …)` emitted an undefined `row` is fixed; the harness declares the host-supplied `rows` and relaxes only noUnusedLocals/noUnusedParameters. 34 tests green, build green.)

## Phase 3 — UI: upload, diff, preview, report (Nov 15–21)
- [x] 3.1 `UploadPanel`: sample picker + file upload (`.bas,.vba`, 200 KB cap) + paste box. Test: selecting each sample loads its source. (Component already met the spec; added `src/components/UploadPanel.test.tsx` with 6 tests for each sample, the 200 KB cap, `.txt` rejection, and paste, plus test devDependencies `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom` scoped with `// @vitest-environment jsdom`.)
- [x] 3.2 `DiffView`: side-by-side VBA vs TS with line numbers. Test: renders both panes for the expense sample. (Fixed a real layout gap by adding `min-width: 0` to `.code-pane` in `App.css` so long lines scroll inside panes; added `src/components/DiffView.test.tsx` with 2 tests for both expense-sample panes and empty input.)
- [x] 3.3 `GeneratedAppPreview`: data table + add-row form + totals driven by the transpiled model. Test: adding a row updates the total. (Component already met the spec; verified that the preview path has no `eval()` or `Function` constructor; added `src/components/GeneratedAppPreview.test.tsx` with 7 tests covering totals changing from `$73.49` to `$83.49` after adding a row, invalid-input rejection, and the low-stock flag.)
- [x] 3.4 `ConversionReport`: counts + warnings + unsupported list with line numbers and suggested rewrites. Test: bad-file fixture shows the report, not a blank page. (Hardened count and status rendering; added `src/components/ConversionReport.test.tsx` with 3 tests for a `GoTo` + `CreateObject` fixture with line numbers and suggestions, a clean-sample message, and warning line numbers; the first 3.4 attempt failed because the default `gpt-5.6-sol` model was throttled with `ModelThrottleError` due to high traffic, and the `gpt-5.6-terra` retry succeeded.)
- [x] 3.5 `App.tsx` wiring + Halloween theme polish in `index.css`/`App.css` (contrast-checked). Manual: full demo flow in < 2 minutes, no console errors. (Fixed sample-switch row reset; upload/paste now clears stale sample rows; added copy-button failure feedback and toast reporting for errors, unsupported constructs, and warnings; rewrote the footer to an honest Kiro attribution without IDE/MCP/hooks/Crew claims; changed code line-number color from `#6b5a8a` (3.29:1, failed AA) to `#8f7bb6` (5.41:1, passes AA) with a full contrast table; added `prefers-reduced-motion` and `<=480px` rules; added `src/App.test.tsx` with 2 wiring tests.)
- [ ] 3.6 Deploy to Vercel/Netlify, verify the live URL loads the samples with no backend. Record the URL in the Devpost draft.

## Phase 4 — Crew app + property tests + hardening (Nov 22–26)
- [x] 4.1 fast-check property tests: determinism, expression preservation, parser robustness (no-throw on mutated input). All green in `npm test`. (Done Nov 6: added 7 properties covering byte-identical parsed-result transpilation, operator and numeric-expression semantics, parsed/transpiled If/For structure, arbitrary strings, shuffled lines, and truncated files; 61 tests green, build green.)
- [x] 4.2 `crew/` folder + Crew agent run: copy the 3 samples to `crew/uploads/`, run `crew-converter`, verify `crew/reports/*.md` + `SUMMARY.md` are correct. This is the Best Kiro Crew App evidence — screenshot the reports for the video. (Done Nov 6 via `kiro-cli chat` following the `crew-converter` definition: `kirocrew run` spent 12m35s in an isolated workspace where its steering blocked all code runs and file writes, and `kirocrew chat -m` auto-denied every tool call because it could not request approval non-interactively; the repository's deterministic parser/transpiler produced the four reports.)
- [ ] 4.3 Add one more real-world sample if time allows (e.g. a payroll or stock-taking macro from a public source, rewritten to the subset) — only if 2.8 still passes. If not, cut it; do not jeopardise the 3 core samples.
- [x] 4.4 Hardening pass: empty file, 200 KB+ file, file with only comments, file with `GoTo` — all handled gracefully. `npm run build` from a clean checkout. (Done Nov 6: zero-procedure inputs now produce empty code, a clear report, and a non-runnable preview state; oversized uploads remain outside the parser; GoTo recovery is covered end-to-end; 68 tests, the local build, and `npm ci && npm run build` in `/tmp/ghostmacro-clean` passed.)
- [x] 4.5 Kiro write-up: fill in `docs/KIRO-USAGE.md` with concrete examples from this build (actual spec decisions, actual hooks that fired, actual MCP/Power usage). (Done Nov 6: documented the real CLI, spec, steering, property-test, and Crew work, including failed Crew attempts and the explicit non-use of Kiro IDE hooks, MCP servers, and Powers; section 9 remains for chen to write.)

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
