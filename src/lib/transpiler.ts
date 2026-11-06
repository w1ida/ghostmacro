/**
 * GhostMacro transpiler — VBA AST → TypeScript / React source text.
 * Pure and deterministic: same AST → same string, byte-for-byte.
 * No LLM calls, no randomness, no eval in the core path.
 */
import type { ParseResult, Procedure, Statement, UnsupportedConstruct } from './vba-parser.ts'

export interface TranspileWarning {
  line: number
  message: string
}

export interface TranspileResult {
  code: string
  warnings: TranspileWarning[]
  unsupported: UnsupportedConstruct[]
}

const TYPE_MAP: Record<string, string> = {
  integer: 'number',
  long: 'number',
  double: 'number',
  single: 'number',
  string: 'string',
  boolean: 'boolean',
  variant: 'unknown',
  date: 'string',
  currency: 'number',
}

const TS_RESERVED = new Set(['function', 'class', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'delete', 'typeof', 'instanceof', 'in', 'of', 'export', 'import', 'default', 'extends', 'super', 'this', 'void', 'null', 'undefined', 'true', 'false'])

function safeName(name: string, line: number, warnings: TranspileWarning[]): string {
  if (TS_RESERVED.has(name.toLowerCase())) {
    warnings.push({ line, message: `Renamed "${name}" to "vba_${name}" — it is a reserved word in TypeScript.` })
    return `vba_${name}`
  }
  return name
}

/** Convert a VBA expression to a TS expression. Handles the common operators. */
export function convertExpr(expr: string): string {
  let out = expr.trim()
  // Strings stay as-is (VBA "..." is valid TS). Handle & concatenation and
  // the equality operators — order matters: do <> / <= / >= before bare =.
  out = out.replace(/<>/g, '!==')
  out = out.replace(/<=/g, '≤').replace(/>=/g, '≥')
  // Bare = in an expression is a comparison in VBA (assignment is handled
  // by the statement parser, not here). Only replace = that is not part of
  // <=, >=, ==, != and is surrounded by spaces / identifiers.
  out = out.replace(/([^=!<>])=([^=])/g, '$1===$2')
  out = out.replace(/≤/g, '<=').replace(/≥/g, '>=')
  // & is VBA string concatenation; in TS + does the same for strings.
  // Do this BEFORE And/Or → &&/||, or the && we just created would be
  // mistaken for two & operators. VBA has no &&, so a lone & is safe here.
  out = out.replace(/\s*&\s*/g, ' + ')
  out = out.replace(/\bAnd\b/gi, '&&').replace(/\bOr\b/gi, '||').replace(/\bNot\b/gi, '!')
  // WorksheetFunction helpers → runtime helpers (see vba-runtime.ts, Week 2).
  out = out.replace(/WorksheetFunction\.Sum\s*\(/gi, 'vbaSum(')
  out = out.replace(/WorksheetFunction\.Average\s*\(/gi, 'vbaAverage(')
  out = out.replace(/WorksheetFunction\.Count\s*\(/gi, 'vbaCount(')
  out = out.replace(/\bLen\s*\(/gi, 'vbaLen(')
  out = out.replace(/\bUCase\s*\(/gi, 'vbaUCase(')
  out = out.replace(/\bTrim\s*\(/gi, 'vbaTrim(')
  // Range("B2:B10").Value / Cells(r, c).Value → row-model access.
  // Range("B2:B10") without .Value (e.g. inside WorksheetFunction.Sum)
  // → an array over the rows, so vbaSum(rows.map(...)) typechecks.
  out = out.replace(/Range\("([A-Z]+)\d+:[A-Z]+\d+"\)/gi, (_m, col: string) => `rows.map((r) => r.${columnToField(col)})`)
  out = out.replace(/Range\("([A-Z]+)(\d+)(?::[A-Z]+\d+)?"\)\.Value/gi, (_m, col: string) => `row.${columnToField(col)}`)
  out = out.replace(/Cells\s*\(\s*[^,]+\s*,\s*(\d+)\s*\)\.Value/gi, (_m, c: string) => `row.${columnIndexToField(Number(c))}`)
  out = out.replace(/Worksheets\("([^"]+)"\)\.Range\("([A-Z]+)\d+"\)\.Value/gi, (_m, _sheet: string, col: string) => `row.${columnToField(col)}`)
  return out
}

export function columnToField(col: string): string {
  const map: Record<string, string> = { A: 'id', B: 'amount', C: 'category', D: 'name', E: 'quantity', F: 'price', G: 'total', H: 'note' }
  return map[col.toUpperCase()] ?? `col${col.toUpperCase()}`
}

export function columnIndexToField(index: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const col = letters[index - 1] ?? `col${index}`
  return columnToField(col)
}

function convertTarget(target: string): string {
  // Range("A1").Value = x  →  row.id = x   (same mapping as expressions)
  let out = target.trim()
  out = out.replace(/Range\("([A-Z]+)(\d+)(?::[A-Z]+\d+)?"\)\.Value/gi, (_m, col: string) => `row.${columnToField(col)}`)
  out = out.replace(/Cells\s*\(\s*[^,]+\s*,\s*(\d+)\s*\)\.Value/gi, (_m, c: string) => `row.${columnIndexToField(Number(c))}`)
  return out
}

function emitStatements(stmts: Statement[], indent: string, warnings: TranspileWarning[], out: string[]): void {
  for (const s of stmts) {
    switch (s.kind) {
      case 'comment':
        out.push(`${indent}// ${s.text}`)
        break
      case 'dim': {
        const tsType = TYPE_MAP[s.vbaType.toLowerCase()] ?? 'unknown'
        if (tsType === 'unknown') warnings.push({ line: s.line, message: `Dim ${s.name} As ${s.vbaType} mapped to "unknown" — give it a concrete type in the generated app.` })
        out.push(`${indent}let ${safeName(s.name, s.line, warnings)}: ${tsType};`)
        break
      }
      case 'const':
        out.push(`${indent}const ${safeName(s.name, s.line, warnings)} = ${convertExpr(s.value)};`)
        break
      case 'assign':
        out.push(`${indent}${convertTarget(s.target)} = ${convertExpr(s.expr)};`)
        break
      case 'return':
        out.push(`${indent}return ${convertExpr(s.expr)};`)
        break
      case 'msgbox':
        out.push(`${indent}// MsgBox → toast in the generated app`)
        out.push(`${indent}showToast(${convertExpr(s.expr)});`)
        break
      case 'inputbox':
        if (s.target) out.push(`${indent}${safeName(s.target, s.line, warnings)} = await showPrompt(${convertExpr(s.prompt)});`)
        else out.push(`${indent}await showPrompt(${convertExpr(s.prompt)});`)
        break
      case 'call':
        out.push(`${indent}${safeName(s.name, s.line, warnings)}(${s.args ? convertExpr(s.args) : ''});`)
        break
      case 'if': {
        out.push(`${indent}if (${convertExpr(s.condition)}) {`)
        emitStatements(s.thenBody, indent + '  ', warnings, out)
        for (const branch of s.elseIfs) {
          out.push(`${indent}} else if (${convertExpr(branch.condition)}) {`)
          emitStatements(branch.body, indent + '  ', warnings, out)
        }
        if (s.elseBody) {
          out.push(`${indent}} else {`)
          emitStatements(s.elseBody, indent + '  ', warnings, out)
        }
        out.push(`${indent}}`)
        break
      }
      case 'for': {
        const step = s.step ? `; ${s.variable} += ${convertExpr(s.step)}` : `; ${s.variable}++`
        out.push(`${indent}for (let ${s.variable} = ${convertExpr(s.from)}; ${s.variable} <= ${convertExpr(s.to)}${step}) {`)
        emitStatements(s.body, indent + '  ', warnings, out)
        out.push(`${indent}}`)
        break
      }
      case 'forEach': {
        out.push(`${indent}for (const ${s.variable} of ${convertExpr(s.collection)}) {`)
        emitStatements(s.body, indent + '  ', warnings, out)
        out.push(`${indent}}`)
        break
      }
      case 'do': {
        const cond = convertExpr(s.condition)
        const test = s.kind2 === 'while' ? cond : `!(${cond})`
        out.push(`${indent}while (${test}) {`)
        emitStatements(s.body, indent + '  ', warnings, out)
        out.push(`${indent}}`)
        break
      }
    }
  }
}

function emitProcedure(proc: Procedure, warnings: TranspileWarning[]): string[] {
  const out: string[] = []
  const params = proc.params.map((p) => {
    const m = p.match(/^([A-Za-z_][A-Za-z0-9_]*)(?:\s+As\s+([A-Za-z]+))?$/)
    if (!m) return p
    return `${safeName(m[1], proc.startLine, warnings)}: ${TYPE_MAP[(m[2] ?? 'Variant').toLowerCase()] ?? 'unknown'}`
  })
  const ret = proc.returnType ? `: ${TYPE_MAP[proc.returnType.toLowerCase()] ?? 'unknown'}` : ''
  out.push(`export function ${safeName(proc.name, proc.startLine, warnings)}(${params.join(', ')})${ret} {`)
  emitStatements(proc.body, '  ', warnings, out)
  out.push('}')
  return out
}

export function transpile(result: ParseResult): TranspileResult {
  const warnings: TranspileWarning[] = []
  const lines: string[] = []
  lines.push('// 👻 GhostMacro — resurrected from Excel VBA. Generated code, do not edit by hand.')
  lines.push('// Original: VBA macro  ·  Resurrected: TypeScript + React')
  lines.push('')
  lines.push("import { vbaSum, vbaAverage, vbaCount } from './vba-runtime';")
  lines.push('')
  lines.push('// TODO (Week 2): showToast / showPrompt are provided by the generated-app template.')
  lines.push('declare function showToast(message: string): void;')
  lines.push('declare function showPrompt(prompt: string): Promise<string>;')
  lines.push('')
  lines.push('export interface GhostRow {')
  lines.push('  id: string;')
  lines.push('  name: string;')
  lines.push('  category: string;')
  lines.push('  amount: number;')
  lines.push('  quantity: number;')
  lines.push('  price: number;')
  lines.push('  total: number;')
  lines.push('}')
  lines.push('')

  for (const proc of result.program.procedures) {
    lines.push(...emitProcedure(proc, warnings))
    lines.push('')
  }

  // Component skeleton so the output reads as a web app, not a function dump.
  const first = result.program.procedures[0]
  if (first) {
    lines.push(`// Generated app shell — renders the resurrected "${first.name}" logic as a web app.`)
    lines.push(`export function ${safeName(first.name, first.startLine, warnings)}App({ rows }: { rows: GhostRow[] }) {`)
    lines.push('  // The preview in GhostMacro renders this template with live data.')
    lines.push('  // TODO (Week 3): generate the full JSX table/form from the procedure body.')
    lines.push('  return rows;')
    lines.push('}')
    lines.push('')
  }

  return { code: lines.join('\n'), warnings, unsupported: result.unsupported }
}
