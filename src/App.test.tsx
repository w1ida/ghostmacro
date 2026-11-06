// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import App from './App.tsx'

const getRowsStat = (count: number) => screen.getByText((_, element) => element?.tagName === 'SPAN' && element.textContent === `${count} rows`)

afterEach(cleanup)

describe('App wiring', () => {
  it('switches samples and restores the selected sample rows', () => {
    render(<App />)

    expect(screen.getByText(/Now resurrecting:/)).toHaveTextContent('expense-tracker.bas')
    expect(getRowsStat(3)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Row name'), { target: { value: 'Temporary expense' } })
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '24' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add row' }))

    expect(getRowsStat(4)).toBeInTheDocument()
    expect(screen.getByText('Temporary expense')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Inventory Manager/ }))

    expect(screen.getByText(/Now resurrecting:/)).toHaveTextContent('inventory-manager.bas')
    expect(getRowsStat(3)).toBeInTheDocument()
    expect(screen.queryByText('Temporary expense')).not.toBeInTheDocument()
  })

  it('uses pasted-code.vba as the active custom source label', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Paste VBA code'), {
      target: { value: 'Sub Hello()\n  MsgBox "Hello"\nEnd Sub' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run the séance on pasted code' }))

    expect(screen.getByText(/Now resurrecting:/)).toHaveTextContent('pasted-code.vba')
    expect(screen.queryByRole('button', { name: /Expense Tracker/ })).not.toHaveClass('selected')
    expect(screen.queryByRole('button', { name: /Inventory Manager/ })).not.toHaveClass('selected')
    expect(screen.queryByRole('button', { name: /Invoice Generator/ })).not.toHaveClass('selected')
  })
})
