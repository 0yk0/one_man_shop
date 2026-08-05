import { useState, useEffect, useCallback } from 'react'
import {
  GetProducts,
  CreateProduct,
  UpdateProduct,
  DeleteProduct,
  GetSettings,
  IsMobile,
} from '../bindings'
import ProductForm from '../components/Products/ProductForm'
import { useSnackbar } from 'notistack'
import { Plus, Pencil, Trash2, Package, Loader2 } from 'lucide-react'
import { sounds } from '../lib/sounds'

type Product = import("../bindings").Product

const MAX_PRODUCTS = 50

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    IsMobile().then(setIsMobile)
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      const [prods, settings] = await Promise.all([GetProducts(), GetSettings()])
      setProducts(prods)
      setTaxEnabled(settings.tax_enabled)
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const handleSave = async (product: Product) => {
    try {
      if (product.id) {
        await UpdateProduct(product)
        enqueueSnackbar(`Updated "${product.name}"`, { variant: 'success' })
      } else {
        await CreateProduct(product)
        sounds.create()
        enqueueSnackbar(`Added "${product.name}"`, { variant: 'success' })
      }
      setShowForm(false)
      setEditingProduct(null)
      loadProducts()
    } catch (err) {
      enqueueSnackbar(String(err), { variant: 'error' })
    }
  }

  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product)
  }

  const confirmDelete = async () => {
    if (!deletingProduct) return
    try {
      await DeleteProduct(deletingProduct.id)
      sounds.delete()
      enqueueSnackbar(`Deleted "${deletingProduct.name}"`, { variant: 'success' })
      loadProducts()
    } catch (err) {
      enqueueSnackbar(String(err), { variant: 'error' })
    } finally {
      setDeletingProduct(null)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleAddNew = () => {
    setEditingProduct(null)
    setShowForm(true)
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
          {products.length} of {MAX_PRODUCTS} products
        </p>
        <button
          className="btn btn-primary btn-sm hidden sm:flex"
          onClick={handleAddNew}
          disabled={products.length >= MAX_PRODUCTS}
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Product Count Bar */}
      <div className="mb-4">
        <progress
          className={`progress ${products.length >= MAX_PRODUCTS ? 'progress-error' : 'progress-primary'}`}
          value={products.length}
          max={MAX_PRODUCTS}
        ></progress>
      </div>

      {/* Mobile: Card Grid */}
      {isMobile ? (
        <div className="product-card-grid">
          {products.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-base-content/40">
              <Package size={40} className="mx-auto mb-2 opacity-30" />
              <p>No products yet</p>
              <p className="text-sm">Tap "Add Product" to get started</p>
            </div>
          ) : (
            products.map(product => (
              <div key={product.id} className="card bg-base-100 shadow-sm">
                {product.image_data ? (
                  <img src={product.image_data} alt={product.name} className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 bg-base-200 flex items-center justify-center">
                    <Package size={24} className="opacity-20" />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                  <p className="text-primary font-bold text-sm">₹{product.price.toFixed(2)}</p>
                  {taxEnabled && (
                    <p className="text-xs text-base-content/60">{(product.tax_rate * 100).toFixed(1)}% tax</p>
                  )}
                  <div className="flex gap-1 mt-2">
                    <button
                      className="btn btn-sm btn-outline flex-1 gap-1 min-h-[44px]"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline btn-error gap-1 min-h-[44px]"
                      onClick={() => handleDeleteClick(product)}
                    >
                      <Trash2 size={12} />
                    </button>
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
                  <th>Price</th>
                  {taxEnabled && <th>Tax Rate</th>}
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={taxEnabled ? 4 : 3} className="text-center py-12 text-base-content/40">
                      <Package size={40} className="mx-auto mb-2 opacity-30" />
                      <p>No products yet</p>
                      <p className="text-sm">Click "Add Product" to get started</p>
                    </td>
                  </tr>
                ) : (
                  products.map(product => (
                    <tr key={product.id} className="hover">
                      <td className="font-medium flex items-center gap-2">
                        {product.image_data ? (
                          <img src={product.image_data} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-base-200 flex items-center justify-center">
                            <Package size={14} className="opacity-40" />
                          </div>
                        )}
                        {product.name}
                      </td>
                      <td>₹{product.price.toFixed(2)}</td>
                      {taxEnabled && (
                        <td>{(product.tax_rate * 100).toFixed(1)}%</td>
                      )}
                      <td className="text-right">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => handleDeleteClick(product)}
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

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          taxEnabled={taxEnabled}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false)
            setEditingProduct(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Product</h3>
            <p className="py-4">
              Are you sure you want to delete <strong>{deletingProduct.name}</strong>?
            </p>
            <div className="modal-action">
              <button className="btn min-h-[44px]" onClick={() => setDeletingProduct(null)}>
                Cancel
              </button>
              <button className="btn btn-error min-h-[44px]" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setDeletingProduct(null)}>close</button>
          </form>
        </dialog>
      )}

      {/* Mobile FAB */}
      <button
        className="sm:hidden fixed bottom-[88px] right-4 z-40 btn btn-primary btn-circle w-14 h-14 shadow-lg"
        onClick={handleAddNew}
        disabled={products.length >= MAX_PRODUCTS}
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
