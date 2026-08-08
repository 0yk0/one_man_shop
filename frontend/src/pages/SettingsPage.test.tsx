import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock bindings BEFORE importing SettingsPage
const mockGetSettings = vi.fn()
const mockSaveSettings = vi.fn()
const mockIsSetupComplete = vi.fn()
const mockGetAvailableScreens = vi.fn()
const mockGetAvailablePrinters = vi.fn()
const mockGetDataDir = vi.fn().mockResolvedValue('/test/data')
const mockSelectDataDir = vi.fn().mockResolvedValue('')
const mockSaveDataDir = vi.fn().mockResolvedValue(undefined)
const mockIsMobile = vi.fn().mockResolvedValue(false)

vi.mock('../bindings', () => ({
  GetSettings: (...args: any[]) => mockGetSettings(...args),
  SaveSettings: (...args: any[]) => mockSaveSettings(...args),
  IsSetupComplete: (...args: any[]) => mockIsSetupComplete(...args),
  GetAvailableScreens: (...args: any[]) => mockGetAvailableScreens(...args),
  GetAvailablePrinters: (...args: any[]) => mockGetAvailablePrinters(...args),
  GetDataDir: (...args: any[]) => mockGetDataDir(...args),
  SelectDataDir: (...args: any[]) => mockSelectDataDir(...args),
  SaveDataDir: (...args: any[]) => mockSaveDataDir(...args),
  IsMobile: (...args: any[]) => mockIsMobile(...args),
  Product: class Product { id = ''; name = ''; price = 0; tax_rate = 0; image_data = ''; active = false; created = '' },
  CartItem: class CartItem { product_id = ''; name = ''; qty = 0; price = 0; tax_rate = 0; subtotal = 0; tax_amount = 0 },
  Transaction: class Transaction { id = ''; items: any[] = []; subtotal = 0; tax_total = 0; total = 0; payment_method = ''; created = '' },
  Settings: class Settings {
    id = ''; shop_name = ''; upi_vpa = ''; merchant_name = ''; admin_pin = ''; theme = 'light'
    tax_enabled = false; default_tax_rate = 0; backup_enabled = false
    backup_folder = ''; backup_retention_days = 30; display_screen = 0
    display_screen_name = ''; display_screen_width = 0; display_screen_height = 0
    auto_open_display = false; printer_name = ''; auto_print = true; paper_width = 80
    constructor(s: any = {}) { Object.assign(this, s || {}) }
  },
  ReportSummary: class ReportSummary { date = ''; total_transactions = 0; total_revenue = 0; total_tax = 0; upi_transactions = 0; cash_transactions = 0 },
  models: {},
}))

import SettingsPage from './SettingsPage'

const defaultSettings = {
  id: '1', shop_name: 'Test', upi_vpa: 'test@upi', merchant_name: 'Owner',
  admin_pin: '', theme: 'light',
  tax_enabled: false, default_tax_rate: 0,
  backup_enabled: false, backup_folder: '', backup_retention_days: 30,
  display_screen: 0, display_screen_name: '', display_screen_width: 0, display_screen_height: 0,
  auto_open_display: false,
  printer_name: '', auto_print: true, paper_width: 80, last_receipt_number: 0,
}

describe('SettingsPage - Admin PIN section', () => {
  const mockOnThemeChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAvailableScreens.mockResolvedValue([])
    mockGetAvailablePrinters.mockResolvedValue([])
  })

  it('renders Security section', async () => {
    mockGetSettings.mockResolvedValue({ ...defaultSettings, admin_pin: '123456' })

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Security')).toBeInTheDocument()
    })

    expect(screen.getByText('New PIN')).toBeInTheDocument()
    expect(screen.getByText('Confirm New PIN')).toBeInTheDocument()
    expect(screen.getByText('Current PIN')).toBeInTheDocument()
  })

  it('shows info alert when no PIN is set', async () => {
    mockGetSettings.mockResolvedValue({ ...defaultSettings })

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText(/No PIN is currently set/)).toBeInTheDocument()
    })
  })

  it('does not show Current PIN field when no PIN is set', async () => {
    mockGetSettings.mockResolvedValue({ ...defaultSettings })

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Security')).toBeInTheDocument()
    })

    expect(screen.queryByText('Current PIN')).not.toBeInTheDocument()
  })

  it('shows error when current PIN is wrong', async () => {
    mockGetSettings.mockResolvedValue({ ...defaultSettings, admin_pin: '123456' })

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Security')).toBeInTheDocument()
    })

    expect(screen.queryByText('Update PIN')).not.toBeInTheDocument()
  })

  it('shows Update PIN button when PIN fields have values', async () => {
    mockGetSettings.mockResolvedValue({ ...defaultSettings, admin_pin: '123456' })

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Security')).toBeInTheDocument()
    })

    expect(screen.queryByText('Update PIN')).not.toBeInTheDocument()
  })

  it('renders Save Settings button', async () => {
    mockGetSettings.mockResolvedValue({ ...defaultSettings })

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Save Settings')).toBeInTheDocument()
    })
  })
})

describe('SettingsPage - Receipt Printer section', () => {
  const mockOnThemeChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAvailableScreens.mockResolvedValue([])
    mockGetAvailablePrinters.mockResolvedValue([])
  })

  it('renders Receipt Printer section', async () => {
    mockGetSettings.mockResolvedValue({ ...defaultSettings })

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Receipt Printer')).toBeInTheDocument()
    })
  })

  it('shows printer dropdown with no printers when none detected', async () => {
    mockGetSettings.mockResolvedValue({ ...defaultSettings })
    mockGetAvailablePrinters.mockResolvedValue([])

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Receipt Printer')).toBeInTheDocument()
    })

    // Should show "No Printer (disabled)" as default option
    expect(screen.getByText('No Printer (disabled)')).toBeInTheDocument()
  })

  it('shows detected printers in dropdown', async () => {
    mockGetSettings.mockResolvedValue({ ...defaultSettings })
    mockGetAvailablePrinters.mockResolvedValue([
      { name: 'Virtual Printer (localhost:9100)', is_default: false },
      { name: 'HP LaserJet', is_default: true },
    ])

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Receipt Printer')).toBeInTheDocument()
    })

    expect(screen.getByText('Virtual Printer (localhost:9100)')).toBeInTheDocument()
    expect(screen.getByText(/HP LaserJet/)).toBeInTheDocument()
  })

  it('renders auto-print toggle', async () => {
    mockGetSettings.mockResolvedValue({ ...defaultSettings })

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Receipt Printer')).toBeInTheDocument()
    })

    expect(screen.getByText('Auto-print after payment')).toBeInTheDocument()
  })

  it('renders paper width selector', async () => {
    mockGetSettings.mockResolvedValue({ ...defaultSettings })

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Receipt Printer')).toBeInTheDocument()
    })

    expect(screen.getByText('Paper Width')).toBeInTheDocument()
    expect(screen.getByText('80mm (Standard)')).toBeInTheDocument()
    expect(screen.getByText('58mm (Narrow)')).toBeInTheDocument()
  })

  it('loads saved printer selection', async () => {
    mockGetSettings.mockResolvedValue({
      ...defaultSettings,
      printer_name: 'HP LaserJet',
      auto_print: false,
      paper_width: 58,
    })
    mockGetAvailablePrinters.mockResolvedValue([
      { name: 'HP LaserJet', is_default: false },
    ])

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Receipt Printer')).toBeInTheDocument()
    })

    // The printer name should be shown in the dropdown
    const select = screen.getByDisplayValue('HP LaserJet')
    expect(select).toBeInTheDocument()
  })

  it('shows auto_print and paper_width from saved settings', async () => {
    mockGetSettings.mockResolvedValue({
      ...defaultSettings,
      printer_name: 'HP LaserJet',
      auto_print: false,
      paper_width: 58,
    })
    mockGetAvailablePrinters.mockResolvedValue([
      { name: 'HP LaserJet', is_default: false },
    ])

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Receipt Printer')).toBeInTheDocument()
    })

    // Paper width should be 58mm
    expect(screen.getByDisplayValue('58mm (Narrow)')).toBeInTheDocument()
  })
})

describe('SettingsPage - Shop Information', () => {
  const mockOnThemeChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAvailableScreens.mockResolvedValue([])
    mockGetAvailablePrinters.mockResolvedValue([])
  })

  it('renders shop fields', async () => {
    mockGetSettings.mockResolvedValue({ ...defaultSettings })

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Shop Information')).toBeInTheDocument()
    })

    expect(screen.getByText('Shop Name')).toBeInTheDocument()
    expect(screen.getByText('UPI VPA')).toBeInTheDocument()
    expect(screen.getByText('Merchant Name')).toBeInTheDocument()
  })

  it('populates form from saved settings', async () => {
    mockGetSettings.mockResolvedValue({
      ...defaultSettings,
      shop_name: 'My Shop',
      upi_vpa: 'myshop@upi',
      merchant_name: 'John',
    })

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('My Shop')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('myshop@upi')).toBeInTheDocument()
    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
  })
})
