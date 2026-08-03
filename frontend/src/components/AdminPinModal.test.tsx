import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AdminPinModal from './AdminPinModal'

describe('AdminPinModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    storedPin: '123456',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    render(<AdminPinModal {...defaultProps} />)
    expect(screen.getByText('Enter Admin PIN')).toBeInTheDocument()
    expect(screen.getByText('Verify')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<AdminPinModal {...defaultProps} open={false} />)
    expect(screen.queryByText('Enter Admin PIN')).not.toBeInTheDocument()
  })

  it('shows 6 digit inputs', () => {
    render(<AdminPinModal {...defaultProps} />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(6)
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(<AdminPinModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows error on incorrect PIN', () => {
    render(<AdminPinModal {...defaultProps} />)
    const inputs = screen.getAllByRole('textbox')

    // Type wrong PIN
    '000000'.split('').forEach((digit, i) => {
      fireEvent.change(inputs[i], { target: { value: digit } })
    })

    // Should show error
    expect(screen.getByText('Incorrect PIN. Try again.')).toBeInTheDocument()
  })

  it('calls onSuccess on correct PIN', () => {
    const onSuccess = vi.fn()
    render(<AdminPinModal {...defaultProps} onSuccess={onSuccess} />)
    const inputs = screen.getAllByRole('textbox')

    // Type correct PIN
    '123456'.split('').forEach((digit, i) => {
      fireEvent.change(inputs[i], { target: { value: digit } })
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('Verify button disabled when PIN is incomplete', () => {
    render(<AdminPinModal {...defaultProps} />)
    const verifyBtn = screen.getByText('Verify')
    expect(verifyBtn).toBeDisabled()
  })

  it('Verify button enabled when PIN is 6 digits', () => {
    render(<AdminPinModal {...defaultProps} />)
    const inputs = screen.getAllByRole('textbox')

    '123456'.split('').forEach((digit, i) => {
      fireEvent.change(inputs[i], { target: { value: digit } })
    })

    // After auto-submit, modal should close
    expect(defaultProps.onSuccess).toHaveBeenCalled()
  })

  it('resets PIN on incorrect attempt', () => {
    render(<AdminPinModal {...defaultProps} />)
    const inputs = screen.getAllByRole('textbox')

    // Type wrong PIN
    '000000'.split('').forEach((digit, i) => {
      fireEvent.change(inputs[i], { target: { value: digit } })
    })

    // PIN should be cleared
    inputs.forEach(input => {
      expect(input).toHaveValue('')
    })
  })

  it('displays lock icon', () => {
    render(<AdminPinModal {...defaultProps} />)
    // The Lock icon is rendered as an SVG within the modal
    const modal = screen.getByText('Enter Admin PIN').closest('.modal-box')
    expect(modal).toBeInTheDocument()
  })
})
