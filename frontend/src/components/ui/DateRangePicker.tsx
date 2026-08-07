import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check } from 'lucide-react'
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
const WEEKDAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// ── Helpers ──────────────────────────────────────────────

function toStr(d: Date): string {
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

// Compute actual start/end dates for a preset
function getPresetRange(preset: DatePreset): { start: string; end: string } {
  const today = new Date()
  const todayStr = toStr(today)

  switch (preset) {
    case 'today':
      return { start: todayStr, end: todayStr }

    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yStr = toStr(yesterday)
      return { start: yStr, end: yStr }
    }

    case 'this_week': {
      // Monday to Sunday
      const day = today.getDay()
      const diffToMonday = day === 0 ? -6 : 1 - day
      const monday = new Date(today)
      monday.setDate(today.getDate() + diffToMonday)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return { start: toStr(monday), end: toStr(sunday) }
    }

    case 'last_week': {
      const day = today.getDay()
      const diffToLastMonday = day === 0 ? -13 : -(day + 6)
      const lastMonday = new Date(today)
      lastMonday.setDate(today.getDate() + diffToLastMonday)
      const lastSunday = new Date(lastMonday)
      lastSunday.setDate(lastMonday.getDate() + 6)
      return { start: toStr(lastMonday), end: toStr(lastSunday) }
    }

    case 'this_month': {
      const first = new Date(today.getFullYear(), today.getMonth(), 1)
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return { start: toStr(first), end: toStr(last) }
    }

    case 'custom':
    default:
      return { start: '', end: '' }
  }
}

// ── Single Calendar Month Component ─────────────────────

interface CalendarMonthProps {
  year: number
  month: number
  selectedStart: string
  selectedEnd: string
  onDateClick: (date: Date) => void
  compact?: boolean
}

function CalendarMonth({ year, month, selectedStart, selectedEnd, onDateClick, compact }: CalendarMonthProps) {
  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    let startDayOfWeek = firstDay.getDay()
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

    const totalDays = lastDay.getDate()
    const result: { date: Date; isCurrentMonth: boolean }[] = []

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      result.push({ date: new Date(year, month, -i), isCurrentMonth: false })
    }
    for (let i = 1; i <= totalDays; i++) {
      result.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }
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

  const weekdays = compact ? WEEKDAYS_SHORT : WEEKDAYS

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-0 mb-1">
        {weekdays.map(day => (
          <div key={day} className={`text-center text-base-content/50 py-1 font-medium ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[1px]">
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
                relative min-h-[48px] text-sm tap-scale
                ${!isCurrentMonth ? 'text-base-content/30' : 'text-base-content'}
                ${selected ? 'bg-primary text-primary-content font-medium rounded-full' : ''}
                ${inRange && !selected ? 'bg-primary/10' : ''}
                ${today && !selected ? 'font-bold' : ''}
                ${!selected && !inRange ? 'hover:bg-base-200 rounded-full active:bg-base-300' : ''}
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

  const [viewDate, setViewDate] = useState(() => {
    const d = parseDate(customStart) || new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const [selecting, setSelecting] = useState<'start' | 'end'>('start')
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Close calendar when clicking outside (desktop only)
  useEffect(() => {
    if (isMobile) return
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
  }, [isMobile])

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
      onChange({ preset: 'custom', customStart: dateStr, customEnd: '' })
      setSelecting('end')
    } else {
      if (dateStr < customStart) {
        onChange({ preset: 'custom', customStart: dateStr, customEnd: customStart })
      } else {
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

  // Swipe handling for month navigation
  const touchStartX = useRef(0)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 50) {
      if (delta < 0) goToNextMonth()
      else goToPrevMonth()
    }
  }, [viewDate])

  // Compute the effective date range to highlight on the calendar
  // For presets, compute from the preset. For custom, use the manual values.
  const effectiveRange = useMemo(() => {
    if (preset === 'custom') {
      return { start: customStart, end: customEnd }
    }
    return getPresetRange(preset)
  }, [preset, customStart, customEnd])

  const rangeLabel = effectiveRange.start && effectiveRange.end
    ? `${formatDisplayDate(effectiveRange.start)} – ${formatDisplayDate(effectiveRange.end)}`
    : effectiveRange.start
    ? `${formatDisplayDate(effectiveRange.start)} – Select end`
    : 'Select dates'

  // ── Preset pills (carousel on mobile, sidebar on desktop) ──

  const renderPresets = (mobile: boolean) => {
    if (mobile) {
      return (
        <div className="sticky top-0 z-10 bg-base-100 pt-3 pb-2 border-b border-base-300">
          <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide carousel-fade-edge px-4 pb-1">
            {PRESETS.map(p => (
              <button
                key={p.value}
                type="button"
                className={`
                  shrink-0 snap-start rounded-full px-5 py-2.5 text-sm whitespace-nowrap transition-colors min-h-[40px]
                  ${preset === p.value
                    ? 'bg-primary text-primary-content shadow-sm font-medium'
                    : 'bg-base-200 text-base-content active:bg-base-300'
                  }
                `}
                onClick={() => handlePresetChange(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="w-40 border-r border-base-300 p-3 flex flex-col gap-1">
        {PRESETS.map(p => (
          <button
            key={p.value}
            type="button"
            className={`
              text-left px-3 py-2 text-sm rounded-lg transition-colors
              ${preset === p.value
                ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                : 'text-base-content hover:bg-base-200 border border-transparent'
              }
            `}
            onClick={() => handlePresetChange(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>
    )
  }

  // ── Calendar content (shared between desktop and mobile) ──

  const renderCalendar = (mobile: boolean) => (
    <div className={mobile ? 'p-4' : 'flex-1 p-4'}>
      {/* Step indicator (mobile only, custom mode) */}
      {mobile && preset === 'custom' && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selecting === 'start' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-base-200 text-base-content/50'}`}>
            <span className={`w-2 h-2 rounded-full ${selecting === 'start' ? 'bg-green-500' : 'bg-base-content/30'}`}></span>
            Start
          </div>
          <div className={`w-6 h-[1px] ${selecting === 'end' ? 'bg-orange-400' : 'bg-base-content/20'}`}></div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selecting === 'end' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-base-200 text-base-content/50'}`}>
            <span className={`w-2 h-2 rounded-full ${selecting === 'end' ? 'bg-orange-500' : 'bg-base-content/30'}`}></span>
            End
          </div>
        </div>
      )}

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" className="btn btn-ghost btn-sm btn-square min-h-[44px] min-w-[44px]" onClick={goToPrevMonth}>
          <ChevronLeft size={20} />
        </button>
        <div className={`${mobile ? 'flex gap-6' : 'flex gap-16'}`}>
          <span className={`font-semibold text-base-content ${mobile ? 'text-base' : 'text-sm'}`}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          {!mobile && (
            <span className="text-sm font-semibold text-base-content">
              {MONTH_NAMES[nextMonth]} {nextYear}
            </span>
          )}
        </div>
        <button type="button" className="btn btn-ghost btn-sm btn-square min-h-[44px] min-w-[44px]" onClick={goToNextMonth}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendars with swipe support */}
      <div onTouchStart={mobile ? handleTouchStart : undefined} onTouchEnd={mobile ? handleTouchEnd : undefined}>
        {mobile ? (
          <CalendarMonth
            year={currentYear}
            month={currentMonth}
            selectedStart={effectiveRange.start}
            selectedEnd={effectiveRange.end}
            onDateClick={handleDateClick}
          />
        ) : (
          <div className="flex gap-6">
            <CalendarMonth
              year={currentYear}
              month={currentMonth}
              selectedStart={effectiveRange.start}
              selectedEnd={effectiveRange.end}
              onDateClick={handleDateClick}
            />
            <CalendarMonth
              year={nextYear}
              month={nextMonth}
              selectedStart={effectiveRange.start}
              selectedEnd={effectiveRange.end}
              onDateClick={handleDateClick}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`mt-4 pt-4 border-t border-base-300 ${mobile ? 'space-y-3' : 'flex items-center justify-between'}`}>
        {/* Date range display */}
        <div className={`bg-base-200 rounded-xl px-4 py-2.5 ${mobile ? '' : 'flex items-center gap-2'}`}>
          <span className={`text-sm ${effectiveRange.start ? 'text-base-content' : 'text-base-content/40'}`}>
            {effectiveRange.start ? formatDisplayDate(effectiveRange.start) : 'Start'}
          </span>
          <span className="text-base-content/40">→</span>
          <span className={`text-sm ${effectiveRange.end ? 'text-base-content' : 'text-base-content/40'}`}>
            {effectiveRange.end ? formatDisplayDate(effectiveRange.end) : 'End'}
          </span>
        </div>

        {/* Action buttons */}
        <div className={`flex items-center gap-2 ${mobile ? '' : ''}`}>
          <button type="button" className={`btn btn-ghost min-h-[48px] ${mobile ? 'flex-1' : 'px-4'}`} onClick={handleCancel}>
            Cancel
          </button>
          <button type="button" className={`btn btn-primary min-h-[48px] gap-2 ${mobile ? 'flex-1' : 'px-6'}`} onClick={handleApply}>
            <Check size={16} />
            Apply
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`relative ${isMobile ? 'w-full' : ''}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        className={`btn btn-sm gap-2 ${isMobile ? 'w-full justify-start' : ''} ${preset === 'custom' ? 'btn-primary' : 'btn-outline'}`}
        onClick={toggleCalendar}
      >
        <CalendarIcon size={14} />
        {preset === 'custom' && customStart && customEnd
          ? `${formatDisplayDate(customStart)} – ${formatDisplayDate(customEnd)}`
          : effectiveRange.start && effectiveRange.end
          ? `${formatDisplayDate(effectiveRange.start)} – ${formatDisplayDate(effectiveRange.end)}`
          : PRESETS.find(p => p.value === preset)?.label || 'Select dates'
        }
      </button>

      {/* Desktop: Dropdown */}
      {showCalendar && !isMobile && (
        <div
          className="absolute z-50 mt-2 left-0 bg-base-100 border border-base-300 rounded-xl shadow-xl overflow-hidden"
          style={{ width: '680px' }}
        >
          <div className="flex">
            {renderPresets(false)}
            {renderCalendar(false)}
          </div>
        </div>
      )}

      {/* Mobile: Bottom Sheet */}
      {showCalendar && isMobile && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 sheet-backdrop"
            onClick={handleCancel}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-base-100 sheet-container max-h-[85vh] flex flex-col safe-area-bottom">
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-base-content/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg">Select Dates</h2>
                <p className="text-xs text-base-content/50 mt-0.5">{rangeLabel}</p>
              </div>
              <button className="btn btn-ghost btn-circle min-h-[44px] min-w-[44px]" onClick={handleCancel}>
                <X size={20} />
              </button>
            </div>

            {/* Presets carousel (sticky) */}
            {renderPresets(true)}

            {/* Scrollable calendar area */}
            <div className="flex-1 overflow-auto">
              {renderCalendar(true)}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
