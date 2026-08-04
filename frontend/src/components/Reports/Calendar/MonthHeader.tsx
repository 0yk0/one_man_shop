import { formatMonth } from '../../../lib/reports'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthHeaderProps {
  year: number
  month: number
  totalTransactions: number
  totalRevenue: number
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

export default function MonthHeader({
  year,
  month,
  totalTransactions,
  totalRevenue,
  onPrevMonth,
  onNextMonth,
  onToday,
}: MonthHeaderProps) {
  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body py-3">
        <div className="flex items-center justify-between">
          {/* Left: Nav arrows + Month */}
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost btn-sm btn-square" onClick={onPrevMonth}>
              <ChevronLeft size={18} />
            </button>
            <h2 className="card-title text-lg">{formatMonth(year, month)}</h2>
            <button className="btn btn-ghost btn-sm btn-square" onClick={onNextMonth}>
              <ChevronRight size={18} />
            </button>
          </div>
          
          {/* Right: Stats + Today */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm text-base-content/60">
              <span><strong className="text-base-content">{totalTransactions}</strong> txns</span>
              <span>•</span>
              <span><strong className="text-primary">₹{totalRevenue.toFixed(0)}</strong></span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onToday}>Today</button>
          </div>
        </div>
      </div>
    </div>
  )
}
