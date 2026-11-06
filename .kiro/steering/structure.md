# Structure — GhostMacro

## Repo layout
```
ghostmacro/
├── .kiro/                          # REQUIRED for Kiroween judging — never gitignore this
│   ├── steering/                   # product.md, tech.md, structure.md (this file)
│   ├── specs/ghostmacro-v1/        # requirements.md, design.md, tasks.md
│   ├── hooks/                      # lint-on-save.json, test-on-save.json
│   ├── settings/mcp.json           # MCP servers (github, filesystem)
│   └── agents/crew-converter.json  # Crew batch-converter agent
├── src/
│   ├── main.tsx                    # Vite entry — renders <App />
│   ├── App.tsx                     # page shell: header, sample picker, 3-pane layout
│   ├── App.css / index.css         # Halloween theme (CSS variables, dark)
│   ├── lib/
│   │   ├── vba-parser.ts           # tokenizer + parser → VBAProgram AST
│   │   ├── transpiler.ts           # AST → TypeScript/React codegen
│   │   ├── vba-runtime.ts          # TODO (Week 2): Sum/Average/Len/UCase helpers for generated apps
│   │   └── samples.ts              # the 3 built-in samples (source + metadata)
│   └── components/
│       ├── UploadPanel.tsx         # file upload + paste + sample picker
│       ├── DiffView.tsx            # side-by-side VBA vs generated TS
│       ├── GeneratedAppPreview.tsx # live runnable preview of the generated app
│       └── ConversionReport.tsx    # errors / unsupported constructs / warnings
├── samples/                        # expense-tracker.bas, inventory-manager.bas, invoice-generator.bas
├── docs/
│   ├── PLAN.md                     # 4-week plan + submission checklist
│   └── KIRO-USAGE.md               # Devpost "How Kiro was used" outline
├── package.json  vite.config.ts  tsconfig.json  index.html
├── README.md  LICENSE (MIT)  .gitignore
└── crew/                           # TODO (Week 3): Kiro Crew app — batch converter + report
    └── README.md                   # (to be added) how the Crew app is run and what it outputs
```

## Where things go
- New parser support for a VBA construct → `src/lib/vba-parser.ts` + a test in `src/lib/*.test.ts` + a row in `README.md`'s supported-subset table. All three, or the change is incomplete.
- New generated-app behaviour → `src/lib/transpiler.ts` (codegen) + `src/components/GeneratedAppPreview.tsx` (runtime template). Never generate code that the preview cannot run.
- New sample → `samples/<name>.bas` + an entry in `src/lib/samples.ts` + a parse test asserting zero errors.
- Kiro process docs → `.kiro/specs/` or `docs/` only. Do not put process notes in `src/`.
- Demo / submission artefacts (video script, blog draft, social post) → `docs/PLAN.md` until they are published, then link the published URLs in the Devpost submission, not in the repo.

## File rules
- One component per file, named exactly as the export (`UploadPanel.tsx` exports `UploadPanel`).
- `src/lib/*.ts` must have no React / DOM imports, so they stay testable in Vitest without jsdom.
- Keep files under ~300 lines where possible; split the parser (tokenizer vs parser) if it grows past that.
- Every public function in `src/lib/` gets a JSDoc line stating its input, output, and what it does on invalid input.
