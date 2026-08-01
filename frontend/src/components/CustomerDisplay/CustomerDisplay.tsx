import { useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle } from 'lucide-react'
import { useDisplayStore, useSyncDisplayState } from '../../stores/displayStore'

export default function CustomerDisplay() {
  useSyncDisplayState()
  const { view, shop_name, products, cart_items, total, tax, payment_method, upi_string, theme } = useDisplayStore()

  // Apply theme
  useEffect(() => {
    if (theme) document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const totalWithTax = total + tax
  const now = new Date()

  // Menu View
  if (view === 'menu') {
    return (
      <div className="min-h-screen bg-stone-200 py-6 overflow-auto">
        <div className="w-full px-4" style={{ maxWidth: 'min(95vw, 900px)', margin: '0 auto' }}>
          <div className="bg-white relative" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)', borderRadius: '4px' }}>
            <div className="w-full h-3" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #d6d3d1 10px, #d6d3d1 20px)' }}></div>
            <div className="px-6 py-5 md:px-10 md:py-7">
              <div className="text-center mb-5">
                <h1 className="text-4xl md:text-5xl font-black tracking-wider text-stone-800">{shop_name}</h1>
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
    )
  }

  // Thank You View
  if (view === 'thankyou') {
    return (
      <div className="min-h-screen bg-stone-200 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4"><CheckCircle size={120} className="text-green-600" strokeWidth={1.5} /></div>
          <h1 className="text-5xl font-bold text-green-600 mb-3">Thank You!</h1>
        </div>
      </div>
    )
  }

  // Bill View
  const itemCount = cart_items?.length || 0

  return (
    <div className="min-h-screen bg-stone-200 flex items-start justify-center py-6 overflow-auto">
      <div className="w-full" style={{ maxWidth: 'min(90vw, 700px)' }}>
        <div className="bg-white relative mx-auto" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)', borderRadius: '4px' }}>
          <div className="w-full h-3" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #d6d3d1 10px, #d6d3d1 20px)' }}></div>

          <div className="px-8 py-6 md:px-12 md:py-8">
            <div className="text-center mb-5">
              <h1 className="text-4xl md:text-5xl font-black tracking-wider text-stone-800">{shop_name}</h1>
              <div className="flex justify-center items-center gap-3 text-sm text-stone-400 mt-2">
                <span>{now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>•</span>
                <span>{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-stone-300 my-4"></div>

            <div className="space-y-0 mb-4">
              {cart_items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start py-2 border-b border-stone-100 last:border-b-0">
                  <div className="flex-1">
                    <span className="font-semibold text-stone-800 text-lg md:text-xl">{item.name}</span>
                    <span className="text-stone-400 ml-3 text-base">{item.qty} × ₹{item.price.toFixed(0)}</span>
                  </div>
                  <span className="font-mono font-semibold text-stone-800 text-lg md:text-xl ml-6">₹{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-dashed border-stone-300 my-4"></div>

            <div className="space-y-2">
              <div className="flex justify-between text-base text-stone-500">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-mono">₹{total.toFixed(2)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-base text-stone-500">
                  <span>Tax</span>
                  <span className="font-mono">₹{tax.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t-2 border-stone-800 my-3"></div>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-black text-stone-800">TOTAL</span>
                <span className="text-3xl md:text-4xl font-black font-mono text-stone-800">₹{totalWithTax.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="border-t-2 border-dashed border-stone-300 my-4"></div>
              {payment_method === 'cash' ? (
                <div className="text-center py-6">
                  <p className="text-2xl font-bold text-amber-600 tracking-wide">COLLECT CASH</p>
                  <p className="text-3xl md:text-4xl font-black font-mono text-stone-800 mt-2">₹{totalWithTax.toFixed(2)}</p>
                </div>
              ) : payment_method === 'upi' && upi_string ? (
                <div className="text-center">
                  <p className="text-sm font-bold tracking-[0.3em] text-stone-400 uppercase mb-4">Scan to Pay</p>
                  <div className="inline-block p-4 bg-white border-2 border-stone-200 rounded-lg">
                    <QRCodeSVG value={upi_string} size={280} />
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl md:text-4xl font-black font-mono text-stone-800">₹{totalWithTax.toFixed(2)}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-base text-stone-400 tracking-[0.2em] font-semibold">AWAITING PAYMENT</p>
                </div>
              )}
            </div>

            <div className="border-t-2 border-dashed border-stone-300 mt-5 pt-4 text-center">
              <p className="text-xs text-stone-300">Powered by One Man Shop POS</p>
            </div>
          </div>

          <div className="w-full h-3" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #d6d3d1 10px, #d6d3d1 20px)' }}></div>
        </div>
      </div>
    </div>
  )
}
