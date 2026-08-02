import { describe, it, expect, beforeEach } from 'vitest'
import { useDisplayStore } from './displayStore'

describe('useDisplayStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useDisplayStore.setState({
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

  it('has correct initial state', () => {
    const state = useDisplayStore.getState()
    expect(state.view).toBe('menu')
    expect(state.shop_name).toBe('Shop')
    expect(state.products).toEqual([])
    expect(state.cart_items).toEqual([])
    expect(state.total).toBe(0)
    expect(state.tax).toBe(0)
    expect(state.payment_method).toBe('')
    expect(state.upi_string).toBe('')
    expect(state.theme).toBe('light')
  })

  it('updates state from WebSocket payload', () => {
    const newState = {
      view: 'bill' as const,
      shop_name: 'My Shop',
      products: [{ id: '1', name: 'Product 1', price: 10 }],
      cart_items: [{ product_id: '1', name: 'Product 1', qty: 2, price: 10, subtotal: 20 }],
      total: 20,
      tax: 2,
      payment_method: 'upi',
      upi_string: 'upi://pay?pa=test@upi',
      theme: 'dark',
    }

    useDisplayStore.setState(newState)

    const state = useDisplayStore.getState()
    expect(state.view).toBe('bill')
    expect(state.shop_name).toBe('My Shop')
    expect(state.products).toHaveLength(1)
    expect(state.cart_items).toHaveLength(1)
    expect(state.total).toBe(20)
    expect(state.tax).toBe(2)
    expect(state.payment_method).toBe('upi')
    expect(state.upi_string).toBe('upi://pay?pa=test@upi')
    expect(state.theme).toBe('dark')
  })

  it('merges multiple setState calls correctly', () => {
    useDisplayStore.setState({ shop_name: 'Updated Shop' })
    useDisplayStore.setState({ theme: 'dark' })
    useDisplayStore.setState({ total: 100 })

    const state = useDisplayStore.getState()
    expect(state.shop_name).toBe('Updated Shop')
    expect(state.theme).toBe('dark')
    expect(state.total).toBe(100)
    // Other fields should remain unchanged
    expect(state.view).toBe('menu')
    expect(state.payment_method).toBe('')
  })

  it('handles thank you view', () => {
    useDisplayStore.setState({ view: 'thankyou' })

    const state = useDisplayStore.getState()
    expect(state.view).toBe('thankyou')
  })
})
