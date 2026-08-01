import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'
import { GetTransactions, ExportTransactionsCSVToDir, GetSettings, SelectFolder, type Transaction } from '../../bindings'
import { type DatePreset, getDateRange, filterTxns, sumTxns, fmtDate, fmtTime } from '../../lib/reports'
import { useSnackbar } from 'notistack'
import { Loader2, Calendar, Download, Receipt, Clock, Search, ArrowUpDown } from 'lucide-react'
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, flexRender, createColumnHelper, type SortingState } from '@tanstack/react-table'

const col = createColumnHelper<Transaction>()

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Today', value: 'today' }, { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'this_week' }, { label: 'Last Week', value: 'last_week' },
  { label: 'This Month', value: 'this_month' }, { label: 'Custom', value: 'custom' },
]

export default function TransactionsTab() {
  const [allTxns, setAllTxns] = useState<Transaction[]>([])
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [preset, setPreset] = useState<DatePreset>('this_week')
  const [customStart, setCustomStart] = useState(() => new Date().toISOString().split('T')[0])
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split('T')[0])
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const { enqueueSnackbar } = useSnackbar()

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      const txns = await GetTransactions(1000, 0)
      const settings = await GetSettings()
      setAllTxns(txns)
      setTaxEnabled(settings.tax_enabled)
    } catch (err) { console.error('Load error:', err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const range = useMemo(() => getDateRange(preset, customStart, customEnd), [preset, customStart, customEnd])
  const filtered = useMemo(() => filterTxns(allTxns, range.start, range.end), [allTxns, range])
  const stats = useMemo(() => sumTxns(filtered), [filtered])

  useEffect(() => { setPageIndex(0); setExpandedId(null) }, [preset, customStart, customEnd, globalFilter])

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

  // Build columns fresh each render so expand button closure is current
  const columns = useMemo(() => {
    const cols: any[] = [
      col.display({
        id: 'expand', size: 40,
        cell: ({ row }) => (
          <button
            className="btn btn-ghost btn-xs"
            onClick={(e) => { e.stopPropagation(); setExpandedId(row.original.id) }}
          >
            {expandedId === row.original.id ? '−' : '+'}
          </button>
        ),
      }),
      col.accessor('created', { header: 'Date', cell: info => fmtDate(info.getValue()), sortingFn: 'datetime' }),
      col.accessor('created', {
        id: 'time', header: 'Time', enableSorting: false,
        cell: info => <span className="flex items-center gap-1"><Clock size={12} className="text-base-content/40" />{fmtTime(info.getValue())}</span>,
      }),
      col.display({ id: 'itemCount', header: 'Items', cell: ({ row }) => `${row.original.items?.length || 0} items` }),
      col.accessor('subtotal', { header: 'Subtotal', cell: info => `₹${info.getValue().toFixed(2)}`, enableSorting: false }),
      ...(taxEnabled ? [col.accessor('tax_total', { header: 'Tax', cell: info => `₹${info.getValue().toFixed(2)}`, enableSorting: false })] : []),
      col.accessor('total', { header: 'Total', cell: info => <span className="font-medium">₹{info.getValue().toFixed(2)}</span> }),
      col.accessor('payment_method', {
        header: 'Method', enableSorting: false,
        cell: info => <span className={`badge badge-sm ${info.getValue() === 'upi' ? 'badge-primary' : 'badge-secondary'}`}>{info.getValue() === 'upi' ? 'UPI' : 'Cash'}</span>,
      }),
    ]
    return cols
  }, [taxEnabled, expandedId])

  const table = useReactTable({
    data: filtered, columns,
    state: { sorting, globalFilter, pagination: { pageIndex, pageSize: 20 } },
    onSortingChange: setSorting, onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (u) => setPageIndex(typeof u === 'function' ? u({ pageIndex, pageSize: 20 }).pageIndex : u.pageIndex),
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(),
  })

  const totalPages = table.getPageCount()

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="btn-group">
          {PRESETS.map(p => (
            <button key={p.value} className={`btn btn-sm ${preset === p.value ? 'btn-active' : ''}`} onClick={() => setPreset(p.value)}>{p.label}</button>
          ))}
        </div>
        <div className="flex-1"></div>
        <label className="input input-bordered input-sm flex items-center gap-2 w-64">
          <Search size={14} className="text-base-content/40" />
          <input type="text" placeholder="Search..." className="bg-transparent outline-none grow" value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} />
          {globalFilter && <button className="btn btn-ghost btn-xs" onClick={() => setGlobalFilter('')}>✕</button>}
        </label>
        <button className="btn btn-outline btn-sm" onClick={handleExportCSV} disabled={exporting}>
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Export CSV
        </button>
      </div>

      {/* Custom Date Range */}
      {preset === 'custom' && (
        <div className="flex items-center gap-3 bg-base-200 rounded-lg p-3">
          <Calendar size={16} className="text-base-content/60" />
          <div className="form-control"><label className="label py-0"><span className="label-text-alt text-xs">From</span></label>
            <input type="date" className="input input-bordered input-sm w-40" value={customStart} max={customEnd} onChange={e => setCustomStart(e.target.value)} /></div>
          <span className="text-base-content/40 mt-4">→</span>
          <div className="form-control"><label className="label py-0"><span className="label-text-alt text-xs">To</span></label>
            <input type="date" className="input input-bordered input-sm w-40" value={customEnd} min={customStart} onChange={e => setCustomEnd(e.target.value)} /></div>
        </div>
      )}

      {/* Stats Bar */}
      {filtered.length > 0 && (
        <div className="flex gap-6 text-sm bg-base-200 rounded-lg p-3">
          <span>Transactions: <strong>{filtered.length}</strong></span>
          <span>Total: <strong>₹{stats.total.toFixed(2)}</strong></span>
          {taxEnabled && <span>Tax: <strong>₹{stats.tax.toFixed(2)}</strong></span>}
          <span>UPI: <strong>{stats.upi}</strong></span>
          <span>Cash: <strong>{stats.cash}</strong></span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id} className={h.column.getCanSort() ? 'cursor-pointer select-none' : ''} onClick={h.column.getToggleSortingHandler()}>
                        <div className="flex items-center gap-1">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {h.column.getIsSorted() === 'asc' ? ' ↑' : h.column.getIsSorted() === 'desc' ? ' ↓' : h.column.getCanSort() ? <ArrowUpDown size={12} className="text-base-content/30" /> : null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={table.getAllColumns().length} className="text-center py-8 text-base-content/40">
                      <Receipt size={32} className="mx-auto mb-2 opacity-30" />
                      <p>No transactions found</p>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <Fragment key={row.original.id}>
                      <tr className="hover cursor-pointer" onClick={() => setExpandedId(expandedId === row.original.id ? null : row.original.id)}>
                        {row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                      </tr>
                      {expandedId === row.original.id && (
                        <tr><td colSpan={table.getAllColumns().length} className="bg-base-200 p-3">
                          <div className="text-sm space-y-1">
                            <p className="font-medium mb-2">Items:</p>
                            {row.original.items?.map((item, j) => (
                              <div key={j} className="flex justify-between"><span>{item.name} × {item.qty}</span><span>₹{item.subtotal.toFixed(2)}</span></div>
                            ))}
                          </div>
                        </td></tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-base-content/60">
              {filtered.length > 0
                ? `Showing ${pageIndex * 20 + 1}–${Math.min((pageIndex + 1) * 20, filtered.length)} of ${filtered.length}`
                : 'No results'}
            </span>
            <div className="flex items-center gap-1">
              <button className="btn btn-ghost btn-xs" onClick={() => setPageIndex(0)} disabled={pageIndex === 0}>«</button>
              <button className="btn btn-ghost btn-xs" onClick={() => setPageIndex(p => Math.max(0, p - 1))} disabled={pageIndex === 0}>‹</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const page = totalPages <= 7 ? i : pageIndex < 4 ? i : pageIndex >= totalPages - 3 ? totalPages - 7 + i : pageIndex - 3 + i
                return <button key={page} className={`btn btn-xs ${pageIndex === page ? 'btn-active' : 'btn-ghost'}`} onClick={() => setPageIndex(page)}>{page + 1}</button>
              })}
              <button className="btn btn-ghost btn-xs" onClick={() => setPageIndex(p => Math.min(totalPages - 1, p + 1))} disabled={pageIndex >= totalPages - 1}>›</button>
              <button className="btn btn-ghost btn-xs" onClick={() => setPageIndex(totalPages - 1)} disabled={pageIndex >= totalPages - 1}>»</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
