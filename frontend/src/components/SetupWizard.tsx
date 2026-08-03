import { useState } from 'react'
import { Store, CreditCard, CheckCircle, ChevronRight, ChevronLeft, Loader2, Shield } from 'lucide-react'
import PinInput from './PinInput'

interface SetupData {
  shop_name: string
  upi_vpa: string
  merchant_name: string
  admin_pin: string
}

interface Props {
  onComplete: (data: SetupData) => void
  saving?: boolean
  error?: string | null
}

const steps = ['Shop Info', 'UPI Setup', 'Security PIN', 'Confirm']

export default function SetupWizard({ onComplete, saving, error }: Props) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<SetupData>({
    shop_name: '',
    upi_vpa: '',
    merchant_name: '',
    admin_pin: '',
  })

  const update = (field: keyof SetupData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const canNext = () => {
    if (step === 0) return data.shop_name.trim().length > 0
    if (step === 1) return data.upi_vpa.trim().length > 0 && data.merchant_name.trim().length > 0
    if (step === 2) return data.admin_pin.length === 6
    return true
  }

  const handleFinish = () => {
    onComplete(data)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-lg bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
              <Store size={28} />
              One Man Shop
            </h1>
            <p className="text-base-content/60 mt-1">Let's set up your POS system</p>
          </div>

          {/* Progress Steps */}
          <ul className="steps steps-horizontal w-full mb-8">
            {steps.map((s, i) => (
              <li key={s} className={`step ${i <= step ? 'step-primary' : ''}`}>
                {s}
              </li>
            ))}
          </ul>

          {/* Error Display */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-[200px]">
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Shop Information</h2>
                <p className="text-sm text-base-content/60">
                  What's the name of your shop? This will be shown on receipts.
                </p>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Shop Name *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Fresh Juice Corner"
                    className="input input-bordered w-full"
                    value={data.shop_name}
                    onChange={e => update('shop_name', e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard size={20} />
                  UPI Payment Setup
                </h2>
                <p className="text-sm text-base-content/60">
                  Enter your UPI details so customers can pay you via QR code.
                </p>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Your Name (Merchant) *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Ramesh Kumar"
                    className="input input-bordered w-full"
                    value={data.merchant_name}
                    onChange={e => update('merchant_name', e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">UPI VPA *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., ramesh@upi"
                    className="input input-bordered w-full"
                    value={data.upi_vpa}
                    onChange={e => update('upi_vpa', e.target.value)}
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/50">
                      This is your UPI ID (Virtual Payment Address)
                    </span>
                  </label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Shield size={20} />
                  Security PIN
                </h2>
                <p className="text-sm text-base-content/60">
                  Set a 6-digit PIN to protect admin settings. Only you should know this PIN.
                </p>
                <div className="flex justify-center py-4">
                  <PinInput
                    length={6}
                    value={data.admin_pin}
                    onChange={v => update('admin_pin', v)}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-base-content/50 text-center">
                  This PIN will be required to access Products, Reports, and Settings.
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle size={20} />
                  Confirm Setup
                </h2>
                <div className="bg-base-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Shop Name</span>
                    <span className="font-medium">{data.shop_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Merchant</span>
                    <span className="font-medium">{data.merchant_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">UPI VPA</span>
                    <span className="font-medium font-mono">{data.upi_vpa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Admin PIN</span>
                    <span className="font-medium font-mono tracking-widest">{'•'.repeat(6)}</span>
                  </div>
                </div>
                <p className="text-sm text-base-content/60">
                  You can change these later in Settings.
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              className="btn btn-ghost"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0 || saving}
            >
              <ChevronLeft size={16} />
              Back
            </button>

            {step < steps.length - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
              >
                Next
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleFinish}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Start Selling'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
