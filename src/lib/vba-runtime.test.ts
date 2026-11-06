import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
  vbaFormat,
  vbaLCase,
  vbaLeft,
  vbaMax,
  vbaMid,
  vbaMin,
  vbaReplace,
  vbaRight,
  vbaRound,
} from './vba-runtime.ts'

describe('vba-runtime — string helpers (Week 2, task 2.7)', () => {
  it('vbaLCase lowercases, null-safe', () => {
    expect(vbaLCase('HeLLo')).toBe('hello')
    expect(vbaLCase(null)).toBe('')
  })

  it('vbaLeft / vbaRight clamp at the ends', () => {
    expect(vbaLeft('GhostMacro', 5)).toBe('Ghost')
    expect(vbaLeft('GhostMacro', 99)).toBe('GhostMacro')
    expect(vbaLeft('GhostMacro', 0)).toBe('')
    expect(vbaRight('GhostMacro', 5)).toBe('Macro')
    expect(vbaRight('GhostMacro', 99)).toBe('GhostMacro')
    expect(vbaRight('GhostMacro', 0)).toBe('')
  })

  it('vbaMid is 1-based, like VBA', () => {
    expect(vbaMid('hello', 2, 3)).toBe('ell')
    expect(vbaMid('hello', 2)).toBe('ello')
    expect(vbaMid('hello', 9)).toBe('')
    expect(vbaMid('hello', 0, 2)).toBe('he')
  })

  it('vbaReplace replaces every occurrence, plain string', () => {
    expect(vbaReplace('a-b-c', '-', '+')).toBe('a+b+c')
    expect(vbaReplace('aaa', 'a', 'b')).toBe('bbb')
    expect(vbaReplace('abc', '', 'x')).toBe('abc')
  })
})

describe('vba-runtime — vbaRound is banker\'s rounding', () => {
  it('rounds .5 to the nearest even number', () => {
    expect(vbaRound(2.5)).toBe(2)
    expect(vbaRound(3.5)).toBe(4)
    expect(vbaRound(-2.5)).toBe(-2)
    expect(vbaRound(2.4)).toBe(2)
    expect(vbaRound(2.6)).toBe(3)
    expect(vbaRound(1.225, 2)).toBe(1.22)
  })
})

describe('vba-runtime — vbaFormat (supported subset)', () => {
  it('formats currency, percent and fixed decimals', () => {
    expect(vbaFormat(1234.5, 'Currency')).toBe('$1,234.50')
    expect(vbaFormat(1234.5, '$#,##0.00')).toBe('$1,234.50')
    expect(vbaFormat(0.123, '0.0%')).toBe('12.3%')
    expect(vbaFormat(3.14159, '0.00')).toBe('3.14')
    expect(vbaFormat(3.7, '0')).toBe('4')
  })

  it('never throws on null or unknown formats', () => {
    expect(vbaFormat(null)).toBe('')
    expect(vbaFormat(42, 'dd-mmm-yyyy')).toBe('42')
  })
})

describe('vba-runtime — vbaMax / vbaMin ignore non-numbers', () => {
  it('returns 0 for an empty / non-numeric list', () => {
    expect(vbaMax([3, 1, 9, 2])).toBe(9)
    expect(vbaMin([3, 1, 9, 2])).toBe(1)
    expect(vbaMax([null, undefined])).toBe(0)
    expect(vbaMin([])).toBe(0)
  })
})

describe('vba-runtime — property tests', () => {
  it('Left/Right never return more chars than asked for', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 20 }), fc.integer({ min: 0, max: 20 }), (s, n) => {
        expect(vbaLeft(s, n).length).toBeLessThanOrEqual(n)
        expect(vbaRight(s, n).length).toBeLessThanOrEqual(n)
      }),
    )
  })

  it('Mid(s, start) matches the JS slice from start - 1', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 20 }), fc.integer({ min: 1, max: 20 }), (s, start) => {
        expect(vbaMid(s, start)).toBe(s.slice(start - 1))
      }),
    )
  })

  it('vbaRound(x, 0) is always an integer', () => {
    fc.assert(
      fc.property(fc.double({ noNaN: true, min: -1e6, max: 1e6 }), (x) => {
        expect(Number.isInteger(vbaRound(x))).toBe(true)
      }),
    )
  })

  it('Replace then Left is bounded by the replaced string', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 12 }), (s) => {
        const replaced = vbaReplace(s, 'a', 'bb')
        expect(vbaLeft(replaced, 3).length).toBeLessThanOrEqual(3)
      }),
    )
  })
})
