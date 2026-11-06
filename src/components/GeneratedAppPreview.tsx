import { useState } from 'react'
import type { GhostRow } from '../lib/samples.ts'

interface Props {
  rows: GhostRow[]
  toast: string | null
  onAddRow: (row: GhostRow) => void
}

export function GeneratedAppPreview({ rows, toast, onAddRow }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('General')
  const [amount, setAmount] = useState('')

  const totalAmount = rows.reduce((acc, r) => acc + r.amount, 0)
  const totalValue = rows.reduce((acc, r) => acc + r.total, 0)
  const lowStock = rows.filter((r) => r.quantity > 0 && r.quantity <= 5).length

  const addRow = () => {
    const value = Number(amount)
    if (name.trim() === '' || !Number.isFinite(value) || value <= 0) return
    onAddRow({
      id: `R${rows.length + 1}`,
      name: name.trim(),
      category: category.trim() || 'General',
      amount: value,
      quantity: 1,
      price: value,
      total: value,
    })
    setName('')
    setAmount('')
  }

  return (
    <section className="panel" aria-label="Live preview of the resurrected app">
      <h2>3 · Run the resurrected app 👻</h2>
      <p className="muted">
        This is the generated app, running live — same logic, new body. Add a row and watch the totals update.
      </p>
      {toast && <p className="toast" role="status">💬 {toast}</p>}
      <div className="stats">
        <span><strong>{rows.length}</strong> rows</span>
        <span><strong>${totalAmount.toFixed(2)}</strong> amount total</span>
        <span><strong>${totalValue.toFixed(2)}</strong> value total</span>
        <span><strong>{lowStock}</strong> low-stock ⚠️</span>
      </div>
      <table className="data-table">
        <thead>
          <tr><th>ID</th><th>Name</th><th>Category</th><th>Amount</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={r.quantity > 0 && r.quantity <= 5 ? 'low' : ''}>
              <td>{r.id}</td><td>{r.name}</td><td>{r.category}</td>
              <td>${r.amount.toFixed(2)}</td><td>{r.quantity}</td>
              <td>${r.price.toFixed(2)}</td><td>${r.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <form className="add-row" onSubmit={(e) => { e.preventDefault(); addRow() }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name — e.g. Office lunch" aria-label="Row name" />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" aria-label="Category" />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" inputMode="decimal" aria-label="Amount" />
        <button type="submit" className="btn">Add row</button>
      </form>
    </section>
  )
}
