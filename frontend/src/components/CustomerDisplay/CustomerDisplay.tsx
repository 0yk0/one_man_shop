import { useEffect, useRef, useState, useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle, CircleDollarSign } from 'lucide-react'
import { useDisplayStore, useSyncDisplayState } from '../../stores/displayStore'

type ViewType = 'menu' | 'bill' | 'thankyou'

export default function CustomerDisplay() {
  useSyncDisplayState()
  const { view, shop_name, products, cart_items, total, tax, payment_method, upi_string, theme } = useDisplayStore()

  // Apply theme
  useEffect(() => {
    if (theme) document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const totalWithTax = total + tax
  const now = new Date()
  const itemsScrollRef = useRef<HTMLDivElement>(null)

  // Track previous view for transition direction
  const [prevView, setPrevView] = useState<ViewType>('menu')
  const thankYouKey = useRef(0)

  useEffect(() => {
    if (view !== prevView) {
      // If entering bill view, reset scroll
      if (view === 'bill' && itemsScrollRef.current) {
        itemsScrollRef.current.scrollTop = 0
      }
      // If entering thankyou, bump key to retrigger animations
      if (view === 'thankyou') {
        thankYouKey.current++
      }
      setPrevView(view as ViewType)
    }
  }, [view, prevView])

  const activeView = (view as ViewType)

  // Ping-pong auto-scroll for items list on bill view
  useEffect(() => {
    if (activeView !== 'bill') return

    const container = itemsScrollRef.current
    if (!container) return

    const SCROLL_SPEED = 50 // px/sec
    const PAUSE_DURATION = 1500 // 1.5s pause at top/bottom
    const START_DELAY = 1000 // 1s initial delay before scrolling starts

    let animId: number
    let direction: 1 | -1 = 1 // 1 = down, -1 = up
    let paused = false
    let pauseTimer: ReturnType<typeof setTimeout> | null = null
    let startTimer: ReturnType<typeof setTimeout> | null = null
    let alive = true
    let lastTime = 0
    let accumulator = 0 // accumulates sub-pixel movement

    function tick(now: number) {
      if (!alive || paused || !container) return

      const { scrollHeight, clientHeight } = container
      const maxScroll = scrollHeight - clientHeight

      // No overflow — nothing to scroll
      if (maxScroll <= 0) return

      // Calculate delta time
      if (lastTime === 0) lastTime = now
      const dt = (now - lastTime) / 1000 // seconds
      lastTime = now

      // Accumulate sub-pixel distance
      accumulator += SCROLL_SPEED * dt
      const pixels = Math.floor(accumulator)
      if (pixels > 0) {
        accumulator -= pixels
        const newScrollTop = container.scrollTop + direction * pixels
        container.scrollTop = Math.max(0, Math.min(newScrollTop, maxScroll))
      }

      const { scrollTop } = container

      // Reached end — pause then reverse
      if (direction === 1 && scrollTop >= maxScroll - 1) {
        paused = true
        pauseTimer = setTimeout(() => {
          direction = -1
          paused = false
          lastTime = 0
          animId = requestAnimationFrame(tick)
        }, PAUSE_DURATION)
        return
      }

      // Reached top — pause then reverse
      if (direction === -1 && scrollTop <= 1) {
        paused = true
        pauseTimer = setTimeout(() => {
          direction = 1
          paused = false
          lastTime = 0
          animId = requestAnimationFrame(tick)
        }, PAUSE_DURATION)
        return
      }

      animId = requestAnimationFrame(tick)
    }

    // Delay start so user can briefly see the top of the list
    startTimer = setTimeout(() => {
      if (alive) animId = requestAnimationFrame(tick)
    }, START_DELAY)

    return () => {
      alive = false
      cancelAnimationFrame(animId)
      if (pauseTimer) clearTimeout(pauseTimer)
      if (startTimer) clearTimeout(startTimer)
      // Reset scroll position on cleanup
      container.scrollTop = 0
    }
  }, [activeView])

  // Transition classes based on which view is entering/leaving
  const viewClasses = useMemo(() => {
    const isMenu = activeView === 'menu'
    const isBill = activeView === 'bill'
    const isThank = activeView === 'thankyou'

    return {
      menu: isMenu
        ? 'opacity-100 z-10 pointer-events-auto translate-y-0 scale-100'
        : isBill
          ? 'opacity-0 z-0 pointer-events-none -translate-y-full'
          : 'opacity-0 z-0 pointer-events-none -translate-y-full',

      bill: isBill
        ? 'opacity-100 z-10 pointer-events-auto translate-y-0 scale-100'
        : 'opacity-0 z-0 pointer-events-none translate-y-full',

      thankyou: isThank
        ? 'opacity-100 z-10 pointer-events-auto translate-y-0 scale-100'
        : 'opacity-0 z-0 pointer-events-none scale-90',
    }
  }, [activeView])

  return (
    <div className="h-screen bg-stone-200 overflow-hidden relative">
      {/* ===== MENU VIEW ===== */}
      <div className={`absolute inset-0 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${viewClasses.menu}`}>
        <div className="h-full overflow-auto">
          <div className="w-full px-4 py-6" style={{ maxWidth: 'min(95vw, 900px)', margin: '0 auto' }}>
            <div className="bg-white relative" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)', borderRadius: '4px' }}>
              <div className="w-full h-3" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #d6d3d1 10px, #d6d3d1 20px)' }}></div>
              <div className="px-6 py-5 md:px-10 md:py-7">
                <div className="text-center mb-5">
                  <h1 className="text-3xl md:text-4xl font-black tracking-wider text-stone-800">{shop_name}</h1>
                  <div className="flex justify-center items-center gap-3 text-sm text-stone-400 mt-2">
                    <span>{now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>•</span>
                    <span>{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <div className="border-t-2 border-dashed border-stone-300 my-4"></div>
                <h2 className="text-lg font-bold tracking-[0.2em] text-stone-400 uppercase text-center mb-5">Menu</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  {products.map((p) => (
                    <div key={p.id} className="flex justify-between items-baseline py-2 border-b border-stone-100">
                      <span className="font-semibold text-stone-800 text-lg">{p.name}</span>
                      <span className="border-b border-dotted border-stone-300 flex-1 mx-2 min-w-5"></span>
                      <span className="font-mono font-semibold text-stone-800 text-lg">₹{p.price.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t-2 border-dashed border-stone-300 mt-5 pt-4 text-center">
                  <p className="text-xs text-stone-300">Powered by One Man Shop POS</p>
                </div>
              </div>
              <div className="w-full h-3" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #d6d3d1 10px, #d6d3d1 20px)' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BILL VIEW ===== */}
      <div className={`absolute inset-0 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${viewClasses.bill}`}>
        <div className="h-full flex flex-col items-center justify-center">
          <div className="w-full h-full flex flex-col bg-white relative mx-auto" style={{ maxWidth: 'min(90vw, 700px)', boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)', borderRadius: '4px' }}>
            <div className="w-full h-2 shrink-0" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #d6d3d1 10px, #d6d3d1 20px)' }}></div>

            {/* Header — fixed */}
            <div className="px-8 pt-4 pb-1 md:px-12 md:pt-6 md:pb-1 shrink-0">
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-black tracking-wider text-stone-800">{shop_name}</h1>
                <div className="flex justify-center items-center gap-3 text-sm text-stone-400 mt-2">
                  <span>{now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>•</span>
                  <span>{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="border-t-2 border-dashed border-stone-300 my-4"></div>
            </div>

            {/* Items — scrollable (ping-pong auto-scroll) */}
            <div ref={itemsScrollRef} className="flex-1 min-h-0 overflow-y-auto px-8 md:px-12 scroll-hidden">
              <div className="space-y-0 pb-4">
                {cart_items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start py-1.5 border-b border-stone-100 last:border-b-0">
                    <div className="flex-1">
                      <span className="font-semibold text-stone-800 text-base md:text-lg">{item.name}</span>
                      <span className="text-stone-400 ml-2 text-sm">{item.qty} × ₹{item.price.toFixed(0)}</span>
                    </div>
                    <span className="font-mono font-semibold text-stone-800 text-base md:text-lg ml-4">₹{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary + QR — pinned at bottom */}
            <div className="shrink-0 px-8 pb-4 pt-1 md:px-12 md:pb-6 md:pt-1">
              <div className="border-t-2 border-dashed border-stone-300 my-3"></div>

              <div className="space-y-1">
                <div className="flex justify-between text-base text-stone-500">
                  <span>Subtotal ({cart_items?.length || 0} items)</span>
                  <span className="font-mono">₹{total.toFixed(2)}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-base text-stone-500">
                    <span>Tax</span>
                    <span className="font-mono">₹{tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t-2 border-stone-800 my-2"></div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xl md:text-2xl font-black text-stone-800">TOTAL</span>
                  <span className="text-2xl md:text-3xl font-black font-mono text-stone-800">₹{totalWithTax.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="border-t-2 border-dashed border-stone-300 my-4"></div>
                {payment_method === 'cash' ? (
                  <div className="text-center py-4">
                    <p className="text-2xl font-bold text-amber-600 tracking-wide">COLLECT CASH</p>
                    <p className="text-3xl md:text-4xl font-black font-mono text-stone-800 mt-2">₹{totalWithTax.toFixed(2)}</p>
                  </div>
                ) : payment_method === 'upi' && upi_string ? (
                  <div className="text-center">
                    <p className="text-sm font-bold tracking-[0.3em] text-stone-400 uppercase mb-2">Scan to Pay</p>
                    <div className="inline-block p-3 bg-white border-2 border-stone-200 rounded-lg">
                      <QRCodeSVG value={upi_string} size={180} />
                    </div>
                    <div className="mt-2">
                      <p className="text-2xl md:text-3xl font-black font-mono text-stone-800">₹{totalWithTax.toFixed(2)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-base text-stone-400 tracking-[0.2em] font-semibold">AWAITING PAYMENT</p>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-dashed border-stone-300 mt-3 pt-2 text-center">
                <p className="text-xs text-stone-300">Powered by One Man Shop POS</p>
              </div>
            </div>

            <div className="w-full h-2 shrink-0" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #d6d3d1 10px, #d6d3d1 20px)' }}></div>
          </div>
        </div>
      </div>

      {/* ===== THANK YOU VIEW ===== */}
      <div className={`absolute inset-0 transition-all duration-[300ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${viewClasses.thankyou}`}>
        <div className="h-full bg-stone-200 flex items-center justify-center">
          <div className="text-center px-8">
            {/* Checkmark with pulse ring */}
            <div className="relative inline-block mb-8">
              <span className="absolute inset-0 rounded-full bg-green-500/20 animate-ping"></span>
              <div key={thankYouKey.current} className="relative animate-[checkPop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
                <CheckCircle size={160} className="text-green-600 drop-shadow-lg" strokeWidth={1.5} />
              </div>
            </div>

            {/* Thank You */}
            <h1 key={`ty-${thankYouKey.current}`} className="text-6xl font-black text-stone-800 mb-3 animate-[fadeSlideUp_0.6s_ease-out_forwards]">Thank You!</h1>

            {/* Shop name */}
            <p key={`shop-${thankYouKey.current}`} className="text-2xl font-bold text-stone-500 tracking-wide mb-6 animate-[fadeSlideUp_0.6s_ease-out_0.3s_forwards] opacity-0">{shop_name}</p>

            {/* Amount paid */}
            {totalWithTax > 0 && (
              <div key={`amt-${thankYouKey.current}`} className="animate-[fadeSlideUp_0.6s_ease-out_0.6s_forwards] opacity-0">
                <div className="inline-block bg-white rounded-2xl px-10 py-5 border-2 border-stone-200 shadow-lg">
                  <CircleDollarSign size={28} className="mx-auto text-stone-400 mb-2" />
                  <p className="text-sm font-bold tracking-[0.2em] text-stone-400 uppercase mb-1">Amount Paid</p>
                  <p className="text-5xl font-black font-mono text-stone-800">₹{totalWithTax.toFixed(2)}</p>
                  <p className="text-sm text-stone-400 mt-2 capitalize">{payment_method} Payment</p>
                </div>
              </div>
            )}

            {/* Visit again */}
            <p key={`visit-${thankYouKey.current}`} className="text-lg text-stone-400 mt-10 tracking-wide animate-[fadeSlideUp_0.6s_ease-out_0.9s_forwards] opacity-0">We hope to see you again!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
