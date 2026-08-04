import { vi } from 'vitest'

// Model classes
export class Product {
  id = ''
  name = ''
  price = 0
  tax_rate = 0
  image_data = ''
  active = false
  created = ''
  constructor(s: any = {}) {
    Object.assign(this, s || {})
  }
}

export class CartItem {
  product_id = ''
  name = ''
  qty = 0
  price = 0
  tax_rate = 0
  subtotal = 0
  tax_amount = 0
  constructor(s: any = {}) {
    Object.assign(this, s || {})
  }
}

export class Transaction {
  id = ''
  items: CartItem[] = []
  subtotal = 0
  tax_total = 0
  total = 0
  payment_method = ''
  created = ''
  constructor(s: any = {}) {
    Object.assign(this, s || {})
    this.items = (s?.items || []).map((i: any) => new CartItem(i))
  }
}

export class Settings {
  id = ''
  shop_name = ''
  upi_vpa = ''
  merchant_name = ''
  admin_pin = ''
  theme = 'light'
  tax_enabled = false
  default_tax_rate = 0
  backup_enabled = false
  backup_folder = ''
  backup_retention_days = 30
  display_screen = 0
  display_screen_name = ''
  display_screen_width = 0
  display_screen_height = 0
  printer_name = ''
  auto_print = true
  paper_width = 80
  constructor(s: any = {}) {
    Object.assign(this, s || {})
  }
}

export class ReportSummary {
  date = ''
  total_transactions = 0
  total_revenue = 0
  total_tax = 0
  upi_transactions = 0
  cash_transactions = 0
  constructor(s: any = {}) {
    Object.assign(this, s || {})
  }
}

// Models namespace
export const models = { Product, CartItem, Transaction, Settings, ReportSummary }
export type models = typeof models

// Mock service method wrappers
export const GetSettings = vi.fn().mockResolvedValue(new Settings())
export const SaveSettings = vi.fn().mockResolvedValue(undefined)
export const IsSetupComplete = vi.fn().mockResolvedValue(true)
export const GetProducts = vi.fn().mockResolvedValue([])
export const CreateProduct = vi.fn().mockImplementation((p: Product) => Promise.resolve(p))
export const UpdateProduct = vi.fn().mockResolvedValue(undefined)
export const DeleteProduct = vi.fn().mockResolvedValue(undefined)
export const GetUPIString = vi.fn().mockResolvedValue('upi://pay?pa=test@upi&pn=Test')
export const CreateTransaction = vi.fn().mockImplementation((t: Transaction) => Promise.resolve(t))
export const GetTransactions = vi.fn().mockResolvedValue([])
export const GetDailyReport = vi.fn().mockResolvedValue(new ReportSummary())
export const GetWeeklyReport = vi.fn().mockResolvedValue([])
export const ExportTransactionsCSV = vi.fn().mockResolvedValue('/tmp/test.csv')
export const OpenCustomerDisplay = vi.fn().mockResolvedValue(undefined)
export const CloseCustomerDisplay = vi.fn().mockResolvedValue(undefined)
export const UpdateCustomerDisplay = vi.fn().mockResolvedValue(undefined)
export const ShowQROnDisplay = vi.fn().mockResolvedValue(undefined)
export const ClearCustomerDisplay = vi.fn().mockResolvedValue(undefined)
export const SendProductsToDisplay = vi.fn().mockResolvedValue(undefined)
export const SendPaymentMethodToDisplay = vi.fn().mockResolvedValue(undefined)
export const ConfirmPayment = vi.fn().mockResolvedValue(undefined)
export const SelectFolder = vi.fn().mockResolvedValue('/tmp/test')
export const SelectSaveFile = vi.fn().mockResolvedValue('/tmp/test.csv')
export const ExportTransactionsCSVToDir = vi.fn().mockResolvedValue('/tmp/test.csv')
export const GetAvailableScreens = vi.fn().mockResolvedValue([])
export const GetAvailablePrinters = vi.fn().mockResolvedValue([])
export const PrintReceipt = vi.fn().mockResolvedValue(undefined)
