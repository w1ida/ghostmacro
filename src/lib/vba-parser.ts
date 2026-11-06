/**
 * GhostMacro VBA parser — starter implementation for the supported subset.
 * Line-based recursive-descent-ish parser: every AST node carries its
 * source line number, and the parser NEVER throws on user input.
 * Bad lines become errors / unsupported entries and parsing continues.
 *
 * Supported: Sub/Function, Dim/Const, If/ElseIf/Else, For/For Each,
 * Do While/Until, Range/Cells, MsgBox/InputBox, WorksheetFunction.*.
 * Unsupported (reported, not dropped): GoTo, On Error, Declare,
 * CreateObject, file I/O, UserForm/ActiveX.
 */

export interface ParseError {
  line: number
  message: string
  raw: string
}

export interface UnsupportedConstruct {
  line: number
  construct: string
  suggestion: string
  raw: string
}

export type Statement =
  | { kind: 'dim'; line: number; name: string; vbaType: string; raw: string }
  | { kind: 'const'; line: number; name: string; value: string; raw: string }
  | { kind: 'assign'; line: number; target: string; expr: string; raw: string }
  | { kind: 'if'; line: number; condition: string; thenBody: Statement[]; elseIfs: { condition: string; body: Statement[] }[]; elseBody: Statement[] | null; raw: string }
  | { kind: 'for'; line: number; variable: string; from: string; to: string; step: string | null; body: Statement[]; raw: string }
  | { kind: 'forEach'; line: number; variable: string; collection: string; body: Statement[]; raw: string }
  | { kind: 'do'; line: number; condition: string; kind2: 'while' | 'until'; body: Statement[]; raw: string }
  | { kind: 'msgbox'; line: number; expr: string; raw: string }
  | { kind: 'inputbox'; line: number; prompt: string; target: string | null; raw: string }
  | { kind: 'call'; line: number; name: string; args: string; raw: string }
  | { kind: 'return'; line: number; expr: string; raw: string }
  | { kind: 'comment'; line: number; text: string; raw: string }

export interface Procedure {
  name: string
  kind: 'sub' | 'function'
  params: string[]
  returnType: string | null
  body: Statement[]
  startLine: number
  endLine: number
}

export interface VBAProgram {
  procedures: Procedure[]
  /** Top-level statements outside any procedure (rare in .bas files). */
  topLevel: Statement[]
}

export interface ParseResult {
  program: VBAProgram
  errors: ParseError[]
  unsupported: UnsupportedConstruct[]
}

const UNSUPPORTED_PATTERNS: { re: RegExp; construct: string; suggestion: string }[] = [
  { re: /\bGoTo\b/i, construct: 'GoTo / label', suggestion: 'Rewrite with If/Else or a For loop — GoTo has no direct TS equivalent.' },
  { re: /\bOn\s+Error\b/i, construct: 'On Error Resume Next', suggestion: 'Use try/catch in the generated code, or validate inputs before the risky call.' },
  { re: /\bDeclare\b/i, construct: 'Declare (Win32 API)', suggestion: 'Replace the API call with a web API / browser equivalent, or report it as out of scope.' },
  { re: /\bCreateObject\b/i, construct: 'CreateObject', suggestion: 'Replace with a direct import / fetch call in TypeScript.' },
  { re: /\bOpen\b.*#\s*\d/i, construct: 'File I/O (Open … #)', suggestion: 'Use the browser File API / download instead of VBA file I/O.' },
  { re: /\bUserForm\b|\bActiveX\b/i, construct: 'UserForm / ActiveX', suggestion: 'Rebuild the form as a React component — see the generated app template.' },
  { re: /\bSelect\s+Case\b/i, construct: 'Select Case (v1)', suggestion: 'Rewrite as If/ElseIf for v1; full Select Case is a stretch goal.' },
]

function checkUnsupported(line: string, lineNo: number, raw: string): UnsupportedConstruct | null {
  for (const p of UNSUPPORTED_PATTERNS) {
    if (p.re.test(line)) return { line: lineNo, construct: p.construct, suggestion: p.suggestion, raw }
  }
  return null
}

function stripComment(line: string): { code: string; comment: string | null } {
  // A ' inside a "..." string is not a comment. Walk the line tracking quotes.
  let inString = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      // "" inside a string is an escaped quote, not the end of the string.
      if (inString && line[i + 1] === '"') { i++; continue }
      inString = !inString
    }
    if (ch === "'" && !inString) {
      return { code: line.slice(0, i).trim(), comment: line.slice(i + 1).trim() }
    }
  }
  return { code: line.trim(), comment: null }
}

export function parseVBA(source: string): ParseResult {
  const errors: ParseError[] = []
  const unsupported: UnsupportedConstruct[] = []
  const procedures: Procedure[] = []
  const topLevel: Statement[] = []

  const lines = source.replace(/\r\n/g, '\n').split('\n')
  let current: Procedure | null = null
  // Stack of open blocks: each entry is the statement list we are appending to.
  const stack: Statement[][] = []

  const currentBody = (): Statement[] => (stack.length > 0 ? stack[stack.length - 1] : current ? current.body : topLevel)

  const push = (stmt: Statement) => { currentBody().push(stmt) }

  lines.forEach((rawLine, idx) => {
    const lineNo = idx + 1
    const raw = rawLine
    const trimmed = rawLine.trim()
    if (trimmed === '') return

    const { code, comment } = stripComment(trimmed)
    if (comment !== null && code === '') {
      push({ kind: 'comment', line: lineNo, text: comment, raw })
      return
    }
    if (code === '') return

    const unsup = checkUnsupported(code, lineNo, raw)
    if (unsup) { unsupported.push(unsup); return }

    // --- Procedure open / close ---
    const subMatch = code.match(/^Sub\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:\((.*)\))?$/i)
    if (subMatch) {
      current = { name: subMatch[1], kind: 'sub', params: splitParams(subMatch[2] ?? ''), returnType: null, body: [], startLine: lineNo, endLine: lineNo }
      procedures.push(current)
      stack.length = 0
      return
    }
    const fnMatch = code.match(/^Function\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:\((.*)\))?(?:\s+As\s+([A-Za-z]+))?$/i)
    if (fnMatch) {
      current = { name: fnMatch[1], kind: 'function', params: splitParams(fnMatch[2] ?? ''), returnType: fnMatch[3] ?? null, body: [], startLine: lineNo, endLine: lineNo }
      procedures.push(current)
      stack.length = 0
      return
    }
    if (/^End\s+Sub$/i.test(code) || /^End\s+Function$/i.test(code)) {
      if (current) current.endLine = lineNo
      current = null
      stack.length = 0
      return
    }
    if (current === null) {
      errors.push({ line: lineNo, message: 'Statement outside any Sub/Function — wrap it in a Sub.', raw })
      return
    }

    // --- Block open / close ---
    const ifMatch = code.match(/^If\s+(.+?)\s+Then$/i)
    if (ifMatch) {
      const stmt: Statement = { kind: 'if', line: lineNo, condition: ifMatch[1], thenBody: [], elseIfs: [], elseBody: null, raw }
      push(stmt)
      stack.push(stmt.thenBody)
      return
    }
    const elseIfMatch = code.match(/^ElseIf\s+(.+?)\s+Then$/i)
    if (elseIfMatch) {
      // Pop back to the enclosing If's level, then push a new else-if body.
      // Find the nearest If on the stack's parent: simplest correct approach
      // for v1 — the top of the stack is the current If body; pop it and
      // attach the new branch to the If statement that owns it.
      const ifStmt = findEnclosingIf(procedures, current)
      if (ifStmt) {
        stack.pop()
        const branch = { condition: elseIfMatch[1], body: [] as Statement[] }
        ifStmt.elseIfs.push(branch)
        stack.push(branch.body)
      } else {
        errors.push({ line: lineNo, message: 'ElseIf without a matching If.', raw })
      }
      return
    }
    if (/^Else$/i.test(code)) {
      const ifStmt = findEnclosingIf(procedures, current)
      if (ifStmt) {
        stack.pop()
        ifStmt.elseBody = []
        stack.push(ifStmt.elseBody)
      } else {
        errors.push({ line: lineNo, message: 'Else without a matching If.', raw })
      }
      return
    }
    if (/^End\s+If$/i.test(code)) {
      if (stack.length > 0) stack.pop()
      return
    }
    const forMatch = code.match(/^For\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s+To\s+(.+?)(?:\s+Step\s+(.+))?$/i)
    if (forMatch) {
      const stmt: Statement = { kind: 'for', line: lineNo, variable: forMatch[1], from: forMatch[2].trim(), to: forMatch[3].trim(), step: forMatch[4]?.trim() ?? null, body: [], raw }
      push(stmt)
      stack.push(stmt.body)
      return
    }
    const forEachMatch = code.match(/^For\s+Each\s+([A-Za-z_][A-Za-z0-9_]*)\s+In\s+(.+)$/i)
    if (forEachMatch) {
      const stmt: Statement = { kind: 'forEach', line: lineNo, variable: forEachMatch[1], collection: forEachMatch[2].trim(), body: [], raw }
      push(stmt)
      stack.push(stmt.body)
      return
    }
    if (/^Next\b/i.test(code)) {
      if (stack.length > 0) stack.pop()
      return
    }
    const doMatch = code.match(/^Do\s+(While|Until)\s+(.+)$/i)
    if (doMatch) {
      const stmt: Statement = { kind: 'do', line: lineNo, condition: doMatch[2].trim(), kind2: doMatch[1].toLowerCase() as 'while' | 'until', body: [], raw }
      push(stmt)
      stack.push(stmt.body)
      return
    }
    if (/^Loop$/i.test(code) || /^Wend$/i.test(code)) {
      if (stack.length > 0) stack.pop()
      return
    }

    // --- Single-line statements ---
    const dimMatch = code.match(/^Dim\s+(.+)$/i)
    if (dimMatch) {
      // Dim a As Integer, b As String
      for (const part of dimMatch[1].split(',')) {
        const m = part.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)(?:\s+As\s+([A-Za-z]+))?$/)
        if (m) push({ kind: 'dim', line: lineNo, name: m[1], vbaType: m[2] ?? 'Variant', raw })
        else errors.push({ line: lineNo, message: `Could not parse Dim declaration: ${part.trim()}`, raw })
      }
      return
    }
    const constMatch = code.match(/^Const\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s+As\s+[A-Za-z]+)?\s*=\s*(.+)$/i)
    if (constMatch) {
      push({ kind: 'const', line: lineNo, name: constMatch[1], value: constMatch[2].trim(), raw })
      return
    }
    const msgMatch = code.match(/^MsgBox\s+(.+)$/i)
    if (msgMatch) {
      push({ kind: 'msgbox', line: lineNo, expr: msgMatch[1].trim(), raw })
      return
    }
    const inputMatch = code.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*InputBox\s*\((.+)\)$/i)
    if (inputMatch) {
      push({ kind: 'inputbox', line: lineNo, prompt: inputMatch[2].trim(), target: inputMatch[1], raw })
      return
    }
    if (/^InputBox\s*\(/i.test(code)) {
      push({ kind: 'inputbox', line: lineNo, prompt: code, target: null, raw })
      return
    }
    // Return: assigning to the function name inside a Function.
    if (current.kind === 'function') {
      const retMatch = code.match(new RegExp(`^${current.name}\\s*=\\s*(.+)$`, 'i'))
      if (retMatch) {
        push({ kind: 'return', line: lineNo, expr: retMatch[1].trim(), raw })
        return
      }
    }
    // Assignment (including Range/Cells on either side).
    const assignMatch = code.match(/^(.+?)\s*=\s*(.+)$/)
    if (assignMatch) {
      push({ kind: 'assign', line: lineNo, target: assignMatch[1].trim(), expr: assignMatch[2].trim(), raw })
      return
    }
    // Bare call: Name arg1, arg2  or  Name
    const callMatch = code.match(/^([A-Za-z_][A-Za-z0-9_]*)(?:\s+(.+))?$/)
    if (callMatch) {
      push({ kind: 'call', line: lineNo, name: callMatch[1], args: callMatch[2] ?? '', raw })
      return
    }

    errors.push({ line: lineNo, message: 'Unrecognised statement — recorded as an error, parsing continued.', raw })
  })

  return { program: { procedures, topLevel }, errors, unsupported }
}

function splitParams(raw: string): string[] {
  const t = raw.trim()
  if (t === '') return []
  return t.split(',').map((p) => p.trim()).filter(Boolean)
}

/** Find the If statement whose body is currently open (top of the stack's owner). */
function findEnclosingIf(procedures: Procedure[], current: Procedure): Extract<Statement, { kind: 'if' }> | null {
  // Walk the current procedure's body depth-first and return the most
  // recently opened If that has not been closed. For the v1 line parser the
  // practical case is a single open If; nested Ifs are handled by tracking
  // the last If in document order that is still open — approximated here by
  // scanning the body for the last If node. TODO (Phase 2): carry an
  // explicit block stack of statement nodes instead of only bodies.
  const all: Extract<Statement, { kind: 'if' }>[] = []
  const walk = (stmts: Statement[]) => {
    for (const s of stmts) {
      if (s.kind === 'if') {
        all.push(s)
        walk(s.thenBody)
        for (const b of s.elseIfs) walk(b.body)
        if (s.elseBody) walk(s.elseBody)
      } else if (s.kind === 'for' || s.kind === 'forEach' || s.kind === 'do') {
        walk(s.body)
      }
    }
  }
  walk(current.body)
  void procedures
  return all.length > 0 ? all[all.length - 1] : null
}
