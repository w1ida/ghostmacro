// @vitest-environment jsdom

import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SAMPLES } from '../lib/samples.ts'
import { UploadPanel } from './UploadPanel.tsx'

interface SampleHarnessProps {
  onSelectSample: (id: string) => void
}

function SampleHarness({ onSelectSample }: SampleHarnessProps) {
  const [selectedId, setSelectedId] = useState(SAMPLES[0].id)
  const selectedSample = SAMPLES.find((sample) => sample.id === selectedId) ?? SAMPLES[0]

  const selectSample = (id: string) => {
    onSelectSample(id)
    setSelectedId(id)
  }

  return (
    <>
      <UploadPanel
        samples={SAMPLES}
        selectedId={selectedId}
        onSelectSample={selectSample}
        onUpload={vi.fn()}
        onPaste={vi.fn()}
      />
      <output aria-label="Loaded VBA source">{selectedSample.source}</output>
    </>
  )
}

function renderPanel({
  onUpload = vi.fn(),
  onPaste = vi.fn(),
}: {
  onUpload?: (fileName: string, source: string) => void
  onPaste?: (source: string) => void
} = {}) {
  render(
    <UploadPanel
      samples={SAMPLES}
      selectedId={SAMPLES[0].id}
      onSelectSample={vi.fn()}
      onUpload={onUpload}
      onPaste={onPaste}
    />,
  )
}

afterEach(cleanup)

describe('UploadPanel', () => {
  it.each(SAMPLES)('selects $title and loads its bundled VBA source', (sample) => {
    const onSelectSample = vi.fn()
    render(<SampleHarness onSelectSample={onSelectSample} />)

    const sampleCard = screen.getByText(sample.title).closest('button')
    expect(sampleCard).not.toBeNull()
    fireEvent.click(sampleCard!)

    expect(onSelectSample).toHaveBeenCalledOnce()
    expect(onSelectSample).toHaveBeenCalledWith(sample.id)
    expect(screen.getByLabelText('Loaded VBA source').textContent).toBe(sample.source)
    expect(sample.source.trim()).not.toBe('')
  })

  it('rejects a file over 200 KB without calling onUpload', () => {
    const onUpload = vi.fn()
    renderPanel({ onUpload })
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')
    expect(fileInput).not.toBeNull()
    expect(fileInput).toHaveAttribute('accept', '.bas,.vba')

    const oversizedFile = new File([new Uint8Array(200 * 1024 + 1)], 'oversized.bas', {
      type: 'text/plain',
    })
    fireEvent.change(fileInput!, { target: { files: [oversizedFile] } })

    expect(screen.getByRole('alert')).toHaveTextContent('File is over the 200 KB limit')
    expect(onUpload).not.toHaveBeenCalled()
  })

  it('rejects files without a .bas or .vba extension', () => {
    const onUpload = vi.fn()
    renderPanel({ onUpload })
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')
    expect(fileInput).not.toBeNull()

    fireEvent.change(fileInput!, {
      target: { files: [new File(['Sub Example\nEnd Sub'], 'macro.txt', { type: 'text/plain' })] },
    })

    expect(screen.getByRole('alert')).toHaveTextContent('GhostMacro reads .bas / .vba text exports')
    expect(onUpload).not.toHaveBeenCalled()
  })

  it('submits pasted VBA without changing its text', () => {
    const onPaste = vi.fn()
    renderPanel({ onPaste })
    const source = 'Sub Example()\n  MsgBox "Boo"\nEnd Sub'

    fireEvent.click(screen.getByText('Paste VBA code instead'))
    fireEvent.change(screen.getByLabelText('Paste VBA code'), { target: { value: source } })
    fireEvent.click(screen.getByRole('button', { name: 'Run the séance on pasted code' }))

    expect(onPaste).toHaveBeenCalledOnce()
    expect(onPaste).toHaveBeenCalledWith(source)
  })
})
