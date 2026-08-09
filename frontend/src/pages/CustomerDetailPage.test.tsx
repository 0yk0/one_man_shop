import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// Mock bindings BEFORE importing CustomerDetailPage
const mockGetCustomerByID = vi.fn()
const mockGetTransactionsByCustomerID = vi.fn()
const mockGetSettings = vi.fn()
const mockIsMobile = vi.fn().mockResolvedValue(false)

vi.mock('../bindings', () => ({
  GetCustomerByID: (...args: any[]) => mockGetCustomerByID(...args),
  GetTransactionsByCustomerID: (...args: any[]) => mockGetTransactionsByCustomerID(...args),
  GetSettings: (...args: any[]) => mockGetSettings(...args),
  IsMobile: (...args: any[]) => mockIsMobile(...args),
  Product: class Product { id = ''; name = ''; price = 0; tax_rate = 0; image_data = ''; active = false; created = '' },
  CartItem: class CartItem { product_id = ''; name = ''; qty = 0; price = 0; tax_rate = 0; subtotal = 0; tax_amount = 0; constructor(s: any = {}) { Object.assign(this, s || {}) } },
  Transaction: class Transaction { id = ''; receipt_number = 0; items: any[] = []; subtotal = 0; tax_total = 0; total = 0; payment_method = ''; customer_id = ''; customer_name = ''; customer_phone = ''; created = ''; constructor(s: any = {}) { Object.assign(this, s || {}); this.items = (s?.items || []).map((i: any) => new CartItem(i)) } },
  Settings: class Settings { id = ''; shop_name = ''; upi_vpa = ''; tax_enabled = false; printer_name = ''; constructor(s: any = {}) { Object.assign(this, s || {}) } },
  ReportSummary: class ReportSummary { date = ''; total_transactions = 0; total_revenue = 0; total_tax = 0; upi_transactions = 0; cash_transactions = 0 },
  Customer: class Customer { id = ''; name = ''; phone = ''; created = ''; constructor(s: any = {}) { Object.assign(this, s || {}) } },
  models: {},
}))

vi.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn(),
    closeSnackbar: vi.fn(),
  }),
  SnackbarProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('../lib/print', () => ({
  printReceipt: vi.fn(),
}))

import CustomerDetailPage from './CustomerDetailPage'

const renderWithRouter = (customerId: string = '1') => {
  return render(
    <MemoryRouter initialEntries={[`/customers/${customerId}`]}>
      <Routes>
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/customers" element={<div>Customers List</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CustomerDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner initially', () => {
    mockGetCustomerByID.mockReturnValue(new Promise(() => {}))
    mockGetTransactionsByCustomerID.mockReturnValue(new Promise(() => {}))
    mockGetSettings.mockResolvedValue({ printer_name: '' })

    renderWithRouter()
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('shows customer not found when customer is null', async () => {
    mockGetCustomerByID.mockResolvedValue(null)
    mockGetTransactionsByCustomerID.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ printer_name: '' })

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('Customer not found')).toBeInTheDocument()
    })
    expect(screen.getByText('Back to Customers')).toBeInTheDocument()
  })

  it('renders customer info', async () => {
    mockGetCustomerByID.mockResolvedValue({
      id: '1',
      name: 'John Doe',
      phone: '9876543210',
      created: '2026-01-15T10:30:00Z',
    })
    mockGetTransactionsByCustomerID.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ printer_name: '' })

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('9876543210')).toBeInTheDocument()
    })
  })

  it('renders customer stats', async () => {
    mockGetCustomerByID.mockResolvedValue({
      id: '1',
      name: 'John Doe',
      phone: '9876543210',
      created: '2026-01-15T10:30:00Z',
    })
    mockGetTransactionsByCustomerID.mockResolvedValue([
      { id: '1', receipt_number: 1, items: [], subtotal: 100, tax_total: 18, total: 118, payment_method: 'upi', created: '2026-08-01T10:30:00Z' },
      { id: '2', receipt_number: 2, items: [], subtotal: 200, tax_total: 36, total: 236, payment_method: 'cash', created: '2026-08-02T11:30:00Z' },
    ])
    mockGetSettings.mockResolvedValue({ printer_name: '' })

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('₹354')).toBeInTheDocument()
      expect(screen.getByText('₹177')).toBeInTheDocument()
    })
  })

  it('renders transaction history', async () => {
    mockGetCustomerByID.mockResolvedValue({
      id: '1',
      name: 'John Doe',
      phone: '9876543210',
      created: '2026-01-15T10:30:00Z',
    })
    mockGetTransactionsByCustomerID.mockResolvedValue([
      { id: '1', receipt_number: 1, items: [{ name: 'Milk', qty: 2, subtotal: 100 }], subtotal: 100, tax_total: 18, total: 118, payment_method: 'upi', created: '2026-08-01T10:30:00Z' },
    ])
    mockGetSettings.mockResolvedValue({ printer_name: '' })

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('#000001')).toBeInTheDocument()
      expect(screen.getByText('₹118.00')).toBeInTheDocument()
      expect(screen.getByText('UPI')).toBeInTheDocument()
    })
  })

  it('renders empty transaction state', async () => {
    mockGetCustomerByID.mockResolvedValue({
      id: '1',
      name: 'John Doe',
      phone: '9876543210',
      created: '2026-01-15T10:30:00Z',
    })
    mockGetTransactionsByCustomerID.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ printer_name: '' })

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('No transactions yet')).toBeInTheDocument()
    })
    expect(screen.getByText('Transactions will appear here after checkout')).toBeInTheDocument()
  })

  it('shows Back to Customers button', async () => {
    mockGetCustomerByID.mockResolvedValue({
      id: '1',
      name: 'John Doe',
      phone: '9876543210',
      created: '2026-01-15T10:30:00Z',
    })
    mockGetTransactionsByCustomerID.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ printer_name: '' })

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    expect(screen.getByText('Customer Details')).toBeInTheDocument()
  })

  it('shows print button when printer is available', async () => {
    mockGetCustomerByID.mockResolvedValue({
      id: '1',
      name: 'John Doe',
      phone: '9876543210',
      created: '2026-01-15T10:30:00Z',
    })
    mockGetTransactionsByCustomerID.mockResolvedValue([
      { id: '1', receipt_number: 1, items: [], subtotal: 100, tax_total: 18, total: 118, payment_method: 'upi', created: '2026-08-01T10:30:00Z' },
    ])
    mockGetSettings.mockResolvedValue({ printer_name: 'My Printer' })

    renderWithRouter()

    await waitFor(() => {
      expect(screen.getByText('#000001')).toBeInTheDocument()
    })

    // Print button should be present (desktop view)
    expect(screen.getByTitle('Print receipt')).toBeInTheDocument()
  })
})
