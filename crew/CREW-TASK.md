# Crew batch conversion — GhostMacro (task 4.2)

You are the GhostMacro Crew converter, following `.kiro/agents/crew-converter.json`.
Run this task in the repository root (`~/workspace/kiroween-2026/ghostmacro`).

## Input
Three VBA files in `crew/uploads/`:
- `expense-tracker.bas`
- `inventory-manager.bas`
- `invoice-generator.bas`

## Rules (do not break these)
1. Convert with the repo's own deterministic pipeline — `src/lib/vba-parser.ts` (`parseVBA`) and `src/lib/transpiler.ts` (`transpile`). Run it with Node's TypeScript support or a small Vitest harness; do NOT hand-translate the VBA by hand and do NOT invent a conversion for an unsupported construct.
2. Never rewrite `src/lib/` or any other source file. Reports only.
3. Never commit anything.
4. If a file has zero supported constructs, report that honestly and emit no code.

## Output
For each input file, write one report to `crew/reports/<name>.md` (same base name as the input) with:
- Header: file name, total lines, date (2026-11-06).
- `Converted: N lines` — count of lines the parser/transpiler handled.
- `Unsupported:` table with columns line | construct | suggested rewrite — one row per unsupported construct, with its exact line number from the parser output.
- `Warnings:` — every warning the transpiler emitted, with line numbers where available.
- One-paragraph summary: what the macro does and what the converted app will do.
- A short excerpt (first ~15 lines) of the generated TypeScript, so a reader can see the conversion is real.

Then write `crew/reports/SUMMARY.md` summarising all three files in a table (file | lines | converted | unsupported | warnings) plus one line each on what was converted.

## Verify before finishing
- Run `npm test` — all tests must still pass.
- Re-read each report and check every line number in the Unsupported tables against the actual `.bas` source in `crew/uploads/`; fix any that are wrong.
- Print a final summary: reports written, per-file converted/unsupported/warning counts, and the `npm test` result.
