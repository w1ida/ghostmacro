# Tech — GhostMacro

## Stack (locked for v1 — do not change without updating the spec)
- **Language:** TypeScript 5, `strict: true`, `noUnusedLocals`, `noUnusedParameters`.
- **Frontend:** Vite 5 + React 18, `react-jsx` runtime. No framework (no Next.js) — static deploy.
- **Styling:** plain CSS in `src/index.css` / `src/App.css` (dark Halloween theme, CSS variables). Tailwind is *not* a dependency in the skeleton to keep `npm install` fast and the build deterministic; if Tailwind is added later, it must be a separate spec task and must not break the existing CSS variables.
- **Tests:** Vitest + `fast-check` for property-based tests. Every transpiler mapping in `src/lib/transpiler.ts` needs at least one unit test and, where it is a pure function, one property test.
- **No backend:** parser + transpiler run client-side. No API keys, no secrets, no `.env` required to run the demo.

## Conventions
- **Files:** `src/lib/` = pure, testable logic (no React imports). `src/components/` = React UI only; all conversion logic lives in `lib` and is passed in as props / results.
- **Parser:** `vba-parser.ts` exports `parseVBA(source: string): ParseResult`. It never throws on bad input — it returns `{ program, errors, unsupported }`. A crash on user input is a bug, not an edge case.
- **Transpiler:** `transpiler.ts` exports `transpile(program: VBAProgram): TranspileResult` with `{ code, warnings, unsupported }`. Deterministic: same input → same output, byte-for-byte. No randomness, no LLM calls in the core path.
- **Naming:** VBA identifiers are preserved where legal in TS (`TotalAmount` stays `TotalAmount`); illegal names get a deterministic `vba_` prefix and a warning entry.
- **Ranges:** `Range("A1").Value` / `Cells(r, c).Value` map to a typed row object (`row.amount`), never to a fake spreadsheet grid library in v1. The generated app uses a plain data table.
- **Safety:** generated preview code is never `eval`'d. The preview renders a *known* template (data grid + form + totals) driven by the transpiled data model, not by executing arbitrary generated JS.
- **Errors:** user-facing errors name the VBA line number and the construct. Internal errors are logged, never shown as a blank page.

## Commands
```bash
npm install
npm run dev        # Vite dev server, http://localhost:5173
npm run build      # tsc -b && vite build — must pass before any commit
npm test           # vitest run
npm run typecheck  # tsc --noEmit
```

## Kiro tooling in this repo
- Specs live in `.kiro/specs/ghostmacro-v1/` (`requirements.md`, `design.md`, `tasks.md`). Implement from `tasks.md` in order; do not skip ahead to UI polish before the parser tasks pass.
- Hooks in `.kiro/hooks/` run lint/test on save. If a hook fails, fix the code — do not disable the hook.
- MCP in `.kiro/settings/mcp.json`: `github` (repo / issues) and `filesystem` (workspace only). No secrets in this file.
- Custom agent: `.kiro/agents/crew-converter.json` — the Crew batch converter. It may only read `samples/` and `uploads/` (a future folder) and write conversion reports; it must not rewrite `src/lib/` without a human-reviewed spec task.

## Dependencies — keep them minimal
React, React-DOM, Vite, TypeScript, Vitest, fast-check. Add a dependency only if (a) it is needed for a spec task, and (b) the task records why a hand-rolled alternative was rejected. No UI component library in v1.
