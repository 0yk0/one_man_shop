import { Component, type ReactNode } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import type { CustomContentProps } from 'notistack'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
} as const

const styles = {
  success: 'bg-success/15 border-success text-success',
  error: 'bg-error/15 border-error text-error',
  warning: 'bg-warning/15 border-warning text-warning',
  info: 'bg-info/15 border-info text-info',
} as const

interface ErrorBoundaryState {
  hasError: boolean
}

class ToastErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[Toast] Render error:', error)
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

function ToastInner({ message, variant = 'info' }: CustomContentProps) {
  const Icon = icons[variant] || icons.info
  const style = styles[variant] || styles.info
  const text = message ?? ''

  return (
    <div className={`${style} border-l-4 rounded-xl shadow-lg`} role="alert">
      <div className="flex items-center gap-3 px-4 py-3">
        <Icon size={20} className="shrink-0" />
        <span className="flex-1 text-sm font-medium">{text}</span>
      </div>
    </div>
  )
}

export default function Toast(props: CustomContentProps) {
  return (
    <ToastErrorBoundary>
      <ToastInner {...props} />
    </ToastErrorBoundary>
  )
}
