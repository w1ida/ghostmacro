// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

  it('shows a zero-procedure report and empty preview for an empty upload', async () => {
    render(<App />)
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')
    expect(fileInput).not.toBeNull()

    const emptyFile = new File([], 'empty.bas', { type: 'text/plain' })
    Object.defineProperty(emptyFile, 'text', { value: () => Promise.resolve('') })
    fireEvent.change(fileInput!, { target: { files: [emptyFile] } })

    await waitFor(() => expect(screen.getByText(/Now resurrecting:/)).toHaveTextContent('empty.bas · 0 lines'))
    expect(screen.getByLabelText('Conversion counts')).toHaveTextContent('0 procedures')
    expect(screen.getByText('Nothing to convert — add a Sub or Function.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '3 · Nothing to run yet 👻' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nothing to copy' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Expense Tracker/ })).not.toHaveClass('selected')
  })

  it('shows a zero-procedure report and empty preview for comment-only input', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Paste VBA code'), {
      target: { value: "' first comment\n' second comment" },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run the séance on pasted code' }))

    expect(screen.getByText(/Now resurrecting:/)).toHaveTextContent('pasted-code.vba · 2 lines')
    expect(screen.getByLabelText('Conversion counts')).toHaveTextContent('0 procedures')
    expect(screen.getByLabelText('Conversion counts')).toHaveTextContent('0 errors')
    expect(screen.getByText('Nothing to convert — add a Sub or Function.')).toBeInTheDocument()
    expect(screen.getByLabelText('Empty generated app preview')).toBeInTheDocument()
  })

  it('rejects an oversized upload without replacing the active conversion', () => {
    render(<App />)
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')
    expect(fileInput).not.toBeNull()

    const oversizedFile = new File([new Uint8Array(200 * 1024 + 1)], 'oversized.bas', {
      type: 'text/plain',
    })
    fireEvent.change(fileInput!, { target: { files: [oversizedFile] } })

    expect(screen.getByRole('alert')).toHaveTextContent('File is over the 200 KB limit')
    expect(screen.getByText(/Now resurrecting:/)).toHaveTextContent('expense-tracker.bas')
    expect(screen.getByText('Clean resurrection — the macro fit the supported subset exactly.')).toBeInTheDocument()
  })

  it('reports GoTo while rendering the rest of the converted procedure', () => {
    render(<App />)
    const source = `Sub Haunted()
  GoTo ExitPoint
  MsgBox "Still parsed"
End Sub`

    fireEvent.change(screen.getByLabelText('Paste VBA code'), { target: { value: source } })
    fireEvent.click(screen.getByRole('button', { name: 'Run the séance on pasted code' }))

    expect(screen.getByText('Line 2 — GoTo / label')).toBeInTheDocument()
    expect(screen.getByText('Suggested rewrite: Rewrite with If/Else or a For loop — GoTo has no direct TS equivalent.')).toBeInTheDocument()
    expect(screen.getByLabelText('✨ Resurrected TypeScript + React')).toHaveTextContent('showToast("Still parsed")')
    expect(screen.getByLabelText('Live preview of the resurrected app')).toBeInTheDocument()
  })
})
