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

  return (
    <div className="flex h-screen bg-base-200">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-base-100 shadow-lg flex flex-col transition-all duration-200`}>
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
          <NavLink
            to="/"
            end
            className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-primary text-primary-content'
                : 'hover:bg-base-300 text-base-content'
            } ${collapsed ? 'justify-center tooltip tooltip-right' : ''}`}
            data-tip={collapsed ? 'POS' : undefined}
            title="POS"
          >
            <Monitor size={20} />
            {!collapsed && <span>POS</span>}
          </NavLink>

          <NavLink
            to="/receipts"
            className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-primary text-primary-content'
                : 'hover:bg-base-300 text-base-content'
            } ${collapsed ? 'justify-center tooltip tooltip-right' : ''}`}
            data-tip={collapsed ? 'Receipts' : undefined}
            title="Receipts"
          >
            <ReceiptText size={20} />
            {!collapsed && <span>Receipts</span>}
          </NavLink>

          <button
            onClick={() => handleProtectedClick('/products')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
              location.pathname === '/products'
                ? 'bg-primary text-primary-content'
                : 'hover:bg-base-300 text-base-content'
            } ${collapsed ? 'justify-center tooltip tooltip-right' : ''}`}
            data-tip={collapsed ? 'Products' : undefined}
            title="Products"
          >
            <Package size={20} />
            {!collapsed && <span>Products</span>}
          </button>

          <button
            onClick={() => handleProtectedClick('/reports')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
              location.pathname === '/reports'
                ? 'bg-primary text-primary-content'
                : 'hover:bg-base-300 text-base-content'
            } ${collapsed ? 'justify-center tooltip tooltip-right' : ''}`}
            data-tip={collapsed ? 'Reports' : undefined}
            title="Reports"
          >
            <BarChart3 size={20} />
            {!collapsed && <span>Reports</span>}
          </button>

          <button
            onClick={() => handleProtectedClick('/settings')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
              location.pathname === '/settings'
                ? 'bg-primary text-primary-content'
                : 'hover:bg-base-300 text-base-content'
            } ${collapsed ? 'justify-center tooltip tooltip-right' : ''}`}
            data-tip={collapsed ? 'Settings' : undefined}
            title="Settings"
          >
            <Settings size={20} />
            {!collapsed && <span>Settings</span>}
          </button>
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

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
