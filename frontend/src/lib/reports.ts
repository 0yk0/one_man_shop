import { Transaction } from '../bindings'

export type { Transaction }

// ── Date Helpers ─────────────────────────────────────────

// Get Monday of a given week offset (UTC-safe)
export function getMonday(offset: number): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  const day = d.getUTCDay()
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
  d.setUTCDate(diff + offset * 7)
  return d
}

// Convert Date to YYYY-MM-DD string (for comparison in UTC)
export function toStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ── Display Functions (always show LOCAL time) ───────────

// Format date for display: "1 Aug 2026"
export function fmtDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  } catch { return isoString }
}

// Format time for display: "2:30 PM"
export function fmtTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    })
  } catch { return '' }
}

// Format short date for charts: "1 Aug"
export function shortDate(dateStr: string): string {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short'
    })
  } catch { return dateStr }
}

// Day of week for charts: "Mon", "Tue", etc.
export function dayOfWeek(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', {
    weekday: 'short'
  })
}

// ── Filter Helpers ───────────────────────────────────────

export type DatePreset = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'custom'

export function getDateRange(preset: DatePreset, cs?: string, ce?: string): { start: string; end: string } {
  const now = new Date()
  const todayStr = toStr(now)

  if (preset === 'custom' && cs && ce) return { start: cs, end: ce }

  switch (preset) {
    case 'today':
      return { start: todayStr, end: todayStr }

    case 'yesterday': {
      const d = new Date(now)
      d.setUTCDate(d.getUTCDate() - 1)
      return { start: toStr(d), end: toStr(d) }
    }

    case 'this_week': {
      const m = getMonday(0)
      const s = new Date(m)
      s.setUTCDate(s.getUTCDate() + 6)
      return { start: toStr(m), end: toStr(s) }
    }

    case 'last_week': {
      const m = getMonday(-1)
      const s = new Date(m)
      s.setUTCDate(s.getUTCDate() + 6)
      return { start: toStr(m), end: toStr(s) }
    }

    case 'this_month': {
      const f = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      const l = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
      return { start: toStr(f), end: toStr(l) }
    }

    default:
      return { start: todayStr, end: todayStr }
  }
}

// Filter transactions by date range (dates stored as UTC ISO strings)
export function filterTxns(txns: Transaction[], start: string, end: string): Transaction[] {
  return txns.filter(txn => {
    try {
      const txnDate = toStr(new Date(txn.created))
      return txnDate >= start && txnDate <= end
    } catch { return false }
  })
}

// Sum up transaction totals
export function sumTxns(txns: Transaction[]) {
  return txns.reduce((a, t) => ({
    total: a.total + t.total,
    tax: a.tax + t.tax_total,
    upi: a.upi + (t.payment_method === 'upi' ? 1 : 0),
    cash: a.cash + (t.payment_method === 'cash' ? 1 : 0),
  }), { total: 0, tax: 0, upi: 0, cash: 0 })
}

// ── Product Helpers ──────────────────────────────────────

export interface ProductStat {
  name: string
  qty: number
  revenue: number
}

// Get top or least products by quantity sold
export function getTopProducts(
  txns: Transaction[],
  count: number,
  ascending: boolean = false
): ProductStat[] {
  const productMap = new Map<string, ProductStat>()

  for (const txn of txns) {
    for (const item of txn.items || []) {
      const existing = productMap.get(item.product_id) || { name: item.name, qty: 0, revenue: 0 }
      existing.qty += item.qty
      existing.revenue += item.subtotal
      productMap.set(item.product_id, existing)
    }
  }

  const products = Array.from(productMap.values())
  products.sort((a, b) => ascending ? a.qty - b.qty : b.qty - a.qty)
  return products.slice(0, count)
}

// ── Calendar Helpers ─────────────────────────────────────

export interface DayData {
  date: string
  transactions: number
  revenue: number
  upi: number
  cash: number
  items: ProductStat[]
}

// Get data for a specific day
export function getDayData(txns: Transaction[], date: string): DayData {
  const dayTxns = filterTxns(txns, date, date)
  const itemMap = new Map<string, ProductStat>()

  for (const txn of dayTxns) {
    for (const item of txn.items || []) {
      const existing = itemMap.get(item.product_id) || { name: item.name, qty: 0, revenue: 0 }
      existing.qty += item.qty
      existing.revenue += item.subtotal
      itemMap.set(item.product_id, existing)
    }
  }

  return {
    date,
    transactions: dayTxns.length,
    revenue: dayTxns.reduce((a, t) => a + t.total, 0),
    upi: dayTxns.filter(t => t.payment_method === 'upi').reduce((a, t) => a + t.total, 0),
    cash: dayTxns.filter(t => t.payment_method === 'cash').reduce((a, t) => a + t.total, 0),
    items: Array.from(itemMap.values()).sort((a, b) => b.qty - a.qty),
  }
}

// Format month name: "January 2026"
export function formatMonth(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

// Format full day name: "Wednesday, Jan 1, 2026"
export function formatFullDay(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
