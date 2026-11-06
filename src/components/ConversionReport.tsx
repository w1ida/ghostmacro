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
  const clean = errors.length === 0 && unsupported.length === 0 && warnings.length === 0
  const hasConversionGaps = errors.length > 0 || unsupported.length > 0

  return (
    <section className="panel" aria-label="Conversion report">
      <h2>4 · Conversion report 📜</h2>
      <div className="stats" aria-label="Conversion counts">
        <span>{procedureCount} procedure{procedureCount === 1 ? '' : 's'}</span>
        <span>{lineCount} lines</span>
        <span>{warnings.length} warning{warnings.length === 1 ? '' : 's'}</span>
        <span>{unsupported.length} unsupported</span>
        <span>{errors.length} error{errors.length === 1 ? '' : 's'}</span>
      </div>
      <p>
        {clean ? (
          <strong className="ok">Clean resurrection — the macro fit the supported subset exactly.</strong>
        ) : hasConversionGaps ? (
          <strong>Honest, not perfect — see what did not convert below.</strong>
        ) : (
          <strong>Resurrection complete with warnings — review the generated code below.</strong>
        )}
      </p>
      {warnings.length > 0 && (
        <>
          <h3>Warnings ({warnings.length})</h3>
          <ul>{warnings.map((warning, index) => <li key={index}>Line {warning.line}: {warning.message}</li>)}</ul>
        </>
      )}
      {unsupported.length > 0 && (
        <>
          <h3>Unsupported constructs ({unsupported.length})</h3>
          <ul>
            {unsupported.map((item, index) => (
              <li key={index}>
                <strong>Line {item.line} — {item.construct}</strong>
                <div>Suggested rewrite: {item.suggestion}</div>
                <code>Source: {item.raw.trim()}</code>
              </li>
            ))}
          </ul>
        </>
      )}
      {errors.length > 0 && (
        <>
          <h3>Parse errors ({errors.length})</h3>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>
                <strong>Line {error.line}:</strong> {error.message}
                <code>Source: {error.raw.trim()}</code>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
