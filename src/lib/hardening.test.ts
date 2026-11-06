import { describe, expect, it } from 'vitest'
import { parseVBA } from './vba-parser.ts'
import { transpile } from './transpiler.ts'

describe('hardening — task 4.4 conversion pipeline', () => {
  it('returns an empty program and no generated code for an empty file', () => {
    const parsed = parseVBA('')
    const transpiled = transpile(parsed)

    expect(parsed.program).toEqual({ procedures: [], topLevel: [] })
    expect(parsed.errors).toEqual([])
    expect(parsed.unsupported).toEqual([])
    expect(transpiled).toEqual({ code: '', warnings: [], unsupported: [] })
  })

  it('returns an empty program and no generated code for a comment-only file', () => {
    const parsed = parseVBA("' exported module comment\n  ' another comment")
    const transpiled = transpile(parsed)

    expect(parsed.program).toEqual({ procedures: [], topLevel: [] })
    expect(parsed.errors).toEqual([])
    expect(parsed.unsupported).toEqual([])
    expect(transpiled).toEqual({ code: '', warnings: [], unsupported: [] })
  })

  it('reports GoTo and continues converting supported lines', () => {
    const source = `Sub Haunted()
  GoTo ExitPoint
  MsgBox "Still parsed"
End Sub`
    const parsed = parseVBA(source)
    const transpiled = transpile(parsed)

    expect(parsed.errors).toEqual([])
    expect(parsed.unsupported).toEqual([
      {
        line: 2,
        construct: 'GoTo / label',
        suggestion: 'Rewrite with If/Else or a For loop — GoTo has no direct TS equivalent.',
        raw: '  GoTo ExitPoint',
      },
    ])
    expect(transpiled.unsupported).toEqual(parsed.unsupported)
    expect(transpiled.code).toContain('showToast("Still parsed")')
  })
})
