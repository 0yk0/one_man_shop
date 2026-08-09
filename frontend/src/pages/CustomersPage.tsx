import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GetCustomers,
  CreateCustomer,
  UpdateCustomer,
  DeleteCustomer,
  GetCustomersCSVContent,
  SelectFolder,
  IsMobile,
} from '../bindings'
import CustomerForm from '../components/Customers/CustomerForm'
import { useSnackbar } from 'notistack'
import { Plus, Pencil, Trash2, Users, Loader2, Search, Download } from 'lucide-react'
import { sounds } from '../lib/sounds'
import { saveFileWithDialog } from '../lib/saveFile'

type Customer = import("../bindings").Customer

export default function CustomersPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    IsMobile().then(setIsMobile)
  }, [])

  const loadCustomers = useCallback(async () => {
    try {
      const data = await GetCustomers()
      setCustomers(data)
    } catch (err) {
      console.error('Failed to load customers:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers
    const q = search.toLowerCase()
    return customers.filter(
      c => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    )
  }, [customers, search])

  const handleSave = async (customer: Customer) => {
    try {
      if (customer.id) {
        await UpdateCustomer(customer)
        enqueueSnackbar(`Updated "${customer.name}"`, { variant: 'success' })
      } else {
        await CreateCustomer(customer)
        sounds.create()
        enqueueSnackbar(`Added "${customer.name}"`, { variant: 'success' })
      }
      setShowForm(false)
      setEditingCustomer(null)
      loadCustomers()
    } catch (err) {
      enqueueSnackbar(String(err), { variant: 'error' })
    }
  }

  const handleDeleteClick = (customer: Customer) => {
    setDeletingCustomer(customer)
  }

  const confirmDelete = async () => {
    if (!deletingCustomer) return
    try {
      await DeleteCustomer(deletingCustomer.id)
      sounds.delete()
      enqueueSnackbar(`Deleted "${deletingCustomer.name}"`, { variant: 'success' })
      loadCustomers()
    } catch (err) {
      enqueueSnackbar(String(err), { variant: 'error' })
    } finally {
      setDeletingCustomer(null)
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setShowForm(true)
  }

  const handleAddNew = () => {
    setEditingCustomer(null)
    setShowForm(true)
  }

  const handleViewCustomer = (customer: Customer) => {
    navigate(`/customers/${customer.id}`)
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const isMobileDevice = await IsMobile()
      if (isMobileDevice) {
        const csvContent = await GetCustomersCSVContent()
        const filename = 'customers.csv'
        await saveFileWithDialog('Save Customers CSV', filename, 'text/csv', btoa(csvContent))
      } else {
        const dir = await SelectFolder('Select folder to save CSV')
        if (!dir) {
          setExporting(false)
          return
        }
        // On desktop, get CSV content and save via Go
        const csvContent = await GetCustomersCSVContent()
        const { SaveFile } = await import('../bindings')
        await SaveFile('Save Customers CSV', 'customers.csv', btoa(csvContent))
      }
      enqueueSnackbar('Customers exported successfully', { variant: 'success' })
    } catch (err) {
      enqueueSnackbar('Export failed: ' + String(err), { variant: 'error' })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <p className="text-sm text-base-content/60">
          {customers.length} customer{customers.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2">
          <button
            className="btn btn-outline btn-sm gap-1"
            onClick={handleExportCSV}
            disabled={exporting || customers.length === 0}
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export CSV
          </button>
          <button
            className="btn btn-primary btn-sm hidden sm:flex"
            onClick={handleAddNew}
          >
            <Plus size={16} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {customers.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="input input-bordered w-full pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Mobile: Card Grid */}
      {isMobile ? (
        <div className="grid grid-cols-1 gap-3">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-base-content/40">
              <Users size={40} className="mx-auto mb-2 opacity-30" />
              <p>{customers.length === 0 ? 'No customers yet' : 'No customers found'}</p>
              {customers.length === 0 && (
                <p className="text-sm">Tap "Add Customer" to get started</p>
              )}
            </div>
          ) : (
            filteredCustomers.map(customer => (
              <div
                key={customer.id}
                className="card bg-base-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleViewCustomer(customer)}
              >
                <div className="card-body p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{customer.name}</h3>
                      <p className="text-sm text-base-content/60">{customer.phone}</p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        className="btn btn-sm btn-outline gap-1 min-h-[44px]"
                        onClick={(e) => { e.stopPropagation(); handleEdit(customer) }}
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline btn-error gap-1 min-h-[44px]"
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(customer) }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-12 text-base-content/40">
                        <Users size={40} className="mx-auto mb-2 opacity-30" />
                        <p>{customers.length === 0 ? 'No customers yet' : 'No customers found'}</p>
                        {customers.length === 0 && (
                          <p className="text-sm">Click "Add Customer" to get started</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(customer => (
                      <tr
                        key={customer.id}
                        className="hover cursor-pointer"
                        onClick={() => handleViewCustomer(customer)}
                      >
                        <td className="font-medium">{customer.name}</td>
                        <td>{customer.phone}</td>
                        <td className="text-right">
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={(e) => { e.stopPropagation(); handleEdit(customer) }}
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error"
                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(customer) }}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false)
            setEditingCustomer(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingCustomer && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Customer</h3>
            <p className="py-4">
              Are you sure you want to delete <strong>{deletingCustomer.name}</strong>?
            </p>
            <p className="text-sm text-base-content/60 mb-4">
              Past transactions with this customer will retain their records but won't show customer details.
            </p>
            <div className="modal-action">
              <button className="btn min-h-[44px]" onClick={() => setDeletingCustomer(null)}>
                Cancel
              </button>
              <button className="btn btn-error min-h-[44px]" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setDeletingCustomer(null)}>close</button>
          </form>
        </dialog>
      )}

      {/* Mobile FAB */}
      <button
        className="sm:hidden fixed bottom-[88px] right-4 z-40 btn btn-primary btn-circle w-14 h-14 shadow-lg"
        onClick={handleAddNew}
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
