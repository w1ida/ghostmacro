# How Kiro was used — GhostMacro (Devpost write-up outline)

> This record separates work performed with Kiro from earlier work and records failed tool attempts as well as successful ones.

## 1. Surfaces used — IDE, CLI, Web, Crew
- **Kiro IDE:** not used in this project. Muse built the skeleton and the Phase 2 parser/transpiler work (tasks 2.6, 2.7, and 2.8; 34 tests) before Kiro CLI was logged in, so that work is not presented as Kiro work.
- **Kiro CLI:** used on 2026-11-06 through `kiro-cli chat --no-interactive --trust-all-tools`. Phase 3 tasks 3.1–3.5 added and tested the upload, diff, preview, conversion-report, and app-wiring work. `gpt-5.6-sol` ran first; task 3.4 hit a `ModelThrottleError`, so `gpt-5.6-terra` completed the retry and the remaining work. Phase 3 ended with 54 tests green, a green build, and commit `c1ff71a`.
- **Kiro CLI in Phase 4:** the same chat command added `src/lib/property.test.ts` for task 4.1, bringing the suite to 61 passing tests. It later executed the report batch by following `.kiro/agents/crew-converter.json`. Task 4.4 added seven hardening tests across the pipeline and app, with `src/lib/hardening.test.ts` covering empty input, comments-only input, and `GoTo`, and app coverage checking files over 200 KB. The final clean-copy check, `npm ci + npm run build + npm test`, passed with 68 tests green.
- **Kiro Web:** not used.
- **Kiro Crew:** installed with `kiro-cli crew -y`; the installed binary was `~/.local/bin/kirocrew`. Both direct Crew attempts failed to produce reports, as detailed in section 5. Kiro CLI then executed the same constrained batch task and produced the checked reports.

## 2. Spec-driven development (vs vibe coding)
- `.kiro/specs/ghostmacro-v1/requirements.md` defines the acceptance criteria, `design.md` defines the tokenizer → AST → codegen → preview architecture, and `tasks.md` turns that design into ordered phases.
- The spec made an early design decision explicit: `Range`/`Cells` map to a typed row model instead of a fake spreadsheet grid. `GeneratedAppPreview` therefore renders a known template driven by the data model rather than executing generated code.
- **Concrete contrast:** generated TypeScript alone was not enough to mark the conversion path complete. The design requires known unsupported constructs such as `GoTo` to be returned with exact line numbers while parsing continues, and task 3.4 required a bad-file fixture to render those details instead of a blank page. Task 4.4 then tested that `GoTo` is reported while the supported `MsgBox` line still converts.
- The task file provides the completion gate: tests and `npm run build` must pass before a task is done. The recorded checkpoints were 54 tests after Phase 3, 61 after task 4.1, and 68 after task 4.4.

## 3. Steering docs
- `.kiro/steering/product.md` defines the audience, demo journey, and explicit non-goals: no full VBA transpiler, `.xlsm` binary parsing, backend, accounts, database, or UserForms/ActiveX rendering in v1.
- `.kiro/steering/tech.md` locks TypeScript, Vite, React, Vitest, and fast-check; keeps conversion logic out of React components; requires invalid input to return structured results rather than throw; and forbids `eval()` of generated preview code.
- `.kiro/steering/structure.md` assigns pure conversion logic to `src/lib/`, UI to `src/components/`, and requires parser support changes to include tests and a supported-subset documentation update.
- **Concrete steering-driven decision:** the generated preview does not evaluate the transpiler's output. The design specifies a known data-table/form/totals template, and Phase 3 task 3.3 explicitly verified that the preview path contains neither `eval()` nor the `Function` constructor.

## 4. Agent hooks
- `.kiro/hooks/lint-on-save.json` configures a `PostFileSave` hook for `src/**/*.{ts,tsx}` that runs `npx tsc --noEmit`.
- `.kiro/hooks/test-on-save.json` configures a `PostFileSave` hook for `src/lib/**/*.{ts,tsx}` that runs `npx vitest run src/lib --reporter=basic`.
- **Observed use:** neither hook was observed firing. This build used Kiro CLI chat, which does not run Kiro IDE save hooks. No defect is attributed to either hook; tests, type checks, and builds were run explicitly instead.

## 5. Custom agents + Kiro Crew app (Best Kiro Crew App)
- `.kiro/agents/crew-converter.json` defines a constrained batch converter. It reads samples/uploads, writes report files, does not rewrite `src/lib/`, and does not commit.
- `kirocrew run crew/CREW-TASK.md` ran for 12m35s in an isolated taskrunner workspace and reported 10/10 tasks passed. Its steering blocked every code run and file write, however, so verification was 0/10 and no reports were produced.
- A registered `crew-converter` agent was then tried with `kirocrew chat -m --agent crew-converter` in a `ghostmacro` workspace containing a copy of the repository. Non-interactive mode could not display approval prompts, so every tool call was auto-denied and this attempt also produced nothing.
- The batch was therefore executed with `kiro-cli chat` while following `.kiro/agents/crew-converter.json`. It used the real `parseVBA`/`transpile` pipeline for all three uploads and wrote `crew/reports/expense-tracker.md`, `inventory-manager.md`, `invoice-generator.md`, and `SUMMARY.md`.
- The final counts were 28/28, 30/30, and 24/24 lines converted, with zero unsupported constructs and zero warnings for every file. Each generated-code excerpt was checked byte-for-byte against fresh pipeline output.
- **How this differs from a single chat edit:** the Crew task is folder-oriented and report-per-file, with fixed read/write boundaries and a summary across the batch. In this build, the two Crew runtimes did not complete that workflow, so the final reports are evidence of Kiro CLI following the Crew agent contract, not evidence that `kirocrew run` successfully wrote them.

## 6. MCP
- `.kiro/settings/mcp.json` configures a GitHub server for repository/code search with write tools disabled and a filesystem server limited to the workspace.
- These MCP servers were never invoked during this build. They did not enable any implementation or navigation result claimed in this write-up; the work used Kiro CLI's available tools, the spec files, and explicit local verification commands.

## 7. Property-based testing (PBT)
- Task 4.1 added seven fast-check properties in `src/lib/property.test.ts`: byte-identical deterministic transpilation; comparison, logical, and concatenation operator preservation; numeric-expression preservation; parsed and transpiled `If`/`For` structure; no throws for arbitrary strings; no throws for shuffled valid lines; and no throws for truncated valid files.
- The suite rose from 54 to 61 passing tests and the build remained green.
- No individual bug is claimed as a PBT discovery. These properties broaden the input space beyond fixed examples and continuously guard determinism, expression semantics, control-flow structure, and parser recovery.

## 8. Kiro Powers
- No Kiro Powers were installed or used during this build. No implementation result is attributed to a Power.

## 9. What Kiro changed about how I build
- [TODO for chen: write 2–3 sentences in your own words for the Devpost write-up and Social Blitz post.]
