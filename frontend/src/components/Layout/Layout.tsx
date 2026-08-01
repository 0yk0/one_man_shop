import { useState, useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useSettings } from '../../hooks/useSettings'
import { Store, Package, BarChart3, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

interface Props {
  onThemeChange?: (theme: string) => void
}

export default function Layout({ onThemeChange }: Props) {
  const { settings } = useSettings()
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

  return (
    <div className="flex h-screen bg-base-200">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-base-100 shadow-lg flex flex-col transition-all duration-200`}>
        <div className={`${collapsed ? 'px-2 py-3' : 'px-4 py-4'} border-b border-base-300 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {collapsed ? (
            <Store size={22} className="text-primary" />
          ) : (
            <div>
              <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                <Store size={22} />
                {settings?.shop_name || 'One Man Shop'}
              </h1>
              <p className="text-xs text-base-content/60 mt-1">POS System</p>
            </div>
          )}
          {!collapsed && (
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-content'
                  : 'hover:bg-base-300 text-base-content'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title="POS"
          >
            <Store size={20} />
            {!collapsed && <span>POS</span>}
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-content'
                  : 'hover:bg-base-300 text-base-content'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title="Products"
          >
            <Package size={20} />
            {!collapsed && <span>Products</span>}
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-content'
                  : 'hover:bg-base-300 text-base-content'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title="Reports"
          >
            <BarChart3 size={20} />
            {!collapsed && <span>Reports</span>}
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-content'
                  : 'hover:bg-base-300 text-base-content'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title="Settings"
          >
            <Settings size={20} />
            {!collapsed && <span>Settings</span>}
          </NavLink>
        </nav>

        {!collapsed && (
          <div className="p-4 border-t border-base-300 text-xs text-base-content/40">
            v0.1.0
          </div>
        )}

        {collapsed && (
          <div className="p-2 border-t border-base-300 flex justify-center">
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
