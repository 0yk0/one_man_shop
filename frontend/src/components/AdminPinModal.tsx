import { useState, useEffect } from 'react'
import PinInput from './PinInput'
import { Lock, X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  storedPin: string
}

export default function AdminPinModal({ open, onClose, onSuccess, storedPin }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setPin('')
      setError(false)
      setShaking(false)
    }
  }, [open])

  const handleSubmit = () => {
    if (pin === storedPin) {
      onSuccess()
      onClose()
    } else {
      setError(true)
      setShaking(true)
      setPin('')
      setTimeout(() => setShaking(false), 500)
    }
  }

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (pin.length === 6 && !error) {
      handleSubmit()
    }
  }, [pin])

  if (!open) return null

  return (
    <div className="modal modal-open">
      <div className={`modal-box ${shaking ? 'animate-shake' : ''}`}>
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>
          <X size={16} />
        </button>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock size={28} className="text-primary" />
          </div>

          <div className="text-center">
            <h3 className="font-bold text-lg">Enter Admin PIN</h3>
            <p className="text-sm text-base-content/60 mt-1">
              Enter your 6-digit PIN to continue
            </p>
          </div>

          <PinInput
            length={6}
            value={pin}
            onChange={v => { setPin(v); setError(false) }}
            error={error}
          />

          {error && (
            <p className="text-sm text-error font-medium">Incorrect PIN. Try again.</p>
          )}

          <div className="flex gap-2 w-full mt-2">
            <button className="btn btn-ghost flex-1" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary flex-1"
              onClick={handleSubmit}
              disabled={pin.length !== 6}
            >
              Verify
            </button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose} />
    </div>
  )
}
