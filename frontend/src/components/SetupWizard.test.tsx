import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SetupWizard from './SetupWizard'

describe('SetupWizard', () => {
  const defaultProps = {
    onComplete: vi.fn(),
    saving: false,
    error: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the initial step (Shop Info)', () => {
    render(<SetupWizard {...defaultProps} />)
    expect(screen.getByText('One Man Shop')).toBeInTheDocument()
    expect(screen.getByText("Let's set up your POS system")).toBeInTheDocument()
    expect(screen.getByText('Shop Information')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g., Fresh Juice Corner')).toBeInTheDocument()
  })

  it('renders all progress steps', () => {
    render(<SetupWizard {...defaultProps} />)
    expect(screen.getByText('Shop Info')).toBeInTheDocument()
    expect(screen.getByText('UPI Setup')).toBeInTheDocument()
    expect(screen.getByText('Security PIN')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
  })

  it('disables Back button on first step', () => {
    render(<SetupWizard {...defaultProps} />)
    expect(screen.getByRole('button', { name: /Back/ })).toBeDisabled()
  })

  it('disables Next button when shop name is empty', () => {
    render(<SetupWizard {...defaultProps} />)
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled()
  })

  it('enables Next button when shop name is entered', async () => {
    const user = userEvent.setup()
    render(<SetupWizard {...defaultProps} />)
    const input = screen.getByPlaceholderText('e.g., Fresh Juice Corner')
    await user.type(input, 'My Shop')
    expect(screen.getByRole('button', { name: /Next/ })).not.toBeDisabled()
  })

  it('navigates to UPI Setup step', async () => {
    const user = userEvent.setup()
    render(<SetupWizard {...defaultProps} />)
    await user.type(screen.getByPlaceholderText('e.g., Fresh Juice Corner'), 'My Shop')
    await user.click(screen.getByRole('button', { name: /Next/ }))

    expect(screen.getByText('UPI Payment Setup')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g., Ramesh Kumar')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g., ramesh@upi')).toBeInTheDocument()
  })

  it('disables Next on UPI step when fields are empty', async () => {
    const user = userEvent.setup()
    render(<SetupWizard {...defaultProps} />)
    await user.type(screen.getByPlaceholderText('e.g., Fresh Juice Corner'), 'My Shop')
    await user.click(screen.getByRole('button', { name: /Next/ }))

    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled()
  })

  it('enables Next on UPI step when both fields filled', async () => {
    const user = userEvent.setup()
    render(<SetupWizard {...defaultProps} />)
    await user.type(screen.getByPlaceholderText('e.g., Fresh Juice Corner'), 'My Shop')
    await user.click(screen.getByRole('button', { name: /Next/ }))

    await user.type(screen.getByPlaceholderText('e.g., Ramesh Kumar'), 'Ramesh')
    await user.type(screen.getByPlaceholderText('e.g., ramesh@upi'), 'ramesh@upi')

    expect(screen.getByRole('button', { name: /Next/ })).not.toBeDisabled()
  })

  it('navigates to Security PIN step', async () => {
    const user = userEvent.setup()
    render(<SetupWizard {...defaultProps} />)
    // Step 0 → 1
    await user.type(screen.getByPlaceholderText('e.g., Fresh Juice Corner'), 'My Shop')
    await user.click(screen.getByRole('button', { name: /Next/ }))
    // Step 1 → 2
    await user.type(screen.getByPlaceholderText('e.g., Ramesh Kumar'), 'Ramesh')
    await user.type(screen.getByPlaceholderText('e.g., ramesh@upi'), 'ramesh@upi')
    await user.click(screen.getByRole('button', { name: /Next/ }))

    // Step 2: Security PIN
    expect(screen.getByText('Security PIN', { selector: 'h2' })).toBeInTheDocument()
    expect(screen.getByText(/Set a 6-digit PIN/)).toBeInTheDocument()
  })

  it('navigates to Confirm step after entering PIN', async () => {
    const user = userEvent.setup()
    render(<SetupWizard {...defaultProps} />)
    // Step 0 → 1
    await user.type(screen.getByPlaceholderText('e.g., Fresh Juice Corner'), 'My Shop')
    await user.click(screen.getByRole('button', { name: /Next/ }))
    // Step 1 → 2
    await user.type(screen.getByPlaceholderText('e.g., Ramesh Kumar'), 'Ramesh')
    await user.type(screen.getByPlaceholderText('e.g., ramesh@upi'), 'ramesh@upi')
    await user.click(screen.getByRole('button', { name: /Next/ }))
    // Step 2: Enter 6-digit PIN
    const pinInputs = screen.getAllByRole('textbox')
    for (let i = 0; i < 6; i++) {
      await user.type(pinInputs[i], String(i + 1))
    }
    // Click Next to advance to Confirm step
    await user.click(screen.getByRole('button', { name: /Next/ }))

    // Step 3: Confirm
    expect(screen.getByText('Confirm Setup')).toBeInTheDocument()
    expect(screen.getByText('Start Selling')).toBeInTheDocument()
  })

  it('displays entered data on Confirm step', async () => {
    const user = userEvent.setup()
    render(<SetupWizard {...defaultProps} />)
    // Step 0 → 1
    await user.type(screen.getByPlaceholderText('e.g., Fresh Juice Corner'), 'Fresh Juices')
    await user.click(screen.getByRole('button', { name: /Next/ }))
    // Step 1 → 2
    await user.type(screen.getByPlaceholderText('e.g., Ramesh Kumar'), 'Ramesh')
    await user.type(screen.getByPlaceholderText('e.g., ramesh@upi'), 'ramesh@upi')
    await user.click(screen.getByRole('button', { name: /Next/ }))
    // Step 2: Enter PIN
    const pinInputs = screen.getAllByRole('textbox')
    for (let i = 0; i < 6; i++) {
      await user.type(pinInputs[i], String(i + 1))
    }
    // Click Next to advance to Confirm step
    await user.click(screen.getByRole('button', { name: /Next/ }))

    // Step 4 - Confirm
    expect(screen.getByText('Fresh Juices')).toBeInTheDocument()
    expect(screen.getByText('Ramesh')).toBeInTheDocument()
    expect(screen.getByText('ramesh@upi')).toBeInTheDocument()
    expect(screen.getByText('•'.repeat(6))).toBeInTheDocument() // masked PIN
  })

  it('calls onComplete with all data when Start Selling is clicked', async () => {
    const onComplete = vi.fn()
    const user = userEvent.setup()
    render(<SetupWizard {...defaultProps} onComplete={onComplete} />)

    // Step 0 → 1
    await user.type(screen.getByPlaceholderText('e.g., Fresh Juice Corner'), 'Fresh Juices')
    await user.click(screen.getByRole('button', { name: /Next/ }))
    // Step 1 → 2
    await user.type(screen.getByPlaceholderText('e.g., Ramesh Kumar'), 'Ramesh')
    await user.type(screen.getByPlaceholderText('e.g., ramesh@upi'), 'ramesh@upi')
    await user.click(screen.getByRole('button', { name: /Next/ }))
    // Step 2: Enter PIN
    const pinInputs = screen.getAllByRole('textbox')
    for (let i = 0; i < 6; i++) {
      await user.type(pinInputs[i], String(i + 1))
    }
    // Click Next to advance to Confirm step
    await user.click(screen.getByRole('button', { name: /Next/ }))

    // Step 4 - Click Start Selling
    await user.click(screen.getByText('Start Selling'))

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith({
      shop_name: 'Fresh Juices',
      upi_vpa: 'ramesh@upi',
      merchant_name: 'Ramesh',
      admin_pin: '123456',
    })
  })

  it('navigates back to previous steps', async () => {
    const user = userEvent.setup()
    render(<SetupWizard {...defaultProps} />)

    // Step 0 → 1
    await user.type(screen.getByPlaceholderText('e.g., Fresh Juice Corner'), 'My Shop')
    await user.click(screen.getByRole('button', { name: /Next/ }))
    expect(screen.getByText('UPI Payment Setup')).toBeInTheDocument()

    // Step 1 → Back to Step 0
    await user.click(screen.getByRole('button', { name: /Back/ }))
    expect(screen.getByText('Shop Information')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g., Fresh Juice Corner')).toHaveValue('My Shop')
  })

  it('displays error message when error prop is set', () => {
    render(<SetupWizard {...defaultProps} error="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('shows loading state when saving', async () => {
    const user = userEvent.setup()
    render(<SetupWizard {...defaultProps} saving={true} />)
    // Navigate to last step
    await user.type(screen.getByPlaceholderText('e.g., Fresh Juice Corner'), 'My Shop')
    await user.click(screen.getByRole('button', { name: /Next/ }))
    await user.type(screen.getByPlaceholderText('e.g., Ramesh Kumar'), 'Ramesh')
    await user.type(screen.getByPlaceholderText('e.g., ramesh@upi'), 'ramesh@upi')
    await user.click(screen.getByRole('button', { name: /Next/ }))
    // Enter PIN using fireEvent since PinInput handles controlled inputs
    const pinInputs = screen.getAllByRole('textbox')
    for (let i = 0; i < 6; i++) {
      fireEvent.change(pinInputs[i], { target: { value: String(i + 1) } })
    }
    // Click Next to advance to Confirm step
    await user.click(screen.getByRole('button', { name: /Next/ }))

    // When saving, the finish button shows a spinner (Loader2) instead of "Start Selling" text
    // Find the disabled primary button on the Confirm step (it's the last button with btn-primary)
    const allPrimaryBtns = screen.getAllByText('', { selector: 'button' })
    const finishBtn = allPrimaryBtns.find(btn => btn.className.includes('btn-primary') && btn.disabled)
    expect(finishBtn).toBeDefined()
    expect(finishBtn).toBeDisabled()
  })

  it('disables Back button while saving', () => {
    render(<SetupWizard {...defaultProps} saving={true} />)
    expect(screen.getByRole('button', { name: /Back/ })).toBeDisabled()
  })
})
