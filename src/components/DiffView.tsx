interface Props {
  vbaSource: string
  tsCode: string
}

function NumberedCode({ code, label }: { code: string; label: string }) {
  const lines = code.split('\n')
  return (
    <div className="code-pane">
      <div className="code-header">{label}</div>
      <pre aria-label={label}>
        {lines.map((line, i) => (
          <div key={i} className="code-line">
            <span className="line-no">{i + 1}</span>
            <code>{line || ' '}</code>
          </div>
        ))}
      </pre>
    </div>
  )
}

export function DiffView({ vbaSource, tsCode }: Props) {
  return (
    <section className="panel" aria-label="Before and after">
      <h2>2 · The séance — before &amp; after</h2>
      <div className="diff-grid">
        <NumberedCode code={vbaSource} label="💀 Dead VBA — original" />
        <NumberedCode code={tsCode} label="✨ Resurrected TypeScript + React" />
      </div>
    </section>
  )
}
