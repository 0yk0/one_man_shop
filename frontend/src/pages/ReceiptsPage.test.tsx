import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock bindings BEFORE importing ReceiptsPage
const mockGetTransactions = vi.fn()
const mockGetSettings = vi.fn()
const mockPrintReceipt = vi.fn()
const mockExportTransactionsCSVToDir = vi.fn()
const mockSelectFolder = vi.fn()
const mockGetTransactionsCSVContent = vi.fn()
const mockIsMobile = vi.fn().mockResolvedValue(false)

vi.mock('../bindings', () => ({
  GetTransactions: (...args: any[]) => mockGetTransactions(...args),
  GetSettings: (...args: any[]) => mockGetSettings(...args),
  PrintReceipt: (...args: any[]) => mockPrintReceipt(...args),
  ExportTransactionsCSVToDir: (...args: any[]) => mockExportTransactionsCSVToDir(...args),
  SelectFolder: (...args: any[]) => mockSelectFolder(...args),
  GetTransactionsCSVContent: (...args: any[]) => mockGetTransactionsCSVContent(...args),
  IsMobile: (...args: any[]) => mockIsMobile(...args),
  Product: class Product { id = ''; name = ''; price = 0; tax_rate = 0; image_data = ''; active = false; created = '' },
  CartItem: class CartItem { product_id = ''; name = ''; qty = 0; price = 0; tax_rate = 0; subtotal = 0; tax_amount = 0; constructor(s: any = {}) { Object.assign(this, s || {}) } },
  Transaction: class Transaction { id = ''; receipt_number = 0; items: any[] = []; subtotal = 0; tax_total = 0; total = 0; payment_method = ''; created = ''; constructor(s: any = {}) { Object.assign(this, s || {}); this.items = (s?.items || []).map((i: any) => new CartItem(i)) } },
  Settings: class Settings { id = ''; shop_name = ''; upi_vpa = ''; tax_enabled = false; printer_name = ''; constructor(s: any = {}) { Object.assign(this, s || {}) } },
  ReportSummary: class ReportSummary { date = ''; total_transactions = 0; total_revenue = 0; total_tax = 0; upi_transactions = 0; cash_transactions = 0 },
  models: {},
}))

vi.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn(),
    closeSnackbar: vi.fn(),
  }),
  SnackbarProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('../lib/reports', () => ({
  fmtDate: (s: string) => s ? '1 Aug 2026' : '',
  fmtTime: (s: string) => s ? '10:30 AM' : '',
  filterTxns: (txns: any[]) => txns,
  getDateRange: () => ({ start: '2026-08-01', end: '2026-08-31' }),
  DatePreset: {},
}))

vi.mock('../components/ui/DateRangePicker', () => ({
  default: ({ value, onChange }: any) => <div data-testid="date-range-picker" />,
}))

import ReceiptsPage from './ReceiptsPage'

describe('ReceiptsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner initially', () => {
    mockGetTransactions.mockReturnValue(new Promise(() => {}))
    mockGetSettings.mockReturnValue(new Promise(() => {}))

    render(<ReceiptsPage />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders Receipts page content', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false, printer_name: '' })

    render(<ReceiptsPage />)

    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
    })
  })

  it('renders empty table when no transactions', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false, printer_name: '' })

    render(<ReceiptsPage />)

    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
    })

    // Table should render with header but no rows
    expect(screen.getByText('#')).toBeInTheDocument() // Receipt number column header
  })

  it('renders transaction table with data', async () => {
    mockGetTransactions.mockResolvedValue([
      {
        id: '1', receipt_number: 1, items: [{ product_id: 'p1', name: 'Juice', qty: 2, price: 25, tax_rate: 0, subtotal: 50, tax_amount: 0 }],
        subtotal: 50, tax_total: 0, total: 50, payment_method: 'upi', created: '2026-08-01T10:00:00Z',
      },
    ])
    mockGetSettings.mockResolvedValue({ tax_enabled: false, printer_name: 'Virtual Printer' })

    render(<ReceiptsPage />)

    await waitFor(() => {
      expect(screen.getByText('#000001')).toBeInTheDocument()
    })

    // ₹50.00 may appear in multiple places (table cells)
    const amounts = screen.getAllByText('₹50.00')
    expect(amounts.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('UPI')).toBeInTheDocument()
  })

  it('shows Export CSV button', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false, printer_name: '' })

    render(<ReceiptsPage />)

    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
    })
  })

  it('shows Export CSV button', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false, printer_name: '' })

    render(<ReceiptsPage />)

    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
    })
  })

  it('shows printer warning when no printer configured', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false, printer_name: '' })

    render(<ReceiptsPage />)

    await waitFor(() => {
      expect(screen.getByText(/No printer configured/)).toBeInTheDocument()
    })
  })

  it('hides printer warning when printer is configured', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false, printer_name: 'Virtual Printer' })

    render(<ReceiptsPage />)

    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
    })

    expect(screen.queryByText(/No printer configured/)).not.toBeInTheDocument()
  })

  it('shows pagination controls', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false, printer_name: '' })

    render(<ReceiptsPage />)

    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
    })

    expect(screen.getByText(/Prev/)).toBeInTheDocument()
    expect(screen.getByText(/Next/)).toBeInTheDocument()
  })

  it('displays search input', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false, printer_name: '' })

    render(<ReceiptsPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search by #, amount, item...')).toBeInTheDocument()
    })
  })
})
