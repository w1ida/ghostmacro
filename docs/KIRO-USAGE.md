# How Kiro was used — GhostMacro (Devpost write-up outline)

> Fill this in with concrete examples as the build proceeds (Phase 4, task 4.5).
> Judges score "Technological Implementation" on how thoroughly and
> thoughtfully Kiro was used — vague claims score low, specific examples score high.
> Every section below needs one real example from this repo before submission.

## 1. Surfaces used — IDE, CLI, Web, Crew
- **Kiro IDE:** not used in this project. Muse built the skeleton and the Phase 2 parser/transpiler work (tasks 2.6, 2.7, and 2.8; 34 tests) before Kiro CLI was logged in, so that work is not presented as Kiro work.
- **Kiro CLI:** used in this session on 2026-11-06, logged in as Builder ID `gxunda@gmail.com`, through non-interactive chat: `kiro-cli chat --no-interactive --trust-all-tools --trust-workspace`. It implemented Phase 3 tasks 3.1–3.5 one at a time, verifying each with `npm test` and `npm run build`. `gpt-5.6-sol` handled 3.1–3.3 and the first 3.4 attempt, which failed with a `ModelThrottleError` caused by high traffic; `gpt-5.6-terra` handled the 3.4 retry and 3.5. The session added `src/components/*.test.tsx` and `src/App.test.tsx`, and changed `src/components/ConversionReport.tsx`, `src/App.tsx`, `src/App.css`, `src/index.css`, and `package.json` for test devDependencies. Final verification: `npm test` passed 54 tests and `npm run build` was green.
- **Kiro Web:** not used.
- **Kiro Crew:** not yet run. The `crew-converter` agent definition exists, but no batch reports have been generated; this remains Phase 4, task 4.2.

## 2. Spec-driven development (vs vibe coding)
- Wrote `.kiro/specs/ghostmacro-v1/requirements.md` (8 requirements, acceptance criteria each) **before** writing parser code, then `design.md` (tokenizer → AST → codegen → preview), then `tasks.md` (phased Nov 6–Dec 5).
- The spec caught a real design decision early: `Range`/`Cells` map to a typed row model instead of a fake spreadsheet grid — that decision is in `design.md` §2 and is why the preview can run without `eval()`.
- Compared to vibe coding: [TODO: one concrete contrast — e.g. "vibe coding would have generated a transpiler that silently dropped GoTo; the spec's Requirement 2.4 forced the unsupported-construct report, which became a demo moment in the video."]
- Spec review loop: requirements → design → tasks were reviewed as documents before implementation started; tasks are implemented in order and each is "done" only when its tests pass.

## 3. Steering docs
- `.kiro/steering/product.md` — who the product is for, the 2-minute demo bar, and the explicit non-goals (no full transpiler, no `.xlsm` binary parsing, no backend).
- `.kiro/steering/tech.md` — locked stack (TS strict, Vite + React, Vitest + fast-check), the "lib has no React imports" rule, the "never throw on user input" rule, and the dependency-minimalism rule.
- `.kiro/steering/structure.md` — where each kind of change goes (new construct = parser + test + README row, all three).
- Biggest difference a steering file made: [TODO: name one — e.g. the product.md non-goals list stopped a mid-build attempt to add `.xlsm` parsing.]

## 4. Agent hooks
- `.kiro/hooks/lint-on-save.json` — `PostFileSave` on `src/**/*.{ts,tsx}` runs `tsc --noEmit`.
- `.kiro/hooks/test-on-save.json` — `PostFileSave` on `src/lib/**` runs the parser/transpiler Vitest suite.
- What they caught: [TODO: one real example — e.g. "the test hook caught a `Cells(row, …)` regression the same save it was introduced."]

## 5. Custom agents + Kiro Crew app (Best Kiro Crew App)
- `.kiro/agents/crew-converter.json` — the Crew batch converter: reads `crew/uploads/`, converts each `.bas` with the same deterministic pipeline, writes `crew/reports/<name>.md` + `SUMMARY.md`, never rewrites `src/lib/`, never commits.
- Evidence: `crew/reports/` (generated in Phase 4, task 4.2) + the video segment at 1:45–2:15.
- How Crew differs from a single IDE session: [TODO: one line — background, batch, report-per-file, no interactive prompting.]

## 6. MCP
- `.kiro/settings/mcp.json` — `github` server (repo/code search; write tools disabled) and `filesystem` server (workspace only).
- What MCP enabled that would have been hard otherwise: [TODO: one real example, or state plainly that MCP was used for repo navigation / GitHub lookup and the heavy lifting was specs + hooks. Do not overclaim.]

## 7. Property-based testing (PBT)
- `fast-check` in `src/lib/transpiler.test.ts`: determinism (transpile twice → identical), expression preservation, parser robustness (mutated input never throws).
- What PBT caught that unit tests missed: [TODO: one real example, or state the properties and what they guard.]

## 8. Kiro Powers
- Powers to record as actually used: GitHub Power (repo workflow), and any others installed during the build (e.g. Figma if the UI was designed there — only if true).
- [TODO: list each Power, what it bundled (MCP + skills + steering), and what it changed in the build. Powers load on demand — note which keyword/context triggered each one if known. Do not list Powers that were never installed.]

## 9. What Kiro changed about how I build
- [TODO: 2–3 sentences, in chen's own words, for the Devpost write-up and the Social Blitz post. Keep it specific: spec-first, hooks as a safety net, Crew for batch work.]
