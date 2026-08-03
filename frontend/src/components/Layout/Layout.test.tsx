import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock bindings
const mockGetSettings = vi.fn()
const mockSaveSettings = vi.fn()
const mockIsSetupComplete = vi.fn()

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: mockGetSettings(),
    loading: false,
    error: null,
    load: vi.fn(),
    save: mockSaveSettings,
  }),
}))

vi.mock('../../bindings', () => ({
  GetSettings: (...args: any[]) => mockGetSettings(...args),
  SaveSettings: (...args: any[]) => mockSaveSettings(...args),
  IsSetupComplete: (...args: any[]) => mockIsSetupComplete(...args),
  Product: class Product { id = ''; name = ''; price = 0; tax_rate = 0; image_data = ''; active = false; created = '' },
  CartItem: class CartItem { product_id = ''; name = ''; qty = 0; price = 0; tax_rate = 0; subtotal = 0; tax_amount = 0 },
  Transaction: class Transaction { id = ''; items: any[] = []; subtotal = 0; tax_total = 0; total = 0; payment_method = ''; created = '' },
  Settings: class Settings {
    id = ''; shop_name = ''; upi_vpa = ''; merchant_name = ''; admin_pin = ''; theme = 'light'
    tax_enabled = false; default_tax_rate = 0; backup_enabled = false
    backup_folder = ''; backup_retention_days = 30; display_screen = 0
    constructor(s: any = {}) { Object.assign(this, s || {}) }
  },
  ReportSummary: class ReportSummary { date = ''; total_transactions = 0; total_revenue = 0; total_tax = 0; upi_transactions = 0; cash_transactions = 0 },
  models: {},
}))

// Mock @wailsio/runtime
vi.mock('@wailsio/runtime', () => ({
  Browser: { OpenURL: vi.fn() },
}))

import Layout from './Layout'

describe('Layout - PIN gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all nav items', () => {
    mockGetSettings.mockReturnValue({ admin_pin: '', shop_name: 'Test Shop' })

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )

    expect(screen.getByText('POS')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders shop name', () => {
    mockGetSettings.mockReturnValue({ admin_pin: '', shop_name: 'My Shop' })

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )

    expect(screen.getByText('My Shop')).toBeInTheDocument()
  })

  it('renders version and credits', () => {
    mockGetSettings.mockReturnValue({ admin_pin: '', shop_name: 'Test' })

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )

    expect(screen.getByText('v0.1.0')).toBeInTheDocument()
    expect(screen.getByText(/Made by/)).toBeInTheDocument()
  })

  it('shows PIN modal when clicking Products with admin_pin set', () => {
    mockGetSettings.mockReturnValue({ admin_pin: '123456', shop_name: 'Test' })

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('Products'))

    expect(screen.getByText('Enter Admin PIN')).toBeInTheDocument()
  })

  it('shows PIN modal when clicking Reports with admin_pin set', () => {
    mockGetSettings.mockReturnValue({ admin_pin: '123456', shop_name: 'Test' })

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('Reports'))

    expect(screen.getByText('Enter Admin PIN')).toBeInTheDocument()
  })

  it('shows PIN modal when clicking Settings with admin_pin set', () => {
    mockGetSettings.mockReturnValue({ admin_pin: '123456', shop_name: 'Test' })

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('Settings'))

    expect(screen.getByText('Enter Admin PIN')).toBeInTheDocument()
  })

  it('does not show PIN modal when clicking POS', () => {
    mockGetSettings.mockReturnValue({ admin_pin: '123456', shop_name: 'Test' })

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('POS'))

    expect(screen.queryByText('Enter Admin PIN')).not.toBeInTheDocument()
  })

  it('collapse and expand toggles work', () => {
    mockGetSettings.mockReturnValue({ admin_pin: '', shop_name: 'Test' })

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    )

    // Initially expanded - shop name visible
    expect(screen.getByText('Test')).toBeInTheDocument()

    // Collapse
    fireEvent.click(screen.getByTitle('Collapse sidebar'))

    // After collapse, shop name should not be visible
    expect(screen.queryByText('Test')).not.toBeInTheDocument()

    // Expand
    fireEvent.click(screen.getByTitle('Expand sidebar'))

    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
