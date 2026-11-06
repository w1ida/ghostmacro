# Requirements — GhostMacro v1

Kiroween 2026 · Category: Frankenstein · Solo · Deadline Dec 4, 2026 2:00 PM PT (= Dec 5, 2026 06:00 SGT)

## Introduction
GhostMacro resurrects dead Excel VBA macros as working modern TypeScript + React web apps. The user uploads or pastes VBA, or picks a built-in sample, and receives generated code, a live runnable preview, and an honest conversion report. The project must be demonstrable by a judge in under 2 minutes with no setup beyond opening the deployed URL.

## Glossary
- **VBA source:** a `.bas` / `.vba` text export, or pasted VBA code.
- **Supported subset:** the VBA constructs listed in `README.md` that GhostMacro converts deterministically.
- **Unsupported construct:** a VBA construct outside the subset. It must be reported with line number, never silently dropped or faked.
- **Generated app:** the TypeScript/React code produced by the transpiler, plus the live preview that runs its data model in the browser.
- **Conversion report:** errors, unsupported constructs, and warnings for one conversion.
- **Crew app:** the Kiro Crew background agent (`crew-converter`) that batch-converts a folder of VBA files and writes a report per file.

## Requirements

### Requirement 1 — Upload and sample selection
**User Story:** As a user with a dead macro, I want to upload a `.bas` file or pick a built-in sample, so I can see a resurrection without preparing any files.

#### Acceptance Criteria
1. WHEN the user opens the app THEN the page SHALL show 3 built-in samples (Expense Tracker, Inventory Manager, Invoice Generator) and an upload control accepting `.bas` and `.vba` files plus a paste box.
2. WHEN the user selects a sample THEN the app SHALL load its VBA source and run the full conversion within 2 seconds on a typical laptop.
3. WHEN the user uploads a file THEN the app SHALL read it as text client-side and run the same conversion pipeline; no file SHALL be sent to a server.
4. WHEN the user uploads a file larger than 200 KB THEN the app SHALL show a clear error and SHALL NOT attempt to parse it.

### Requirement 2 — VBA parsing (supported subset)
**User Story:** As a user, I want the parser to understand the common VBA I actually wrote, so the resurrection covers my real macro.

#### Acceptance Criteria
1. WHEN the source contains `Sub` / `End Sub` and `Function` / `End Function` THEN the parser SHALL produce one program node per procedure with its name and parameters.
2. WHEN the source contains `Dim x As Integer/String/Double/Boolean`, `Const`, `If/ElseIf/Else/End If`, `For…Next`, `For Each…Next`, `Do While/Until…Loop` THEN the parser SHALL produce the corresponding AST nodes.
3. WHEN the source contains `Range("A1").Value`, `Cells(r, c).Value`, `Worksheets("…")`, `MsgBox`, `InputBox`, or `WorksheetFunction.Sum/Average/Count` THEN the parser SHALL produce the corresponding AST nodes.
4. WHEN the source contains an unsupported construct (`GoTo`, `On Error Resume Next`, ActiveX/UserForm, `Declare`, `CreateObject`, file I/O) THEN the parser SHALL record it in `unsupported` with the exact source line number and SHALL NOT crash.
5. WHEN the source is empty or contains only comments THEN the parser SHALL return an empty program with a clear "nothing to convert" message, not an error page.

### Requirement 3 — Deterministic transpilation to TypeScript + React
**User Story:** As a user, I want the generated code to be real, readable TypeScript I could keep, so the resurrection is useful beyond the demo.

#### Acceptance Criteria
1. WHEN a program is transpiled THEN the output SHALL be valid TypeScript: `Dim` → typed `let`/`const`, `If` → `if/else`, `For` → `for`, `&` → string `+`, `=` in a condition → `===`.
2. WHEN the same VBA input is transpiled twice THEN the two outputs SHALL be byte-for-byte identical.
3. WHEN a VBA identifier is illegal in TypeScript THEN the transpiler SHALL rename it deterministically (prefix `vba_`) and record a warning.
4. WHEN a procedure uses `Range`/`Cells` THEN the generated code SHALL operate on a typed row object / array, and the generated app SHALL render it as a data table.
5. WHEN `MsgBox` / `InputBox` appears THEN the generated app SHALL render a toast / modal instead of a browser `alert()` in the preview (the generated *code* may show the mapping as a comment).

### Requirement 4 — Side-by-side diff and conversion report
**User Story:** As a judge, I want to see the before and after next to each other and know exactly what did not convert, so I can trust the demo.

#### Acceptance Criteria
1. WHEN a conversion succeeds THEN the UI SHALL show the original VBA on the left and the generated TypeScript on the right, with line numbers on both sides.
2. WHEN a conversion has warnings THEN the report SHALL list each warning with the VBA line it came from.
3. WHEN a conversion has unsupported constructs THEN the report SHALL list each one with line number, construct name, and a one-line suggested rewrite.
4. WHEN a conversion has a parse error THEN the report SHALL show the error, the offending line, and the rest of the convertible code SHALL still be shown (partial conversion, not a blank page).

### Requirement 5 — Live runnable preview
**User Story:** As a user, I want to run the resurrected app, not just read its code, so I know the logic survived.

#### Acceptance Criteria
1. WHEN the user presses "Run the resurrected app" THEN the preview SHALL render the generated app's data table, form, and totals from the transpiled data model.
2. WHEN the user adds a row in the preview THEN totals / counts derived from the original macro SHALL update immediately.
3. WHEN the user edits a numeric field THEN the preview SHALL recompute the same way the VBA would (e.g. a running total, a low-stock flag).
4. WHEN the generated app is run THEN it SHALL never `eval()` generated code; the preview SHALL use a known template driven by the data model.

### Requirement 6 — Property-based and unit tests for the conversion
**User Story:** As a developer, I want property tests to catch conversion bugs that hand-written examples miss, so the transpiler can be trusted.

#### Acceptance Criteria
1. WHEN `npm test` runs THEN all unit tests for the parser and transpiler SHALL pass.
2. WHEN `npm test` runs THEN at least 3 property-based tests (fast-check) SHALL run, covering: (a) transpilation is deterministic, (b) a parsed-then-transpiled `If`/`For` round-trips structurally, (c) numeric expressions preserve value for generated random inputs in the supported range.
3. WHEN a new VBA construct is added THEN a unit test and a README subset-table row SHALL be added in the same change.

### Requirement 7 — Kiro Crew batch converter (Best Kiro Crew App)
**User Story:** As a user with a folder of dead macros, I want a background Crew agent to convert them all and report back, so I do not have to convert them one by one.

#### Acceptance Criteria
1. WHEN the Crew agent is given a folder of `.bas` files THEN it SHALL convert each file with the same parser/transpiler and write one report per file to `crew/reports/<name>.md`.
2. WHEN a file has unsupported constructs THEN its report SHALL list them with line numbers, exactly as the in-browser report does.
3. WHEN a file has zero supported constructs THEN the agent SHALL report that honestly and SHALL NOT emit code.
4. WHEN the batch finishes THEN the agent SHALL write `crew/reports/SUMMARY.md` with per-file counts (converted / skipped / unsupported).

### Requirement 8 — Deployment, repo, and submission readiness
**User Story:** As the entrant, I want the repo to pass Devpost's checks on the first try, so the submission is not disqualified on a technicality.

#### Acceptance Criteria
1. WHEN the repo is pushed to GitHub THEN it SHALL be public, SHALL contain an MIT `LICENSE` detectable by GitHub, and SHALL contain `/.kiro` at the root.
2. WHEN `.gitignore` is checked THEN it SHALL NOT contain a `.kiro` entry.
3. WHEN `npm install && npm run build` runs from a clean checkout THEN it SHALL succeed with no secrets or `.env` required.
4. WHEN the app is deployed to Vercel/Netlify THEN the live URL SHALL load the 3 samples and run a conversion with no backend.

## Non-requirements (out of scope for v1)
- Full VBA transpilation, `.xlsm` binary parsing, UserForms/ActiveX, multi-module projects, user accounts, backend, database.
