import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Wails runtime globally
vi.mock('@wailsio/runtime', () => ({
  Call: { ByID: vi.fn().mockResolvedValue(null) },
}))

// Mock notistack
vi.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn(),
    closeSnackbar: vi.fn(),
  }),
  SnackbarProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock qrcode.react
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => `<div data-testid="qr-code" data-value="${value}" />`,
  QRCodeCanvas: ({ value }: { value: string }) => `<canvas data-testid="qr-code" data-value="${value}" />`,
}))

// Mock recharts
vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => children,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => children,
  PieChart: ({ children }: any) => children,
  Pie: () => null,
  Cell: () => null,
  LineChart: ({ children }: any) => children,
  Line: () => null,
}))
