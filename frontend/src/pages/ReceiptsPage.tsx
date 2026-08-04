import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, flexRender,
  type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import { GetTransactions, GetSettings, PrintReceipt } from '../bindings'
import { useSnackbar } from 'notistack'
import { fmtDate, fmtTime, filterTxns, getDateRange, type DatePreset } from '../lib/reports'
import type { Transaction } from '../bindings'
import {
  ReceiptText, Search, Loader2, Printer, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react'

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'this_week' },
  { label: 'Last Week', value: 'last_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Custom', value: 'custom' },
]

function formatID(num: number): string {
  if (!num) return '-'
  return `#${String(num).padStart(6, '0')}`
}

export default function ReceiptsPage() {
  const [allTxns, setAllTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [printerAvailable, setPrinterAvailable] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  // Filters
  const [preset, setPreset] = useState<DatePreset>('today')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [search, setSearch] = useState('')
  const [printing, setPrinting] = useState<string | null>(null)

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

  // Table columns
  const columns = useMemo<ColumnDef<Transaction>[]>(() => [
    {
      id: 'expand',
      header: '',
      cell: ({ row }) => (
        <button
          className="btn btn-ghost btn-xs"
          onClick={() => toggleRow(row.original.id)}
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

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ReceiptText size={28} /> Receipts
        </h1>
        <button className="btn btn-ghost btn-sm gap-1" onClick={loadData}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {DATE_PRESETS.map(p => (
          <button
            key={p.value}
            className={`btn btn-sm ${preset === p.value ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setPreset(p.value)}
          >
            {p.label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            placeholder="Search..."
            className="input input-bordered input-sm pl-9 w-48"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Custom Date Range */}
      {preset === 'custom' && (
        <div className="flex items-center gap-3 bg-base-200 rounded-lg p-3 mb-4">
          <div className="form-control">
            <label className="label py-0"><span className="label-text-alt text-xs">From</span></label>
            <input type="date" className="input input-bordered input-sm w-40" value={customStart} max={customEnd || undefined} onChange={e => setCustomStart(e.target.value)} />
          </div>
          <span className="text-base-content/40 mt-4">→</span>
          <div className="form-control">
            <label className="label py-0"><span className="label-text-alt text-xs">To</span></label>
            <input type="date" className="input input-bordered input-sm w-40" value={customEnd} min={customStart || undefined} onChange={e => setCustomEnd(e.target.value)} />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="text-sm text-base-content/60 mb-3">
        {filtered.length} receipt(s) found
        {!printerAvailable && (
          <span className="ml-2 text-warning text-xs">No printer configured — go to Settings to set one up</span>
        )}
      </div>

      {/* Table */}
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

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-base-content/60">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
          -{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filtered.length)}
          {' '}of {filtered.length}
        </span>
        <div className="flex gap-1">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
