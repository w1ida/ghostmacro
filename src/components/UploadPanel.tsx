import { useRef, useState } from 'react'
import type { Sample } from '../lib/samples.ts'

interface Props {
  samples: Sample[]
  selectedId: string
  onSelectSample: (id: string) => void
  onUpload: (fileName: string, source: string) => void
  onPaste: (source: string) => void
}

export function UploadPanel({ samples, selectedId, onSelectSample, onUpload, onPaste }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [paste, setPaste] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (file.size > 200 * 1024) {
      setError('File is over the 200 KB limit — split it into one module per conversion.')
      return
    }
    if (!/\.bas$|\.vba$/i.test(file.name)) {
      setError('GhostMacro reads .bas / .vba text exports. In Excel: Alt+F11 → right-click the module → Export File.')
      return
    }
    setError(null)
    void file.text().then((text) => onUpload(file.name, text))
  }

  return (
    <section className="panel upload-panel" aria-label="Upload a macro">
      <h2>1 · Summon a macro</h2>
      <p className="muted">Pick a haunted sample, or upload your own <code>.bas</code> / <code>.vba</code> export.</p>
      <div className="sample-grid">
        {samples.map((s) => (
          <button
            key={s.id}
            type="button"
            className={selectedId === s.id ? 'sample-card selected' : 'sample-card'}
            onClick={() => onSelectSample(s.id)}
          >
            <strong>{s.title}</strong>
            <span>{s.tagline}</span>
            <code>{s.fileName}</code>
          </button>
        ))}
      </div>
      <div className="upload-row">
        <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
          📁 Upload .bas / .vba
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".bas,.vba"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <span className="muted">Runs entirely in your browser. Nothing is uploaded to a server.</span>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <details className="paste-box">
        <summary>Paste VBA code instead</summary>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="' Paste your Sub ... End Sub here"
          rows={6}
          aria-label="Paste VBA code"
        />
        <button type="button" className="btn secondary" disabled={paste.trim() === ''} onClick={() => onPaste(paste)}>
          Run the séance on pasted code
        </button>
      </details>
    </section>
  )
}
