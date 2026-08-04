import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getMonday,
  toStr,
  fmtDate,
  fmtTime,
  shortDate,
  dayOfWeek,
  getDateRange,
  filterTxns,
  sumTxns,
} from './reports'
import { Transaction } from '../bindings'

describe('getMonday', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns Monday of current week when offset is 0', () => {
    vi.useFakeTimers()
    // Set to Wednesday, August 5, 2026
    vi.setSystemTime(new Date('2026-08-05T12:00:00Z'))

    const monday = getMonday(0)
    expect(monday.getUTCDay()).toBe(1) // Monday
    expect(monday.getUTCDate()).toBe(3) // August 3, 2026
  })

  it('returns Monday of previous week when offset is -1', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-05T12:00:00Z'))

    const monday = getMonday(-1)
    expect(monday.getUTCDay()).toBe(1)
    expect(monday.getUTCDate()).toBe(27) // July 27, 2026
  })

  it('returns Monday of next week when offset is 1', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-05T12:00:00Z'))

    const monday = getMonday(1)
    expect(monday.getUTCDay()).toBe(1)
    expect(monday.getUTCDate()).toBe(10) // August 10, 2026
  })
})

describe('toStr', () => {
  it('converts Date to YYYY-MM-DD string', () => {
    const d = new Date('2026-08-02T15:30:00Z')
    expect(toStr(d)).toBe('2026-08-02')
  })

  it('handles midnight', () => {
    const d = new Date('2026-12-25T00:00:00Z')
    expect(toStr(d)).toBe('2026-12-25')
  })
})

describe('fmtDate', () => {
  it('formats ISO string to readable date', () => {
    const result = fmtDate('2026-08-02T12:00:00Z')
    // en-IN format: "2 Aug 2026"
    expect(result).toContain('2')
    expect(result).toContain('2026')
  })

  it('returns "Invalid Date" for invalid input (JS Date behavior)', () => {
    // new Date('invalid') creates an Invalid Date; toLocaleDateString returns "Invalid Date"
    expect(fmtDate('invalid')).toBe('Invalid Date')
  })
})

describe('fmtTime', () => {
  it('formats ISO string to time', () => {
    const result = fmtTime('2026-08-02T14:30:00Z')
    // Should contain time components
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })

  it('returns "Invalid Date" for invalid input (JS Date behavior)', () => {
    // new Date('invalid') creates an Invalid Date; toLocaleTimeString returns "Invalid Date"
    expect(fmtTime('invalid')).toBe('Invalid Date')
  })
})

describe('shortDate', () => {
  it('formats date string to short format', () => {
    const result = shortDate('2026-08-02')
    expect(result).toContain('2')
    expect(result).toContain('Aug')
  })
})

describe('dayOfWeek', () => {
  it('returns day of week', () => {
    // August 3, 2026 is a Monday
    const result = dayOfWeek('2026-08-03')
    expect(result).toBe('Mon')
  })

  it('returns correct day for Sunday', () => {
    // August 2, 2026 is a Sunday
    const result = dayOfWeek('2026-08-02')
    expect(result).toBe('Sun')
  })
})

describe('getDateRange', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Set to Wednesday, August 5, 2026
    vi.setSystemTime(new Date('2026-08-05T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns today for "today" preset', () => {
    const range = getDateRange('today')
    expect(range.start).toBe('2026-08-05')
    expect(range.end).toBe('2026-08-05')
  })

  it('returns yesterday for "yesterday" preset', () => {
    const range = getDateRange('yesterday')
    expect(range.start).toBe('2026-08-04')
    expect(range.end).toBe('2026-08-04')
  })

  it('returns this week for "this_week" preset', () => {
    const range = getDateRange('this_week')
    expect(range.start).toBe('2026-08-03') // Monday
    expect(range.end).toBe('2026-08-09')   // Sunday
  })

  it('returns last week for "last_week" preset', () => {
    const range = getDateRange('last_week')
    expect(range.start).toBe('2026-07-27') // Previous Monday
    expect(range.end).toBe('2026-08-02')   // Previous Sunday
  })

  it('returns this month for "this_month" preset', () => {
    const range = getDateRange('this_month')
    expect(range.start).toBe('2026-08-01')
    expect(range.end).toBe('2026-08-31')
  })

  it('returns custom range when provided', () => {
    const range = getDateRange('custom', '2026-01-01', '2026-12-31')
    expect(range.start).toBe('2026-01-01')
    expect(range.end).toBe('2026-12-31')
  })

  it('returns today for custom without dates', () => {
    const range = getDateRange('custom')
    expect(range.start).toBe('2026-08-05')
    expect(range.end).toBe('2026-08-05')
  })
})

describe('filterTxns', () => {
  const txns: Transaction[] = [
    { id: '1', receipt_number: 1, items: [], subtotal: 10, tax_total: 1, total: 11, payment_method: 'upi', created: '2026-08-01T10:00:00Z' },
    { id: '2', receipt_number: 2, items: [], subtotal: 20, tax_total: 2, total: 22, payment_method: 'cash', created: '2026-08-02T10:00:00Z' },
    { id: '3', receipt_number: 3, items: [], subtotal: 30, tax_total: 3, total: 33, payment_method: 'upi', created: '2026-08-03T10:00:00Z' },
    { id: '4', receipt_number: 4, items: [], subtotal: 40, tax_total: 4, total: 44, payment_method: 'cash', created: '2026-08-04T10:00:00Z' },
  ]

  it('filters transactions within date range', () => {
    const filtered = filterTxns(txns, '2026-08-02', '2026-08-03')
    expect(filtered).toHaveLength(2)
    expect(filtered[0].id).toBe('2')
    expect(filtered[1].id).toBe('3')
  })

  it('returns empty array when no matches', () => {
    const filtered = filterTxns(txns, '2026-09-01', '2026-09-30')
    expect(filtered).toHaveLength(0)
  })

  it('returns all transactions when range covers all', () => {
    const filtered = filterTxns(txns, '2026-01-01', '2026-12-31')
    expect(filtered).toHaveLength(4)
  })
})

describe('sumTxns', () => {
  it('sums transaction totals correctly', () => {
    const txns: Transaction[] = [
      { id: '1', receipt_number: 1, items: [], subtotal: 10, tax_total: 1, total: 11, payment_method: 'upi', created: '' },
      { id: '2', receipt_number: 2, items: [], subtotal: 20, tax_total: 2, total: 22, payment_method: 'cash', created: '' },
      { id: '3', receipt_number: 3, items: [], subtotal: 30, tax_total: 3, total: 33, payment_method: 'upi', created: '' },
    ]

    const result = sumTxns(txns)
    expect(result.total).toBe(66)
    expect(result.tax).toBe(6)
    expect(result.upi).toBe(2)
    expect(result.cash).toBe(1)
  })

  it('returns zeros for empty array', () => {
    const result = sumTxns([])
    expect(result.total).toBe(0)
    expect(result.tax).toBe(0)
    expect(result.upi).toBe(0)
    expect(result.cash).toBe(0)
  })
})
