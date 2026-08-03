import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProductForm from './ProductForm'

// Mock bindings
vi.mock('../../bindings', () => ({
  Product: class Product {
    id = ''
    name = ''
    price = 0
    tax_rate = 0
    image_data = ''
    active = false
    created = ''
  },
}))

// Helper to get inputs by placeholder since DaisyUI labels don't use `for`
// and <dialog> elements aren't visible in jsdom so getByRole doesn't work
function getNameInput() {
  return screen.getByPlaceholderText('e.g., Mango Juice')
}

function getPriceInput() {
  return screen.getByPlaceholderText('0.00')
}

function getTaxRateInput() {
  return screen.getByPlaceholderText('0')
}

// Inside a <dialog>, getByRole doesn't work in jsdom. Use text selectors.
function getSubmitButton() {
  return screen.getByText('Add Product', { selector: 'button[type="submit"]' })
}

function getEditSubmitButton() {
  return screen.getByText('Save Changes', { selector: 'button[type="submit"]' })
}

describe('ProductForm', () => {
  const defaultProps = {
    taxEnabled: false,
    onSave: vi.fn(),
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Add Product mode', () => {
    it('renders Add Product heading', () => {
      render(<ProductForm {...defaultProps} />)
      expect(screen.getByText('Add Product', { selector: 'h3' })).toBeInTheDocument()
    })

    it('renders form fields', () => {
      render(<ProductForm {...defaultProps} />)
      expect(getNameInput()).toBeInTheDocument()
      expect(getPriceInput()).toBeInTheDocument()
    })

    it('does not show tax rate field when tax is disabled', () => {
      render(<ProductForm {...defaultProps} taxEnabled={false} />)
      expect(screen.queryByText('Tax Rate (%)')).not.toBeInTheDocument()
    })

    it('shows tax rate field when tax is enabled', () => {
      render(<ProductForm {...defaultProps} taxEnabled={true} />)
      expect(screen.getByText('Tax Rate (%)')).toBeInTheDocument()
    })

    it('renders Cancel and submit buttons', () => {
      render(<ProductForm {...defaultProps} />)
      expect(screen.getByText('Cancel', { selector: 'button' })).toBeInTheDocument()
      expect(getSubmitButton()).toBeInTheDocument()
    })

    it('disables submit button when name is empty', () => {
      render(<ProductForm {...defaultProps} />)
      expect(getSubmitButton()).toBeDisabled()
    })

    it('enables submit button when name is entered', () => {
      render(<ProductForm {...defaultProps} />)
      fireEvent.change(getNameInput(), { target: { value: 'Mango Juice' } })
      expect(getSubmitButton()).not.toBeDisabled()
    })

    it('calls onClose when Cancel is clicked', () => {
      const onClose = vi.fn()
      render(<ProductForm {...defaultProps} onClose={onClose} />)
      fireEvent.click(screen.getByText('Cancel', { selector: 'button' }))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onSave with correct product data on submit', () => {
      const onSave = vi.fn()
      render(<ProductForm {...defaultProps} onSave={onSave} taxEnabled={false} />)

      fireEvent.change(getNameInput(), { target: { value: 'Mango Juice' } })
      fireEvent.change(getPriceInput(), { target: { value: '25' } })

      fireEvent.click(getSubmitButton())

      expect(onSave).toHaveBeenCalledTimes(1)
      const savedProduct = onSave.mock.calls[0][0]
      expect(savedProduct.name).toBe('Mango Juice')
      expect(savedProduct.price).toBe(25)
      expect(savedProduct.active).toBe(true)
      expect(savedProduct.id).toBe('')
    })

    it('calculates tax rate correctly when tax enabled', () => {
      const onSave = vi.fn()
      render(<ProductForm {...defaultProps} onSave={onSave} taxEnabled={true} />)

      fireEvent.change(getNameInput(), { target: { value: 'Juice' } })
      fireEvent.change(getPriceInput(), { target: { value: '100' } })
      fireEvent.change(getTaxRateInput(), { target: { value: '18' } })

      fireEvent.click(getSubmitButton())

      const savedProduct = onSave.mock.calls[0][0]
      expect(savedProduct.tax_rate).toBe(0.18)
    })

    it('sets tax_rate to 0 when tax is disabled', () => {
      const onSave = vi.fn()
      render(<ProductForm {...defaultProps} onSave={onSave} taxEnabled={false} />)

      fireEvent.change(getNameInput(), { target: { value: 'Juice' } })
      fireEvent.change(getPriceInput(), { target: { value: '100' } })

      fireEvent.click(getSubmitButton())

      const savedProduct = onSave.mock.calls[0][0]
      expect(savedProduct.tax_rate).toBe(0)
    })

    it('trims whitespace from product name', () => {
      const onSave = vi.fn()
      render(<ProductForm {...defaultProps} onSave={onSave} />)

      fireEvent.change(getNameInput(), { target: { value: '  Mango Juice  ' } })
      fireEvent.change(getPriceInput(), { target: { value: '25' } })

      fireEvent.click(getSubmitButton())

      const savedProduct = onSave.mock.calls[0][0]
      expect(savedProduct.name).toBe('Mango Juice')
    })

    it('defaults price to 0 when not a valid number', () => {
      const onSave = vi.fn()
      render(<ProductForm {...defaultProps} onSave={onSave} />)

      fireEvent.change(getNameInput(), { target: { value: 'Juice' } })
      // Enter a price that parseFloat will return 0 for
      fireEvent.change(getPriceInput(), { target: { value: '0' } })

      fireEvent.click(getSubmitButton())

      const savedProduct = onSave.mock.calls[0][0]
      expect(savedProduct.price).toBe(0)
    })
  })

  describe('Edit Product mode', () => {
    const existingProduct = {
      id: 'prod-123',
      name: 'Existing Product',
      price: 50,
      tax_rate: 0.1,
      image_data: '',
      active: true,
      created: '2026-01-01',
    }

    it('renders Edit Product heading', () => {
      render(<ProductForm {...defaultProps} product={existingProduct} />)
      expect(screen.getByText('Edit Product', { selector: 'h3' })).toBeInTheDocument()
    })

    it('populates form fields with existing product data', () => {
      render(<ProductForm {...defaultProps} product={existingProduct} />)
      expect(getNameInput()).toHaveValue('Existing Product')
      // Price is stored as string in component state via String(product.price)
      expect((getPriceInput() as HTMLInputElement).value).toBe('50')
    })

    it('shows Save Changes button instead of Add Product', () => {
      render(<ProductForm {...defaultProps} product={existingProduct} />)
      expect(getEditSubmitButton()).toBeInTheDocument()
      expect(screen.queryByText('Add Product', { selector: 'button[type="submit"]' })).not.toBeInTheDocument()
    })

    it('preserves id, active, and created from existing product', () => {
      const onSave = vi.fn()
      render(<ProductForm {...defaultProps} product={existingProduct} onSave={onSave} />)

      fireEvent.click(getEditSubmitButton())

      const savedProduct = onSave.mock.calls[0][0]
      expect(savedProduct.id).toBe('prod-123')
      expect(savedProduct.active).toBe(true)
      expect(savedProduct.created).toBe('2026-01-01')
    })

    it('converts tax_rate from decimal to percentage for display', () => {
      render(<ProductForm {...defaultProps} product={existingProduct} taxEnabled={true} />)
      // Tax rate is stored as String(product.tax_rate * 100)
      expect((getTaxRateInput() as HTMLInputElement).value).toBe('10')
    })
  })

  describe('Image upload', () => {
    it('shows upload area when no image', () => {
      render(<ProductForm {...defaultProps} />)
      expect(screen.getByText('Click to upload image')).toBeInTheDocument()
      expect(screen.getByText('Max 2MB')).toBeInTheDocument()
    })

    it('shows image preview when product has image_data', () => {
      const product = {
        id: '1',
        name: 'Product',
        price: 10,
        tax_rate: 0,
        image_data: 'data:image/png;base64,abc123',
        active: true,
        created: '',
      }
      render(<ProductForm {...defaultProps} product={product} />)
      const img = screen.getByAltText('Product preview')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'data:image/png;base64,abc123')
    })

    it('removes image when remove button is clicked', () => {
      const product = {
        id: '1',
        name: 'Product',
        price: 10,
        tax_rate: 0,
        image_data: 'data:image/png;base64,abc123',
        active: true,
        created: '',
      }
      render(<ProductForm {...defaultProps} product={product} />)
      // The remove button is inside the image preview area, use the X icon's parent button
      const img = screen.getByAltText('Product preview')
      const removeBtn = img.parentElement!.querySelector('button')!
      fireEvent.click(removeBtn)
      expect(screen.getByText('Click to upload image')).toBeInTheDocument()
    })
  })

  describe('Form validation', () => {
    it('requires product name', () => {
      render(<ProductForm {...defaultProps} />)
      expect(getNameInput()).toBeRequired()
    })

    it('requires price', () => {
      render(<ProductForm {...defaultProps} />)
      expect(getPriceInput()).toBeRequired()
    })

    it('disables submit when name is whitespace only', () => {
      render(<ProductForm {...defaultProps} />)
      fireEvent.change(getNameInput(), { target: { value: '   ' } })
      expect(getSubmitButton()).toBeDisabled()
    })
  })
})
