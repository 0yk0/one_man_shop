import { useState, useEffect } from 'react'
import { Customer } from '../../bindings'
import { Save } from 'lucide-react'

interface Props {
  customer?: Customer | null
  onSave: (customer: Customer) => void
  onClose: () => void
}

export default function CustomerForm({ customer, onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (customer) {
      setName(customer.name)
      setPhone(customer.phone)
    }
  }, [customer])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const c = new Customer()
    if (customer) {
      c.id = customer.id
      c.created = customer.created
    }
    c.name = name.trim()
    c.phone = phone.trim()

    onSave(c)
  }

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md w-[calc(100vw-2rem)]">
        <h3 className="font-bold text-lg mb-4">
          {customer ? 'Edit Customer' : 'Add Customer'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Customer Name *</span>
            </label>
            <input
              type="text"
              placeholder="e.g., John Doe"
              className="input input-bordered w-full"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Phone Number *</span>
            </label>
            <input
              type="tel"
              placeholder="e.g., 9876543210"
              className="input input-bordered w-full"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
            <label className="label">
              <span className="label-text-alt text-base-content/50">
                Used to link transactions to this customer
              </span>
            </label>
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost min-h-[44px]" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary min-h-[44px]" disabled={!name.trim() || !phone.trim()}>
              <Save size={16} />
              {customer ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  )
}
