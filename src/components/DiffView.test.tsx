// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { SAMPLES } from '../lib/samples.ts'
import { transpile } from '../lib/transpiler.ts'
import { parseVBA } from '../lib/vba-parser.ts'
import { DiffView } from './DiffView.tsx'

function expectNumberedPane(pane: HTMLElement, code: string) {
  const expectedLines = code.split('\n')
  const renderedLines = Array.from(pane.querySelectorAll('.code-line'))

  expect(renderedLines).toHaveLength(expectedLines.length)
  expect(renderedLines.map((line) => line.querySelector('.line-no')?.textContent)).toEqual(
    expectedLines.map((_, index) => String(index + 1)),
  )
  expect(renderedLines.map((line) => line.querySelector('code')?.textContent)).toEqual(
    expectedLines.map((line) => line || ' '),
  )
}

afterEach(cleanup)

describe('DiffView', () => {
  it('renders numbered VBA and transpiled TypeScript panes for the expense sample', () => {
    const expenseSample = SAMPLES.find((sample) => sample.id === 'expense-tracker')
    if (!expenseSample) throw new Error('Expense tracker sample is missing')

    const tsCode = transpile(parseVBA(expenseSample.source)).code
    render(<DiffView vbaSource={expenseSample.source} tsCode={tsCode} />)

    const vbaPane = screen.getByLabelText('💀 Dead VBA — original')
    const tsPane = screen.getByLabelText('✨ Resurrected TypeScript + React')

    expectNumberedPane(vbaPane, expenseSample.source)
    expectNumberedPane(tsPane, tsCode)
    expect(vbaPane).toHaveTextContent('Sub AddExpense(Category As String, Amount As Double)')
    expect(tsPane).toHaveTextContent('export function AddExpense')
  })

  it('renders line 1 in both panes for empty input', () => {
    render(<DiffView vbaSource="" tsCode="" />)

    const vbaPane = screen.getByLabelText('💀 Dead VBA — original')
    const tsPane = screen.getByLabelText('✨ Resurrected TypeScript + React')

    expectNumberedPane(vbaPane, '')
    expectNumberedPane(tsPane, '')
    expect(vbaPane.querySelector('.line-no')).toHaveTextContent('1')
    expect(tsPane.querySelector('.line-no')).toHaveTextContent('1')
  })
})
