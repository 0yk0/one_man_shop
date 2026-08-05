import { useState } from 'react'
import { BarChart3, List, Calendar } from 'lucide-react'
import SummaryTab from '../components/Reports/SummaryTab'
import TransactionsTab from '../components/Reports/TransactionsTab'
import CalendarTab from '../components/Reports/Calendar/CalendarTab'

export default function ReportsPage() {
  const [tab, setTab] = useState<'summary' | 'transactions' | 'calendar'>('summary')

  return (
    <div className="p-4 md:p-6">
      <div className="tabs tabs-boxed mb-4 md:mb-6 w-full md:w-fit">
        <button className={`tab flex-1 md:flex-none ${tab === 'summary' ? 'tab-active' : ''}`} onClick={() => setTab('summary')}>
          <BarChart3 size={16} className="mr-1" />Summary
        </button>
        <button className={`tab flex-1 md:flex-none ${tab === 'transactions' ? 'tab-active' : ''}`} onClick={() => setTab('transactions')}>
          <List size={16} className="mr-1" />Transactions
        </button>
        <button className={`tab flex-1 md:flex-none ${tab === 'calendar' ? 'tab-active' : ''}`} onClick={() => setTab('calendar')}>
          <Calendar size={16} className="mr-1" />Calendar
        </button>
      </div>

      {tab === 'summary' && <SummaryTab />}
      {tab === 'transactions' && <TransactionsTab />}
      {tab === 'calendar' && <CalendarTab />}
    </div>
  )
}
