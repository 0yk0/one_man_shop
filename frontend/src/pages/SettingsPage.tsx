import { useState, useEffect } from 'react'
import { useSettings } from '../hooks/useSettings'
import { useSnackbar } from 'notistack'
import { GetAvailableScreens, GetAvailablePrinters, GetDataDir, SelectDataDir, SaveDataDir, IsMobile } from '../bindings'
import { Save, Loader2, Palette, Monitor, Shield, Printer, FolderOpen } from 'lucide-react'
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
    printer_name: '',
    auto_print: true,
    paper_width: 80,
  })
  const [saving, setSaving] = useState(false)
  const [formInitialized, setFormInitialized] = useState(false)
  const [screens, setScreens] = useState<{ index: number; name: string; width: number; height: number }[]>([])
  const [printers, setPrinters] = useState<{ name: string; is_default: boolean }[]>([])
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [changingPin, setChangingPin] = useState(false)
  const [dataDir, setDataDir] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [changingDataDir, setChangingDataDir] = useState(false)

  // Load available screens on mount
  useEffect(() => {
    GetAvailableScreens()
      .then(s => setScreens(s ?? []))
      .catch(() => setScreens([]))
  }, [])

  // Load available printers on mount
  useEffect(() => {
    GetAvailablePrinters()
      .then(p => setPrinters(p ?? []))
      .catch(() => setPrinters([]))
  }, [])

  // Load data dir and platform on mount
  useEffect(() => {
    GetDataDir().then(setDataDir).catch(() => {})
    IsMobile().then(setIsMobile).catch(() => setIsMobile(false))
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
        printer_name: settings.printer_name || '',
        auto_print: settings.auto_print ?? true,
        paper_width: settings.paper_width || 80,
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

  // Validate saved printer is still available (e.g. virtual printer might have stopped)
  useEffect(() => {
    if (!formInitialized || printers.length === 0) return
    setForm(prev => {
      if (!prev.printer_name) return prev // nothing selected, no change
      const match = printers.find(p => p.name === prev.printer_name)
      if (match) return prev // still available
      // Printer no longer available — clear selection
      return { ...prev, printer_name: '' }
    })
  }, [printers, formInitialized])

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
      printer_name: form.printer_name,
      auto_print: form.auto_print,
      paper_width: form.paper_width,
    })
    setSaving(false)
    if (success) {
      enqueueSnackbar('Settings saved successfully', { variant: 'success' })
      onThemeChange(form.theme)
    } else {
      enqueueSnackbar('Failed to save settings', { variant: 'error' })
    }
  }

  const handleChangeDataDir = async () => {
    if (isMobile) return // Not supported on Android
    try {
      setChangingDataDir(true)
      const selected = await SelectDataDir()
      if (selected && selected.length > 0) {
        await SaveDataDir(selected)
        setDataDir(selected)
        enqueueSnackbar('Data directory updated. Restart the app to use the new location.', { variant: 'info' })
      }
    } catch (err) {
      console.error('Failed to change data directory:', err)
    } finally {
      setChangingDataDir(false)
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
      // Include current form values to prevent clobbering unsaved display settings
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
      printer_name: form.printer_name,
      auto_print: form.auto_print,
      paper_width: form.paper_width,
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
    <div className="p-4 md:p-6">
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
            <label className="label"><span className="label-text-alt text-base-content/60 text-wrap">Your UPI Virtual Payment Address (e.g., shop@upi)</span></label>
          </div>

          <div className="form-control w-full">
            <label className="label"><span className="label-text">Merchant Name</span></label>
            <input type="text" className="input input-bordered w-full" value={form.merchant_name} onChange={e => update('merchant_name', e.target.value)} />
          </div>

          <div className="divider"></div>

          <h2 className="card-title flex items-center gap-2"><FolderOpen size={18} />Data Location</h2>

          <div className="form-control w-full">
            <label className="label"><span className="label-text">Data Directory</span></label>
            {isMobile ? (
              <input type="text" className="input input-bordered w-full text-sm" value={dataDir} readOnly />
            ) : (
              <div className="flex gap-2">
                <input type="text" className="input input-bordered flex-1 text-sm" value={dataDir} readOnly />
                <button className="btn btn-outline" onClick={handleChangeDataDir} disabled={changingDataDir}>
                  {changingDataDir ? <Loader2 size={14} className="animate-spin" /> : 'Change'}
                </button>
              </div>
            )}
            <label className="label">
              <span className="label-text-alt text-base-content/60 text-wrap">
                {isMobile 
                  ? 'On Android, data is stored in the app\'s external storage and persists across updates.'
                  : 'Your products, transactions, and settings are stored in this directory.'}
              </span>
            </label>
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
              <label className="label"><span className="label-text-alt text-base-content/60 text-wrap">Per-product tax rates can be set individually</span></label>
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
                <label className="label"><span className="label-text-alt text-base-content/60 text-wrap">Point this to your OneDrive/Dropbox folder</span></label>
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
            <label className="label"><span className="label-text-alt text-base-content/60 text-wrap">Preview applies live. Click Save to keep it.</span></label>
          </div>

          <div className="bg-base-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Preview</p>
            <div className="flex flex-wrap gap-2">
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

          {/* Receipt Printer */}
          <h2 className="card-title flex items-center gap-2"><Printer size={18} />Receipt Printer</h2>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Printer</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.printer_name}
              onChange={e => update('printer_name', e.target.value)}
            >
              <option value="">No Printer (disabled)</option>
              {printers.map(p => (
                <option key={p.name} value={p.name}>
                  {p.name} {p.is_default ? '(Default)' : ''}
                </option>
              ))}
            </select>
            <label className="label">
              <span className="label-text-alt text-base-content/60 text-wrap">
                Select a printer for receipts. Supports thermal (58mm/80mm) and regular printers.
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <input type="checkbox" className="toggle toggle-primary" checked={form.auto_print} onChange={e => update('auto_print', e.target.checked)} />
              <span className="label-text">Auto-print after payment</span>
            </label>
          </div>

          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">Paper Width</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.paper_width}
              onChange={e => update('paper_width', parseInt(e.target.value))}
            >
              <option value={80}>80mm (Standard)</option>
              <option value={58}>58mm (Narrow)</option>
            </select>
            <label className="label">
              <span className="label-text-alt text-base-content/60">Match your thermal paper roll width</span>
            </label>
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

          <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-[calc(var(--app-nav-h,72px)+12px)] bg-base-100 z-10 sm:static sm:bg-transparent sm:mx-0 sm:px-0 sm:pb-0 sm:pt-0">
            <button
              className="btn btn-primary btn-block min-h-[48px] gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
