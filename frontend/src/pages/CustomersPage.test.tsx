import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock bindings BEFORE importing CustomersPage
const mockGetCustomers = vi.fn()
const mockCreateCustomer = vi.fn()
const mockUpdateCustomer = vi.fn()
const mockDeleteCustomer = vi.fn()
const mockGetCustomersCSVContent = vi.fn()
const mockSelectFolder = vi.fn()
const mockIsMobile = vi.fn().mockResolvedValue(false)

vi.mock('../bindings', () => ({
  GetCustomers: (...args: any[]) => mockGetCustomers(...args),
  CreateCustomer: (...args: any[]) => mockCreateCustomer(...args),
  UpdateCustomer: (...args: any[]) => mockUpdateCustomer(...args),
  DeleteCustomer: (...args: any[]) => mockDeleteCustomer(...args),
  GetCustomersCSVContent: (...args: any[]) => mockGetCustomersCSVContent(...args),
  SelectFolder: (...args: any[]) => mockSelectFolder(...args),
  IsMobile: (...args: any[]) => mockIsMobile(...args),
  Product: class Product { id = ''; name = ''; price = 0; tax_rate = 0; image_data = ''; active = false; created = '' },
  CartItem: class CartItem { product_id = ''; name = ''; qty = 0; price = 0; tax_rate = 0; subtotal = 0; tax_amount = 0 },
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

vi.mock('../lib/sounds', () => ({
  sounds: {
    create: vi.fn(),
    delete: vi.fn(),
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
  },
}))

vi.mock('../lib/saveFile', () => ({
  saveFileWithDialog: vi.fn().mockResolvedValue('/path/to/file.csv'),
}))

import CustomersPage from './CustomersPage'

const renderWithRouter = (component: React.ReactNode) => {
  return render(<MemoryRouter>{component}</MemoryRouter>)
}

describe('CustomersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner initially', () => {
    mockGetCustomers.mockReturnValue(new Promise(() => {}))

    renderWithRouter(<CustomersPage />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders empty state when no customers', async () => {
    mockGetCustomers.mockResolvedValue([])

    renderWithRouter(<CustomersPage />)

    await waitFor(() => {
      expect(screen.getByText('No customers yet')).toBeInTheDocument()
    })
  })

  it('renders customer table with customers', async () => {
    mockGetCustomers.mockResolvedValue([
      { id: '1', name: 'John Doe', phone: '9876543210', created: '' },
      { id: '2', name: 'Jane Smith', phone: '9876543211', created: '' },
    ])

    renderWithRouter(<CustomersPage />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    expect(screen.getByText('9876543210')).toBeInTheDocument()
    expect(screen.getByText('9876543211')).toBeInTheDocument()
  })

  it('shows customer count', async () => {
    mockGetCustomers.mockResolvedValue([
      { id: '1', name: 'John Doe', phone: '9876543210', created: '' },
    ])

    renderWithRouter(<CustomersPage />)

    await waitFor(() => {
      expect(screen.getByText('1 customer')).toBeInTheDocument()
    })
  })

  it('shows customer count plural', async () => {
    mockGetCustomers.mockResolvedValue([
      { id: '1', name: 'John Doe', phone: '9876543210', created: '' },
      { id: '2', name: 'Jane Smith', phone: '9876543211', created: '' },
    ])

    renderWithRouter(<CustomersPage />)

    await waitFor(() => {
      expect(screen.getByText('2 customers')).toBeInTheDocument()
    })
  })

  it('shows Add Customer button', async () => {
    mockGetCustomers.mockResolvedValue([])

    renderWithRouter(<CustomersPage />)

    await waitFor(() => {
      expect(screen.getByText('Add Customer')).toBeInTheDocument()
    })
  })

  it('shows Export CSV button', async () => {
    mockGetCustomers.mockResolvedValue([])

    renderWithRouter(<CustomersPage />)

    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
    })
  })

  it('shows Edit and Delete buttons for each customer', async () => {
    mockGetCustomers.mockResolvedValue([
      { id: '1', name: 'John Doe', phone: '9876543210', created: '' },
    ])

    renderWithRouter(<CustomersPage />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('shows search input when customers exist', async () => {
    mockGetCustomers.mockResolvedValue([
      { id: '1', name: 'John Doe', phone: '9876543210', created: '' },
    ])

    renderWithRouter(<CustomersPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search by name or phone...')).toBeInTheDocument()
    })
  })

  it('does not show search input when no customers', async () => {
    mockGetCustomers.mockResolvedValue([])

    renderWithRouter(<CustomersPage />)

    await waitFor(() => {
      expect(screen.getByText('No customers yet')).toBeInTheDocument()
    })

    expect(screen.queryByPlaceholderText('Search by name or phone...')).not.toBeInTheDocument()
  })

  it('renders Customers page content', async () => {
    mockGetCustomers.mockResolvedValue([])

    renderWithRouter(<CustomersPage />)

    await waitFor(() => {
      expect(screen.getByText('Add Customer')).toBeInTheDocument()
    })
  })
})
