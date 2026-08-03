import { useState, useEffect } from 'react'
import { useSettings } from '../hooks/useSettings'
import { useSnackbar } from 'notistack'
import { GetAvailableScreens } from '../bindings'
import { Save, Loader2, Palette, Monitor, Shield } from 'lucide-react'
import PinInput from '../components/PinInput'

const DAISYUI_THEMES = [
  'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate',
  'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden',
  'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black',
  'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade',
  'night', 'coffee', 'winter', 'dim', 'nord', 'sunset', 'caramellatte',
  'abyss', 'silk',
]

interface Props {
  currentTheme: string
  onThemeChange: (theme: string) => void
}

export default function SettingsPage({ currentTheme, onThemeChange }: Props) {
  const { settings, loading, error, save } = useSettings()
  const { enqueueSnackbar } = useSnackbar()
  const [form, setForm] = useState({
    shop_name: '',
    upi_vpa: '',
    merchant_name: '',
    theme: currentTheme,
    tax_enabled: false,
    default_tax_rate: 0,
    backup_enabled: false,
    backup_folder: '',
    backup_retention_days: 30,
    display_screen: 0,
    display_screen_name: '',
    display_screen_width: 0,
    display_screen_height: 0,
  })
  const [saving, setSaving] = useState(false)
  const [formInitialized, setFormInitialized] = useState(false)
  const [screens, setScreens] = useState<{ index: number; name: string; width: number; height: number }[]>([])
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [changingPin, setChangingPin] = useState(false)

  // Load available screens on mount
  useEffect(() => {
    GetAvailableScreens()
      .then(s => setScreens(s ?? []))
      .catch(() => setScreens([]))
  }, [])

  // Populate form from DB on initial load
  useEffect(() => {
    if (settings && !formInitialized) {
      setForm({
        shop_name: settings.shop_name,
        upi_vpa: settings.upi_vpa,
        merchant_name: settings.merchant_name,
        theme: settings.theme || currentTheme,
        tax_enabled: settings.tax_enabled,
        default_tax_rate: settings.default_tax_rate * 100,
        backup_enabled: settings.backup_enabled,
        backup_folder: settings.backup_folder,
        backup_retention_days: settings.backup_retention_days,
        display_screen: settings.display_screen ?? 0,
        display_screen_name: settings.display_screen_name || '',
        display_screen_width: settings.display_screen_width || 0,
        display_screen_height: settings.display_screen_height || 0,
      })
      setFormInitialized(true)
    }
  }, [settings, currentTheme, formInitialized])

  // Once screens finish loading, validate the saved display is still connected
  useEffect(() => {
    if (!formInitialized || screens.length === 0) return
    setForm(prev => {
      const match = prev.display_screen_name
        ? screens.find(s => s.name === prev.display_screen_name && s.width === prev.display_screen_width && s.height === prev.display_screen_height)
        : screens.find(s => s.index === prev.display_screen)
      if (match && match.index === prev.display_screen) return prev // already correct
      return {
        ...prev,
        display_screen: match ? match.index : 0,
        display_screen_name: match ? match.name : (screens[0]?.name ?? ''),
        display_screen_width: match ? match.width : (screens[0]?.width ?? 0),
        display_screen_height: match ? match.height : (screens[0]?.height ?? 0),
      }
    })
  }, [screens, formInitialized])

  const update = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))

    // Live preview — only on explicit user change
    if (field === 'theme') {
      onThemeChange(value)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    const success = await save({
      ...settings,
      shop_name: form.shop_name,
      upi_vpa: form.upi_vpa,
      merchant_name: form.merchant_name,
      theme: form.theme,
      tax_enabled: form.tax_enabled,
      default_tax_rate: form.default_tax_rate / 100,
      backup_enabled: form.backup_enabled,
      backup_folder: form.backup_folder,
      backup_retention_days: form.backup_retention_days,
      display_screen: form.display_screen,
      display_screen_name: form.display_screen_name,
      display_screen_width: form.display_screen_width,
      display_screen_height: form.display_screen_height,
    })
    setSaving(false)
    if (success) {
      enqueueSnackbar('Settings saved successfully', { variant: 'success' })
      onThemeChange(form.theme)
    } else {
      enqueueSnackbar('Failed to save settings', { variant: 'error' })
    }
  }

  const handlePinChange = async () => {
    if (!settings) return
    setPinError('')

    // Verify current PIN
    if (settings.admin_pin && currentPin !== settings.admin_pin) {
      setPinError('Current PIN is incorrect')
      return
    }

    // Validate new PIN
    if (newPin.length !== 6) {
      setPinError('New PIN must be 6 digits')
      return
    }

    if (newPin !== confirmPin) {
      setPinError('New PINs do not match')
      return
    }

    if (newPin === settings.admin_pin) {
      setPinError('New PIN must be different from current PIN')
      return
    }

    setChangingPin(true)
    const success = await save({
      ...settings,
      admin_pin: newPin,
    })
    setChangingPin(false)

    if (success) {
      enqueueSnackbar('Admin PIN updated successfully', { variant: 'success' })
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
    } else {
      enqueueSnackbar('Failed to update PIN', { variant: 'error' })
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="alert alert-error">
          <span>Error loading settings: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="card bg-base-100 shadow-md max-w-2xl">
        <div className="card-body">
          <h2 className="card-title">Shop Information</h2>

          <div className="form-control w-full">
            <label className="label"><span className="label-text">Shop Name</span></label>
            <input type="text" className="input input-bordered w-full" value={form.shop_name} onChange={e => update('shop_name', e.target.value)} />
          </div>

          <div className="form-control w-full">
            <label className="label"><span className="label-text">UPI VPA</span></label>
            <input type="text" className="input input-bordered w-full" value={form.upi_vpa} onChange={e => update('upi_vpa', e.target.value)} />
            <label className="label"><span className="label-text-alt text-base-content/60">Your UPI Virtual Payment Address (e.g., shop@upi)</span></label>
          </div>

          <div className="form-control w-full">
            <label className="label"><span className="label-text">Merchant Name</span></label>
            <input type="text" className="input input-bordered w-full" value={form.merchant_name} onChange={e => update('merchant_name', e.target.value)} />
          </div>

          <div className="divider"></div>

          <h2 className="card-title">Tax Settings</h2>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <input type="checkbox" className="toggle toggle-primary" checked={form.tax_enabled} onChange={e => update('tax_enabled', e.target.checked)} />
              <span className="label-text">Enable Tax</span>
            </label>
          </div>

          {form.tax_enabled && (
            <div className="form-control w-full">
              <label className="label"><span className="label-text">Default Tax Rate (%)</span></label>
              <input type="number" min="0" max="100" step="0.5" className="input input-bordered w-full" value={form.default_tax_rate} onChange={e => update('default_tax_rate', parseFloat(e.target.value) || 0)} />
              <label className="label"><span className="label-text-alt text-base-content/60">Per-product tax rates can be set individually</span></label>
            </div>
          )}

          <div className="divider"></div>

          <h2 className="card-title">Backup</h2>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <input type="checkbox" className="toggle toggle-primary" checked={form.backup_enabled} onChange={e => update('backup_enabled', e.target.checked)} />
              <span className="label-text">Enable Nightly Backup</span>
            </label>
          </div>

          {form.backup_enabled && (
            <>
              <div className="form-control w-full">
                <label className="label"><span className="label-text">Backup Folder</span></label>
                <div className="flex gap-2">
                  <input type="text" className="input input-bordered flex-1" value={form.backup_folder} onChange={e => update('backup_folder', e.target.value)} placeholder="/path/to/backup/folder" />
                  <button className="btn btn-outline">Browse</button>
                </div>
                <label className="label"><span className="label-text-alt text-base-content/60">Point this to your OneDrive/Dropbox folder</span></label>
              </div>
              <div className="form-control w-full max-w-xs">
                <label className="label"><span className="label-text">Retention (days)</span></label>
                <input type="number" min="1" max="365" className="input input-bordered w-full" value={form.backup_retention_days} onChange={e => update('backup_retention_days', parseInt(e.target.value) || 30)} />
              </div>
            </>
          )}

          <div className="divider"></div>

          <h2 className="card-title flex items-center gap-2"><Palette size={18} />Appearance</h2>

          <div className="form-control w-full">
            <label className="label"><span className="label-text">Theme</span></label>
            <select className="select select-bordered w-full" value={form.theme} onChange={e => update('theme', e.target.value)}>
              {DAISYUI_THEMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <label className="label"><span className="label-text-alt text-base-content/60">Preview applies live. Click Save to keep it.</span></label>
          </div>

          <div className="bg-base-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Preview</p>
            <div className="flex gap-2">
              <button className="btn btn-primary btn-sm">Primary</button>
              <button className="btn btn-secondary btn-sm">Secondary</button>
              <button className="btn btn-accent btn-sm">Accent</button>
              <button className="btn btn-ghost btn-sm">Ghost</button>
            </div>
            <div className="flex gap-2 items-center">
              <div className="badge badge-primary">Badge</div>
              <div className="badge badge-secondary">Badge</div>
              <div className="badge badge-accent">Badge</div>
            </div>
          </div>

          <div className="divider"></div>

          {/* Customer Display */}
          <h2 className="card-title flex items-center gap-2"><Monitor size={18} />Customer Display</h2>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Display Screen</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.display_screen}
              onChange={e => {
                const idx = parseInt(e.target.value)
                const selected = (screens ?? []).find(s => s.index === idx)
                update('display_screen', idx)
                update('display_screen_name', selected?.name ?? '')
                update('display_screen_width', selected?.width ?? 0)
                update('display_screen_height', selected?.height ?? 0)
              }}
            >
              {(screens ?? []).length === 0 ? (
                <option value={0}>Primary Screen (default)</option>
              ) : (
                screens.map(s => (
                  <option key={s.index} value={s.index}>
                    {s.index === 0 ? 'Primary Screen' : `Screen ${s.index + 1}`}
                    {s.name ? ` (${s.name})` : ''} — {s.width}×{s.height}
                  </option>
                ))
              )}
            </select>
            <label className="label">
              <span className="label-text-alt text-base-content/60 text-wrap">
                Select which screen the customer display opens on.
                Use the "Customer Display" button on the POS screen to open it.
              </span>
            </label>
          </div>

          <div className="divider"></div>

          {/* Security / Admin PIN */}
          <h2 className="card-title flex items-center gap-2"><Shield size={18} />Security</h2>

          <p className="text-sm text-base-content/60">
            Change the 6-digit admin PIN used to protect Products, Reports, and Settings access.
          </p>

          {settings?.admin_pin ? (
            <div className="form-control w-full">
              <label className="label"><span className="label-text">Current PIN</span></label>
              <PinInput
                length={6}
                value={currentPin}
                onChange={setCurrentPin}
                autoFocus={false}
              />
            </div>
          ) : (
            <div className="alert alert-info">
              <span>No PIN is currently set. Enter a new PIN below to enable protection.</span>
            </div>
          )}

          <div className="form-control w-full">
            <label className="label"><span className="label-text">New PIN</span></label>
            <PinInput
              length={6}
              value={newPin}
              onChange={setNewPin}
              autoFocus={false}
            />
          </div>

          <div className="form-control w-full">
            <label className="label"><span className="label-text">Confirm New PIN</span></label>
            <PinInput
              length={6}
              value={confirmPin}
              onChange={setConfirmPin}
              autoFocus={false}
            />
          </div>

          {pinError && (
            <div className="text-sm text-error font-medium">{pinError}</div>
          )}

          {(currentPin || newPin || confirmPin) && (
            <div className="flex justify-end">
              <button
                className="btn btn-outline btn-sm"
                onClick={handlePinChange}
                disabled={changingPin || newPin.length !== 6 || confirmPin.length !== 6}
              >
                {changingPin ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                Update PIN
              </button>
            </div>
          )}

          <div className="card-actions justify-end mt-6">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
