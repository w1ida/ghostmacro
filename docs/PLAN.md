# Plan — GhostMacro, Kiroween 2026 (Nov 6 – Dec 5)

Solo, Frankenstein, TypeScript / Vite + React. Deadline **Dec 4, 2026 2:00 PM PT = Dec 5, 2026 06:00 SGT**. Target: Overall $30k/$20k/$10k or Best Frankenstein $5k, **plus** Best Demo $1k + Best Kiro Crew App $1k + Bonus Blog + Social Blitz. Max realistic: **$32,000**.

chen: non-student, no startup, no Kiroween 2025, solo, has Kiro account, 4,000 credits already claimed. No identity-bonus prizes apply — do not spend time on them.

## Week 1 — Nov 6–12: Spec + skeleton + deploy pipeline
- [x] Nov 6: choose Project A, write spec (`/.kiro/specs/ghostmacro-v1/`), steering, hooks, MCP, Crew agent, skeleton app, 3 samples. (This repo.)
- [ ] Nov 7: create the **public GitHub repo**, push, verify MIT license is detected in the About section and `/.kiro` is visible at the root. Do **not** put `/.kiro` in `.gitignore` (already absent — keep it that way).
- [ ] Nov 8: confirm Devpost registration, create a **draft submission early** and save it. Add the GitHub URL as soon as the repo exists.
- [ ] Nov 9–10: parser core (tasks 2.1–2.2 in `tasks.md`): tokenizer, Sub/Function, Dim, If.
- [ ] Nov 11–12: parser core continued (2.3–2.4): For/Do, Range/Cells, MsgBox, unsupported detection. Attend the Devpost Build Session if useful — Nov 11, 10:00 AM PT (= Nov 12, 02:00 SGT).
- **Exit criteria:** `npm install && npm run build && npm test` green; all 3 samples parse with zero errors.

## Week 2 — Nov 13–19: Transpiler end-to-end
- [ ] Nov 13–15: transpiler (2.5–2.6): type/operator mapping, Range→row model, MsgBox→toast, WorksheetFunction→runtime helpers.
- [ ] Nov 16–17: `vba-runtime.ts` (2.7) + unit tests.
- [ ] Nov 18–19: acceptance 2.8 — every sample transpiles to valid TS; the generated code reads like a real web app, not a dump.
- **Exit criteria:** pick any sample → DiffView shows real TS → preview totals update. No console errors.

## Week 3 — Nov 20–26: UI polish + Crew app + property tests
- [ ] Nov 20–21: UI (3.1–3.5): UploadPanel, DiffView, GeneratedAppPreview, ConversionReport, theme polish. Deploy to Vercel/Netlify; put the live URL in the Devpost draft.
- [ ] Nov 22–23: fast-check property tests (4.1): determinism, expression preservation, parser no-throw on mutated input.
- [ ] Nov 24–25: Crew app (4.2): `crew/uploads/` ← 3 samples, run `crew-converter`, verify `crew/reports/*.md` + `SUMMARY.md`. Screenshot the reports — this is the Best Kiro Crew App evidence.
- [ ] Nov 26: hardening (4.4): empty file, >200 KB file, comments-only file, `GoTo` file — all graceful. Clean-checkout build.
- **Exit criteria:** live URL works with no backend; Crew reports exist; `npm test` green.

## Week 4 — Nov 27 – Dec 5, 06:00 SGT: Video, blog, social, submit
- [ ] Nov 27–28: record the demo video (script below), upload to **YouTube, public, < 3 minutes**.
- [ ] Nov 29–30: write the Bonus Blog post (third-party platform, mentions Kiroween 2026), publish, link it in Devpost. Write the Social Blitz post.
- [ ] Dec 1–2: fill in `docs/KIRO-USAGE.md` with concrete examples; paste the Kiro write-up into Devpost; add the live URL, GitHub URL, video URL, blog URL, social URL.
- [ ] Dec 3: full submission dry-run with a fresh eye: repo public? license detected? `/.kiro` at root? video public? All links work?
- [ ] Dec 4 (aim 12:00 SGT, **not** the last hour): submit. Deadline is Dec 5, 06:00 SGT — do not cut it close.

## Demo video script (< 3 min, YouTube public)
| Time | Shot | Line |
| --- | --- | --- |
| 0:00–0:15 | Haunted spreadsheet on screen | "Every company has a spreadsheet nobody dares to touch. Its author left in 2009. The macro still runs the business." |
| 0:15–1:15 | Expense Tracker sample, live | "GhostMacro holds a séance. VBA on the left — TypeScript on the right. Same logic, new body." Add a row, total updates. |
| 1:15–1:45 | Upload your own + unsupported report | "Upload your own .bas. If it uses GoTo or CreateObject, you get the exact line and a fix — not a silent wrong answer." |
| 1:45–2:15 | Crew batch report | "And a Kiro Crew agent converts a whole folder overnight and leaves a report per file." Show `crew/reports/SUMMARY.md`. |
| 2:15–2:45 | Kiro in 20 seconds | "Built spec-first in Kiro: requirements → design → tasks, steering, hooks, MCP, property-based tests." Show `/.kiro`. |
| 2:45–3:00 | Close | "GhostMacro — talk to your dead macros. Frankenstein, Kiroween 2026." Live URL + GitHub on screen. |

## Submission checklist (Devpost)
- [ ] Category: **Frankenstein**
- [ ] Public GitHub URL, MIT license detectable, `/.kiro` at root, not in `.gitignore`
- [ ] Working app URL (Vercel/Netlify) — loads, 3 samples run, no login needed
- [ ] Text description (features + functionality)
- [ ] Demo video: YouTube public, < 3 min
- [ ] "How Kiro was used" write-up (from `docs/KIRO-USAGE.md`)
- [ ] Bonus prizes ticked: Best Demo (automatic), **Best Kiro Crew App** (link `crew/` + reports), **Bonus Blog** (link), **Social Blitz** (link)
- [ ] Do NOT tick Best Student / Best Startup / Best Ghost — chen is not eligible

## Bonus Blog draft (publish on a third-party platform, mention Kiroween 2026)
Title: *"I held a séance for a dead Excel macro — and Kiro brought it back as a React app"*
1. The haunted spreadsheet: why VBA macros are the zombies of enterprise software.
2. The Frankenstein idea: stitching a 1993 language to a 2026 stack.
3. How Kiro changed the build: spec-first vs vibe coding — the spec caught a Range-mapping bug before a line of UI existed; hooks ran tests on every save; the Crew agent did the boring batch work.
4. What the transpiler actually proves: determinism + property-based tests, and why "fail gracefully with a line number" matters more than "convert everything".
5. Try it: live URL + GitHub link. Built for Kiroween 2026.

## Social Blitz draft (post starts with #KiroweenHackathon26)
> #KiroweenHackathon26 I used to vibe-code and hope. Building GhostMacro in Kiro flipped it: I wrote the spec first, Kiro argued with it, and the transpiler came out provable — deterministic output + property tests that catch what unit tests miss. The scariest thing in my repo is now a 2009 Excel macro, not my own code. 👻 [live URL]

## Risks + scope cuts
| Risk | Mitigation / cut |
| --- | --- |
| Parser scope creep ("just one more VBA feature") | The supported-subset table is the contract. New construct = spec task + test + README row, or it does not ship. |
| Generated preview feels fake | The preview is driven by the transpiled data model, never `eval()`. If a mapping cannot run in the preview, cut the mapping, not the honesty. |
| Solo time crunch in Week 4 | Video + Devpost are scheduled Nov 27–Dec 2, not Dec 4. Dec 4 is buffer only. |
| Crew app eats Week 3 | Cut Crew *UI* first; keep Crew *reports* — the prize evidence is the reports. |
| `.xlsm` binary parsing temptation | Out of scope. Text `.bas` export only. Do not start it. |
