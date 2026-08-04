import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock bindings BEFORE importing TransactionsTab
const mockGetTransactions = vi.fn()
const mockGetSettings = vi.fn()
const mockExportTransactionsCSVToDir = vi.fn()
const mockSelectFolder = vi.fn()

vi.mock('../../bindings', () => ({
  GetTransactions: (...args: any[]) => mockGetTransactions(...args),
  GetSettings: (...args: any[]) => mockGetSettings(...args),
  ExportTransactionsCSVToDir: (...args: any[]) => mockExportTransactionsCSVToDir(...args),
  SelectFolder: (...args: any[]) => mockSelectFolder(...args),
  Product: class Product { id = ''; name = ''; price = 0; tax_rate = 0; image_data = ''; active = false; created = '' },
  CartItem: class CartItem { product_id = ''; name = ''; qty = 0; price = 0; tax_rate = 0; subtotal = 0; tax_amount = 0; constructor(s: any = {}) { Object.assign(this, s || {}) } },
  Transaction: class Transaction { id = ''; receipt_number = 0; items: any[] = []; subtotal = 0; tax_total = 0; total = 0; payment_method = ''; created = ''; constructor(s: any = {}) { Object.assign(this, s || {}); this.items = (s?.items || []).map((i: any) => new CartItem(i)) } },
  Settings: class Settings { id = ''; shop_name = ''; tax_enabled = false; constructor(s: any = {}) { Object.assign(this, s || {}) } },
  models: {},
}))

vi.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn(),
    closeSnackbar: vi.fn(),
  }),
  SnackbarProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('../../lib/reports', () => ({
  getDateRange: () => ({ start: '2026-08-03', end: '2026-08-09' }),
  filterTxns: (txns: any[]) => txns,
  sumTxns: (txns: any[]) => ({
    total: txns.reduce((a: number, t: any) => a + t.total, 0),
    tax: txns.reduce((a: number, t: any) => a + t.tax_total, 0),
    upi: txns.filter((t: any) => t.payment_method === 'upi').length,
    cash: txns.filter((t: any) => t.payment_method === 'cash').length,
  }),
  fmtDate: (s: string) => '4 Aug 2026',
  fmtTime: (s: string) => '10:30 AM',
  DatePreset: {},
}))

vi.mock('../ui/DateRangePicker', () => ({
  default: ({ value, onChange }: any) => <div data-testid="date-range-picker" />,
}))

import TransactionsTab from './TransactionsTab'

describe('TransactionsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner initially', () => {
    mockGetTransactions.mockReturnValue(new Promise(() => {}))
    mockGetSettings.mockReturnValue(new Promise(() => {}))

    render(<TransactionsTab />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders empty state when no transactions', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<TransactionsTab />)

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument()
    })
  })

  it('renders transaction table with data', async () => {
    mockGetTransactions.mockResolvedValue([
      {
        id: '1', receipt_number: 1,
        items: [{ product_id: 'p1', name: 'Juice', qty: 2, price: 25, tax_rate: 0, subtotal: 50, tax_amount: 0 }],
        subtotal: 50, tax_total: 0, total: 50, payment_method: 'upi', created: '2026-08-04T10:00:00Z',
      },
    ])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<TransactionsTab />)

    await waitFor(() => {
      expect(screen.getByText('4 Aug 2026')).toBeInTheDocument()
    })

    expect(screen.getByText('10:30 AM')).toBeInTheDocument()
    // ₹50.00 appears in both stats bar and table
    const amounts = screen.getAllByText('₹50.00')
    expect(amounts.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('UPI')).toBeInTheDocument()
  })

  it('shows stats bar when transactions exist', async () => {
    mockGetTransactions.mockResolvedValue([
      {
        id: '1', receipt_number: 1, items: [], subtotal: 100, tax_total: 10, total: 110,
        payment_method: 'upi', created: '2026-08-04T10:00:00Z',
      },
    ])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<TransactionsTab />)

    await waitFor(() => {
      expect(screen.getByText('Transactions:')).toBeInTheDocument()
    })

    expect(screen.getByText('Total:')).toBeInTheDocument()
    expect(screen.getByText('UPI:')).toBeInTheDocument()
    expect(screen.getByText('Cash:')).toBeInTheDocument()
  })

  it('shows tax in stats when tax enabled', async () => {
    mockGetTransactions.mockResolvedValue([
      {
        id: '1', receipt_number: 1, items: [], subtotal: 100, tax_total: 10, total: 110,
        payment_method: 'upi', created: '2026-08-04T10:00:00Z',
      },
    ])
    mockGetSettings.mockResolvedValue({ tax_enabled: true })

    render(<TransactionsTab />)

    await waitFor(() => {
      expect(screen.getByText('Tax:')).toBeInTheDocument()
    })
  })

  it('hides tax in stats when tax disabled', async () => {
    mockGetTransactions.mockResolvedValue([
      {
        id: '1', receipt_number: 1, items: [], subtotal: 100, tax_total: 10, total: 110,
        payment_method: 'upi', created: '2026-08-04T10:00:00Z',
      },
    ])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<TransactionsTab />)

    await waitFor(() => {
      expect(screen.getByText('Transactions:')).toBeInTheDocument()
    })

    expect(screen.queryByText('Tax:')).not.toBeInTheDocument()
  })

  it('shows Export CSV button', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<TransactionsTab />)

    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
    })
  })

  it('displays search input', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<TransactionsTab />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search by #, amount, item...')).toBeInTheDocument()
    })
  })

  it('shows date range picker', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<TransactionsTab />)

    await waitFor(() => {
      expect(screen.getByTestId('date-range-picker')).toBeInTheDocument()
    })
  })

  it('shows pagination info', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<TransactionsTab />)

    await waitFor(() => {
      expect(screen.getByText('No results')).toBeInTheDocument()
    })
  })
})
