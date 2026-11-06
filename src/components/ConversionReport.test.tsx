// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { SAMPLES } from '../lib/samples.ts'
import { transpile } from '../lib/transpiler.ts'
import { parseVBA } from '../lib/vba-parser.ts'
import { ConversionReport } from './ConversionReport.tsx'

function renderReport(source: string) {
  const parsed = parseVBA(source)
  const transpiled = transpile(parsed)

  render(
    <ConversionReport
      lineCount={source.split('\n').length}
      procedureCount={parsed.program.procedures.length}
      errors={parsed.errors}
      unsupported={transpiled.unsupported}
      warnings={transpiled.warnings}
    />,
  )

  return { parsed, transpiled }
}

afterEach(cleanup)

describe('ConversionReport', () => {
  it('renders a complete report for GoTo and CreateObject instead of a blank page', () => {
    const source = `Sub Haunted()
  GoTo Escape
  Set specter = CreateObject("WScript.Shell")
End Sub`
    const { parsed, transpiled } = renderReport(source)

    expect(screen.getByLabelText('Conversion report')).toBeInTheDocument()
    expect(screen.getByLabelText('Conversion report')).not.toBeEmptyDOMElement()
    const counts = screen.getByLabelText('Conversion counts')
    expect(counts).toHaveTextContent('1 procedure')
    expect(counts).toHaveTextContent('4 lines')
    expect(counts).toHaveTextContent('0 warnings')
    expect(counts).toHaveTextContent('2 unsupported')
    expect(counts).toHaveTextContent('0 errors')
    expect(parsed.errors).toEqual([])
    expect(transpiled.warnings).toEqual([])

    expect(screen.getByText('Line 2 — GoTo / label')).toBeInTheDocument()
    expect(screen.getByText('Suggested rewrite: Rewrite with If/Else or a For loop — GoTo has no direct TS equivalent.')).toBeInTheDocument()
    expect(screen.getByText('Source: GoTo Escape')).toBeInTheDocument()

    expect(screen.getByText('Line 3 — CreateObject')).toBeInTheDocument()
    expect(screen.getByText('Suggested rewrite: Replace with a direct import / fetch call in TypeScript.')).toBeInTheDocument()
    expect(screen.getByText('Source: Set specter = CreateObject("WScript.Shell")')).toBeInTheDocument()
  })

  it('shows an explicit clean message for a clean bundled sample', () => {
    const sample = SAMPLES.find((item) => item.id === 'expense-tracker')
    if (!sample) throw new Error('Expense tracker sample is missing')

    const { parsed, transpiled } = renderReport(sample.source)

    expect(parsed.errors).toEqual([])
    expect(transpiled.unsupported).toEqual([])
    expect(transpiled.warnings).toEqual([])
    expect(screen.getByText('Clean resurrection — the macro fit the supported subset exactly.')).toBeInTheDocument()
    const counts = screen.getByLabelText('Conversion counts')
    expect(counts).toHaveTextContent('0 warnings')
    expect(counts).toHaveTextContent('0 unsupported')
    expect(counts).toHaveTextContent('0 errors')
  })

  it('shows every transpiler warning with its VBA line number', () => {
    const source = `Sub ReservedWord()
  Dim Function As String
End Sub`
    const { transpiled } = renderReport(source)

    expect(transpiled.warnings).toHaveLength(1)
    expect(screen.getByText(`Line ${transpiled.warnings[0].line}: ${transpiled.warnings[0].message}`)).toBeInTheDocument()
    expect(screen.getByLabelText('Conversion counts')).toHaveTextContent('1 warning')
  })
})
