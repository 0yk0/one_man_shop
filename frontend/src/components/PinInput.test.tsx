import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PinInput from './PinInput'

describe('PinInput', () => {
  it('renders correct number of input boxes', () => {
    render(<PinInput value="" onChange={vi.fn()} />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(6)
  })

  it('renders custom length inputs', () => {
    render(<PinInput length={4} value="" onChange={vi.fn()} />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(4)
  })

  it('displays digits from value prop', () => {
    render(<PinInput value="123456" onChange={vi.fn()} />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs[0]).toHaveValue('1')
    expect(inputs[1]).toHaveValue('2')
    expect(inputs[2]).toHaveValue('3')
    expect(inputs[3]).toHaveValue('4')
    expect(inputs[4]).toHaveValue('5')
    expect(inputs[5]).toHaveValue('6')
  })

  it('calls onChange with digit', () => {
    const onChange = vi.fn()
    render(<PinInput value="" onChange={onChange} />)
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: '7' } })
    expect(onChange).toHaveBeenCalledWith('7')
  })

  it('strips non-digit characters', () => {
    const onChange = vi.fn()
    render(<PinInput value="" onChange={onChange} />)
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'a' } })
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('extracts single digit from multi-char input', () => {
    const onChange = vi.fn()
    render(<PinInput value="" onChange={onChange} />)
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: '3a' } })
    expect(onChange).toHaveBeenCalledWith('3')
  })

  it('Backspace clears current digit', () => {
    const onChange = vi.fn()
    render(<PinInput value="12" onChange={onChange} />)
    const inputs = screen.getAllByRole('textbox')
    fireEvent.keyDown(inputs[1], { key: 'Backspace' })
    expect(onChange).toHaveBeenCalledWith('1')
  })

  it('Backspace on empty moves to previous and clears', () => {
    const onChange = vi.fn()
    render(<PinInput value="12" onChange={onChange} />)
    const inputs = screen.getAllByRole('textbox')
    fireEvent.keyDown(inputs[1], { key: 'Backspace' })
    // First call clears current digit
    expect(onChange).toHaveBeenCalledWith('1')
  })

  it('ArrowLeft moves focus to previous input', () => {
    render(<PinInput value="" onChange={vi.fn()} />)
    const inputs = screen.getAllByRole('textbox')
    fireEvent.keyDown(inputs[2], { key: 'ArrowLeft' })
    expect(inputs[1]).toHaveFocus()
  })

  it('ArrowRight moves focus to next input', () => {
    render(<PinInput value="" onChange={vi.fn()} />)
    const inputs = screen.getAllByRole('textbox')
    fireEvent.keyDown(inputs[0], { key: 'ArrowRight' })
    expect(inputs[1]).toHaveFocus()
  })

  it('applies error styling when error prop is true', () => {
    render(<PinInput value="" onChange={vi.fn()} error />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs[0].className).toContain('input-error')
  })

  it('disables inputs when disabled prop is true', () => {
    render(<PinInput value="" onChange={vi.fn()} disabled />)
    const inputs = screen.getAllByRole('textbox')
    inputs.forEach(input => {
      expect(input).toBeDisabled()
    })
  })

  it('handles paste of digits', () => {
    const onChange = vi.fn()
    render(<PinInput value="" onChange={onChange} />)
    const inputs = screen.getAllByRole('textbox')
    fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => '123456' },
    })
    expect(onChange).toHaveBeenCalledWith('123456')
  })

  it('handles paste of mixed content', () => {
    const onChange = vi.fn()
    render(<PinInput value="" onChange={onChange} />)
    const inputs = screen.getAllByRole('textbox')
    fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => 'abc123def456' },
    })
    expect(onChange).toHaveBeenCalledWith('123456')
  })

  it('truncates paste to max length', () => {
    const onChange = vi.fn()
    render(<PinInput length={4} value="" onChange={onChange} />)
    const inputs = screen.getAllByRole('textbox')
    fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => '12345678' },
    })
    expect(onChange).toHaveBeenCalledWith('1234')
  })
})
