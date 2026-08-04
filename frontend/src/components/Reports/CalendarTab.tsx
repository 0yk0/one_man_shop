import { useState, useEffect, useMemo } from 'react'
import { GetTransactions } from '../../bindings'
import { type Transaction, toStr, getDayData, formatMonth, formatFullDay, type DayData } from '../../lib/reports'
import { Loader2, ChevronLeft, ChevronRight, X, ShoppingCart, Calendar } from 'lucide-react'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function CalendarTab() {
  const [allTxns, setAllTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null)

  useEffect(() => {
    GetTransactions(50000, 0)
      .then(setAllTxns)
      .catch(err => console.error('Load error:', err))
      .finally(() => setLoading(false))
  }, [])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  // Compute month data
  const monthData = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()

    // Get starting day of week (0=Sun, 1=Mon, ...)
    let startDayOfWeek = firstDay.getDay()
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1 // Convert to Mon=0

    const result: { date: string; day: number; isCurrentMonth: boolean; data: DayData }[] = []

    // Previous month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      const dateStr = toStr(d)
      result.push({ date: dateStr, day: d.getDate(), isCurrentMonth: false, data: getDayData(allTxns, dateStr) })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      const dateStr = toStr(d)
      result.push({ date: dateStr, day: i, isCurrentMonth: true, data: getDayData(allTxns, dateStr) })
    }

    // Next month days
    const remaining = 42 - result.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      const dateStr = toStr(d)
      result.push({ date: dateStr, day: d.getDate(), isCurrentMonth: false, data: getDayData(allTxns, dateStr) })
    }

    return result
  }, [allTxns, year, month])

  // Monthly summary
  const monthSummary = useMemo(() => {
    const currentMonthDays = monthData.filter(d => d.isCurrentMonth)
    const totalTransactions = currentMonthDays.reduce((a, d) => a + d.data.transactions, 0)
    const totalRevenue = currentMonthDays.reduce((a, d) => a + d.data.revenue, 0)
    return { totalTransactions, totalRevenue }
  }, [monthData])

  const goToPrevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const goToNextMonth = () => setViewDate(new Date(year, month + 1, 1))
  const goToToday = () => {
    const now = new Date()
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  const today = toStr(new Date())

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-4">
      {/* Month Navigation & Summary */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body py-3">
          <div className="flex items-center justify-between">
            {/* Left: Nav arrows + Month */}
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost btn-sm btn-square" onClick={goToPrevMonth}>
                <ChevronLeft size={18} />
              </button>
              <h2 className="card-title text-lg">{formatMonth(year, month)}</h2>
              <button className="btn btn-ghost btn-sm btn-square" onClick={goToNextMonth}>
                <ChevronRight size={18} />
              </button>
            </div>
            
            {/* Right: Stats + Today */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-sm text-base-content/60">
                <span><strong className="text-base-content">{monthSummary.totalTransactions}</strong> txns</span>
                <span>•</span>
                <span><strong className="text-primary">₹{monthSummary.totalRevenue.toFixed(0)}</strong></span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={goToToday}>Today</button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-0">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-base-300">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-xs font-medium text-base-content/50 py-3 border-r border-base-300 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7">
            {monthData.map(({ date, day, isCurrentMonth, data }, idx) => {
              const isToday = date === today
              const isSelected = selectedDay?.date === date
              const hasSales = data.transactions > 0

              return (
                <button
                  key={idx}
                  type="button"
                  className={`
                    relative min-h-[100px] p-2 text-left border-r border-b border-base-300 last:border-r-0
                    ${!isCurrentMonth ? 'bg-base-200/50 text-base-content/30' : 'bg-base-100'}
                    ${isToday ? 'ring-2 ring-primary ring-inset' : ''}
                    ${isSelected ? 'bg-primary/10' : ''}
                    ${hasSales && isCurrentMonth ? 'hover:bg-base-200 cursor-pointer' : ''}
                  `}
                  onClick={() => hasSales && setSelectedDay(data)}
                >
                  <span className={`text-sm ${isToday ? 'font-bold text-primary' : ''}`}>
                    {day}
                  </span>
                  {hasSales && isCurrentMonth && (
                    <div className="mt-1 space-y-0.5">
                      <div className="text-xs font-medium text-base-content">
                        {data.transactions} txns
                      </div>
                      <div className="text-xs text-primary font-mono">
                        ₹{data.revenue.toFixed(0)}
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Calendar size={20} className="text-primary" />
                {formatFullDay(selectedDay.date)}
              </h3>
              <button className="btn btn-ghost btn-sm btn-square" onClick={() => setSelectedDay(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-base-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-base-content">{selectedDay.transactions}</div>
                <div className="text-xs text-base-content/50">Transactions</div>
              </div>
              <div className="bg-base-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">₹{selectedDay.revenue.toFixed(0)}</div>
                <div className="text-xs text-base-content/50">Revenue</div>
              </div>
              <div className="bg-base-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-success">₹{selectedDay.upi.toFixed(0)}</div>
                <div className="text-xs text-base-content/50">UPI</div>
              </div>
              <div className="bg-base-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-accent">₹{selectedDay.cash.toFixed(0)}</div>
                <div className="text-xs text-base-content/50">Cash</div>
              </div>
            </div>

            {/* Items List */}
            {selectedDay.items.length > 0 ? (
              <div>
                <h4 className="font-medium text-sm mb-3 text-base-content/70">
                  Items Sold ({selectedDay.items.length} unique products)
                </h4>
                <div className="max-h-[300px] overflow-y-auto rounded-lg border border-base-300">
                  <table className="table table-sm">
                    <thead className="bg-base-200">
                      <tr>
                        <th className="w-12">#</th>
                        <th>Item</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDay.items.map((item, i) => (
                        <tr key={i} className="hover:bg-base-200/50">
                          <td className="text-base-content/40">{i + 1}</td>
                          <td className="font-medium">{item.name}</td>
                          <td className="text-right font-mono">{item.qty}</td>
                          <td className="text-right font-mono text-base-content/60">
                            ₹{(item.revenue / item.qty).toFixed(0)}
                          </td>
                          <td className="text-right font-mono font-medium">₹{item.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-base-content/40">
                <ShoppingCart size={40} className="mx-auto mb-2 opacity-30" />
                <p>No items data available</p>
              </div>
            )}

            <div className="modal-action">
              <button className="btn btn-sm" onClick={() => setSelectedDay(null)}>Close</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setSelectedDay(null)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  )
}
