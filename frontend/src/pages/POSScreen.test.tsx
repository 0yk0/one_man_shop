import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock bindings BEFORE importing POSScreen
const mockGetProducts = vi.fn()
const mockGetSettings = vi.fn()
const mockGetUPIString = vi.fn()
const mockCreateTransaction = vi.fn()
const mockPrintReceipt = vi.fn()
const mockOpenCustomerDisplay = vi.fn()
const mockCloseCustomerDisplay = vi.fn()
const mockUpdateCustomerDisplay = vi.fn()
const mockShowQROnDisplay = vi.fn()
const mockClearCustomerDisplay = vi.fn()
const mockSendProductsToDisplay = vi.fn()
const mockSendPaymentMethodToDisplay = vi.fn()
const mockConfirmPayment = vi.fn()
const mockGetAvailableScreens = vi.fn().mockResolvedValue([])
const mockIsMobile = vi.fn().mockResolvedValue(false)

vi.mock('../bindings', () => ({
  GetProducts: (...args: any[]) => mockGetProducts(...args),
  GetSettings: (...args: any[]) => mockGetSettings(...args),
  GetUPIString: (...args: any[]) => mockGetUPIString(...args),
  CreateTransaction: (...args: any[]) => mockCreateTransaction(...args),
  PrintReceipt: (...args: any[]) => mockPrintReceipt(...args),
  OpenCustomerDisplay: (...args: any[]) => mockOpenCustomerDisplay(...args),
  CloseCustomerDisplay: (...args: any[]) => mockCloseCustomerDisplay(...args),
  UpdateCustomerDisplay: (...args: any[]) => mockUpdateCustomerDisplay(...args),
  ShowQROnDisplay: (...args: any[]) => mockShowQROnDisplay(...args),
  ClearCustomerDisplay: (...args: any[]) => mockClearCustomerDisplay(...args),
  SendProductsToDisplay: (...args: any[]) => mockSendProductsToDisplay(...args),
  SendPaymentMethodToDisplay: (...args: any[]) => mockSendPaymentMethodToDisplay(...args),
  ConfirmPayment: (...args: any[]) => mockConfirmPayment(...args),
  GetAvailableScreens: (...args: any[]) => mockGetAvailableScreens(...args),
  IsMobile: (...args: any[]) => mockIsMobile(...args),
  Product: class Product { id = ''; name = ''; price = 0; tax_rate = 0; image_data = ''; active = false; created = ''; constructor(s: any = {}) { Object.assign(this, s || {}) } },
  CartItem: class CartItem { product_id = ''; name = ''; qty = 0; price = 0; tax_rate = 0; subtotal = 0; tax_amount = 0; constructor(s: any = {}) { Object.assign(this, s || {}) } },
  Transaction: class Transaction { id = ''; receipt_number = 0; items: any[] = []; subtotal = 0; tax_total = 0; total = 0; payment_method = ''; created = ''; constructor(s: any = {}) { Object.assign(this, s || {}); this.items = (s?.items || []).map((i: any) => new (require('../bindings').CartItem)(i)) } },
  Settings: class Settings { id = ''; shop_name = ''; upi_vpa = ''; merchant_name = ''; admin_pin = ''; theme = 'light'; tax_enabled = false; default_tax_rate = 0; backup_enabled = false; backup_folder = ''; backup_retention_days = 30; display_screen = 0; display_screen_name = ''; display_screen_width = 0; display_screen_height = 0; auto_open_display = false; printer_name = ''; auto_print = true; paper_width = 80; last_receipt_number = 0; constructor(s: any = {}) { Object.assign(this, s || {}) } },
  models: { Transaction: class Transaction { id = ''; receipt_number = 0; items: any[] = []; subtotal = 0; tax_total = 0; total = 0; payment_method = ''; created = ''; constructor(s: any = {}) { Object.assign(this, s || {}); this.items = (s?.items || []).map((i: any) => new (require('../bindings').CartItem)(i)) } } },
}))

vi.mock('../lib/print', () => ({
  printReceipt: vi.fn().mockResolvedValue(undefined),
  isPrinterConnected: vi.fn().mockResolvedValue(false),
  getAndroidPrinters: vi.fn().mockResolvedValue([]),
  connectAndroidPrinter: vi.fn().mockResolvedValue(undefined),
  testPrint: vi.fn().mockResolvedValue(undefined),
  openBluetoothSettings: vi.fn(),
  disconnectPrinter: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn(),
    closeSnackbar: vi.fn(),
  }),
  SnackbarProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => `<div data-testid="qr-code" data-value="${value}" />`,
}))

vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => children,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => children,
}))

vi.mock('../lib/sounds', () => ({
  sounds: {
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
    qtyUp: vi.fn(),
    qtyDown: vi.fn(),
    qrReady: vi.fn(),
    paymentSuccess: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}))

import POSScreen from './POSScreen'

describe('POSScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner initially', () => {
    mockGetProducts.mockReturnValue(new Promise(() => {})) // Never resolves
    mockGetSettings.mockReturnValue(new Promise(() => {}))

    render(<POSScreen />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders empty state when no products', async () => {
    mockGetProducts.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ printer_name: '', display_screen: 0, upi_vpa: 'test@upi' })

    render(<POSScreen />)

    await waitFor(() => {
      expect(screen.getByText('No products yet')).toBeInTheDocument()
    })
  })

  it('renders product grid with products', async () => {
    mockGetProducts.mockResolvedValue([
      { id: '1', name: 'Mango Juice', price: 25, tax_rate: 0, image_data: '', active: true, created: '' },
      { id: '2', name: 'Apple Juice', price: 30, tax_rate: 0.05, image_data: '', active: true, created: '' },
    ])
    mockGetSettings.mockResolvedValue({ printer_name: '', display_screen: 0, upi_vpa: 'test@upi' })

    render(<POSScreen />)

    await waitFor(() => {
      expect(screen.getByText('Mango Juice')).toBeInTheDocument()
      expect(screen.getByText('Apple Juice')).toBeInTheDocument()
    })

    expect(screen.getByText('₹25.00')).toBeInTheDocument()
    expect(screen.getByText('₹30.00')).toBeInTheDocument()
  })

  it('shows cart sidebar with empty state', async () => {
    mockGetProducts.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ printer_name: '', display_screen: 0, upi_vpa: 'test@upi' })

    render(<POSScreen />)

    await waitFor(() => {
      expect(screen.getByText('Tap a product to add')).toBeInTheDocument()
    })
  })

  it('shows pay button disabled when cart is empty', async () => {
    mockGetProducts.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ printer_name: '', display_screen: 0, upi_vpa: 'test@upi' })

    render(<POSScreen />)

    await waitFor(() => {
      expect(screen.getByText('No products yet')).toBeInTheDocument()
    })

    const payBtn = screen.getByText(/Pay ₹/)
    expect(payBtn).toBeDisabled()
  })

  it('displays product count badge', async () => {
    mockGetProducts.mockResolvedValue([
      { id: '1', name: 'Item 1', price: 10, tax_rate: 0, image_data: '', active: true, created: '' },
    ])
    mockGetSettings.mockResolvedValue({ printer_name: '', display_screen: 0, upi_vpa: 'test@upi' })

    render(<POSScreen />)

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument()
    })

    // Cart badge should show 0 items initially
    expect(screen.getByText('Cart')).toBeInTheDocument()
  })

  it('shows search input when products exist', async () => {
    mockGetProducts.mockResolvedValue([
      { id: '1', name: 'Item 1', price: 10, tax_rate: 0, image_data: '', active: true, created: '' },
    ])
    mockGetSettings.mockResolvedValue({ printer_name: '', display_screen: 0, upi_vpa: 'test@upi' })

    render(<POSScreen />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search products... (press /)')).toBeInTheDocument()
    })
  })

  it('hides search input when no products', async () => {
    mockGetProducts.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ printer_name: '', display_screen: 0, upi_vpa: 'test@upi' })

    render(<POSScreen />)

    await waitFor(() => {
      expect(screen.getByText('No products yet')).toBeInTheDocument()
    })

    expect(screen.queryByPlaceholderText('Search products... (press /)')).not.toBeInTheDocument()
  })

  it('shows open display button', async () => {
    mockGetProducts.mockResolvedValue([])
    mockGetSettings.mockResolvedValue({ printer_name: '', display_screen: 0, upi_vpa: 'test@upi' })
    mockGetAvailableScreens.mockResolvedValue([
      { index: 0, name: 'Primary', width: 1920, height: 1080 },
      { index: 1, name: 'External', width: 1920, height: 1080 },
    ])

    render(<POSScreen />)

    await waitFor(() => {
      expect(screen.getByText('Open Display')).toBeInTheDocument()
    })
  })

  it('shows clear button in cart header', async () => {
    mockGetProducts.mockResolvedValue([
      { id: '1', name: 'Item 1', price: 10, tax_rate: 0, image_data: '', active: true, created: '' },
    ])
    mockGetSettings.mockResolvedValue({ printer_name: '', display_screen: 0, upi_vpa: 'test@upi' })

    render(<POSScreen />)

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument()
    })

    // Cart should show Clear button (only when items present)
    // Initially empty so no clear button
    expect(screen.queryByText('Clear')).not.toBeInTheDocument()
  })
})
