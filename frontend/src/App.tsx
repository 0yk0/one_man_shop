import { Routes, Route } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { SnackbarProvider } from 'notistack'
import SetupWizard from './components/SetupWizard'
import CustomerDisplay from './components/CustomerDisplay/CustomerDisplay'
import Layout from './components/Layout/Layout'
import POSScreen from './pages/POSScreen'
import ProductsPage from './pages/ProductsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import ReceiptsPage from './pages/ReceiptsPage'
import { IsSetupComplete, SaveSettings, GetSettings } from './bindings'

function App() {
  const [isComplete, setIsComplete] = useState<boolean | null>(null)
  const [setupSaving, setSetupSaving] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [theme, setTheme] = useState<string>('light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    let cancelled = false
    IsSetupComplete()
      .then(async (result) => {
        if (cancelled) return
        setIsComplete(result)
        if (result) {
          try {
            const settings = await GetSettings()
            if (!cancelled) setTheme(settings.theme || 'light')
          } catch {}
        }
      })
      .catch(() => { if (!cancelled) setIsComplete(false) })
    return () => { cancelled = true }
  }, [])

  const handleThemeChange = useCallback((newTheme: string) => {
    setTheme(newTheme)
  }, [])

  const handleSetupComplete = useCallback(async (data: {
    shop_name: string; upi_vpa: string; merchant_name: string; admin_pin: string
  }) => {
    setSetupError(null)
    setSetupSaving(true)
    try {
      await SaveSettings({
        id: '', shop_name: data.shop_name, upi_vpa: data.upi_vpa,
        merchant_name: data.merchant_name, admin_pin: data.admin_pin, theme: 'light',
        tax_enabled: false, default_tax_rate: 0,
        backup_enabled: false, backup_folder: '', backup_retention_days: 30, display_screen: 0,
        display_screen_name: '', display_screen_width: 0, display_screen_height: 0,
        printer_name: '', auto_print: true, paper_width: 80, last_receipt_number: 0,
      })
      setTheme('light')
      setIsComplete(true)
    } catch (err) {
      setSetupError(String(err))
    } finally {
      setSetupSaving(false)
    }
  }, [])

  if (isComplete === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-base-content/60">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isComplete) {
    return (
      <SetupWizard
        saving={setupSaving}
        error={setupError}
        onComplete={handleSetupComplete}
      />
    )
  }

  return (
    <SnackbarProvider
      maxSnack={1}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      autoHideDuration={3000}
      preventDuplicate
    >
      <Routes>
        <Route path="/customer-display" element={<CustomerDisplay />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<POSScreen />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="receipts" element={<ReceiptsPage />} />
          <Route path="settings" element={<SettingsPage currentTheme={theme} onThemeChange={handleThemeChange} />} />
        </Route>
      </Routes>
    </SnackbarProvider>
  )
}

export default App
