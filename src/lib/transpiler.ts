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

/** Row-model context threaded through emission.
 * VBA sheet rows are 1-based with row 1 the header, so sheet row n is
 * `rows[n - 2]`. A numeric `For` loop variable holds a sheet row *number*
 * (`rows[var - 2]`), while a `For Each` variable already *is* a row object.
 * Tracking which is which is what makes the generated code typecheck. */
export interface RowCtx {
  /** Numeric For loop variables in scope — sheet row numbers. */
  indexVars: Set<string>
  /** For Each variables in scope — row objects. */
  rowVars: Set<string>
}

const EMPTY_CTX: RowCtx = { indexVars: new Set(), rowVars: new Set() }

function withIndexVar(ctx: RowCtx, name: string): RowCtx {
  return { indexVars: new Set([...ctx.indexVars, name]), rowVars: ctx.rowVars }
}

function withRowVar(ctx: RowCtx, name: string): RowCtx {
  return { indexVars: ctx.indexVars, rowVars: new Set([...ctx.rowVars, name]) }
}

/** `Cells(firstArg, colIndex).Value` → typed row-model access. */
function cellAccess(firstArg: string, colIndex: number, ctx: RowCtx): string {
  const field = columnIndexToField(colIndex)
  const arg = firstArg.trim()
  if (/^\d+$/.test(arg)) return `rows[${Number(arg) - 2}].${field}`
  if (ctx.indexVars.has(arg)) return `rows[${arg} - 2].${field}`
  if (ctx.rowVars.has(arg)) return `${arg}.${field}`
  // Any other identifier / expression holding a sheet row number.
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(arg)) return `rows[${arg} - 2].${field}`
  return `rows[(${convertExpr(arg, ctx)}) - 2].${field}`
}

/** Convert a VBA expression to a TS expression. Handles the common operators. */
export function convertExpr(expr: string, ctx: RowCtx = EMPTY_CTX): string {
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
  out = out.replace(/WorksheetFunction\.Max\s*\(/gi, 'vbaMax(')
  out = out.replace(/WorksheetFunction\.Min\s*\(/gi, 'vbaMin(')
  out = out.replace(/\bLen\s*\(/gi, 'vbaLen(')
  out = out.replace(/\bUCase\s*\(/gi, 'vbaUCase(')
  out = out.replace(/\bLCase\s*\(/gi, 'vbaLCase(')
  out = out.replace(/\bTrim\s*\(/gi, 'vbaTrim(')
  out = out.replace(/\bLeft\s*\(/gi, 'vbaLeft(')
  out = out.replace(/\bRight\s*\(/gi, 'vbaRight(')
  out = out.replace(/\bMid\s*\(/gi, 'vbaMid(')
  out = out.replace(/\bReplace\s*\(/gi, 'vbaReplace(')
  out = out.replace(/\bFormat\s*\(/gi, 'vbaFormat(')
  out = out.replace(/\bRound\s*\(/gi, 'vbaRound(')
  // Range("B2:B10").Value / Cells(r, c).Value → row-model access.
  // Range("B2:B10") without .Value (e.g. inside WorksheetFunction.Sum)
  // → an array over the rows, so vbaSum(rows.map(...)) typechecks.
  // Worksheets(...) first: the plain Range patterns below would otherwise
  // match the inner Range(...) and leave a broken `Worksheets("x").…` prefix.
  out = out.replace(/Worksheets\("([^"]+)"\)\.Range\("([A-Z]+)(\d+):[A-Z]+\d+"\)\.Value/gi, (_m, _sheet: string, col: string) => `rows.map((r) => r.${columnToField(col)})`)
  out = out.replace(/Worksheets\("([^"]+)"\)\.Range\("([A-Z]+)(\d+)"\)\.Value/gi, (_m, _sheet: string, col: string, row: string) => `rows[${Number(row) - 2}].${columnToField(col)}`)
  out = out.replace(/Worksheets\("([^"]+)"\)\.Range\("([A-Z]+)(\d+)"\)/gi, (_m, _sheet: string, col: string, row: string) => `rows[${Number(row) - 2}].${columnToField(col)}`)
  out = out.replace(/Range\("([A-Z]+)\d+:[A-Z]+\d+"\)\.Value/gi, (_m, col: string) => `rows.map((r) => r.${columnToField(col)})`)
  out = out.replace(/Range\("([A-Z]+)\d+:[A-Z]+\d+"\)/gi, (_m, col: string) => `rows.map((r) => r.${columnToField(col)})`)
  out = out.replace(/Range\("([A-Z]+)(\d+)"\)\.Value/gi, (_m, col: string, row: string) => `rows[${Number(row) - 2}].${columnToField(col)}`)
  out = out.replace(/Range\("([A-Z]+)(\d+)"\)/gi, (_m, col: string, row: string) => `rows[${Number(row) - 2}].${columnToField(col)}`)
  out = out.replace(/Cells\s*\(\s*([^,]+?)\s*,\s*(\d+)\s*\)\.Value/gi, (_m, first: string, c: string) => cellAccess(first, Number(c), ctx))
  out = out.replace(/Cells\s*\(\s*([^,]+?)\s*,\s*(\d+)\s*\)(?!\.Value)/gi, (_m, first: string, c: string) => cellAccess(first, Number(c), ctx))
  // A bare `row.amount` where row is a numeric loop variable is the same
  // bug in another spelling — it is a sheet row number, not a row object.
  for (const v of ctx.indexVars) {
    out = out.replace(new RegExp(`\\b${v}\\.([A-Za-z_][A-Za-z0-9_]*)`, 'g'), (_m, field: string) => `rows[${v} - 2].${field}`)
  }
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

function convertTarget(target: string, ctx: RowCtx = EMPTY_CTX): string {
  // Range("A1").Value = x  →  rows[0].id = x   (same mapping as expressions)
  let out = target.trim()
  out = out.replace(/Worksheets\("([^"]+)"\)\.Range\("([A-Z]+)(\d+)"\)\.Value/gi, (_m, _sheet: string, col: string, row: string) => `rows[${Number(row) - 2}].${columnToField(col)}`)
  out = out.replace(/Range\("([A-Z]+)(\d+)"\)\.Value/gi, (_m, col: string, row: string) => `rows[${Number(row) - 2}].${columnToField(col)}`)
  out = out.replace(/Cells\s*\(\s*([^,]+?)\s*,\s*(\d+)\s*\)\.Value/gi, (_m, first: string, c: string) => cellAccess(first, Number(c), ctx))
  out = out.replace(/Cells\s*\(\s*([^,]+?)\s*,\s*(\d+)\s*\)(?!\.Value)/gi, (_m, first: string, c: string) => cellAccess(first, Number(c), ctx))
  for (const v of ctx.indexVars) {
    out = out.replace(new RegExp(`\\b${v}\\.([A-Za-z_][A-Za-z0-9_]*)`, 'g'), (_m, field: string) => `rows[${v} - 2].${field}`)
  }
  return out
}

function emitStatements(stmts: Statement[], indent: string, warnings: TranspileWarning[], out: string[], ctx: RowCtx = EMPTY_CTX, dimNames: Set<string> = new Set()): void {
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
        out.push(`${indent}const ${safeName(s.name, s.line, warnings)} = ${convertExpr(s.value, ctx)};`)
        break
      case 'assign':
        out.push(`${indent}${convertTarget(s.target, ctx)} = ${convertExpr(s.expr, ctx)};`)
        break
      case 'return':
        out.push(`${indent}return ${convertExpr(s.expr, ctx)};`)
        break
      case 'msgbox':
        out.push(`${indent}// MsgBox → toast in the generated app`)
        out.push(`${indent}showToast(${convertExpr(s.expr, ctx)});`)
        break
      case 'inputbox':
        if (s.target) out.push(`${indent}${safeName(s.target, s.line, warnings)} = await showPrompt(${convertExpr(s.prompt, ctx)});`)
        else out.push(`${indent}await showPrompt(${convertExpr(s.prompt, ctx)});`)
        break
      case 'call':
        out.push(`${indent}${safeName(s.name, s.line, warnings)}(${s.args ? convertExpr(s.args, ctx) : ''});`)
        break
      case 'if': {
        out.push(`${indent}if (${convertExpr(s.condition, ctx)}) {`)
        emitStatements(s.thenBody, indent + '  ', warnings, out, ctx, dimNames)
        for (const branch of s.elseIfs) {
          out.push(`${indent}} else if (${convertExpr(branch.condition, ctx)}) {`)
          emitStatements(branch.body, indent + '  ', warnings, out, ctx, dimNames)
        }
        if (s.elseBody) {
          out.push(`${indent}} else {`)
          emitStatements(s.elseBody, indent + '  ', warnings, out, ctx, dimNames)
        }
        out.push(`${indent}}`)
        break
      }
      case 'for': {
        // A loop variable already Dim'd in this procedure is the same
        // variable — reuse it (`for (row = 2; …)`) instead of shadowing it
        // with `for (let row …)`, which left the Dim'd one unused.
        const decl = dimNames.has(s.variable) ? '' : 'let '
        const step = s.step ? `; ${s.variable} += ${convertExpr(s.step, ctx)}` : `; ${s.variable}++`
        out.push(`${indent}for (${decl}${s.variable} = ${convertExpr(s.from, ctx)}; ${s.variable} <= ${convertExpr(s.to, ctx)}${step}) {`)
        emitStatements(s.body, indent + '  ', warnings, out, withIndexVar(ctx, s.variable), dimNames)
        out.push(`${indent}}`)
        break
      }
      case 'forEach': {
        const decl = dimNames.has(s.variable) ? '' : 'const '
        out.push(`${indent}for (${decl}${s.variable} of ${convertExpr(s.collection, ctx)}) {`)
        emitStatements(s.body, indent + '  ', warnings, out, withRowVar(ctx, s.variable), dimNames)
        out.push(`${indent}}`)
        break
      }
      case 'do': {
        const cond = convertExpr(s.condition, ctx)
        const test = s.kind2 === 'while' ? cond : `!(${cond})`
        out.push(`${indent}while (${test}) {`)
        emitStatements(s.body, indent + '  ', warnings, out, ctx, dimNames)
        out.push(`${indent}}`)
        break
      }
    }
  }
}

/** Names declared with Dim anywhere in a procedure body (recursively). */
function collectDimNames(stmts: Statement[], into: Set<string> = new Set()): Set<string> {
  for (const s of stmts) {
    if (s.kind === 'dim') into.add(s.name)
    else if (s.kind === 'if') {
      collectDimNames(s.thenBody, into)
      for (const b of s.elseIfs) collectDimNames(b.body, into)
      if (s.elseBody) collectDimNames(s.elseBody, into)
    } else if (s.kind === 'for' || s.kind === 'forEach' || s.kind === 'do') {
      collectDimNames(s.body, into)
    }
  }
  return into
}

/** True when a statement tree contains an InputBox — its generated code awaits showPrompt, so the procedure must be async. */
function bodyUsesInputBox(stmts: Statement[]): boolean {
  for (const s of stmts) {
    if (s.kind === 'inputbox') return true
    if (s.kind === 'if') {
      if (bodyUsesInputBox(s.thenBody)) return true
      if (s.elseIfs.some((b) => bodyUsesInputBox(b.body))) return true
      if (s.elseBody && bodyUsesInputBox(s.elseBody)) return true
    } else if (s.kind === 'for' || s.kind === 'forEach' || s.kind === 'do') {
      if (bodyUsesInputBox(s.body)) return true
    }
  }
  return false
}

function emitProcedure(proc: Procedure, warnings: TranspileWarning[]): string[] {
  const out: string[] = []
  const params = proc.params.map((p) => {
    const m = p.match(/^([A-Za-z_][A-Za-z0-9_]*)(?:\s+As\s+([A-Za-z]+))?$/)
    if (!m) return p
    return `${safeName(m[1], proc.startLine, warnings)}: ${TYPE_MAP[(m[2] ?? 'Variant').toLowerCase()] ?? 'unknown'}`
  })
  const baseRet = proc.returnType ? TYPE_MAP[proc.returnType.toLowerCase()] ?? 'unknown' : ''
  const isAsync = bodyUsesInputBox(proc.body)
  const ret = baseRet ? `: ${isAsync ? `Promise<${baseRet}>` : baseRet}` : isAsync ? ': Promise<void>' : ''
  out.push(`export ${isAsync ? 'async ' : ''}function ${safeName(proc.name, proc.startLine, warnings)}(${params.join(', ')})${ret} {`)
  emitStatements(proc.body, '  ', warnings, out, EMPTY_CTX, collectDimNames(proc.body))
  out.push('}')
  return out
}

const RUNTIME_HELPERS = ['vbaSum', 'vbaAverage', 'vbaCount', 'vbaLen', 'vbaUCase', 'vbaLCase', 'vbaTrim', 'vbaLeft', 'vbaRight', 'vbaMid', 'vbaReplace', 'vbaFormat', 'vbaRound', 'vbaMax', 'vbaMin']

export function transpile(result: ParseResult): TranspileResult {
  const warnings: TranspileWarning[] = []
  const body: string[] = []

  for (const proc of result.program.procedures) {
    body.push(...emitProcedure(proc, warnings))
    body.push('')
  }

  // Component skeleton so the output reads as a web app, not a function dump.
  const first = result.program.procedures[0]
  if (first) {
    body.push(`// Generated app shell — renders the resurrected "${first.name}" logic as a web app.`)
    body.push(`export function ${safeName(first.name, first.startLine, warnings)}App({ rows }: { rows: GhostRow[] }) {`)
    body.push('  // The preview in GhostMacro renders this template with live data.')
    body.push('  // TODO (Week 3): generate the full JSX table/form from the procedure body.')
    body.push('  return rows;')
    body.push('}')
    body.push('')
  }

  // Import only the runtime helpers the generated code actually calls,
  // so the output has no unused imports.
  const bodyText = body.join('\n')
  const used = RUNTIME_HELPERS.filter((h) => new RegExp(`\\b${h}\\s*\\(`).test(bodyText))

  const lines: string[] = []
  lines.push('// 👻 GhostMacro — resurrected from Excel VBA. Generated code, do not edit by hand.')
  lines.push('// Original: VBA macro  ·  Resurrected: TypeScript + React')
  lines.push('')
  if (used.length > 0) {
    lines.push(`import { ${used.join(', ')} } from './vba-runtime';`)
    lines.push('')
  }
  // Real implementations, not declare stubs: MsgBox → toast, InputBox → prompt.
  // In the generated app the host wires showToast to its toast UI; standalone
  // they fall back to console / window.prompt, so the file runs as-is.
  lines.push('export function showToast(message: string): void {')
  lines.push("  if (typeof window !== 'undefined') window.console.info('[GhostMacro]', message);")
  lines.push('}')
  lines.push('')
  lines.push('export function showPrompt(prompt: string): Promise<string> {')
  lines.push("  const answer = typeof window !== 'undefined' && typeof window.prompt === 'function' ? window.prompt(prompt) : null;")
  lines.push("  return Promise.resolve(answer ?? '');")
  lines.push('}')
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
  lines.push(...body)

  return { code: lines.join('\n'), warnings, unsupported: result.unsupported }
}
