# Crew app — GhostMacro batch converter

> TODO (Week 3, task 4.2). This folder is the home of the **Best Kiro Crew App** ($1,000) evidence.

## How it works
1. Drop `.bas` / `.vba` files into `crew/uploads/`.
2. Run the Crew agent defined in `.kiro/agents/crew-converter.json` (Kiro Crew, on Kiro CLI).
3. The agent converts each file with the same deterministic parser/transpiler as the web app and writes one report per file to `crew/reports/<name>.md`, plus `crew/reports/SUMMARY.md`.
4. The agent never rewrites `src/lib/` and never commits — reports only.

## Layout (to be created in Week 3)
```
crew/
├── README.md        # this file
├── uploads/         # input .bas files (the 3 samples go here first)
└── reports/         # output: one .md per file + SUMMARY.md
```

## Report format
Header (file, lines, date) · `Converted: n lines` · `Unsupported:` table (line | construct | suggestion) · `Warnings:` · one-paragraph summary.
