import { useState } from 'react'
import { BarChart3, List, Calendar } from 'lucide-react'
import SummaryTab from '../components/Reports/SummaryTab'
import TransactionsTab from '../components/Reports/TransactionsTab'
import CalendarTab from '../components/Reports/Calendar/CalendarTab'

export default function ReportsPage() {
  const [tab, setTab] = useState<'summary' | 'transactions' | 'calendar'>('summary')

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2"><BarChart3 size={28} />Reports</h1>
      </div>

      <div className="tabs tabs-boxed mb-6 w-fit">
        <button className={`tab ${tab === 'summary' ? 'tab-active' : ''}`} onClick={() => setTab('summary')}>
          <BarChart3 size={16} className="mr-1" />Summary
        </button>
        <button className={`tab ${tab === 'transactions' ? 'tab-active' : ''}`} onClick={() => setTab('transactions')}>
          <List size={16} className="mr-1" />Transactions
        </button>
        <button className={`tab ${tab === 'calendar' ? 'tab-active' : ''}`} onClick={() => setTab('calendar')}>
          <Calendar size={16} className="mr-1" />Calendar
        </button>
      </div>

      {tab === 'summary' && <SummaryTab />}
      {tab === 'transactions' && <TransactionsTab />}
      {tab === 'calendar' && <CalendarTab />}
    </div>
  )
}
