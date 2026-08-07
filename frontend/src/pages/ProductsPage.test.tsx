import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock bindings BEFORE importing ProductsPage
const mockGetProducts = vi.fn()
const mockCreateProduct = vi.fn()
const mockUpdateProduct = vi.fn()
const mockDeleteProduct = vi.fn()
const mockGetSettings = vi.fn()
const mockIsMobile = vi.fn().mockResolvedValue(false)

vi.mock('../bindings', () => ({
  GetProducts: (...args: any[]) => mockGetProducts(...args),
  CreateProduct: (...args: any[]) => mockCreateProduct(...args),
  UpdateProduct: (...args: any[]) => mockUpdateProduct(...args),
  DeleteProduct: (...args: any[]) => mockDeleteProduct(...args),
  GetSettings: (...args: any[]) => mockGetSettings(...args),
  IsMobile: (...args: any[]) => mockIsMobile(...args),
  Product: class Product { id = ''; name = ''; price = 0; tax_rate = 0; image_data = ''; active = false; created = ''; constructor(s: any = {}) { Object.assign(this, s || {}) } },
  CartItem: class CartItem { product_id = ''; name = ''; qty = 0; price = 0; tax_rate = 0; subtotal = 0; tax_amount = 0 },
  Transaction: class Transaction { id = ''; items: any[] = []; subtotal = 0; tax_total = 0; total = 0; payment_method = ''; created = '' },
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

vi.mock('../lib/sounds', () => ({
  sounds: {
    create: vi.fn(),
    delete: vi.fn(),
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
  },
}))

import ProductsPage from './ProductsPage'

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner initially', () => {
    mockGetProducts.mockReturnValue(new Promise(() => {}))
    mockGetSettings.mockReturnValue(new Promise(() => {}))

    render(<ProductsPage />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders empty state when no products', async () => {
    mockGetProducts.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('No products yet')).toBeInTheDocument()
    })
    expect(screen.getByText('Click "Add Product" to get started')).toBeInTheDocument()
  })

  it('renders product table with products', async () => {
    mockGetProducts.mockResolvedValue([
      { id: '1', name: 'Mango Juice', price: 25, tax_rate: 0, image_data: '', active: true, created: '' },
      { id: '2', name: 'Apple Juice', price: 30, tax_rate: 0.05, image_data: '', active: true, created: '' },
    ])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('Mango Juice')).toBeInTheDocument()
      expect(screen.getByText('Apple Juice')).toBeInTheDocument()
    })

    expect(screen.getByText('₹25.00')).toBeInTheDocument()
    expect(screen.getByText('₹30.00')).toBeInTheDocument()
  })

  it('shows product count', async () => {
    mockGetProducts.mockResolvedValue([
      { id: '1', name: 'Item 1', price: 10, tax_rate: 0, image_data: '', active: true, created: '' },
    ])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('1 of 50 products')).toBeInTheDocument()
    })
  })

  it('shows Add Product button', async () => {
    mockGetProducts.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('Add Product')).toBeInTheDocument()
    })
  })

  it('shows Edit and Delete buttons for each product', async () => {
    mockGetProducts.mockResolvedValue([
      { id: '1', name: 'Item 1', price: 10, tax_rate: 0, image_data: '', active: true, created: '' },
    ])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument()
    })

    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('shows tax column when tax is enabled', async () => {
    mockGetProducts.mockResolvedValue([
      { id: '1', name: 'Item 1', price: 100, tax_rate: 0.18, image_data: '', active: true, created: '' },
    ])
    mockGetSettings.mockResolvedValue({ tax_enabled: true })

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument()
    })

    // Should show tax rate column header
    expect(screen.getByText('Tax Rate')).toBeInTheDocument()
    expect(screen.getByText('18.0%')).toBeInTheDocument()
  })

  it('hides tax column when tax is disabled', async () => {
    mockGetProducts.mockResolvedValue([
      { id: '1', name: 'Item 1', price: 100, tax_rate: 0.18, image_data: '', active: true, created: '' },
    ])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument()
    })

    expect(screen.queryByText('Tax Rate')).not.toBeInTheDocument()
  })

  it('renders Products page content', async () => {
    mockGetProducts.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ tax_enabled: false })

    render(<ProductsPage />)

    await waitFor(() => {
      expect(screen.getByText('Add Product')).toBeInTheDocument()
    })
  })
})
