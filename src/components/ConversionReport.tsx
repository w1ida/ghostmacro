import type { ParseError, UnsupportedConstruct } from '../lib/vba-parser.ts'
import type { TranspileWarning } from '../lib/transpiler.ts'

interface Props {
  lineCount: number
  procedureCount: number
  errors: ParseError[]
  unsupported: UnsupportedConstruct[]
  warnings: TranspileWarning[]
}

export function ConversionReport({ lineCount, procedureCount, errors, unsupported, warnings }: Props) {
  const clean = errors.length === 0 && unsupported.length === 0
  return (
    <section className="panel" aria-label="Conversion report">
      <h2>4 · Conversion report 📜</h2>
      <p>
        {procedureCount} procedure{procedureCount === 1 ? '' : 's'} · {lineCount} lines ·{' '}
        {clean ? (
          <strong className="ok">Clean resurrection — no errors, nothing unsupported.</strong>
        ) : (
          <strong>Honest, not perfect — see what did not convert below.</strong>
        )}
      </p>
      {warnings.length > 0 && (
        <>
          <h3>Warnings ({warnings.length})</h3>
          <ul>{warnings.map((w, i) => <li key={i}>Line {w.line}: {w.message}</li>)}</ul>
        </>
      )}
      {unsupported.length > 0 && (
        <>
          <h3>Unsupported constructs ({unsupported.length})</h3>
          <ul>
            {unsupported.map((u, i) => (
              <li key={i}>
                <strong>Line {u.line} — {u.construct}:</strong> {u.suggestion}{' '}
                <code>{u.raw.trim()}</code>
              </li>
            ))}
          </ul>
        </>
      )}
      {errors.length > 0 && (
        <>
          <h3>Parse errors ({errors.length})</h3>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>Line {e.line}: {e.message} <code>{e.raw.trim()}</code></li>
            ))}
          </ul>
        </>
      )}
      {clean && warnings.length === 0 && <p className="muted">Nothing to report — the macro fit the supported subset exactly.</p>}
    </section>
  )
}
