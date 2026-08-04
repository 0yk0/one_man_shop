import { type DayData } from '../../../lib/reports'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface CalendarDay {
  date: string
  day: number
  isCurrentMonth: boolean
  data: DayData
}

interface CalendarGridProps {
  monthData: CalendarDay[]
  selectedDay: DayData | null
  today: string
  onDayClick: (data: DayData) => void
}

export default function CalendarGrid({ monthData, selectedDay, today, onDayClick }: CalendarGridProps) {
  return (
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
                onClick={() => hasSales && onDayClick(data)}
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
  )
}
