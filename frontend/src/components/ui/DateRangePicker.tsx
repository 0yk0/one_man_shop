import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DatePreset } from '../../lib/reports'

// ── Types ────────────────────────────────────────────────

export interface DateRangeValue {
  preset: DatePreset
  customStart: string
  customEnd: string
}

interface DateRangePickerProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  defaultPreset?: DatePreset
}

// ── Constants ────────────────────────────────────────────

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This week', value: 'this_week' },
  { label: 'Last week', value: 'last_week' },
  { label: 'This month', value: 'this_month' },
  { label: 'Custom', value: 'custom' },
]

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// ── Helpers ──────────────────────────────────────────────

function toStr(d: Date): string {
  // Use local time instead of UTC
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = parseDate(dateStr)
  if (!d) return dateStr
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Single Calendar Month Component ─────────────────────

interface CalendarMonthProps {
  year: number
  month: number
  selectedStart: string
  selectedEnd: string
  onDateClick: (date: Date) => void
}

function CalendarMonth({ year, month, selectedStart, selectedEnd, onDateClick }: CalendarMonthProps) {
  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    let startDayOfWeek = firstDay.getDay()
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

    const totalDays = lastDay.getDate()
    const result: { date: Date; isCurrentMonth: boolean }[] = []

    // Previous month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      result.push({ date: new Date(year, month, -i), isCurrentMonth: false })
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      result.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    // Next month days
    const remaining = 42 - result.length
    for (let i = 1; i <= remaining; i++) {
      result.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }

    return result
  }, [year, month])

  const isInRange = (date: Date) => {
    if (!selectedStart || !selectedEnd) return false
    const ds = toStr(date)
    return ds > selectedStart && ds < selectedEnd
  }

  const isStartDate = (date: Date) => toStr(date) === selectedStart
  const isEndDate = (date: Date) => toStr(date) === selectedEnd
  const isToday = (date: Date) => toStr(date) === toStr(new Date())

  return (
    <div className="w-64">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0 mb-2">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-xs text-base-content/50 py-1 font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0">
        {days.map(({ date, isCurrentMonth }, idx) => {
          const isStart = isStartDate(date)
          const isEnd = isEndDate(date)
          const inRange = isInRange(date)
          const selected = isStart || isEnd
          const today = isToday(date)

          return (
            <button
              key={idx}
              type="button"
              className={`
                relative h-9 text-sm
                ${!isCurrentMonth ? 'text-base-content/30' : 'text-base-content'}
                ${selected ? 'bg-primary text-primary-content font-medium rounded-full' : ''}
                ${inRange ? 'bg-primary/10' : ''}
                ${today && !selected ? 'font-bold' : ''}
                ${!selected && !inRange ? 'hover:bg-base-200 rounded-full' : ''}
                ${inRange && !selected ? (isStart || isEnd) ? '' : 'rounded-none' : ''}
                ${isStart && selectedEnd ? 'rounded-r-none' : ''}
                ${isEnd && selectedStart ? 'rounded-l-none' : ''}
              `}
              onClick={() => onDateClick(date)}
            >
              {date.getDate()}
              {today && !selected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────

export default function DateRangePicker({ value, onChange, defaultPreset = 'today' }: DateRangePickerProps) {
  const { preset, customStart, customEnd } = value
  const [showCalendar, setShowCalendar] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Calendar view state - show current month and next month
  const [viewDate, setViewDate] = useState(() => {
    const d = parseDate(customStart) || new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const [selecting, setSelecting] = useState<'start' | 'end'>('start')

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setShowCalendar(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePresetChange = useCallback((newPreset: DatePreset) => {
    if (newPreset === 'custom') {
      const today = toStr(new Date())
      const newStart = customStart || today
      const newEnd = customEnd || today
      onChange({ preset: 'custom', customStart: newStart, customEnd: newEnd })
      setShowCalendar(true)
    } else {
      onChange({ preset: newPreset, customStart, customEnd })
      setShowCalendar(false)
    }
  }, [customStart, customEnd, onChange])

  const handleDateClick = useCallback((date: Date) => {
    const dateStr = toStr(date)

    if (selecting === 'start') {
      // When selecting start date, always clear end date and move to end selection
      onChange({ preset: 'custom', customStart: dateStr, customEnd: '' })
      setSelecting('end')
    } else {
      // When selecting end date
      if (dateStr < customStart) {
        // If clicked date is before start, swap them
        onChange({ preset: 'custom', customStart: dateStr, customEnd: customStart })
      } else {
        // Otherwise, set as end date
        onChange({ preset: 'custom', customStart, customEnd: dateStr })
      }
      setSelecting('start')
    }
  }, [selecting, customStart, onChange])

  const handleApply = useCallback(() => {
    setShowCalendar(false)
    setSelecting('start')
  }, [])

  const handleCancel = useCallback(() => {
    setShowCalendar(false)
    setSelecting('start')
  }, [])

  const toggleCalendar = useCallback(() => {
    if (!showCalendar) {
      // When opening, always start with selecting a new start date
      setSelecting('start')
    }
    setShowCalendar(prev => !prev)
  }, [showCalendar])

  const goToPrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  const goToNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))

  const currentMonth = viewDate.getMonth()
  const currentYear = viewDate.getFullYear()
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        className={`btn btn-sm gap-2 ${preset === 'custom' ? 'btn-primary' : 'btn-outline'}`}
        onClick={toggleCalendar}
      >
        <CalendarIcon size={14} />
        {preset === 'custom' && customStart && customEnd
          ? `${formatDisplayDate(customStart)} – ${formatDisplayDate(customEnd)}`
          : PRESETS.find(p => p.value === preset)?.label || 'Select dates'
        }
      </button>

      {/* Calendar Dropdown */}
      {showCalendar && (
        <div
          ref={containerRef}
          className="absolute z-50 mt-2 left-0 bg-base-100 border border-base-300 rounded-xl shadow-xl overflow-hidden"
          style={{ width: '680px' }}
        >
          <div className="flex">
            {/* Left Sidebar - Presets */}
            <div className="w-40 border-r border-base-300 p-3 flex flex-col gap-1">
              {PRESETS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  className={`
                    text-left px-3 py-2 text-sm rounded-lg transition-colors
                    ${preset === p.value
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-base-content hover:bg-base-200'
                    }
                  `}
                  onClick={() => handlePresetChange(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Right Side - Calendars */}
            <div className="flex-1 p-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-square"
                  onClick={goToPrevMonth}
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-16">
                  <span className="text-sm font-semibold text-base-content">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </span>
                  <span className="text-sm font-semibold text-base-content">
                    {MONTH_NAMES[nextMonth]} {nextYear}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-square"
                  onClick={goToNextMonth}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Dual Calendars */}
              <div className="flex gap-6">
                <CalendarMonth
                  year={currentYear}
                  month={currentMonth}
                  selectedStart={customStart}
                  selectedEnd={customEnd}
                  onDateClick={handleDateClick}
                />
                <CalendarMonth
                  year={nextYear}
                  month={nextMonth}
                  selectedStart={customStart}
                  selectedEnd={customEnd}
                  onDateClick={handleDateClick}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-300">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-base-200 rounded-lg px-3 py-2">
                    <input
                      type="text"
                      className="bg-transparent text-sm w-28 outline-none text-base-content"
                      value={customStart ? formatDisplayDate(customStart) : ''}
                      placeholder="Start date"
                      readOnly
                    />
                    <span className="text-base-content/40">–</span>
                    <input
                      type="text"
                      className="bg-transparent text-sm w-28 outline-none text-base-content"
                      value={customEnd ? formatDisplayDate(customEnd) : ''}
                      placeholder="End date"
                      readOnly
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleApply}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
