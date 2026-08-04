import { type DayData, type ProductStat, formatFullDay } from '../../../lib/reports'
import { Loader2, Download } from 'lucide-react'

interface DayDetailModalProps {
  selectedDay: DayData
  shopName: string
  taxEnabled: boolean
  topItems: ProductStat[]
  taxCollected: number
  onClose: () => void
  onDownloadPDF: () => void
  downloading: boolean
}

export default function DayDetailModal({
  selectedDay,
  shopName,
  taxEnabled,
  topItems,
  taxCollected,
  onClose,
  onDownloadPDF,
  downloading,
}: DayDetailModalProps) {
  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-xl bg-base-100 p-0 overflow-hidden">
        {/* Report Document */}
        <div className="bg-white">
          {/* Header */}
          <div className="bg-gray-800 text-white px-5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{shopName}</h2>
                <p className="text-gray-300 text-xs">Daily Sales Report</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatFullDay(selectedDay.date)}</p>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="px-5 py-3 border-b border-gray-200">
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-800">{selectedDay.transactions}</p>
                <p className="text-[10px] text-gray-500 uppercase">Transactions</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-primary">₹{selectedDay.revenue.toFixed(0)}</p>
                <p className="text-[10px] text-gray-500 uppercase">Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-600">₹{selectedDay.upi.toFixed(0)}</p>
                <p className="text-[10px] text-gray-500 uppercase">UPI</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-blue-600">₹{selectedDay.cash.toFixed(0)}</p>
                <p className="text-[10px] text-gray-500 uppercase">Cash</p>
              </div>
            </div>
            {/* Tax Summary */}
            {taxEnabled && (
              <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-xs">
                <span className="text-gray-500">Tax Collected</span>
                <span className="font-bold text-purple-600">₹{taxCollected.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Top 3 & Items */}
          <div className="px-5 py-3">
            {/* Top 3 Items */}
            {topItems.length > 0 && (
              <div className="mb-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Top Selling</h3>
                <div className="flex gap-2">
                  {topItems.map((item, i) => (
                    <div key={i} className="flex-1 bg-gray-50 rounded px-2 py-1.5 text-center">
                      <span className="inline-block w-4 h-4 rounded-full bg-gray-800 text-white text-[9px] font-bold leading-4 mr-1">{i + 1}</span>
                      <span className="text-xs font-medium text-gray-700">{item.name}</span>
                      <p className="text-[10px] text-gray-500 mt-0.5">{item.qty} sold</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items Table */}
            {selectedDay.items.length > 0 ? (
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Items Sold ({selectedDay.items.length})
                </h3>
                <div className="border border-gray-200 rounded overflow-hidden max-h-[180px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="text-left py-1.5 px-2 text-gray-500 font-medium">#</th>
                        <th className="text-left py-1.5 px-2 text-gray-500 font-medium">Item</th>
                        <th className="text-right py-1.5 px-2 text-gray-500 font-medium">Qty</th>
                        <th className="text-right py-1.5 px-2 text-gray-500 font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDay.items.map((item, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="py-1.5 px-2 text-gray-400">{i + 1}</td>
                          <td className="py-1.5 px-2 font-medium text-gray-700">{item.name}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-gray-600">{item.qty}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-medium text-gray-700">₹{item.revenue.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan={3} className="py-1.5 px-2 font-bold text-gray-600 text-right">Total</td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-gray-800">
                          ₹{selectedDay.items.reduce((a, item) => a + item.revenue, 0).toFixed(0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-xs">No items data available</div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-5 py-2 flex justify-between text-[10px] text-gray-400 border-t border-gray-200">
            <span>Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            <span>{shopName}</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-5 py-3 flex justify-end gap-2 bg-white border-t border-gray-200">
          <button
            className="btn btn-primary btn-sm gap-1"
            onClick={onDownloadPDF}
            disabled={downloading}
          >
            {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            PDF
          </button>
          <button className="btn btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  )
}
