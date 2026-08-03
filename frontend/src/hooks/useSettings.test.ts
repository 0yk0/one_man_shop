import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// Mock bindings BEFORE importing useSettings
const mockGetSettings = vi.fn()
const mockSaveSettings = vi.fn()
const mockIsSetupComplete = vi.fn()

vi.mock('../bindings', () => ({
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

import { useSettings, useSetupStatus } from './useSettings'
import { Settings } from '../bindings'

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads settings on mount', async () => {
    const mockSettings = new Settings({
      id: '1',
      shop_name: 'Test Shop',
      upi_vpa: 'test@upi',
      theme: 'dark',
    })
    mockGetSettings.mockResolvedValue(mockSettings)

    const { result } = renderHook(() => useSettings())

    expect(result.current.loading).toBe(true)
    expect(result.current.settings).toBeNull()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.settings).toBeDefined()
    expect(result.current.settings?.shop_name).toBe('Test Shop')
    expect(result.current.settings?.upi_vpa).toBe('test@upi')
    expect(result.current.error).toBeNull()
  })

  it('handles error on load', async () => {
    mockGetSettings.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSettings())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Error: Network error')
    expect(result.current.settings).toBeNull()
  })

  it('save updates state', async () => {
    const initialSettings = new Settings({ id: '1', shop_name: 'Initial', upi_vpa: '' })
    mockGetSettings.mockResolvedValue(initialSettings)
    mockSaveSettings.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSettings())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // After save, GetSettings is called again to confirm persisted state
    const confirmedSettings = new Settings({ id: '1', shop_name: 'Updated Shop', upi_vpa: '' })
    mockGetSettings.mockResolvedValue(confirmedSettings)

    const newSettings = new Settings({ ...initialSettings, shop_name: 'Updated Shop' })
    const success = await result.current.save(newSettings)

    expect(success).toBe(true)
    await waitFor(() => {
      expect(result.current.settings?.shop_name).toBe('Updated Shop')
    })
    expect(mockSaveSettings).toHaveBeenCalledWith(newSettings)
  })

  it('handles save error', async () => {
    const initialSettings = new Settings({ id: '1', shop_name: 'Test' })
    mockGetSettings.mockResolvedValue(initialSettings)
    mockSaveSettings.mockRejectedValue(new Error('Save failed'))

    const { result } = renderHook(() => useSettings())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const success = await result.current.save(initialSettings)

    expect(success).toBe(false)
    await waitFor(() => {
      expect(result.current.error).toBe('Error: Save failed')
    })
  })

  it('can reload settings', async () => {
    const mockSettings = new Settings({ id: '1', shop_name: 'Test Shop' })
    mockGetSettings.mockResolvedValue(mockSettings)

    const { result } = renderHook(() => useSettings())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await result.current.load()

    expect(mockGetSettings).toHaveBeenCalledTimes(2)
  })
})

describe('useSetupStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('checks setup status on mount', async () => {
    mockIsSetupComplete.mockResolvedValue(true)

    const { result } = renderHook(() => useSetupStatus())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isComplete).toBe(true)
  })

  it('returns false when setup is not complete', async () => {
    mockIsSetupComplete.mockResolvedValue(false)

    const { result } = renderHook(() => useSetupStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isComplete).toBe(false)
  })

  it('handles error gracefully', async () => {
    mockIsSetupComplete.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSetupStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isComplete).toBe(false)
  })

  it('can recheck status', async () => {
    mockIsSetupComplete.mockResolvedValue(true)

    const { result } = renderHook(() => useSetupStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await result.current.check()

    expect(mockIsSetupComplete).toHaveBeenCalledTimes(2)
  })
})
