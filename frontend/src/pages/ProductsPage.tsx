import { useState, useEffect, useCallback } from 'react'
import {
  GetProducts,
  CreateProduct,
  UpdateProduct,
  DeleteProduct,
  GetSettings,
} from '../bindings'
import ProductForm from '../components/Products/ProductForm'
import { useSnackbar } from 'notistack'
import { Plus, Pencil, Trash2, Package, Loader2 } from 'lucide-react'

type Product = import("../bindings").Product

const MAX_PRODUCTS = 50

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const { enqueueSnackbar } = useSnackbar()

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-base-content/60 mt-1">
            {products.length} of {MAX_PRODUCTS} products
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleAddNew}
          disabled={products.length >= MAX_PRODUCTS}
        >
          <Plus size={18} />
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

      {/* Product Table */}
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
              <button className="btn" onClick={() => setDeletingProduct(null)}>
                Cancel
              </button>
              <button className="btn btn-error" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setDeletingProduct(null)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  )
}
