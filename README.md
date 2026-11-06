# 👻 GhostMacro — VBA Séance

> **Talk to your dead macros. Bring them back as a modern web app.**
>
> Kiroween 2026 — Category: **Frankenstein** · Solo entry by chen

Every company has a haunted spreadsheet: an Excel workbook from 2009 whose VBA macros no one dares to touch, whose author left years ago, and whose business still runs on it. GhostMacro holds a séance for that dead code — upload the macro, watch it rise as a working TypeScript + React web app.

This is a **Frankenstein** project in the literal sense: it stitches together things that were never meant to live in one body —

- **Dead technology:** Excel VBA (1993– ), `Range` / `Cells`, `MsgBox`, `InputBox`, worksheet loops
- **Modern body:** TypeScript, React, Vite, Tailwind
- **A second brain:** deterministic parsing + property-based tests that prove the resurrection kept the original behaviour
- **A skeleton crew:** a Kiro Crew background agent that batch-converts uploads and posts a conversion report

No full VBA transpiler is attempted — that would be a lie in 28 days. GhostMacro converts a **documented, supported subset** and fails gracefully, with a clear unsupported-construct report, for everything else. See [Supported subset](#supported-vba-subset).

## 🎃 Demo flow for judges (90 seconds)

1. Open the app, click **“Try a haunted sample”** — pick *Expense Tracker*, *Inventory Manager*, or *Invoice Generator*.
2. Watch the séance: VBA on the left, generated TypeScript / React on the right, with a line-by-line diff.
3. Press **“Run the resurrected app”** — the generated app runs live in the browser: add an expense, see the total update, export the table. Same logic, new body.
4. Upload your own `.bas` / `.vba` file. If it uses an unsupported construct (e.g. `GoTo`, ActiveX, `On Error Resume Next` as control flow), you get a report naming the exact line and a suggested rewrite — not a silent wrong answer.

## 🚀 How to run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
npm test         # Vitest + fast-check property-based tests
npm run test:coverage
```

No backend, no API keys, no database. The parser and transpiler run entirely client-side, so the demo works offline and deploys as a static site (Vercel / Netlify).

## 🧟 Supported VBA subset

| VBA | GhostMacro handling |
| --- | --- |
| `Sub Name() … End Sub`, `Function Name(…) As Type … End Function` | → exported TS function / React handler |
| `Dim x As Integer / String / Double / Boolean`, `Const` | → `let` / `const` with inferred TS type |
| `If … Then … ElseIf … Else … End If` | → `if / else if / else` |
| `For i = 1 To n … Next i`, `For Each cell In Range … Next` | → `for` loop over row data |
| `Do While … Loop`, `Do Until … Loop` | → `while` loop (with a 10,000-iteration safety cap in the preview) |
| `Range("A1").Value`, `Cells(row, col).Value`, `Worksheets("Sheet1")` | → row-object field access on a typed data grid |
| `MsgBox "…"`, `InputBox("…")` | → toast / modal dialog in the generated app |
| `WorksheetFunction.Sum / Average / Count`, `Len`, `UCase`, `Trim`, `Format` | → `sum / average / count`, string helpers in `src/lib/vba-runtime.ts` (TODO in v1 skeleton — see tasks) |
| `+ - * /`, `&` concat, `= <> < > <= >=`, `And / Or / Not` | → JS operators (`&` → `+` for strings, `=` in a condition → `===`) |
| Comments `'` and `Rem` | → preserved as `//` comments |

**Explicitly unsupported in v1 (reported, not silently dropped):** `GoTo` / labels, `On Error Resume Next` as control flow, ActiveX / UserForms, `Declare` / Win32 API calls, `CreateObject`, file I/O (`Open`, `Print #`), `Select Case` with non-literal patterns (basic `Select Case` is a stretch goal), class modules, and anything that touches the Excel object model beyond worksheets/ranges.

## 📁 Project layout

```
ghostmacro/
├── .kiro/                    # REQUIRED — Kiro specs, steering, hooks, agents, MCP.
│   ├── steering/             # product.md, tech.md, structure.md
│   ├── specs/ghostmacro-v1/  # requirements.md, design.md, tasks.md
│   ├── hooks/                # lint-on-save, test-on-save
│   ├── settings/mcp.json     # GitHub + filesystem MCP servers
│   └── agents/crew-converter.json  # Kiro Crew batch-converter agent
├── src/
│   ├── lib/vba-parser.ts     # tokenizer + parser for the supported subset
│   ├── lib/transpiler.ts     # VBA AST → TypeScript / React codegen
│   ├── lib/samples.ts        # the 3 built-in samples
│   └── components/           # UploadPanel, DiffView, GeneratedAppPreview, ConversionReport
├── samples/                  # expense-tracker.bas, inventory-manager.bas, invoice-generator.bas
└── docs/PLAN.md              # 4-week execution plan + submission checklist
└── docs/KIRO-USAGE.md        # outline for the Devpost “How Kiro was used” write-up
```

## 🧠 How Kiro was used

Full write-up outline: [`docs/KIRO-USAGE.md`](docs/KIRO-USAGE.md).

Short version: spec-driven development in Kiro IDE (`.kiro/specs/ghostmacro-v1/` — requirements → design → tasks, reviewed before any implementation), steering files that keep the transpiler's subset honest, agent hooks that lint and test on save, MCP servers for GitHub and the local filesystem, a custom Crew agent that does batch conversion in the background, and property-based tests (`fast-check`) that catch conversion bugs unit tests miss. Built with Kiro IDE + CLI; Crew app in `crew/` (see `docs/PLAN.md` Week 3).

## 🏆 Kiroween 2026

- **Category:** Frankenstein
- **Submission deadline:** Dec 4, 2026 2:00 PM PT (= Dec 5, 2026 06:00 SGT)
- **Repo requirements:** public GitHub, MIT license, `/.kiro` at the root (present here — do not add it to `.gitignore`)
- **Targets:** Overall ($30k/$20k/$10k) or Best Frankenstein ($5k), plus Best Demo ($1k), Best Kiro Crew App ($1k), Bonus Blog, Social Blitz

## ⚠️ Status

V1 skeleton — parser and transpiler cover the core subset with real code; the runtime helpers, Crew app, and polished generated-app templates are phased in `docs/PLAN.md` / `.kiro/specs/ghostmacro-v1/tasks.md`. The 3 samples are written to fit the supported subset and are the acceptance test for “works end-to-end”.

## License

MIT — see [LICENSE](LICENSE).
