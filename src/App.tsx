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
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  const sample = SAMPLES.find((s) => s.id === selectedId) ?? SAMPLES[0]
  const source = customSource ?? sample.source
  const fileLabel = customName ?? sample.fileName

  const parsed = useMemo(() => parseVBA(source), [source])
  const transpiled = useMemo(() => transpile(parsed), [parsed])
  const hasProcedures = parsed.program.procedures.length > 0
  const lineCount = source === '' ? 0 : source.split('\n').length

  const conversionGaps = [
    `${parsed.errors.length} parse error${parsed.errors.length === 1 ? '' : 's'}`,
    `${transpiled.unsupported.length} unsupported construct${transpiled.unsupported.length === 1 ? '' : 's'}`,
    `${transpiled.warnings.length} warning${transpiled.warnings.length === 1 ? '' : 's'}`,
  ].filter((entry) => !entry.startsWith('0 '))
  const toast = !hasProcedures
    ? null
    : conversionGaps.length === 0
      ? `Resurrected ${parsed.program.procedures.length} procedure(s) from ${fileLabel} — no errors or warnings.`
      : `Conversion of ${fileLabel} found ${conversionGaps.join(', ')}. See the report below.`

  const selectSample = (id: string) => {
    const s = SAMPLES.find((x) => x.id === id) ?? SAMPLES[0]
    setSelectedId(s.id)
    setCustomSource(null)
    setCustomName(null)
    setRows(s.rows)
  }

  const loadCustomSource = (name: string, sourceText: string) => {
    setSelectedId('')
    setCustomName(name)
    setCustomSource(sourceText)
    setRows([])
  }

  const copyCode = async () => {
    if (!navigator.clipboard?.writeText) {
      setCopyStatus('failed')
      return
    }

    try {
      await navigator.clipboard.writeText(transpiled.code)
      setCopyStatus('copied')
      window.setTimeout(() => setCopyStatus('idle'), 2000)
    } catch {
      setCopyStatus('failed')
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">🎃 Kiroween 2026 · Frankenstein</p>
        <h1>GhostMacro <span aria-hidden="true">👻</span></h1>
        <p className="pitch">Talk to your dead macros. Upload an Excel VBA macro — watch it rise as a working modern web app.</p>
        <p className="muted">Deterministic parser + transpiler and property-based tests. No backend, no API keys.</p>
      </header>

      <main>
        <UploadPanel
          samples={SAMPLES}
          selectedId={customSource !== null ? '' : selectedId}
          onSelectSample={selectSample}
          onUpload={loadCustomSource}
          onPaste={(text) => loadCustomSource('pasted-code.vba', text)}
        />
        <p className="current-file">Now resurrecting: <code>{fileLabel}</code> · {lineCount} lines</p>

        <DiffView vbaSource={source} tsCode={transpiled.code} />
        <div className="copy-row">
          <button type="button" className="btn secondary" disabled={!hasProcedures} onClick={copyCode}>
            {!hasProcedures ? 'Nothing to copy' : copyStatus === 'copied' ? '✅ Copied!' : copyStatus === 'failed' ? '⚠️ Copy unavailable' : '📋 Copy generated TypeScript'}
          </button>
        </div>

        {hasProcedures ? (
          <GeneratedAppPreview rows={rows} toast={toast} onAddRow={(row) => setRows((prev) => [...prev, row])} />
        ) : (
          <section className="panel" aria-label="Empty generated app preview">
            <h2>3 · Nothing to run yet 👻</h2>
            <p className="muted" role="status">No Sub or Function was found. Add one to generate a runnable preview.</p>
          </section>
        )}

        <ConversionReport
          lineCount={lineCount}
          procedureCount={parsed.program.procedures.length}
          errors={parsed.errors}
          unsupported={transpiled.unsupported}
          warnings={transpiled.warnings}
        />
      </main>

      <footer>
        <p>GhostMacro — Kiroween 2026, Frankenstein. Built with this repository’s <code>.kiro</code> spec and steering configuration, plus Phase 3 UI work completed with Kiro CLI in this session. MIT licensed.</p>
      </footer>
    </div>
  )
}
