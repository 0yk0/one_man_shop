import { useState, useEffect, useCallback } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useSettings } from '../../hooks/useSettings'
import AdminPinModal from '../AdminPinModal'
import { Store, Monitor, Package, BarChart3, ReceiptText, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Browser } from '@wailsio/runtime'

interface Props {
  onThemeChange?: (theme: string) => void
}

export default function Layout({ onThemeChange }: Props) {
  const { settings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pendingRoute, setPendingRoute] = useState<string | null>(null)
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

  const handleProtectedClick = useCallback((route: string) => {
    if (settings?.admin_pin) {
      setPendingRoute(route)
      setPinModalOpen(true)
    } else {
      navigate(route)
    }
  }, [settings?.admin_pin, navigate])

  const handlePinSuccess = useCallback(() => {
    if (pendingRoute) {
      navigate(pendingRoute)
      setPendingRoute(null)
    }
  }, [pendingRoute, navigate])

  const navItems = [
    { to: '/', icon: Monitor, label: 'POS', end: true },
    { to: '/receipts', icon: ReceiptText, label: 'Receipts', end: false },
    { route: '/products', icon: Package, label: 'Products' },
    { route: '/reports', icon: BarChart3, label: 'Reports' },
    { route: '/settings', icon: Settings, label: 'Settings' },
  ]

  // Desktop sidebar
  const renderDesktopSidebar = () => (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-base-100 shadow-lg flex flex-col transition-all duration-200 hidden md:flex`}>
      <NavLink
        to="/"
        className={`${collapsed ? 'px-2 py-3' : 'px-4 py-4'} border-b border-base-300 flex items-center ${collapsed ? 'justify-center' : ''} hover:bg-base-300 transition-colors ${collapsed ? 'tooltip tooltip-right' : ''}`}
        data-tip={collapsed ? (settings?.shop_name || 'One Man Shop') : undefined}
      >
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <Store size={22} />
          {!collapsed && (settings?.shop_name || 'One Man Shop')}
        </h1>
      </NavLink>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(item => {
          if (item.route) {
            // Protected route
            return (
              <button
                key={item.route}
                onClick={() => handleProtectedClick(item.route)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  location.pathname === item.route
                    ? 'bg-primary text-primary-content'
                    : 'hover:bg-base-300 text-base-content'
                } ${collapsed ? 'justify-center tooltip tooltip-right' : ''}`}
                data-tip={collapsed ? item.label : undefined}
                title={item.label}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          }
          return (
            <NavLink
              key={item.to}
              to={item.to!}
              end={item.end}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-content'
                  : 'hover:bg-base-300 text-base-content'
              } ${collapsed ? 'justify-center tooltip tooltip-right' : ''}`}
              data-tip={collapsed ? item.label : undefined}
              title={item.label}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-base-300">
          <div className="flex items-center justify-between">
            <div className="text-xs text-base-content/40">
              <p>v0.1.0</p>
              <p className="mt-1">Made by <button onClick={() => Browser.OpenURL('https://linkedin.com/in/yatheeshkonduru')} className="hover:text-base-content transition-colors link link-hover">Yatheesh</button></p>
            </div>
            <button
              className="btn btn-ghost btn-xs tooltip tooltip-right"
              data-tip="Collapse sidebar"
              aria-label="Collapse sidebar"
              onClick={() => setCollapsed(true)}
            >
              <PanelLeftClose size={20} />
            </button>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="p-2 border-t border-base-300">
          <button
            className="btn btn-ghost btn-xs w-full tooltip tooltip-right"
            data-tip="Expand sidebar"
            aria-label="Expand sidebar"
            onClick={() => setCollapsed(false)}
          >
            <PanelLeftOpen size={20} />
          </button>
        </div>
      )}
    </aside>
  )

  // Mobile bottom tab bar
  const renderBottomNav = () => (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-[var(--app-nav-h)]">
        {navItems.map(item => {
          if (item.route) {
            return (
              <button
                key={item.route}
                onClick={() => handleProtectedClick(item.route)}
                className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                  location.pathname === item.route
                    ? 'text-primary bg-primary/10'
                    : 'text-base-content/60 active:text-primary active:bg-primary/5'
                }`}
              >
                <item.icon size={22} />
                <span className="text-xs">{item.label}</span>
              </button>
            )
          }
          return (
            <NavLink
              key={item.to}
              to={item.to!}
              end={item.end}
              className={({ isActive }) => `flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-base-content/60 active:text-primary active:bg-primary/5'
              }`}
            >
              <item.icon size={22} />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )

  return (
    <div className="flex h-screen bg-base-200" style={{ '--app-nav-h': '72px' } as React.CSSProperties}>
      {renderDesktopSidebar()}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-[var(--app-nav-h)] md:pb-0 safe-area-top">
        <Outlet />
      </main>

      {renderBottomNav()}

      {/* Admin PIN Modal */}
      <AdminPinModal
        open={pinModalOpen}
        onClose={() => { setPinModalOpen(false); setPendingRoute(null) }}
        onSuccess={handlePinSuccess}
        storedPin={settings?.admin_pin || ''}
      />
    </div>
  )
}
