import { useMemo, useState } from 'react'
import './App.css'
import { parseVBA } from './lib/vba-parser.ts'
import { transpile } from './lib/transpiler.ts'
import { SAMPLES, type GhostRow } from './lib/samples.ts'
import { UploadPanel } from './components/UploadPanel.tsx'
import { DiffView } from './components/DiffView.tsx'
import { GeneratedAppPreview } from './components/GeneratedAppPreview.tsx'
import { ConversionReport } from './components/ConversionReport.tsx'

export default function App() {
  const [selectedId, setSelectedId] = useState(SAMPLES[0].id)
  const [customName, setCustomName] = useState<string | null>(null)
  const [customSource, setCustomSource] = useState<string | null>(null)
  const [rows, setRows] = useState<GhostRow[]>(SAMPLES[0].rows)
  const [copied, setCopied] = useState(false)

  const sample = SAMPLES.find((s) => s.id === selectedId) ?? SAMPLES[0]
  const source = customSource ?? sample.source
  const fileLabel = customName ?? sample.fileName

  const parsed = useMemo(() => parseVBA(source), [source])
  const transpiled = useMemo(() => transpile(parsed), [parsed])

  const toast =
    parsed.errors.length === 0 && parsed.unsupported.length === 0
      ? `Resurrected ${parsed.program.procedures.length} procedure(s) from ${fileLabel} — no errors.`
      : `Resurrected with ${parsed.unsupported.length} unsupported construct(s) — see the report below.`

  const selectSample = (id: string) => {
    const s = SAMPLES.find((x) => x.id === id) ?? SAMPLES[0]
    setSelectedId(s.id)
    setCustomSource(null)
    setCustomName(null)
    setRows(s.rows)
  }

  const copyCode = () => {
    void navigator.clipboard?.writeText(transpiled.code).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">🎃 Kiroween 2026 · Frankenstein</p>
        <h1>GhostMacro <span aria-hidden="true">👻</span></h1>
        <p className="pitch">Talk to your dead macros. Upload an Excel VBA macro — watch it rise as a working modern web app.</p>
        <p className="muted">Deterministic parser + transpiler, property-based tests, and a Kiro Crew batch converter. No backend, no API keys.</p>
      </header>

      <main>
        <UploadPanel
          samples={SAMPLES}
          selectedId={customSource ? '' : selectedId}
          onSelectSample={selectSample}
          onUpload={(name, text) => { setCustomName(name); setCustomSource(text) }}
          onPaste={(text) => { setCustomName('pasted-code.vba'); setCustomSource(text) }}
        />
        <p className="current-file">Now resurrecting: <code>{fileLabel}</code> · {source.split('\n').length} lines</p>

        <DiffView vbaSource={source} tsCode={transpiled.code} />
        <div className="copy-row">
          <button type="button" className="btn secondary" onClick={copyCode}>
            {copied ? '✅ Copied!' : '📋 Copy generated TypeScript'}
          </button>
        </div>

        <GeneratedAppPreview rows={rows} toast={toast} onAddRow={(row) => setRows((prev) => [...prev, row])} />

        <ConversionReport
          lineCount={source.split('\n').length}
          procedureCount={parsed.program.procedures.length}
          errors={parsed.errors}
          unsupported={transpiled.unsupported}
          warnings={transpiled.warnings}
        />
      </main>

      <footer>
        <p>GhostMacro — Kiroween 2026, Frankenstein. Built with Kiro (spec-driven, hooks, MCP, Crew). MIT licensed. <code>/.kiro</code> lives at the repo root.</p>
      </footer>
    </div>
  )
}
