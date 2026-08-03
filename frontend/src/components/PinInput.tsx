import { useRef, useState, useEffect, useCallback } from 'react'

interface Props {
  length?: number
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
  disabled?: boolean
  error?: boolean
}

export default function PinInput({ length = 6, value, onChange, autoFocus = true, disabled = false, error = false }: Props) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [focused, setFocused] = useState(autoFocus)

  // Initialize refs array
  const pins = value.split('').concat(Array(length - value.length).fill('')).slice(0, length)

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus()
      inputRefs.current[index]?.select()
    }
  }, [length])

  const handleChange = (index: number, digit: string) => {
    // Only allow digits
    const d = digit.replace(/\D/g, '').slice(-1)
    const newPins = [...pins]
    newPins[index] = d
    const newValue = newPins.join('')
    onChange(newValue)

    // Auto-advance to next input
    if (d && index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (pins[index]) {
        // Clear current digit
        const newPins = [...pins]
        newPins[index] = ''
        onChange(newPins.join(''))
      } else if (index > 0) {
        // Move to previous and clear
        const newPins = [...pins]
        newPins[index - 1] = ''
        onChange(newPins.join(''))
        focusInput(index - 1)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusInput(index - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusInput(index + 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pasted) {
      onChange(pasted)
      // Focus the next empty input or the last one
      const nextEmpty = pasted.length < length ? pasted.length : length - 1
      focusInput(nextEmpty)
    }
  }

  const handleFocus = () => setFocused(true)
  const handleBlur = () => setFocused(false)

  return (
    <div className="flex gap-2 justify-center">
      {pins.map((digit, i) => (
        <input
          key={i}
          ref={el => { inputRefs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          className={`input input-bordered w-12 h-14 text-center text-xl font-mono font-bold tracking-widest
            ${error ? 'input-error border-error' : focused ? 'input-primary' : ''}
          `}
        />
      ))}
    </div>
  )
}
