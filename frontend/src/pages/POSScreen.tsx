import { useState, useEffect, useCallback, useRef } from 'react'
import {
  GetProducts, GetSettings, GetUPIString, CreateTransaction,
  OpenCustomerDisplay, CloseCustomerDisplay, UpdateCustomerDisplay,
  ShowQROnDisplay, ClearCustomerDisplay, SendProductsToDisplay,
  SendPaymentMethodToDisplay, ConfirmPayment
} from '../bindings'
import { models } from '../bindings'
import { useSnackbar } from 'notistack'
import { QRCodeSVG } from 'qrcode.react'
import {
  ShoppingCart, Minus, Plus, Trash2, ArrowLeft, CheckCircle, Loader2,
  Receipt, Monitor, MonitorOff, RefreshCw, Search, X
} from 'lucide-react'

type Product = import("../bindings").Product
type CartItem = import("../bindings").CartItem
type Settings = import("../bindings").Settings

export default function POSScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi')
  const [upiString, setUpiString] = useState('')
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const { enqueueSnackbar } = useSnackbar()
  const processingRef = useRef(false)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [displayOpen, setDisplayOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [tappedId, setTappedId] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [prods, sett] = await Promise.all([GetProducts(), GetSettings()])
      setProducts(prods)
      setSettings(sett)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => { if (clearTimerRef.current) clearTimeout(clearTimerRef.current) }
  }, [])

  const filteredProducts = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products

  const cartQtyMap: Record<string, number> = {}
  for (const item of cart) {
    cartQtyMap[item.product_id] = item.qty
  }

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const taxTotal = cart.reduce((sum, item) => sum + item.tax_amount, 0)
  const total = subtotal + taxTotal

  // ========== Keyboard shortcuts ==========
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'

      // / — focus search
      if (e.key === '/' && !isInput) {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      // Escape — clear search or go back from payment
      if (e.key === 'Escape') {
        if (search) {
          setSearch('')
          searchInputRef.current?.blur()
        } else if (showPayment && !completed) {
          setShowPayment(false)
          setUpiString('')
        }
        return
      }

      // Skip remaining shortcuts if typing in an input or in payment view
      if (isInput || showPayment || completed) return
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [search, showPayment, completed, filteredProducts])

  // ========== Display ==========
  const toggleDisplay = async () => {
    try {
      if (displayOpen) {
        CloseCustomerDisplay()
        setDisplayOpen(false)
        setCart([])
        setShowPayment(false)
        setCompleted(false)
        setUpiString('')
        setPaymentMethod('upi')
        enqueueSnackbar('Customer display closed', { variant: 'info' })
      } else {
        const screenIdx = settings?.display_screen || 0
        await OpenCustomerDisplay(screenIdx)
        setDisplayOpen(true)
        enqueueSnackbar('Customer display opened', { variant: 'success' })
        SendProductsToDisplay()
      }
    } catch (err) {
      enqueueSnackbar('Failed to open display: ' + String(err), { variant: 'error' })
    }
  }

  // ========== Cart operations ==========
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) {
        return prev.map(i => {
          if (i.product_id === product.id) {
            const newQty = i.qty + 1
            const newSubtotal = product.price * newQty
            const newTax = newSubtotal * product.tax_rate
            return { ...i, qty: newQty, subtotal: newSubtotal, tax_amount: newTax }
          }
          return i
        })
      } else {
        const itemSubtotal = product.price
        const taxAmount = itemSubtotal * product.tax_rate
        const newItem: CartItem = {
          product_id: product.id, name: product.name, qty: 1,
          price: product.price, tax_rate: product.tax_rate,
          subtotal: itemSubtotal, tax_amount: taxAmount,
        }
        return [...prev, newItem]
      }
    })
  }

  const handleProductTap = (product: Product) => {
    addToCart(product)
    setTappedId(product.id)
    setTimeout(() => setTappedId(null), 150)
  }

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product_id === productId) {
        const newQty = i.qty + delta
        if (newQty <= 0) return null as any
        const newSubtotal = i.price * newQty
        const newTax = newSubtotal * i.tax_rate
        return { ...i, qty: newQty, subtotal: newSubtotal, tax_amount: newTax }
      }
      return i
    }).filter(Boolean))
  }

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(i => i.product_id !== productId))
  }

  const clearCart = () => {
    if (cart.length === 0) return
    setShowClearConfirm(true)
  }

  const confirmClearCart = () => {
    setCart([])
    setShowPayment(false)
    setCompleted(false)
    setUpiString('')
    setPaymentMethod('upi')
    if (displayOpen) {
      ClearCustomerDisplay()
    }
    setShowClearConfirm(false)
  }

  // ========== Payment ==========
  const generateUPI = useCallback(async (amount: number) => {
    try {
      const upi = await GetUPIString(amount)
      setUpiString(upi)
      return upi
    } catch (err) {
      console.error('Failed to generate UPI string:', err)
      return ''
    }
  }, [])

  useEffect(() => {
    if (showPayment && !completed && paymentMethod === 'upi' && total > 0) {
      generateUPI(total)
    }
  }, [showPayment, paymentMethod, total, completed, generateUPI])

  useEffect(() => {
    if (showPayment && !completed && paymentMethod === 'upi' && upiString && displayOpen) {
      ShowQROnDisplay(upiString, total, settings?.upi_vpa || '')
    }
  }, [upiString])

  const handlePayment = async () => {
    if (processingRef.current) return
    processingRef.current = true
    setProcessing(true)
    try {
      const transaction = new models.Transaction()
      transaction.items = cart
      transaction.subtotal = subtotal
      transaction.tax_total = taxTotal
      transaction.total = total
      transaction.payment_method = paymentMethod
      transaction.id = ''
      transaction.created = ''

      await CreateTransaction(transaction)
      setCompleted(true)
      enqueueSnackbar(`Payment of ₹${total.toFixed(2)} recorded`, { variant: 'success' })

      ConfirmPayment()

      // Auto-clear after 3 seconds (thank you view duration)
      clearTimerRef.current = setTimeout(() => {
        setCompleted(false)
        setCart([])
        setShowPayment(false)
        setPaymentMethod('upi')
        if (displayOpen) {
          SendProductsToDisplay()
        }
      }, 3000)
    } catch (err) {
      console.error('Payment failed:', err)
      enqueueSnackbar('Failed to record transaction: ' + String(err), { variant: 'error' })
    } finally {
      setProcessing(false)
      processingRef.current = false
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Product Grid */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center gap-3 mb-4">
          {products.length > 0 && (
            <div className="relative flex-1 max-w-sm">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products... (press /)"
                className="input input-bordered w-full pl-10 pr-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  onClick={() => { setSearch(''); searchInputRef.current?.focus() }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 shrink-0">
            {displayOpen && (
              <button
                className="btn btn-sm btn-ghost gap-1"
                onClick={() => {
                  ClearCustomerDisplay()
                  SendProductsToDisplay()
                  enqueueSnackbar('Display refreshed', { variant: 'info' })
                }}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            )}
            <button
              className={`btn btn-sm gap-1 ${displayOpen ? 'btn-success' : 'btn-outline'}`}
              onClick={toggleDisplay}
            >
              {displayOpen ? <MonitorOff size={16} /> : <Monitor size={16} />}
              {displayOpen ? 'Close Display' : 'Open Display'}
            </button>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 text-base-content/40">
            <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg">No products yet</p>
            <p className="text-sm mt-1">Add products from the Products page</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-base-content/40">
            <Search size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg">No products match "{search}"</p>
            <button className="btn btn-ghost btn-sm mt-2" onClick={() => setSearch('')}>Clear search</button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                className={`relative card bg-base-100 shadow hover:shadow-md hover:bg-primary/5 transition-all duration-150 cursor-pointer text-left overflow-hidden ${tappedId === product.id ? 'ring-2 ring-primary scale-95' : ''}`}
                onClick={() => handleProductTap(product)}
              >
                {/* Cart count badge */}
                {cartQtyMap[product.id] != null && (
                  <span className="badge badge-primary badge-sm absolute top-2 right-2 z-10">{cartQtyMap[product.id]}</span>
                )}
                {product.image_data ? (
                  <img src={product.image_data} alt={product.name} className="w-full h-24 sm:h-28 md:h-32 object-cover" />
                ) : (
                  <div className="w-full h-24 sm:h-28 md:h-32 bg-base-200 flex items-center justify-center">
                    <ShoppingCart size={32} className="opacity-20" />
                  </div>
                )}
                <div className="card-body p-3">
                  <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
                  <p className="text-primary font-bold text-sm">₹{product.price.toFixed(2)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <div className="w-72 md:w-80 lg:w-96 bg-base-100 border-l border-base-300 flex flex-col shrink-0">
        <div className="p-4 border-b border-base-300">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Receipt size={20} /> Cart
              {cart.length > 0 && <span className="badge badge-sm">{cart.reduce((s, i) => s + i.qty, 0)}</span>}
            </h2>
            {cart.length > 0 && (
              <button className="btn btn-sm btn-ghost text-error gap-1" onClick={clearCart}>
                <Trash2 size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-base-content/40">
              <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
              <p>Tap a product to add</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.product_id} className="flex items-center gap-3 bg-base-200 rounded-lg p-3">
                  <button
                    className="btn btn-sm btn-circle btn-ghost text-error shrink-0"
                    onClick={() => removeItem(item.product_id)}
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-base-content/60">₹{item.price.toFixed(2)} × {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="btn btn-sm btn-circle btn-ghost"
                      onClick={() => updateQty(item.product_id, -1)}
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-10 text-center text-base font-bold">{item.qty}</span>
                    <button
                      className="btn btn-sm btn-circle btn-ghost"
                      onClick={() => updateQty(item.product_id, 1)}
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <p className="font-medium text-sm min-w-[70px] text-right">₹{item.subtotal.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        <div className="border-t border-base-300 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
          </div>
          {taxTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Tax</span><span>₹{taxTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t border-base-300 pt-2">
            <span>Total</span><span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Pay Button / Payment UI */}
        <div className="p-4 border-t border-base-300">
            {!showPayment ? (
            <button
              className="btn btn-primary btn-block btn-lg"
              disabled={cart.length === 0}
              onClick={() => {
                setShowPayment(true)
              if (displayOpen) {
                UpdateCustomerDisplay(cart, subtotal, taxTotal)
                SendPaymentMethodToDisplay('upi')
              }
              }}
            >
              Pay ₹{total.toFixed(2)}
            </button>
          ) : completed ? (
            <div className="space-y-3">
              <div className="alert alert-success gap-2">
                <CheckCircle size={20} />
                <span>Payment recorded!</span>
              </div>
              <button className="btn btn-ghost btn-block gap-2" disabled>
                <Loader2 size={16} className="animate-spin" />
                Waiting for display...
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  className={`btn flex-1 ${paymentMethod === 'upi' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => {
                    setPaymentMethod('upi')
                    if (displayOpen) SendPaymentMethodToDisplay('upi')
                  }}
                >
                  UPI QR
                </button>
                <button
                  className={`btn flex-1 ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => {
                    setPaymentMethod('cash')
                    if (displayOpen) SendPaymentMethodToDisplay('cash')
                  }}
                >
                  Cash
                </button>
              </div>
              {paymentMethod === 'upi' && upiString && (
                <div className="text-center">
                  <div className="bg-white p-4 rounded-2xl inline-block mb-2">
                    <QRCodeSVG value={upiString} size={200} />
                  </div>
                  <p className="text-lg font-semibold text-primary">₹{total.toFixed(2)}</p>
                  <p className="text-xs text-base-content/60 mt-1 font-mono">{settings?.upi_vpa}</p>
                </div>
              )}
              {paymentMethod === 'cash' && (
                <div className="text-center py-4">
                  <p className="text-2xl font-bold">₹{total.toFixed(2)}</p>
                  <p className="text-sm text-base-content/60">Collect cash from customer</p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost flex-1"
                  onClick={() => { setShowPayment(false); setUpiString('') }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  className="btn btn-primary flex-1"
                  onClick={handlePayment}
                  disabled={processing}
                >
                  {processing ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle size={16} /> Confirm</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Clear Cart</h3>
            <p className="py-4">Are you sure you want to clear all items from the cart?</p>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-error" onClick={confirmClearCart}>
                Clear
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowClearConfirm(false)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  )
}
