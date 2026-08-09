import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  GetCustomerByID,
  GetTransactionsByCustomerID,
  GetSettings,
  IsMobile,
} from '../bindings'
import { useSnackbar } from 'notistack'
import { ArrowLeft, Loader2, ReceiptText, Calendar, Phone, ChevronDown, ChevronUp, Printer } from 'lucide-react'
import { printReceipt } from '../lib/print'

type Customer = import("../bindings").Customer
type Transaction = import("../bindings").Transaction

function formatID(num: number): string {
  if (!num) return '-'
  return `#${String(num).padStart(6, '0')}`
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-primary text-primary-content',
    'bg-secondary text-secondary-content',
    'bg-accent text-accent-content',
    'bg-info text-info-content',
    'bg-success text-success-content',
    'bg-warning text-warning-content',
    'bg-error text-error-content',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [printing, setPrinting] = useState<string | null>(null)
  const [printerAvailable, setPrinterAvailable] = useState(false)
  const [page, setPage] = useState(0)
  const pageSize = 20

  useEffect(() => {
    IsMobile().then(setIsMobile)
  }, [])

  useEffect(() => {
    GetSettings().then(s => {
      setPrinterAvailable(!!s.printer_name)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const [cust, txns] = await Promise.all([
          GetCustomerByID(id),
          GetTransactionsByCustomerID(id),
        ])
        setCustomer(cust)
        setTransactions(txns ?? [])
      } catch (err) {
        console.error('Failed to load customer:', err)
        enqueueSnackbar('Failed to load customer details', { variant: 'error' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, enqueueSnackbar])

  const stats = useMemo(() => {
    const totalSpent = transactions.reduce((sum, t) => sum + t.total, 0)
    const avgOrder = transactions.length > 0 ? totalSpent / transactions.length : 0
    const lastVisit = transactions.length > 0 ? transactions[0].created : null
    return { totalSpent, avgOrder, count: transactions.length, lastVisit }
  }, [transactions])

  const totalPages = Math.ceil(transactions.length / pageSize)
  const paginatedTxns = useMemo(() => {
    const start = page * pageSize
    return transactions.slice(start, start + pageSize)
  }, [transactions, page])

  const toggleRow = (txnId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(txnId)) next.delete(txnId)
      else next.add(txnId)
      return next
    })
  }

  const handlePrint = async (txn: Transaction) => {
    setPrinting(txn.id)
    try {
      await printReceipt(txn)
      enqueueSnackbar(`Receipt #${String(txn.receipt_number).padStart(6, '0')} printed`, { variant: 'success' })
    } catch (err) {
      enqueueSnackbar('Print failed: ' + String(err), { variant: 'error' })
    } finally {
      setPrinting(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-6 text-center">
        <p className="text-base-content/60 mb-4">Customer not found</p>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/customers')}>
          <ArrowLeft size={16} /> Back to Customers
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          className="btn btn-ghost btn-circle btn-sm"
          onClick={() => navigate('/customers')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Customer Details</h1>
      </div>

      {/* Customer Profile Card */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${getAvatarColor(customer.name)}`}>
              {getInitials(customer.name)}
            </div>
            
            {/* Customer Info */}
            <div className="flex-1">
              <h2 className="text-xl font-bold">{customer.name}</h2>
              <div className="flex items-center gap-2 text-base-content/70 mt-1">
                <Phone size={14} />
                <span>{customer.phone}</span>
              </div>
              {customer.created && (
                <div className="flex items-center gap-2 text-sm text-base-content/50 mt-1">
                  <Calendar size={12} />
                  <span>Member since {formatDate(customer.created)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="stat bg-base-100 rounded-box shadow p-4">
          <div className="stat-title text-xs">Orders</div>
          <div className="stat-value text-primary text-2xl">{stats.count}</div>
          <div className="stat-desc text-xs">
            {stats.count === 1 ? 'transaction' : 'transactions'}
          </div>
        </div>

        <div className="stat bg-base-100 rounded-box shadow p-4">
          <div className="stat-title text-xs">Total Spent</div>
          <div className="stat-value text-secondary text-2xl">₹{stats.totalSpent.toFixed(0)}</div>
          <div className="stat-desc text-xs">lifetime value</div>
        </div>

        <div className="stat bg-base-100 rounded-box shadow p-4">
          <div className="stat-title text-xs">Avg Order</div>
          <div className="stat-value text-accent text-2xl">₹{stats.avgOrder.toFixed(0)}</div>
          <div className="stat-desc text-xs">per transaction</div>
        </div>

        <div className="stat bg-base-100 rounded-box shadow p-4">
          <div className="stat-title text-xs">Last Visit</div>
          <div className="stat-value text-info text-lg">
            {stats.lastVisit ? formatDate(stats.lastVisit) : 'N/A'}
          </div>
          <div className="stat-desc text-xs">
            {stats.lastVisit ? formatTime(stats.lastVisit) : 'no visits yet'}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card bg-base-100 shadow-md">
        {transactions.length === 0 ? (
          <div className="card-body">
            <div className="text-center py-12 text-base-content/40">
              <ReceiptText size={40} className="mx-auto mb-2 opacity-30" />
              <p>No transactions yet</p>
              <p className="text-sm">Transactions will appear here after checkout</p>
            </div>
          </div>
        ) : (
          <>
            {/* Pagination */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-base-300">
              <span className="text-xs text-base-content/60">
                {page * pageSize + 1}–{Math.min((page + 1) * pageSize, transactions.length)}
                {' '}of {transactions.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  className="btn btn-ghost btn-sm min-h-[40px] px-3"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  ‹ Prev
                </button>
                <span className="text-xs text-base-content/60 px-2 tabular-nums font-mono">
                  {page + 1}/{totalPages}
                </span>
                <button
                  className="btn btn-ghost btn-sm min-h-[40px] px-3"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next ›
                </button>
              </div>
            </div>

            {isMobile ? (
              /* Mobile Card View */
              <div className="p-2 space-y-2">
                {paginatedTxns.map(txn => {
                  const count = txn.items?.reduce((sum, i) => sum + i.qty, 0) || 0
                  const method = txn.payment_method
                  const isExpanded = expandedRows.has(txn.id)
                  return (
                    <div
                      key={txn.id}
                      className="border border-base-300 rounded-lg p-3 active:bg-base-200 transition-colors"
                    >
                      <button
                        className="w-full text-left"
                        onClick={() => toggleRow(txn.id)}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-mono text-sm font-medium">{formatID(txn.receipt_number)}</span>
                          <span className="text-sm font-mono font-medium">₹{txn.total.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-base-content/60 mt-1">
                          {formatDate(txn.created)} • {formatTime(txn.created)}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-base-content/60">{count} items</span>
                          <span className={`badge badge-sm ${method === 'upi' ? 'badge-primary' : 'badge-secondary'}`}>
                            {method === 'upi' ? 'UPI' : 'Cash'}
                          </span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-base-300 space-y-1">
                          <p className="text-xs font-medium text-base-content/50 mb-2">Items</p>
                          {txn.items?.map((item, j) => (
                            <div key={j} className="flex justify-between text-sm">
                              <span>{item.name} × {item.qty}</span>
                              <span className="font-mono">₹{item.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                          {printerAvailable && (
                            <button
                              className="btn btn-outline btn-xs gap-1 mt-2 w-full"
                              onClick={(e) => { e.stopPropagation(); handlePrint(txn) }}
                              disabled={printing === txn.id}
                            >
                              {printing === txn.id
                                ? <Loader2 size={12} className="animate-spin" />
                                : <Printer size={12} />
                              } Print Receipt
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Desktop Table View */
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Receipt</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th className="text-right">Total</th>
                      <th>Method</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTxns.map(txn => (
                      <>
                        <tr
                          key={txn.id}
                          className="hover cursor-pointer"
                          onClick={() => toggleRow(txn.id)}
                        >
                          <td>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={(e) => { e.stopPropagation(); toggleRow(txn.id) }}
                            >
                              {expandedRows.has(txn.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </td>
                          <td>
                            <span className="font-mono text-sm">{formatID(txn.receipt_number)}</span>
                          </td>
                          <td>
                            <div className="text-sm">{formatDate(txn.created)}</div>
                            <div className="text-xs text-base-content/50">{formatTime(txn.created)}</div>
                          </td>
                          <td>
                            <span className="text-sm">
                              {txn.items?.reduce((sum, i) => sum + i.qty, 0) || 0} items
                            </span>
                          </td>
                          <td className="text-right">
                            <span className="font-mono font-medium">₹{txn.total.toFixed(2)}</span>
                          </td>
                          <td>
                            <span className={`badge badge-sm ${txn.payment_method === 'upi' ? 'badge-primary' : 'badge-secondary'}`}>
                              {txn.payment_method === 'upi' ? 'UPI' : 'Cash'}
                            </span>
                          </td>
                          <td>
                            {printerAvailable && (
                              <button
                                className="btn btn-ghost btn-xs gap-1"
                                onClick={(e) => { e.stopPropagation(); handlePrint(txn) }}
                                disabled={printing === txn.id}
                                title="Print receipt"
                              >
                                {printing === txn.id
                                  ? <Loader2 size={14} className="animate-spin" />
                                  : <Printer size={14} />
                                }
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandedRows.has(txn.id) && (
                          <tr key={`${txn.id}-expanded`}>
                            <td colSpan={7} className="bg-base-200/50 py-3 px-6">
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-base-content/50 mb-2">Items</p>
                                {txn.items?.map((item, j) => (
                                  <div key={j} className="flex justify-between text-sm">
                                    <span>{item.name} × {item.qty}</span>
                                    <span className="font-mono">₹{item.subtotal.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
