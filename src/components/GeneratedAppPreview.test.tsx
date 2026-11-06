// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SAMPLES } from '../lib/samples.ts'
import type { GhostRow } from '../lib/samples.ts'
import { GeneratedAppPreview } from './GeneratedAppPreview.tsx'

const expenseRows = SAMPLES.find((sample) => sample.id === 'expense-tracker')!.rows

function renderPreview(rows: GhostRow[] = expenseRows, onAddRow = vi.fn()) {
  return {
    onAddRow,
    ...render(<GeneratedAppPreview rows={rows} toast={null} onAddRow={onAddRow} />),
  }
}

function amountTotalStat() {
  return screen.getByText(/amount total/).closest('span')
}

afterEach(cleanup)

describe('GeneratedAppPreview', () => {
  it('renders the expense sample amount total', () => {
    renderPreview()

    expect(amountTotalStat()).toHaveTextContent('$73.49 amount total')
  })

  it('adds a valid row and updates the total when the parent supplies it', () => {
    const { onAddRow, rerender } = renderPreview()

    fireEvent.change(screen.getByLabelText('Row name'), { target: { value: 'Team snacks' } })
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add row' }))

    expect(onAddRow).toHaveBeenCalledOnce()
    const addedRow = onAddRow.mock.calls[0][0]
    expect(addedRow).toMatchObject({ name: 'Team snacks', amount: 10, total: 10 })

    rerender(
      <GeneratedAppPreview
        rows={[...expenseRows, addedRow]}
        toast={null}
        onAddRow={onAddRow}
      />,
    )

    expect(amountTotalStat()).toHaveTextContent('$83.49 amount total')
    expect(screen.getByText(/rows$/).closest('span')).toHaveTextContent('4 rows')
  })

  it.each([
    ['an empty name', '', '10'],
    ['a non-numeric amount', 'Team snacks', 'not-a-number'],
    ['a zero amount', 'Team snacks', '0'],
    ['a negative amount', 'Team snacks', '-10'],
  ])('rejects %s', (_case, name, amount) => {
    const { onAddRow } = renderPreview()

    fireEvent.change(screen.getByLabelText('Row name'), { target: { value: name } })
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: amount } })
    fireEvent.click(screen.getByRole('button', { name: 'Add row' }))

    expect(onAddRow).not.toHaveBeenCalled()
  })

  it('visually flags a row with quantity at the low-stock threshold', () => {
    const lowStockRow: GhostRow = {
      id: 'SKU-LOW',
      name: 'Low-stock item',
      category: 'Inventory',
      amount: 0,
      quantity: 5,
      price: 4,
      total: 20,
    }

    renderPreview([lowStockRow])

    expect(screen.getByText('Low-stock item').closest('tr')).toHaveClass('low')
    expect(screen.getByText(/low-stock/).closest('span')).toHaveTextContent('1 low-stock')
  })
})
