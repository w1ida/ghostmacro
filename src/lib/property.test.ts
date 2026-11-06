import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { parseVBA } from './vba-parser.ts'
import { convertExpr, transpile } from './transpiler.ts'

const identifierArbitrary = fc.constantFrom('total', 'count', 'amount', 'quantity')
const integerArbitrary = fc.integer({ min: -100, max: 100 })
const arithmeticOperatorArbitrary = fc.constantFrom('+', '-', '*')
const safeTextArbitrary = fc
  .array(fc.constantFrom(...'abcdef0123456789'), { maxLength: 12 })
  .map((characters) => characters.join(''))

const statementArbitrary = fc.oneof(
  fc.tuple(identifierArbitrary, fc.constantFrom('Integer', 'Long', 'Double', 'String', 'Boolean', 'Variant')).map(
    ([name, type]) => `Dim ${name} As ${type}`,
  ),
  fc.tuple(identifierArbitrary, integerArbitrary, arithmeticOperatorArbitrary, integerArbitrary).map(
    ([name, left, operator, right]) => `${name} = ${left} ${operator} ${right}`,
  ),
  fc.tuple(identifierArbitrary, integerArbitrary).map(
    ([name, value]) => `If ${name} = ${value} Then\n MsgBox "equal"\nEnd If`,
  ),
  fc.tuple(identifierArbitrary, integerArbitrary, integerArbitrary).map(
    ([name, from, distance]) => `For ${name} = ${from} To ${from + Math.abs(distance)}\n MsgBox ${name}\nNext ${name}`,
  ),
  safeTextArbitrary.map((text) => `MsgBox "${text}"`),
)

const parsedProgramArbitrary = fc
  .array(statementArbitrary, { maxLength: 12 })
  .map((statements) => parseVBA(`Sub Generated()\n${statements.join('\n')}\nEnd Sub`))

const VALID_VBA = [
  'Sub Generated()',
  ' Dim total As Integer',
  ' Dim i As Integer',
  ' total = 0',
  ' If total = 0 Then',
  '  For i = 1 To 3',
  '   total = total + i',
  '  Next i',
  ' Else',
  '  total = -1',
  ' End If',
  ' MsgBox "Total: " & total',
  'End Sub',
].join('\n')

function applyArithmeticOperator(left: number, operator: string, right: number): number {
  switch (operator) {
    case '+': return left + right
    case '-': return left - right
    case '*': return left * right
    default: throw new Error(`Unsupported arithmetic operator: ${operator}`)
  }
}

function evaluateGeneratedArithmetic(expression: string): number {
  const match = expression.match(/^\((-?\d+) ([+*-]) (-?\d+)\) ([+*-]) (-?\d+)$/)
  if (!match) throw new Error(`Unexpected generated arithmetic expression: ${expression}`)
  const first = applyArithmeticOperator(Number(match[1]), match[2], Number(match[3]))
  return applyArithmeticOperator(first, match[4], Number(match[5]))
}

function evaluateGeneratedBoolean(expression: string): boolean {
  const match = expression.match(/^! \((-?\d+) === (-?\d+)\) && \(\((-?\d+) !== (-?\d+)\) \|\| \((-?\d+) === (-?\d+)\)\)$/)
  if (!match) throw new Error(`Unexpected generated boolean expression: ${expression}`)
  return !(Number(match[1]) === Number(match[2]))
    && (Number(match[3]) !== Number(match[4]) || Number(match[5]) === Number(match[6]))
}

function evaluateGeneratedConcatenation(expression: string): string {
  const match = expression.match(/^"([a-f0-9]*)" \+ "([a-f0-9]*)"$/)
  if (!match) throw new Error(`Unexpected generated concatenation: ${expression}`)
  return match[1] + match[2]
}

function expectParserResult(source: string): void {
  expect(() => {
    const result = parseVBA(source)
    expect(Array.isArray(result.program.procedures)).toBe(true)
    expect(Array.isArray(result.errors)).toBe(true)
    expect(Array.isArray(result.unsupported)).toBe(true)
  }).not.toThrow()
}

describe('GhostMacro conversion properties — task 4.1', () => {
  it('transpiles the same parsed VBA to byte-identical output', () => {
    fc.assert(
      fc.property(parsedProgramArbitrary, (parsed) => {
        const first = transpile(parsed)
        const second = transpile(parsed)

        expect(second.code).toBe(first.code)
        expect(second.warnings).toEqual(first.warnings)
        expect(second.unsupported).toEqual(first.unsupported)
      }),
    )
  })

  it('preserves comparison, logical, and concatenation operator semantics', () => {
    fc.assert(
      fc.property(
        integerArbitrary,
        integerArbitrary,
        integerArbitrary,
        integerArbitrary,
        integerArbitrary,
        integerArbitrary,
        safeTextArbitrary,
        safeTextArbitrary,
        (left, right, otherLeft, otherRight, finalLeft, finalRight, prefix, suffix) => {
          const vbaBoolean = `Not (${left} = ${right}) And ((${otherLeft} <> ${otherRight}) Or (${finalLeft} = ${finalRight}))`
          const generatedBoolean = convertExpr(vbaBoolean)
          const expectedBoolean = !(left === right) && (otherLeft !== otherRight || finalLeft === finalRight)
          expect(generatedBoolean).toBe(`! (${left} === ${right}) && ((${otherLeft} !== ${otherRight}) || (${finalLeft} === ${finalRight}))`)
          expect(evaluateGeneratedBoolean(generatedBoolean)).toBe(expectedBoolean)

          const generatedConcatenation = convertExpr(`"${prefix}" & "${suffix}"`)
          expect(generatedConcatenation).toBe(`"${prefix}" + "${suffix}"`)
          expect(evaluateGeneratedConcatenation(generatedConcatenation)).toBe(prefix + suffix)
        },
      ),
    )
  })

  it('preserves random numeric expression values in the supported range', () => {
    fc.assert(
      fc.property(
        integerArbitrary,
        arithmeticOperatorArbitrary,
        integerArbitrary,
        arithmeticOperatorArbitrary,
        integerArbitrary,
        (left, firstOperator, middle, secondOperator, right) => {
          const vbaExpression = `(${left} ${firstOperator} ${middle}) ${secondOperator} ${right}`
          const expected = applyArithmeticOperator(
            applyArithmeticOperator(left, firstOperator, middle),
            secondOperator,
            right,
          )
          expect(evaluateGeneratedArithmetic(convertExpr(vbaExpression))).toBe(expected)
        },
      ),
    )
  })

  it('retains parsed and transpiled If/For structure', () => {
    fc.assert(
      fc.property(
        integerArbitrary,
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: 0, max: 20 }),
        integerArbitrary,
        (threshold, start, distance, increment) => {
          const end = start + distance
          const source = [
            'Sub Generated()',
            ' Dim total As Integer',
            ' Dim i As Integer',
            ' total = 0',
            ` If total = ${threshold} Then`,
            `  For i = ${start} To ${end}`,
            `   total = total + ${increment}`,
            '  Next i',
            ' Else',
            '  total = -1',
            ' End If',
            'End Sub',
          ].join('\n')
          const parsed = parseVBA(source)
          expect(parsed.errors).toEqual([])

          const ifStatement = parsed.program.procedures[0]?.body.find((statement) => statement.kind === 'if')
          expect(ifStatement?.kind).toBe('if')
          if (!ifStatement || ifStatement.kind !== 'if') throw new Error('Generated If statement was not parsed')
          expect(ifStatement.condition).toBe(`total = ${threshold}`)
          expect(ifStatement.thenBody[0]?.kind).toBe('for')

          const generated = transpile(parsed).code
          expect(generated).toContain(`if (total === ${threshold}) {`)
          expect(generated).toContain(`for (i = ${start}; i <= ${end}; i++) {`)
          expect(generated).toContain(`total = total + ${increment};`)
          expect(generated).toContain('} else {\n    total = -1;')
        },
      ),
    )
  })

  it('never throws on arbitrary string input', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 2000 }), (source) => {
        expectParserResult(source)
      }),
    )
  })

  it('never throws when valid VBA lines are randomly shuffled', () => {
    const lines = VALID_VBA.split('\n')
    const shuffledLineIndexes = fc.uniqueArray(
      fc.integer({ min: 0, max: lines.length - 1 }),
      { minLength: lines.length, maxLength: lines.length },
    )

    fc.assert(
      fc.property(shuffledLineIndexes, (indexes) => {
        expectParserResult(indexes.map((index) => lines[index]).join('\n'))
      }),
    )
  })

  it('never throws when valid VBA files are truncated', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: VALID_VBA.length }), (cutAt) => {
        expectParserResult(VALID_VBA.slice(0, cutAt))
      }),
    )
  })
})
