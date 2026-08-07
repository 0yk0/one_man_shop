import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock child components
vi.mock('../components/Reports/SummaryTab', () => ({
  default: () => <div data-testid="summary-tab">Summary Content</div>,
}))

vi.mock('../components/Reports/TransactionsTab', () => ({
  default: () => <div data-testid="transactions-tab">Transactions Content</div>,
}))

vi.mock('../components/Reports/Calendar/CalendarTab', () => ({
  default: () => <div data-testid="calendar-tab">Calendar Content</div>,
}))

import ReportsPage from './ReportsPage'

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Reports page tabs', () => {
    render(<ReportsPage />)
    expect(screen.getByText('Summary')).toBeInTheDocument()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
    expect(screen.getByText('Calendar')).toBeInTheDocument()
  })

  it('renders Summary, Transactions, and Calendar tabs', () => {
    render(<ReportsPage />)
    expect(screen.getByText('Summary')).toBeInTheDocument()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
    expect(screen.getByText('Calendar')).toBeInTheDocument()
  })

  it('shows Summary tab content by default', () => {
    render(<ReportsPage />)
    expect(screen.getByTestId('summary-tab')).toBeInTheDocument()
    expect(screen.queryByTestId('transactions-tab')).not.toBeInTheDocument()
    expect(screen.queryByTestId('calendar-tab')).not.toBeInTheDocument()
  })

  it('switches to Transactions tab on click', () => {
    render(<ReportsPage />)
    fireEvent.click(screen.getByText('Transactions'))
    expect(screen.getByTestId('transactions-tab')).toBeInTheDocument()
    expect(screen.queryByTestId('summary-tab')).not.toBeInTheDocument()
  })

  it('switches to Calendar tab on click', () => {
    render(<ReportsPage />)
    fireEvent.click(screen.getByText('Calendar'))
    expect(screen.getByTestId('calendar-tab')).toBeInTheDocument()
    expect(screen.queryByTestId('summary-tab')).not.toBeInTheDocument()
  })

  it('switches back to Summary tab', () => {
    render(<ReportsPage />)
    fireEvent.click(screen.getByText('Transactions'))
    expect(screen.getByTestId('transactions-tab')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Summary'))
    expect(screen.getByTestId('summary-tab')).toBeInTheDocument()
    expect(screen.queryByTestId('transactions-tab')).not.toBeInTheDocument()
  })

  it('highlights active tab', () => {
    render(<ReportsPage />)
    const summaryTab = screen.getByText('Summary').closest('button')!
    expect(summaryTab.className).toContain('tab-active')
  })
})
