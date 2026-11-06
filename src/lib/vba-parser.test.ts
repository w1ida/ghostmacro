import { describe, expect, it } from 'vitest'
import { parseVBA } from './vba-parser.ts'
import expense from '../../samples/expense-tracker.bas?raw'
import inventory from '../../samples/inventory-manager.bas?raw'
import invoice from '../../samples/invoice-generator.bas?raw'

describe('parseVBA — samples must parse cleanly', () => {
  it.each([
    ['expense-tracker', expense],
    ['inventory-manager', inventory],
    ['invoice-generator', invoice],
  ])('%s parses with zero errors and zero unsupported', (_name, source) => {
    const r = parseVBA(source as unknown as string)
    expect(r.errors).toEqual([])
    expect(r.unsupported).toEqual([])
    expect(r.program.procedures.length).toBeGreaterThan(0)
  })
})

describe('parseVBA — constructs', () => {
  it('parses Dim, If/Else and MsgBox', () => {
    const r = parseVBA('Sub T()\n Dim x As Integer\n If x > 0 Then\n MsgBox "hi"\n Else\n MsgBox "no"\n End If\nEnd Sub')
    expect(r.errors).toEqual([])
    expect(r.program.procedures[0].body[1].kind).toBe('if')
  })

  it('reports GoTo as unsupported and does not throw', () => {
    const r = parseVBA('Sub T()\n GoTo Done\nDone:\nEnd Sub')
    expect(r.unsupported.length).toBe(1)
    expect(r.unsupported[0].line).toBe(2)
    expect(r.unsupported[0].construct).toContain('GoTo')
  })

  it('never throws on garbage input', () => {
    const r = parseVBA('))) not vba at all (((\nDim\nIf\n')
    expect(r).toBeDefined()
    expect(Array.isArray(r.errors)).toBe(true)
  })
})
