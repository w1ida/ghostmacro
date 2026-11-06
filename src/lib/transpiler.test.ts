import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import ts from 'typescript'
import { unlinkSync, writeFileSync } from 'node:fs'
import { parseVBA } from './vba-parser.ts'
import { transpile, convertExpr } from './transpiler.ts'
import expense from '../../samples/expense-tracker.bas?raw'
import inventory from '../../samples/inventory-manager.bas?raw'
import invoice from '../../samples/invoice-generator.bas?raw'

describe('transpiler — acceptance: the 3 samples (task 2.8)', () => {
  it.each([
    ['expense-tracker', expense],
    ['inventory-manager', inventory],
    ['invoice-generator', invoice],
  ])('%s parses clean and transpiles with no stubs left', (_name, source) => {
    const parsed = parseVBA(source as unknown as string)
    expect(parsed.errors).toEqual([])
    expect(parsed.unsupported).toEqual([])
    const { code, warnings, unsupported } = transpile(parsed)
    expect(warnings).toEqual([])
    expect(unsupported).toEqual([])
    expect(code).not.toContain('declare function')
    expect(code).not.toContain('TODO (Week 2)')
    expect(code).toContain('export function showToast')
    expect(code).toContain('export function showPrompt')
    // Deterministic: transpile twice, byte-identical.
    expect(transpile(parseVBA(source as unknown as string)).code).toBe(code)
  })

  it.each([
    ['expense-tracker', expense],
    ['inventory-manager', inventory],
    ['invoice-generator', invoice],
  ])('%s transpiles to valid TS (tsc --noEmit on the generated output)', (_name, source) => {
    const { code } = transpile(parseVBA(source as unknown as string))
    // The generated procedures run inside the host app with the sheet's
    // rows in scope; declare that binding for the standalone check. The
    // file is written next to vba-runtime.ts so its import resolves.
    const file = `src/lib/__tsc-check-${_name}.ts`
    writeFileSync(file, `// tsc harness: rows is supplied by the host app.\ndeclare const rows: GhostRow[];\n${code}\n`)
    try {
      const program = ts.createProgram([file], {
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        target: ts.ScriptTarget.ES2020,
        lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'],
        // Generated code keeps the VBA signature even when a parameter is
        // unused (e.g. AddExpense's Category) — valid TS, not a type error.
        noUnusedLocals: false,
        noUnusedParameters: false,
      })
      const errors = ts
        .getPreEmitDiagnostics(program)
        .filter((d) => d.file?.fileName.endsWith(`__tsc-check-${_name}.ts`))
        .map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' '))
      expect(errors).toEqual([])
    } finally {
      unlinkSync(file)
    }
  })
})

describe('transpiler — Week 2 mappings', () => {
  it('maps the new string/format helpers to vba* runtime calls', () => {
    expect(convertExpr('Left(name, 3)')).toBe('vbaLeft(name, 3)')
    expect(convertExpr('Right(name, 2)')).toBe('vbaRight(name, 2)')
    expect(convertExpr('Mid(name, 2, 3)')).toBe('vbaMid(name, 2, 3)')
    expect(convertExpr('LCase(name)')).toBe('vbaLCase(name)')
    expect(convertExpr('Format(total, "Currency")')).toBe('vbaFormat(total, "Currency")')
    expect(convertExpr('Round(x, 2)')).toBe('vbaRound(x, 2)')
    expect(convertExpr('Replace(s, "-", "+")')).toBe('vbaReplace(s, "-", "+")')
    expect(convertExpr('WorksheetFunction.Max(Range("B2:B10"))')).toBe('vbaMax(rows.map((r) => r.amount))')
  })

  it('imports only the runtime helpers the generated code uses', () => {
    const src = 'Sub T()\n MsgBox Format(1.5, "Currency")\nEnd Sub'
    const code = transpile(parseVBA(src)).code
    expect(code).toContain("import { vbaFormat } from './vba-runtime';")
    expect(code).not.toContain('vbaSum')
  })

  it('makes a procedure async when it uses InputBox (await showPrompt)', () => {
    const src = 'Sub T()\n Dim name As String\n name = InputBox("Your name?")\nEnd Sub'
    const code = transpile(parseVBA(src)).code
    expect(code).toContain('export async function T()')
    expect(code).toContain('await showPrompt("Your name?")')
  })
})

describe('transpiler', () => {
  it('is deterministic: same input, byte-identical output', () => {
    const src = 'Sub T()\n Dim total As Double\n total = 1 + 2\n If total > 0 Then\n MsgBox "ok"\n End If\nEnd Sub'
    const a = transpile(parseVBA(src)).code
    const b = transpile(parseVBA(src)).code
    expect(a).toBe(b)
  })

  it('maps = in a condition to === and <> to !==', () => {
    expect(convertExpr('lowCount = 0')).toBe('lowCount === 0')
    expect(convertExpr('x <> 1')).toBe('x !== 1')
    expect(convertExpr('a And b')).toBe('a && b')
  })

  it('maps Cells(row, 2) to the row model — a sheet row number, not a row object', () => {
    expect(convertExpr('Cells(row, 2).Value')).toBe('rows[row - 2].amount')
    expect(convertExpr('Cells(row, 5).Value')).toBe('rows[row - 2].quantity')
    expect(convertExpr('Cells(3, 2).Value')).toBe('rows[1].amount')
    expect(convertExpr('Range("B2").Value')).toBe('rows[0].amount')
    expect(convertExpr('Range("B2:B10").Value')).toBe('rows.map((r) => r.amount)')
  })

  it('maps Cells(i, n) inside a For i loop to rows[i - 2], and a For Each variable stays a row object', () => {
    const looped = transpile(parseVBA('Sub T()\n Dim i As Integer\n Dim total As Double\n total = 0\n For i = 2 To 8\n total = total + Cells(i, 5).Value * Cells(i, 6).Value\n Next i\nEnd Sub')).code
    expect(looped).toContain('for (i = 2; i <= 8; i++)')
    expect(looped).toContain('rows[i - 2].quantity * rows[i - 2].price')
    expect(looped).not.toContain('row.quantity')
    const each = transpile(parseVBA('Sub T()\n For Each r In rows\n MsgBox r.name\n Next r\nEnd Sub')).code
    expect(each).toContain('for (const r of rows)')
    expect(each).toContain('showToast(r.name)')
  })

  it('writes to Cells through the same mapping', () => {
    const code = transpile(parseVBA('Sub T()\n Dim row As Integer\n For row = 2 To 4\n Cells(row, 2).Value = 99\n Next row\nEnd Sub')).code
    expect(code).toContain('rows[row - 2].amount = 99;')
  })
})

describe('transpiler — property tests', () => {
  it('determinism holds for arbitrary Dim/assign programs', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), fc.integer({ min: 0, max: 1000 }), (a, b) => {
        const src = `Sub T()\n Dim total As Double\n total = ${a} + ${b}\nEnd Sub`
        expect(transpile(parseVBA(src)).code).toBe(transpile(parseVBA(src)).code)
      }),
    )
  })

  it('numeric literals survive the round trip', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10000 }), (n) => {
        expect(convertExpr(String(n))).toBe(String(n))
      }),
    )
  })
})
