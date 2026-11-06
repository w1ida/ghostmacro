/**
 * Built-in samples. Each entry bundles the VBA source (imported as a
 * string here so the app works with no backend) with a typed data model
 * that drives the live preview. The .bas files in samples/ are the
 * source of truth — keep this file in sync with them.
 */
import expenseSource from '../../samples/expense-tracker.bas?raw'
import inventorySource from '../../samples/inventory-manager.bas?raw'
import invoiceSource from '../../samples/invoice-generator.bas?raw'

export interface GhostRow {
  id: string
  name: string
  category: string
  amount: number
  quantity: number
  price: number
  total: number
}

export interface Sample {
  id: string
  title: string
  tagline: string
  fileName: string
  source: string
  rows: GhostRow[]
}

export const SAMPLES: Sample[] = [
  {
    id: 'expense-tracker',
    title: '👻 Expense Tracker',
    tagline: 'Adds expenses and keeps a running total. Haunted since 2009.',
    fileName: 'expense-tracker.bas',
    source: expenseSource,
    rows: [
      { id: 'E1', name: 'Office lunch', category: 'Food', amount: 42.5, quantity: 1, price: 42.5, total: 42.5 },
      { id: 'E2', name: 'Taxi to client', category: 'Travel', amount: 18.0, quantity: 1, price: 18.0, total: 18.0 },
      { id: 'E3', name: 'Printer paper', category: 'Office', amount: 12.99, quantity: 2, price: 6.5, total: 12.99 },
    ],
  },
  {
    id: 'inventory-manager',
    title: '🎃 Inventory Manager',
    tagline: 'Counts stock and flags anything at or below the reorder level (5).',
    fileName: 'inventory-manager.bas',
    source: inventorySource,
    rows: [
      { id: 'SKU-101', name: 'Pumpkin candle', category: 'Seasonal', amount: 0, quantity: 3, price: 9.99, total: 29.97 },
      { id: 'SKU-102', name: 'Ghost mug', category: 'Merch', amount: 0, quantity: 24, price: 12.0, total: 288.0 },
      { id: 'SKU-103', name: 'Spider web decor', category: 'Seasonal', amount: 0, quantity: 5, price: 4.5, total: 22.5 },
    ],
  },
  {
    id: 'invoice-generator',
    title: '🕸️ Invoice Generator',
    tagline: 'Builds an invoice total with 8% tax and a 10% discount above 500.',
    fileName: 'invoice-generator.bas',
    source: invoiceSource,
    rows: [
      { id: 'INV-001', name: 'Website rescue', category: 'Services', amount: 650, quantity: 1, price: 650, total: 650 },
      { id: 'INV-002', name: 'Macro séance', category: 'Services', amount: 120, quantity: 1, price: 120, total: 120 },
    ],
  },
]
