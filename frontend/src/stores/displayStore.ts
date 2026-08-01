import { create } from 'zustand'
import { useEffect, useRef } from 'react'

interface DisplayState {
  view: 'menu' | 'bill' | 'thankyou'
  shop_name: string
  products: { id: string; name: string; price: number }[]
  cart_items: { product_id: string; name: string; qty: number; price: number; subtotal: number }[]
  total: number
  tax: number
  payment_method: string
  upi_string: string
  theme: string
}

// Zustand store for customer display state
export const useDisplayStore = create<DisplayState>(() => ({
  view: 'menu',
  shop_name: 'Shop',
  products: [],
  cart_items: [],
  total: 0,
  tax: 0,
  payment_method: '',
  upi_string: '',
  theme: 'light',
}))

// MUST match wsPort in app.go
const WS_PORT = 9246
const WS_URL = `ws://127.0.0.1:${WS_PORT}/ws`
const RECONNECT_DELAY = 1000

// Hook to sync Go state → Zustand via WebSocket
export function useSyncDisplayState() {
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let alive = true

    function connect() {
      if (!alive) return

      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[Display] WebSocket connected')
      }

      ws.onmessage = (event) => {
        try {
          const state = JSON.parse(event.data) as DisplayState
          useDisplayStore.setState(state)
        } catch (e) {
          console.error('[Display] Failed to parse state:', e)
        }
      }

      ws.onclose = () => {
        wsRef.current = null
        if (alive) {
          console.log('[Display] WebSocket disconnected, reconnecting...')
          setTimeout(connect, RECONNECT_DELAY)
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      alive = false
      wsRef.current?.close()
    }
  }, [])
}
