import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { parseVBA } from './vba-parser.ts'
import { transpile, convertExpr } from './transpiler.ts'

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

  it('maps Cells(row, 2) to the row model', () => {
    expect(convertExpr('Cells(row, 2).Value')).toBe('row.amount')
    expect(convertExpr('Cells(row, 5).Value')).toBe('row.quantity')
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
