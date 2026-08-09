import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CustomerForm from './CustomerForm'

describe('CustomerForm', () => {
  const mockOnSave = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Add Customer form when no customer provided', () => {
    render(<CustomerForm onSave={mockOnSave} onClose={mockOnClose} />)

    expect(screen.getByText('Add Customer', { selector: 'h3' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g., John Doe')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g., 9876543210')).toBeInTheDocument()
  })

  it('renders Edit Customer form when customer provided', () => {
    const customer = { id: '1', name: 'John Doe', phone: '9876543210', created: '' }
    render(<CustomerForm customer={customer} onSave={mockOnSave} onClose={mockOnClose} />)

    expect(screen.getByText('Edit Customer')).toBeInTheDocument()
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('9876543210')).toBeInTheDocument()
    expect(screen.getByText('Save Changes')).toBeInTheDocument()
  })

  it('calls onClose when Cancel button is clicked', () => {
    render(<CustomerForm onSave={mockOnSave} onClose={mockOnClose} />)

    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onSave with new customer when form is submitted', () => {
    render(<CustomerForm onSave={mockOnSave} onClose={mockOnClose} />)

    fireEvent.change(screen.getByPlaceholderText('e.g., John Doe'), { target: { value: 'New Customer' } })
    fireEvent.change(screen.getByPlaceholderText('e.g., 9876543210'), { target: { value: '9876543210' } })
    fireEvent.click(screen.getByText('Add Customer', { selector: 'button' }))

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Customer',
        phone: '9876543210',
      })
    )
  })

  it('calls onSave with updated customer when editing', () => {
    const customer = { id: '1', name: 'John Doe', phone: '9876543210', created: '2026-01-01' }
    render(<CustomerForm customer={customer} onSave={mockOnSave} onClose={mockOnClose} />)

    fireEvent.change(screen.getByPlaceholderText('e.g., John Doe'), { target: { value: 'John Updated' } })
    fireEvent.click(screen.getByText('Save Changes'))

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        name: 'John Updated',
        phone: '9876543210',
        created: '2026-01-01',
      })
    )
  })

  it('disables submit button when name is empty', () => {
    render(<CustomerForm onSave={mockOnSave} onClose={mockOnClose} />)

    fireEvent.change(screen.getByPlaceholderText('e.g., 9876543210'), { target: { value: '9876543210' } })
    expect(screen.getByText('Add Customer', { selector: 'button' })).toBeDisabled()
  })

  it('disables submit button when phone is empty', () => {
    render(<CustomerForm onSave={mockOnSave} onClose={mockOnClose} />)

    fireEvent.change(screen.getByPlaceholderText('e.g., John Doe'), { target: { value: 'John Doe' } })
    expect(screen.getByText('Add Customer', { selector: 'button' })).toBeDisabled()
  })

  it('trims whitespace from name and phone', () => {
    render(<CustomerForm onSave={mockOnSave} onClose={mockOnClose} />)

    fireEvent.change(screen.getByPlaceholderText('e.g., John Doe'), { target: { value: '  John Doe  ' } })
    fireEvent.change(screen.getByPlaceholderText('e.g., 9876543210'), { target: { value: '  9876543210  ' } })
    fireEvent.click(screen.getByText('Add Customer', { selector: 'button' }))

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'John Doe',
        phone: '9876543210',
      })
    )
  })
})
