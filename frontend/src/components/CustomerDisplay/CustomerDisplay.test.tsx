import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Use vi.hoisted() to declare variables that are available in vi.mock factories
const { mockState, mockUseDisplayStoreFn } = vi.hoisted(() => {
  const mockState: Record<string, any> = {
    view: 'menu',
    shop_name: 'Shop',
    products: [],
    cart_items: [],
    total: 0,
    tax: 0,
    payment_method: '',
    upi_string: '',
    theme: 'light',
  }

  const mockUseDisplayStoreFn = vi.fn((selectorOrFn?: any) => {
    if (typeof selectorOrFn === 'function') return selectorOrFn(mockState)
    return mockState
  })

  return { mockState, mockUseDisplayStoreFn }
})

vi.mock('../../stores/displayStore', () => ({
  useDisplayStore: Object.assign(mockUseDisplayStoreFn, {
    getState: () => mockState,
    setState: (s: any) => Object.assign(mockState, s),
    subscribe: vi.fn(),
  }),
  useSyncDisplayState: vi.fn(),
}))

// Mock qrcode.react
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value, size }: { value: string; size: number }) => (
    <div data-testid="qr-code" data-value={value} data-size={size} />
  ),
}))

import CustomerDisplay from './CustomerDisplay'
import { useSyncDisplayState } from '../../stores/displayStore'

describe('CustomerDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(mockState, {
      view: 'menu',
      shop_name: 'Shop',
      products: [],
      cart_items: [],
      total: 0,
      tax: 0,
      payment_method: '',
      upi_string: '',
      theme: 'light',
    })
  })

  function setStoreState(state: Partial<typeof mockState>) {
    Object.assign(mockState, state)
  }

  it('calls useSyncDisplayState on mount', () => {
    setStoreState({})
    render(<CustomerDisplay />)
    expect(useSyncDisplayState).toHaveBeenCalled()
  })

  it('renders shop name in menu view', () => {
    setStoreState({ view: 'menu', shop_name: 'Fresh Juices' })
    render(<CustomerDisplay />)
    // Shop name appears in all 3 views (all in DOM with absolute positioning)
    const elements = screen.getAllByText('Fresh Juices')
    expect(elements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders Menu heading in menu view', () => {
    setStoreState({ view: 'menu' })
    render(<CustomerDisplay />)
    expect(screen.getByText('Menu')).toBeInTheDocument()
  })

  it('renders products in menu view', () => {
    setStoreState({
      view: 'menu',
      products: [
        { id: '1', name: 'Mango Juice', price: 25 },
        { id: '2', name: 'Orange Juice', price: 30 },
      ],
    })
    render(<CustomerDisplay />)
    expect(screen.getByText('Mango Juice')).toBeInTheDocument()
    expect(screen.getByText('Orange Juice')).toBeInTheDocument()
    expect(screen.getByText('₹25')).toBeInTheDocument()
    expect(screen.getByText('₹30')).toBeInTheDocument()
  })

  it('renders empty menu when no products', () => {
    setStoreState({ view: 'menu', products: [] })
    render(<CustomerDisplay />)
    expect(screen.getByText('Menu')).toBeInTheDocument()
  })

  it('renders bill view with cart items', () => {
    setStoreState({
      view: 'bill',
      cart_items: [
        { product_id: '1', name: 'Mango Juice', qty: 2, price: 25, subtotal: 50 },
        { product_id: '2', name: 'Orange Juice', qty: 1, price: 30, subtotal: 30 },
      ],
      total: 80,
      tax: 0,
      payment_method: '',
    })
    render(<CustomerDisplay />)
    // Items appear in the bill view's scrollable area
    expect(screen.getAllByText('Mango Juice').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Orange Juice').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('₹50.00')).toBeInTheDocument()
    expect(screen.getByText('₹30.00')).toBeInTheDocument()
  })

  it('shows total in bill view', () => {
    setStoreState({
      view: 'bill',
      cart_items: [],
      total: 100,
      tax: 10,
      payment_method: '',
    })
    render(<CustomerDisplay />)
    expect(screen.getByText('TOTAL')).toBeInTheDocument()
    // ₹110.00 appears in bill total and potentially thankyou view
    const amounts = screen.getAllByText('₹110.00')
    expect(amounts.length).toBeGreaterThanOrEqual(1)
  })

  it('shows tax line when tax > 0', () => {
    setStoreState({
      view: 'bill',
      cart_items: [],
      total: 100,
      tax: 10,
      payment_method: '',
    })
    render(<CustomerDisplay />)
    expect(screen.getByText('Tax')).toBeInTheDocument()
    expect(screen.getByText('₹10.00')).toBeInTheDocument()
  })

  it('hides tax line when tax is 0', () => {
    setStoreState({
      view: 'bill',
      cart_items: [],
      total: 100,
      tax: 0,
      payment_method: '',
    })
    render(<CustomerDisplay />)
    expect(screen.queryByText('Tax')).not.toBeInTheDocument()
  })

  it('shows COLLECT CASH for cash payment', () => {
    setStoreState({
      view: 'bill',
      cart_items: [],
      total: 100,
      tax: 0,
      payment_method: 'cash',
    })
    render(<CustomerDisplay />)
    expect(screen.getByText('COLLECT CASH')).toBeInTheDocument()
  })

  it('shows QR code for UPI payment', () => {
    setStoreState({
      view: 'bill',
      cart_items: [],
      total: 100,
      tax: 0,
      payment_method: 'upi',
      upi_string: 'upi://pay?pa=test@upi&pn=Test',
    })
    render(<CustomerDisplay />)
    expect(screen.getByText('Scan to Pay')).toBeInTheDocument()
    const qr = screen.getByTestId('qr-code')
    expect(qr).toHaveAttribute('data-value', 'upi://pay?pa=test@upi&pn=Test')
  })

  it('shows AWAITING PAYMENT when no payment method', () => {
    setStoreState({
      view: 'bill',
      cart_items: [],
      total: 100,
      tax: 0,
      payment_method: '',
    })
    render(<CustomerDisplay />)
    expect(screen.getByText('AWAITING PAYMENT')).toBeInTheDocument()
  })

  it('renders thank you view', () => {
    setStoreState({
      view: 'thankyou',
      shop_name: 'Fresh Juices',
      total: 100,
      tax: 10,
      payment_method: 'upi',
    })
    render(<CustomerDisplay />)
    expect(screen.getByText('Thank You!')).toBeInTheDocument()
    // Shop name appears in all 3 views
    expect(screen.getAllByText('Fresh Juices').length).toBeGreaterThanOrEqual(1)
  })

  it('shows amount paid in thank you view', () => {
    setStoreState({
      view: 'thankyou',
      shop_name: 'Shop',
      total: 100,
      tax: 10,
      payment_method: 'upi',
    })
    render(<CustomerDisplay />)
    expect(screen.getByText('Amount Paid')).toBeInTheDocument()
    expect(screen.getAllByText('₹110.00').length).toBeGreaterThanOrEqual(1)
  })

  it('does not show amount paid when total is 0', () => {
    setStoreState({
      view: 'thankyou',
      shop_name: 'Shop',
      total: 0,
      tax: 0,
      payment_method: '',
    })
    render(<CustomerDisplay />)
    expect(screen.queryByText('Amount Paid')).not.toBeInTheDocument()
  })

  it('shows "Powered by" footer in menu view', () => {
    setStoreState({ view: 'menu' })
    render(<CustomerDisplay />)
    // "Powered by One Man Shop POS" appears in both menu and bill views (all always in DOM)
    const poweredBy = screen.getAllByText('Powered by One Man Shop POS')
    expect(poweredBy.length).toBeGreaterThanOrEqual(1)
  })

  it('shows subtotal count in bill view', () => {
    setStoreState({
      view: 'bill',
      cart_items: [
        { product_id: '1', name: 'Item 1', qty: 1, price: 10, subtotal: 10 },
        { product_id: '2', name: 'Item 2', qty: 2, price: 20, subtotal: 40 },
      ],
      total: 50,
      tax: 0,
      payment_method: '',
    })
    render(<CustomerDisplay />)
    expect(screen.getByText('Subtotal (2 items)')).toBeInTheDocument()
  })
})
