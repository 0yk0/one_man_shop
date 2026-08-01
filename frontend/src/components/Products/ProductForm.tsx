import { useState, useEffect, useRef } from 'react'
import { Product } from '../../bindings'
import { Upload, X, Save } from 'lucide-react'

interface Props {
  product?: Product | null
  taxEnabled: boolean
  onSave: (product: Product) => void
  onClose: () => void
}

export default function ProductForm({ product, taxEnabled, onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [taxRate, setTaxRate] = useState('')
  const [imageData, setImageData] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (product) {
      setName(product.name)
      setPrice(String(product.price))
      setTaxRate(String(product.tax_rate * 100))
      setImageData(product.image_data || '')
      setImagePreview(product.image_data || '')
    }
  }, [product])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setImageData(dataUrl)
      setImagePreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageData('')
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const p = new Product()
    if (product) {
      p.id = product.id
      p.active = product.active
      p.created = product.created
    } else {
      p.id = ''
      p.active = true
      p.created = ''
    }
    p.name = name.trim()
    p.price = parseFloat(price) || 0
    p.tax_rate = taxEnabled ? (parseFloat(taxRate) || 0) / 100 : 0
    p.image_data = imageData

    onSave(p)
  }

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-4">
          {product ? 'Edit Product' : 'Add Product'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Product Image</span>
            </label>

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-full h-40 object-cover rounded-lg border border-base-300"
                />
                <button
                  type="button"
                  className="btn btn-circle btn-xs btn-error absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-base-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                <div className="text-center">
                  <Upload size={28} className="mx-auto text-base-content/40" />
                  <p className="text-sm text-base-content/60 mt-1">Click to upload image</p>
                  <p className="text-xs text-base-content/40">Max 2MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Product Name *</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Mango Juice"
              className="input input-bordered w-full"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Price (₹) *</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.50"
              placeholder="0.00"
              className="input input-bordered w-full"
              value={price}
              onChange={e => setPrice(e.target.value)}
              required
            />
          </div>

          {taxEnabled && (
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Tax Rate (%)</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="0"
                className="input input-bordered w-full"
                value={taxRate}
                onChange={e => setTaxRate(e.target.value)}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/50">
                  Per-product tax override
                </span>
              </label>
            </div>
          )}

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              <Save size={16} />
              {product ? 'Save Changes' : 'Add Product'}
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
