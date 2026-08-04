import { useState, useEffect, useMemo } from 'react'
import { GetTransactions, GetSettings } from '../../../bindings'
import { type Transaction, toStr, getDayData, type DayData } from '../../../lib/reports'
import { Loader2 } from 'lucide-react'
import { useSnackbar } from 'notistack'
import MonthHeader from './MonthHeader'
import CalendarGrid from './CalendarGrid'
import DayDetailModal from './DayDetailModal'
import { generateDailyReportPDF } from './generatePDF'

export default function CalendarTab() {
  const [allTxns, setAllTxns] = useState<Transaction[]>([])
  const [shopName, setShopName] = useState('One Man Shop')
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const { enqueueSnackbar } = useSnackbar()
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null)

  useEffect(() => {
    Promise.all([
      GetTransactions(50000, 0),
      GetSettings(),
    ])
      .then(([txns, settings]) => {
        setAllTxns(txns)
        setShopName(settings.shop_name || 'One Man Shop')
        setTaxEnabled(settings.tax_enabled)
      })
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

    let startDayOfWeek = firstDay.getDay()
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

    const result: { date: string; day: number; isCurrentMonth: boolean; data: DayData }[] = []

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      const dateStr = toStr(d)
      result.push({ date: dateStr, day: d.getDate(), isCurrentMonth: false, data: getDayData(allTxns, dateStr) })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      const dateStr = toStr(d)
      result.push({ date: dateStr, day: i, isCurrentMonth: true, data: getDayData(allTxns, dateStr) })
    }

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

  // Top items for selected day
  const topItems = useMemo(() => {
    if (!selectedDay) return []
    return [...selectedDay.items].sort((a, b) => b.qty - a.qty).slice(0, 3)
  }, [selectedDay])

  // Tax collected for selected day
  const taxCollected = useMemo(() => {
    if (!selectedDay || !taxEnabled) return 0
    return selectedDay.revenue * 0.18
  }, [selectedDay, taxEnabled])

  const goToPrevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const goToNextMonth = () => setViewDate(new Date(year, month + 1, 1))
  const goToToday = () => {
    const now = new Date()
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  const today = toStr(new Date())

  // PDF Download handler
  const handleDownloadPDF = async () => {
    if (!selectedDay) return
    setDownloading(true)

    try {
      const path = await generateDailyReportPDF(selectedDay, shopName, taxEnabled, topItems, taxCollected)
      if (path) {
        enqueueSnackbar(`PDF saved to ${path}`, { variant: 'success' })
      }
    } catch (err) {
      console.error('PDF generation failed:', err)
      enqueueSnackbar('Failed to generate PDF: ' + String(err), { variant: 'error' })
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-4">
      <MonthHeader
        year={year}
        month={month}
        totalTransactions={monthSummary.totalTransactions}
        totalRevenue={monthSummary.totalRevenue}
        onPrevMonth={goToPrevMonth}
        onNextMonth={goToNextMonth}
        onToday={goToToday}
      />

      <CalendarGrid
        monthData={monthData}
        selectedDay={selectedDay}
        today={today}
        onDayClick={setSelectedDay}
      />

      {selectedDay && (
        <DayDetailModal
          selectedDay={selectedDay}
          shopName={shopName}
          taxEnabled={taxEnabled}
          topItems={topItems}
          taxCollected={taxCollected}
          onClose={() => setSelectedDay(null)}
          onDownloadPDF={handleDownloadPDF}
          downloading={downloading}
        />
      )}
    </div>
  )
}
