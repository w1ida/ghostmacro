# Design — GhostMacro v1

## Overview
A static, client-side single-page app. No backend. The whole product is a pipeline that runs in the browser:

```
.bas / .vba text ──► tokenizer ──► parser (VBA AST)
                                  │  errors + unsupported (with line numbers)
                                  ▼
                          transpiler (AST → TS/React source text)
                                  │  warnings + unsupported
                                  ▼
                    ┌─────────────┴──────────────┐
                    ▼                            ▼
              DiffView                     GeneratedAppPreview
         (VBA vs TS,                     (known template driven
          line numbers)                   by the transpiled model)
                    └─────────────┬──────────────┘
                                  ▼
                         ConversionReport
```

A Kiro Crew agent reuses the same parser/transpiler logic for batch conversion and writes Markdown reports to `crew/reports/`. It does not share code with the browser bundle in v1 (it is a documented agent workflow, not an imported module) — the contract between them is the supported subset in `README.md` and the report format in Requirement 7.

## Architecture

### 1. Parser — `src/lib/vba-parser.ts`
- **Input:** raw VBA source string.
- **Output:** `ParseResult { program: VBAProgram, errors: ParseError[], unsupported: UnsupportedConstruct[] }`.
- **Never throws** on user input. Every failure is a value in `errors`/`unsupported`.
- **Tokenizer:** splits source into lines first (line numbers are first-class — every AST node carries `line`). Within a line, tokenizes identifiers, numbers, strings (`"…"`, with `""` as an escaped quote), operators (`+ - * / & = <> < > <= >=`), parentheses, commas, and the `'` comment marker. VBA is case-insensitive for keywords; the tokenizer normalises keywords to upper case and preserves identifier case for codegen.
- **Parser:** a small recursive-descent parser over the token stream, one function per construct:
  - `parseProcedure` — `Sub`/`Function … End Sub`/`End Function`
  - `parseDim` / `parseConst`
  - `parseIf` — `If … Then` (single-line `If … Then …` is normalised to block form), `ElseIf`, `Else`
  - `parseFor` — `For i = a To b [Step s] … Next`, `For Each x In Range … Next`
  - `parseDo` — `Do While/Until … Loop`, `While … Wend` (mapped to `Do While`)
  - `parseRange` — `Range("A1").Value`, `Cells(r, c).Value`, `Worksheets("…").Range(…)`
  - `parseCall` — `MsgBox`, `InputBox`, `WorksheetFunction.*`, plain procedure calls
  - Anything else on a line → if it matches the known unsupported list (`GoTo`, `On Error`, `Declare`, `CreateObject`, `Open … #`, UserForm/ActiveX keywords) it is recorded in `unsupported` with its line; otherwise it is recorded as a parse error with the line and the parser continues with the next line (recovery, not abort).
- **AST types** (in the same file for v1, split out if the file exceeds ~300 lines): `VBAProgram { procedures: Procedure[] }`, `Procedure { name, kind: 'sub'|'function', params, body: Statement[] }`, `Statement` = union of `DimStmt | AssignStmt | IfStmt | ForStmt | ForEachStmt | DoStmt | CallStmt | RangeStmt | MsgBoxStmt | InputBoxStmt | ReturnStmt | CommentStmt`.

### 2. Transpiler — `src/lib/transpiler.ts`
- **Input:** `VBAProgram`. **Output:** `TranspileResult { code: string, warnings: Warning[], unsupported: UnsupportedConstruct[] }`.
- **Pure and deterministic.** Same AST → same string. No `Date.now()`, no random IDs, no LLM calls.
- **Mapping (the heart of the product):**
  - Types: `Integer/Long → number`, `String → string`, `Double/Single → number`, `Boolean → boolean`, `Variant → unknown` (with a warning).
  - `Dim x As T` → `let x: T;` (or `const` for `Const`).
  - Assignment `x = expr` → `x = <expr>;` ; `=` inside a condition → `===`; `<>` → `!==`; `And/Or/Not` → `&&/||/!`; `&` → `+`.
  - `Range("A1").Value` → `row.<column>` where the column is derived from the sample's data model (see below); `Cells(r, c)` → `rows[r - 1][<column c>]` in codegen comments, resolved to a named field in the preview model.
  - `MsgBox "…" ` → `showToast("…")` in generated code, with a comment noting the mapping.
  - `WorksheetFunction.Sum(range)` → `sum(rows.map(r => r.<field>))` using `vba-runtime` helpers.
  - Procedures → exported functions; a `Sub` that builds a table becomes a React component skeleton (`export function <Name>App() { … }`) with a data-grid + form, so the generated code is visibly a *web app*, not just a function dump.
- **Data model for the preview:** each sample declares a `DataModel { fields: { name, type, label }[], rows: Record<string, string|number|boolean>[] }` in `src/lib/samples.ts`. The transpiler emits code *about* that model; the preview renders the model. This is the deliberate scope cut that makes "run the generated app" feasible in v1 without executing generated code.

### 3. Runtime helpers — `src/lib/vba-runtime.ts` (Week 2)
Pure functions mirroring VBA semantics where they differ from JS: `vbaSum`, `vbaAverage`, `vbaCount`, `vbaLen`, `vbaUCase`, `vbaTrim`, `vbaFormat`. Each has a unit test and a property test where applicable (e.g. `vbaSum` over a random array equals the array's JS sum).

### 4. UI — `src/App.tsx` + `src/components/`
Single page, three zones:
- **Header:** name, one-line pitch, category badge (Frankenstein), links to GitHub / Devpost (placeholders until the repo exists).
- **Left / input zone — `UploadPanel`:** sample picker (3 cards), file input (`.bas,.vba`), paste textarea, "Run séance" button. Shows file name + line count once loaded.
- **Centre / output zone — `DiffView`:** two `<pre>` panes with line numbers, VBA left, TS right. A toggle for "generated app code only" vs "full file".
- **Right / live zone — `GeneratedAppPreview`:** renders the transpiled model as a working mini-app: table, add-row form, totals. A "Copy generated code" button.
- **Below — `ConversionReport`:** counts (lines converted / warnings / unsupported), then each warning/unsupported item with line number and suggested rewrite.
- **Theme:** `src/index.css` defines CSS variables (`--ghost-purple`, `--pumpkin`, `--bone`, `--bg`, `--panel`). Dark background `#0d0916`, purple `#7c3aed`, orange `#ff7a1a`, bone white `#f5f1e6`. Code panes use a monospace stack. All interactive elements are keyboard-reachable and have visible focus states. No Halloween effect may reduce contrast below WCAG AA for body text.

### 5. Samples — `samples/*.bas` + `src/lib/samples.ts`
Each sample is a real, short VBA macro (30–60 lines) that fits the supported subset exactly, plus a `DataModel` with 3–5 seed rows so the preview is alive on first load. The samples are the acceptance test: if a sample does not parse with zero errors and zero unsupported, v1 is not done.

### 6. Crew app — `crew/` (Week 3) + `.kiro/agents/crew-converter.json`
- The agent is invoked on a folder (`crew/uploads/`) and writes `crew/reports/<name>.md` + `SUMMARY.md`.
- Report format: header (file, lines, date), `Converted: n lines`, `Unsupported:` (table: line | construct | suggestion), `Warnings:`, and a one-paragraph summary.
- The agent must not edit `src/lib/` and must not commit. It is a *reporter*, not a rewriter — that boundary is what makes the Crew story credible to judges.

### 7. Testing strategy
- **Unit (Vitest):** one test per parser construct and per transpiler mapping, using the sample files as fixtures.
- **Property (fast-check):** determinism (transpile twice → identical), expression preservation (random numeric expressions in the supported range evaluate the same before/after mapping, via a small evaluator in the test), and parser robustness (random mutations of a valid file never throw — they produce errors/unsupported, not a crash).
- **Manual:** the 3 samples end-to-end in the browser, plus one deliberately unsupported file (`GoTo` + `CreateObject`) to verify the report path.

## Data flow & error handling
- Every stage returns a result object; no stage throws on user input.
- The UI shows partial results: if parsing fails on line 12, lines 1–11 and 13+ still convert and are shown, with line 12 flagged in the report.
- The app works with no network. The only network call in the product is none.

## Deployment
Static build (`npm run build` → `dist/`). Deploy `dist/` to Vercel or Netlify. No environment variables, no serverless functions in v1.
