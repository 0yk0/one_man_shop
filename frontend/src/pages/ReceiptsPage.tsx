import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, flexRender,
  type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import { GetTransactions, GetSettings, PrintReceipt, ExportTransactionsCSVToDir, SelectFolder } from '../bindings'
import { useSnackbar } from 'notistack'
import { fmtDate, fmtTime, filterTxns, getDateRange, type DatePreset } from '../lib/reports'
import type { Transaction } from '../bindings'
import {
  Search, Loader2, Printer, ChevronDown, ChevronUp,
  Download,
} from 'lucide-react'
import DateRangePicker from '../components/ui/DateRangePicker'

function formatID(num: number): string {
  if (!num) return '-'
  return `#${String(num).padStart(6, '0')}`
}

export default function ReceiptsPage() {
  const [allTxns, setAllTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [printerAvailable, setPrinterAvailable] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(() => window.innerWidth < 768)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    const check = () => setIsSmallScreen(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Filters
  const [preset, setPreset] = useState<DatePreset>('today')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [search, setSearch] = useState('')
  const [printing, setPrinting] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  // Table
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created', desc: true }])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [txns, settings] = await Promise.all([
        GetTransactions(50000, 0),
        GetSettings(),
      ])
      setAllTxns(txns ?? [])
      setTaxEnabled(settings.tax_enabled)
    } catch (err) {
      console.error('Failed to load receipts:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Check if printer is available
  useEffect(() => {
    GetSettings().then(s => {
      setPrinterAvailable(!!s.printer_name)
    }).catch(() => {})
  }, [])

  // Filter transactions
  const range = useMemo(() => getDateRange(preset, customStart, customEnd), [preset, customStart, customEnd])
  const filtered = useMemo(() => filterTxns(allTxns, range.start, range.end), [allTxns, range])

  // Toggle row expand
  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Print receipt
  const handlePrint = async (txn: Transaction) => {
    setPrinting(txn.id)
    try {
      await PrintReceipt(txn)
      enqueueSnackbar(`Receipt #${String(txn.receipt_number).padStart(6, '0')} printed`, { variant: 'success' })
    } catch (err) {
      enqueueSnackbar('Print failed: ' + String(err), { variant: 'error' })
    } finally {
      setPrinting(null)
    }
  }

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const dir = await SelectFolder('Select folder to save CSV')
      if (!dir) return
      setExporting(true)
      const path = await ExportTransactionsCSVToDir(range.start, range.end, dir)
      enqueueSnackbar(`CSV exported to ${path}`, { variant: 'success' })
    } catch (err) {
      if (String(err).includes('cancel')) return
      enqueueSnackbar('Export failed: ' + String(err), { variant: 'error' })
    } finally {
      setExporting(false)
    }
  }

  // Table columns
  const columns = useMemo<ColumnDef<Transaction>[]>(() => [
    {
      id: 'expand',
      header: '',
      cell: ({ row }) => (
        <button
          className="btn btn-ghost btn-xs"
          onClick={(e) => { e.stopPropagation(); toggleRow(row.original.id) }}
        >
          {expandedRows.has(row.original.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      ),
      size: 36,
    },
    {
      accessorKey: 'receipt_number',
      header: '#',
      cell: ({ getValue }) => {
        const num = getValue() as number
        return <span className="font-mono text-sm">{formatID(num)}</span>
      },
      size: 90,
    },
    {
      accessorKey: 'created',
      header: 'Date',
      cell: ({ getValue }) => <span className="text-sm">{fmtDate(getValue() as string)}</span>,
      size: 100,
    },
    {
      id: 'time',
      accessorKey: 'created',
      header: 'Time',
      cell: ({ getValue }) => <span className="text-sm text-base-content/60">{fmtTime(getValue() as string)}</span>,
      size: 80,
    },
    {
      id: 'items',
      header: 'Items',
      cell: ({ row }) => {
        const count = row.original.items?.reduce((sum, i) => sum + i.qty, 0) || 0
        return <span className="text-sm">{count} items</span>
      },
      size: 80,
    },
    {
      accessorKey: 'subtotal',
      header: 'Subtotal',
      cell: ({ getValue }) => <span className="text-sm font-mono">₹{(getValue() as number).toFixed(2)}</span>,
      size: 100,
    },
    ...(taxEnabled ? [{
      accessorKey: 'tax_total' as const,
      header: 'Tax',
      cell: ({ getValue }: any) => <span className="text-sm font-mono text-base-content/60">₹{(getValue() as number).toFixed(2)}</span>,
      size: 80,
    }] : []),
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ getValue }) => <span className="text-sm font-mono font-medium">₹{(getValue() as number).toFixed(2)}</span>,
      size: 100,
    },
    {
      accessorKey: 'payment_method',
      header: 'Payment',
      cell: ({ getValue }) => {
        const method = getValue() as string
        return (
          <span className={`badge badge-sm ${method === 'upi' ? 'badge-primary' : 'badge-secondary'}`}>
            {method === 'upi' ? 'UPI' : 'Cash'}
          </span>
        )
      },
      size: 80,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          className="btn btn-ghost btn-xs gap-1"
          onClick={() => handlePrint(row.original)}
          disabled={!printerAvailable || printing === row.original.id}
          title={printerAvailable ? 'Print receipt' : 'No printer configured'}
        >
          {printing === row.original.id
            ? <Loader2 size={14} className="animate-spin" />
            : <Printer size={14} />
          }
        </button>
      ),
      size: 50,
    },
  ], [taxEnabled, expandedRows, printerAvailable, printing])

  // Custom search filter - searches across receipt number, amounts, items, payment method
  const globalFilterFn = useMemo(() => {
    return (row: any, _columnId: string, filterValue: string) => {
      const txn = row.original as Transaction
      const search = filterValue.toLowerCase().trim()
      if (!search) return true

      // Receipt number
      if (String(txn.receipt_number).includes(search)) return true

      // Amounts (total, subtotal, tax)
      if (String(txn.total).includes(search)) return true
      if (String(txn.subtotal).includes(search)) return true
      if (String(txn.tax_total).includes(search)) return true

      // Payment method
      if (txn.payment_method.toLowerCase().includes(search)) return true

      // Item names
      if (txn.items?.some(item => item.name.toLowerCase().includes(search))) return true

      return false
    }
  }, [])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    globalFilterFn: globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* Filter Section */}
      <div className="bg-base-100 border border-base-300 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
          <DateRangePicker
            value={{ preset, customStart, customEnd }}
            onChange={(v) => { setPreset(v.preset); setCustomStart(v.customStart); setCustomEnd(v.customEnd); }}
          />
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Search by #, amount, item..."
                className="input input-bordered w-full pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
                inputMode="search"
              />
            </div>
          </div>
          <button className="btn btn-outline btn-sm gap-1 w-full sm:w-auto" onClick={handleExportCSV} disabled={exporting}>
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Export CSV
          </button>
        </div>
      </div>

      {/* Printer Warning */}
      {!printerAvailable && (
        <div className="text-warning text-xs mb-4">
          No printer configured — go to Settings to set one up
        </div>
      )}

      {/* Table / Mobile Cards */}
      <div className="card bg-base-100 shadow-md">
        {/* Pagination - above table */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-base-300">
          <span className="text-xs text-base-content/60">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            –{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filtered.length)}
            {' '}of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              className="btn btn-ghost btn-sm min-h-[40px] px-3"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              ‹ Prev
            </button>
            <span className="text-xs text-base-content/60 px-2 tabular-nums font-mono">
              {table.getState().pagination.pageIndex + 1}/{table.getPageCount()}
            </span>
            <button
              className="btn btn-ghost btn-sm min-h-[40px] px-3"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next ›
            </button>
          </div>
        </div>

        {isSmallScreen ? (
          /* Mobile Card View */
          <div className="p-2 space-y-2">
            {table.getRowModel().rows.map(row => {
              const txn = row.original
              const count = txn.items?.reduce((sum, i) => sum + i.qty, 0) || 0
              const method = txn.payment_method
              const isExpanded = expandedRows.has(txn.id)
              return (
                <div
                  key={row.id}
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
                      {fmtDate(txn.created)} • {fmtTime(txn.created)}
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
            {table.getRowModel().rows.length === 0 && (
              <div className="text-center py-8 text-base-content/40 text-sm">
                No receipts found
              </div>
            )}
          </div>
        ) : (
          /* Desktop Table View */
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => (
                        <th
                          key={h.id}
                          className={h.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                          onClick={h.column.getToggleSortingHandler()}
                          style={{ width: h.column.getSize() }}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            {{ asc: ' ↑', desc: ' ↓' }[h.column.getIsSorted() as string] ?? ''}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <>
                      <tr
                        key={row.id}
                        className="hover cursor-pointer"
                        onClick={() => toggleRow(row.original.id)}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} style={{ width: cell.column.getSize() }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                      {expandedRows.has(row.original.id) && (
                        <tr key={`${row.id}-expanded`}>
                          <td colSpan={columns.length} className="bg-base-200/50 py-3 px-6">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-base-content/50 mb-2">Items</p>
                              {row.original.items?.map((item, j) => (
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
          </div>
        )}
      </div>
    </div>
  )
}
