import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock bindings BEFORE importing SummaryTab
const mockGetTransactions = vi.fn()
const mockGetSettings = vi.fn()

vi.mock('../../bindings', () => ({
  GetTransactions: (...args: any[]) => mockGetTransactions(...args),
  GetSettings: (...args: any[]) => mockGetSettings(...args),
  Product: class Product { id = ''; name = ''; price = 0; tax_rate = 0; image_data = ''; active = false; created = '' },
  CartItem: class CartItem { product_id = ''; name = ''; qty = 0; price = 0; tax_rate = 0; subtotal = 0; tax_amount = 0; constructor(s: any = {}) { Object.assign(this, s || {}) } },
  Transaction: class Transaction { id = ''; receipt_number = 0; items: any[] = []; subtotal = 0; tax_total = 0; total = 0; payment_method = ''; created = ''; constructor(s: any = {}) { Object.assign(this, s || {}); this.items = (s?.items || []).map((i: any) => new CartItem(i)) } },
  Settings: class Settings { id = ''; shop_name = ''; tax_enabled = false; constructor(s: any = {}) { Object.assign(this, s || {}) } },
  models: {},
}))

vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => children,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => children,
  Legend: () => null,
}))

import SummaryTab from './SummaryTab'

describe('SummaryTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner initially', () => {
    mockGetTransactions.mockReturnValue(new Promise(() => {}))
    mockGetSettings.mockReturnValue(new Promise(() => {}))

    render(<SummaryTab />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders today stats after loading', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<SummaryTab />)

    await waitFor(() => {
      expect(screen.getByText("Today's Revenue")).toBeInTheDocument()
    })

    expect(screen.getByText('UPI Today')).toBeInTheDocument()
    expect(screen.getByText('Cash Today')).toBeInTheDocument()
  })

  it('shows tax column when tax is enabled', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: true })

    render(<SummaryTab />)

    await waitFor(() => {
      expect(screen.getByText("Today's Tax")).toBeInTheDocument()
    })
  })

  it('hides tax column when tax is disabled', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<SummaryTab />)

    await waitFor(() => {
      expect(screen.getByText("Today's Revenue")).toBeInTheDocument()
    })

    expect(screen.queryByText("Today's Tax")).not.toBeInTheDocument()
  })

  it('renders Weekly Revenue section', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<SummaryTab />)

    await waitFor(() => {
      expect(screen.getByText('Weekly Revenue')).toBeInTheDocument()
    })
  })

  it('renders Top 3 Products section', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<SummaryTab />)

    await waitFor(() => {
      expect(screen.getByText('Top 3 Products')).toBeInTheDocument()
    })
  })

  it('renders Least 3 Products section', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<SummaryTab />)

    await waitFor(() => {
      expect(screen.getByText('Least 3 Products')).toBeInTheDocument()
    })
  })

  it('shows no sales message when no transactions', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<SummaryTab />)

    await waitFor(() => {
      // "No sales this week" appears in both Top 3 and Least 3 sections
      const noSalesMessages = screen.getAllByText('No sales this week')
      expect(noSalesMessages.length).toBe(2)
    })
  })

  it('shows week navigation buttons', async () => {
    mockGetTransactions.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<SummaryTab />)

    await waitFor(() => {
      expect(screen.getByText('Weekly Revenue')).toBeInTheDocument()
    })

    // Should have previous/next week buttons
    const buttons = screen.getAllByRole('button')
    const navButtons = buttons.filter(b => b.querySelector('svg'))
    expect(navButtons.length).toBeGreaterThan(0)
  })

  it('renders with transaction data', async () => {
    mockGetTransactions.mockResolvedValue([
      {
        id: '1', receipt_number: 1,
        items: [{ product_id: 'p1', name: 'Juice', qty: 2, price: 25, tax_rate: 0, subtotal: 50, tax_amount: 0 }],
        subtotal: 50, tax_total: 0, total: 50, payment_method: 'upi', created: '2026-08-04T10:00:00Z',
      },
    ])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<SummaryTab />)

    await waitFor(() => {
      expect(screen.getByText("Today's Revenue")).toBeInTheDocument()
    })

    // Should show revenue amount in today's revenue stat
    const revenueStats = screen.getAllByText(/₹50/)
    expect(revenueStats.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('1 transactions')).toBeInTheDocument()
  })
})
