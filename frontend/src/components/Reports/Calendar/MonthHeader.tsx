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
      <div className="card-body py-3 gap-2">
        {/* Row 1: Month navigation — centered */}
        <div className="flex items-center justify-center gap-2">
          <button className="btn btn-ghost btn-sm btn-square min-h-[44px] min-w-[44px]" onClick={onPrevMonth}>
            <ChevronLeft size={20} />
          </button>
          <h2 className="card-title text-xl sm:text-2xl min-w-0 text-center">{formatMonth(year, month)}</h2>
          <button className="btn btn-ghost btn-sm btn-square min-h-[44px] min-w-[44px]" onClick={onNextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Row 2: Stats + Today — centered */}
        <div className="flex items-center justify-center gap-3 text-sm text-base-content/60">
          <span><strong className="text-base-content">{totalTransactions}</strong> txns</span>
          <span>·</span>
          <span><strong className="text-primary font-mono tabular-nums">₹{totalRevenue.toFixed(0)}</strong></span>
          <span>·</span>
          <button className="btn btn-ghost btn-xs" onClick={onToday}>Today</button>
        </div>
      </div>
    </div>
  )
}
