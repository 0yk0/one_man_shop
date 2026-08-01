import { useState, useEffect } from 'react'
import { GetTransactions } from '../../bindings'
import { type Transaction, getMonday, toStr, shortDate, dayOfWeek, filterTxns, sumTxns } from '../../lib/reports'
import { BarChart3, IndianRupee, Loader2, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function SummaryTab() {
  const [allTxns, setAllTxns] = useState<Transaction[]>([])
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    Promise.all([
      GetTransactions(1000, 0),
      import('../../bindings').then(m => m.GetSettings()),
    ])
      .then(([txns, settings]) => { setAllTxns(txns); setTaxEnabled(settings.tax_enabled) })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const today = toStr(new Date())
  const todayTxns = filterTxns(allTxns, today, today)
  const todayStats = sumTxns(todayTxns)
  const todayUpiAmount = todayTxns.filter(t => t.payment_method === 'upi').reduce((a, t) => a + t.total, 0)
  const todayCashAmount = todayTxns.filter(t => t.payment_method === 'cash').reduce((a, t) => a + t.total, 0)

  const monday = getMonday(weekOffset)
  const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6)
  const weekStart = toStr(monday)
  const weekEnd = toStr(sunday)
  const weekTxns = filterTxns(allTxns, weekStart, weekEnd)
  const weekStats = sumTxns(weekTxns)
  const weekUpiRevenue = weekTxns.filter(t => t.payment_method === 'upi').reduce((a, t) => a + t.total, 0)
  const weekCashRevenue = weekTxns.filter(t => t.payment_method === 'cash').reduce((a, t) => a + t.total, 0)

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(d.getDate() + i)
    const ds = toStr(d)
    const dayTxns = filterTxns(allTxns, ds, ds)
    return {
      day: dayOfWeek(ds),
      upi: dayTxns.filter(t => t.payment_method === 'upi').reduce((a, t) => a + t.total, 0),
      cash: dayTxns.filter(t => t.payment_method === 'cash').reduce((a, t) => a + t.total, 0),
    }
  })

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      <div className={`grid gap-4 ${taxEnabled ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title flex items-center gap-1"><IndianRupee size={14} />Today's Revenue</div>
          <div className="stat-value text-primary text-2xl">₹{todayStats.total.toFixed(0)}</div>
          <div className="stat-desc">{todayTxns.length} transactions</div>
        </div>
        {taxEnabled && (
          <div className="stat bg-base-100 rounded-box shadow">
            <div className="stat-title flex items-center gap-1"><IndianRupee size={14} />Today's Tax</div>
            <div className="stat-value text-secondary text-2xl">₹{todayStats.tax.toFixed(0)}</div>
            <div className="stat-desc">collected</div>
          </div>
        )}
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title flex items-center gap-1"><ArrowUpRight size={14} className="text-success" />UPI Today</div>
          <div className="stat-value text-2xl">₹{todayUpiAmount.toFixed(0)}</div>
          <div className="stat-desc">{todayStats.upi} payments</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title flex items-center gap-1"><ArrowDownRight size={14} className="text-accent" />Cash Today</div>
          <div className="stat-value text-2xl">₹{todayCashAmount.toFixed(0)}</div>
          <div className="stat-desc">{todayStats.cash} payments</div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="flex justify-between items-center mb-2">
            <h2 className="card-title flex items-center gap-2"><BarChart3 size={18} />Weekly Revenue</h2>
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost btn-xs" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft size={16} /></button>
              <span className="text-sm font-medium">{shortDate(weekStart)} — {shortDate(weekEnd)}</span>
              <button className="btn btn-ghost btn-xs" onClick={() => setWeekOffset(w => w + 1)} disabled={weekOffset >= 0}><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="flex gap-6 mb-2 text-sm">
            <span>Total: <strong>₹{weekStats.total.toFixed(0)}</strong></span>
            {taxEnabled && <span>Tax: <strong>₹{weekStats.tax.toFixed(0)}</strong></span>}
            <span>Transactions: <strong>{weekTxns.length}</strong></span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#16a34a]"></span>UPI: <strong>₹{weekUpiRevenue.toFixed(0)}</strong></span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#0284c7]"></span>Cash: <strong>₹{weekCashRevenue.toFixed(0)}</strong></span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weekData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" fontSize={12} tickLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-base-100 border border-base-300 rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-sm mb-1">{label}</p>
                      {payload.map((entry: any, idx: number) => (
                        <p key={idx} className="text-sm" style={{ color: entry.color }}>
                          {entry.name}: ₹{Number(entry.value).toFixed(2)}
                        </p>
                      ))}
                    </div>
                  )
                }}
              />
              <Legend />
              <Bar dataKey="upi" name="UPI" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="cash" name="Cash" stackId="a" fill="#0284c7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
