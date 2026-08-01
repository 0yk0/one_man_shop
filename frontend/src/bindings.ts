// TypeScript wrapper for Go App service methods
import { Call } from '@wailsio/runtime'

// Model classes
export class Product {
  id = ''; name = ''; price = 0; tax_rate = 0; image_data = ''; active = false; created = ''
  constructor(s: any = {}) { Object.assign(this, s || {}) }
}
export class CartItem {
  product_id = ''; name = ''; qty = 0; price = 0; tax_rate = 0; subtotal = 0; tax_amount = 0
  constructor(s: any = {}) { Object.assign(this, s || {}) }
}
export class Transaction {
  id = ''; items: CartItem[] = []; subtotal = 0; tax_total = 0; total = 0; payment_method = ''; created = ''
  constructor(s: any = {}) { Object.assign(this, s || {}); this.items = (s?.items || []).map((i: any) => new CartItem(i)) }
}
export class Settings {
  id = ''; shop_name = ''; upi_vpa = ''; merchant_name = ''; theme = 'light'
  tax_enabled = false; default_tax_rate = 0; backup_enabled = false
  backup_folder = ''; backup_retention_days = 30; display_screen = 0
  constructor(s: any = {}) { Object.assign(this, s || {}) }
}
export class ReportSummary {
  date = ''; total_transactions = 0; total_revenue = 0; total_tax = 0; upi_transactions = 0; cash_transactions = 0
  constructor(s: any = {}) { Object.assign(this, s || {}) }
}

// Models namespace (re-exports classes as types for models.Product pattern)
export const models = { Product, CartItem, Transaction, Settings, ReportSummary }
export type models = typeof models

// Service method wrappers
export const GetSettings = (): Promise<Settings> => Call.ByID(2554697378)
export const SaveSettings = (s: Settings): Promise<void> => Call.ByID(1949631069, s)
export const IsSetupComplete = (): Promise<boolean> => Call.ByID(259807637)
export const GetProducts = (): Promise<Product[]> => Call.ByID(3397715095)
export const CreateProduct = (p: Product): Promise<Product> => Call.ByID(668623628, p)
export const UpdateProduct = (p: Product): Promise<void> => Call.ByID(2842109971, p)
export const DeleteProduct = (id: string): Promise<void> => Call.ByID(4245649569, id)
export const GetUPIString = (amount: number): Promise<string> => Call.ByID(2226102084, amount)
export const CreateTransaction = (t: Transaction): Promise<Transaction> => Call.ByID(1755283203, t)
export const GetTransactions = (limit: number, offset: number): Promise<Transaction[]> => Call.ByID(96738246, limit, offset)
export const GetDailyReport = (date: string): Promise<ReportSummary> => Call.ByID(2199403238, date)
export const GetWeeklyReport = (startDate: string): Promise<ReportSummary[]> => Call.ByID(1448145698, startDate)
export const ExportTransactionsCSV = (startDate: string, endDate: string): Promise<string> => Call.ByID(3689662970, startDate, endDate)
export const OpenCustomerDisplay = (screenIndex: number): Promise<void> => Call.ByID(2705716685, screenIndex)
export const CloseCustomerDisplay = (): Promise<void> => Call.ByID(2672389447)
export const UpdateCustomerDisplay = (cartItems: CartItem[], total: number, taxTotal: number): Promise<void> => Call.ByID(3889504338, cartItems, total, taxTotal)
export const ShowQROnDisplay = (upiString: string, amount: number, vpa: string): Promise<void> => Call.ByID(1604515304, upiString, amount, vpa)
export const ClearCustomerDisplay = (): Promise<void> => Call.ByID(1174768400)
export const SendProductsToDisplay = (): Promise<void> => Call.ByID(2191768672)
export const SendPaymentMethodToDisplay = (method: string): Promise<void> => Call.ByID(738920047, method)
export const ConfirmPayment = (): Promise<void> => Call.ByID(295967811)
export const SelectFolder = (title: string): Promise<string> => Call.ByID(237181597, title)
export const SelectSaveFile = (title: string, defaultName: string): Promise<string> => Call.ByID(893202942, title, defaultName)
export const ExportTransactionsCSVToDir = (startDate: string, endDate: string, dir: string): Promise<string> => Call.ByID(340704382, startDate, endDate, dir)
export const GetAvailableScreens = (): Promise<any[]> => Call.ByID(1652254419)
