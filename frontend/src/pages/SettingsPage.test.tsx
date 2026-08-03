import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock bindings BEFORE importing SettingsPage
const mockGetSettings = vi.fn()
const mockSaveSettings = vi.fn()
const mockIsSetupComplete = vi.fn()
const mockGetAvailableScreens = vi.fn()

vi.mock('../bindings', () => ({
  GetSettings: (...args: any[]) => mockGetSettings(...args),
  SaveSettings: (...args: any[]) => mockSaveSettings(...args),
  IsSetupComplete: (...args: any[]) => mockIsSetupComplete(...args),
  GetAvailableScreens: (...args: any[]) => mockGetAvailableScreens(...args),
  Product: class Product { id = ''; name = ''; price = 0; tax_rate = 0; image_data = ''; active = false; created = '' },
  CartItem: class CartItem { product_id = ''; name = ''; qty = 0; price = 0; tax_rate = 0; subtotal = 0; tax_amount = 0 },
  Transaction: class Transaction { id = ''; items: any[] = []; subtotal = 0; tax_total = 0; total = 0; payment_method = ''; created = '' },
  Settings: class Settings {
    id = ''; shop_name = ''; upi_vpa = ''; merchant_name = ''; admin_pin = ''; theme = 'light'
    tax_enabled = false; default_tax_rate = 0; backup_enabled = false
    backup_folder = ''; backup_retention_days = 30; display_screen = 0
    display_screen_name = ''; display_screen_width = 0; display_screen_height = 0
    constructor(s: any = {}) { Object.assign(this, s || {}) }
  },
  ReportSummary: class ReportSummary { date = ''; total_transactions = 0; total_revenue = 0; total_tax = 0; upi_transactions = 0; cash_transactions = 0 },
  models: {},
}))

import SettingsPage from './SettingsPage'

describe('SettingsPage - Admin PIN section', () => {
  const mockOnThemeChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAvailableScreens.mockResolvedValue([])
  })

  it('renders Security section', async () => {
    mockGetSettings.mockResolvedValue({
      id: '1', shop_name: 'Test', upi_vpa: 'test@upi', merchant_name: 'Owner',
      admin_pin: '123456', theme: 'light',
      tax_enabled: false, default_tax_rate: 0,
      backup_enabled: false, backup_folder: '', backup_retention_days: 30,
      display_screen: 0, display_screen_name: '', display_screen_width: 0, display_screen_height: 0,
    })

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Security')).toBeInTheDocument()
    })

    expect(screen.getByText('New PIN')).toBeInTheDocument()
    expect(screen.getByText('Confirm New PIN')).toBeInTheDocument()
    expect(screen.getByText('Current PIN')).toBeInTheDocument()
  })

  it('shows info alert when no PIN is set', async () => {
    mockGetSettings.mockResolvedValue({
      id: '1', shop_name: 'Test', upi_vpa: 'test@upi', merchant_name: 'Owner',
      admin_pin: '', theme: 'light',
      tax_enabled: false, default_tax_rate: 0,
      backup_enabled: false, backup_folder: '', backup_retention_days: 30,
      display_screen: 0, display_screen_name: '', display_screen_width: 0, display_screen_height: 0,
    })

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText(/No PIN is currently set/)).toBeInTheDocument()
    })
  })

  it('does not show Current PIN field when no PIN is set', async () => {
    mockGetSettings.mockResolvedValue({
      id: '1', shop_name: 'Test', upi_vpa: 'test@upi', merchant_name: 'Owner',
      admin_pin: '', theme: 'light',
      tax_enabled: false, default_tax_rate: 0,
      backup_enabled: false, backup_folder: '', backup_retention_days: 30,
      display_screen: 0, display_screen_name: '', display_screen_width: 0, display_screen_height: 0,
    })

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Security')).toBeInTheDocument()
    })

    expect(screen.queryByText('Current PIN')).not.toBeInTheDocument()
  })

  it('shows error when current PIN is wrong', async () => {
    mockGetSettings.mockResolvedValue({
      id: '1', shop_name: 'Test', upi_vpa: 'test@upi', merchant_name: 'Owner',
      admin_pin: '123456', theme: 'light',
      tax_enabled: false, default_tax_rate: 0,
      backup_enabled: false, backup_folder: '', backup_retention_days: 30,
      display_screen: 0, display_screen_name: '', display_screen_width: 0, display_screen_height: 0,
    })

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Security')).toBeInTheDocument()
    })

    // The Update PIN button should not be visible yet
    expect(screen.queryByText('Update PIN')).not.toBeInTheDocument()
  })

  it('shows Update PIN button when PIN fields have values', async () => {
    mockGetSettings.mockResolvedValue({
      id: '1', shop_name: 'Test', upi_vpa: 'test@upi', merchant_name: 'Owner',
      admin_pin: '123456', theme: 'light',
      tax_enabled: false, default_tax_rate: 0,
      backup_enabled: false, backup_folder: '', backup_retention_days: 30,
      display_screen: 0, display_screen_name: '', display_screen_width: 0, display_screen_height: 0,
    })

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Security')).toBeInTheDocument()
    })

    // Update PIN button should not be visible initially
    expect(screen.queryByText('Update PIN')).not.toBeInTheDocument()
  })

  it('renders Save Settings button', async () => {
    mockGetSettings.mockResolvedValue({
      id: '1', shop_name: 'Test', upi_vpa: 'test@upi', merchant_name: 'Owner',
      admin_pin: '', theme: 'light',
      tax_enabled: false, default_tax_rate: 0,
      backup_enabled: false, backup_folder: '', backup_retention_days: 30,
      display_screen: 0, display_screen_name: '', display_screen_width: 0, display_screen_height: 0,
    })

    render(<SettingsPage currentTheme="light" onThemeChange={mockOnThemeChange} />)

    await waitFor(() => {
      expect(screen.getByText('Save Settings')).toBeInTheDocument()
    })
  })
})
