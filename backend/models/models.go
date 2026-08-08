package models

import "time"

// Product represents a POS product (max 50 items)
type Product struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	TaxRate   float64 `json:"tax_rate"` // 0.0 to 1.0 (e.g., 0.05 = 5%)
	ImageData string  `json:"image_data"` // base64 data URL, empty = no image
	Active    bool    `json:"active"`
	Created   string  `json:"created"`
}

// CartItem represents a single item in the cart
type CartItem struct {
	ProductID string  `json:"product_id"`
	Name      string  `json:"name"`
	Qty       int     `json:"qty"`
	Price     float64 `json:"price"`
	TaxRate   float64 `json:"tax_rate"`
	Subtotal  float64 `json:"subtotal"` // price * qty
	TaxAmount float64 `json:"tax_amount"` // subtotal * tax_rate
}

// Cart represents the current order being built
type Cart struct {
	Items    []CartItem `json:"items"`
	Subtotal float64    `json:"subtotal"` // sum of item subtotals (before tax)
	TaxTotal float64    `json:"tax_total"` // sum of all tax amounts
	Total    float64    `json:"total"`    // subtotal + tax_total
}

// Transaction represents a completed sale
type Transaction struct {
	ID            string       `json:"id"`
	ReceiptNumber int          `json:"receipt_number"` // Rolling receipt number (e.g., 42 → "#000042")
	Items         []CartItem   `json:"items"`
	Subtotal      float64      `json:"subtotal"`
	TaxTotal      float64      `json:"tax_total"`
	Total         float64      `json:"total"`
	PaymentMethod string       `json:"payment_method"` // "upi" or "cash"
	Created       string       `json:"created"`
}

// TransactionItem is stored as JSON in transactions collection
type TransactionItem struct {
	ProductID string  `json:"product_id"`
	Name      string  `json:"name"`
	Qty       int     `json:"qty"`
	Price     float64 `json:"price"`
	TaxRate   float64 `json:"tax_rate"`
	Subtotal  float64 `json:"subtotal"`
	TaxAmount float64 `json:"tax_amount"`
}

// Settings represents shop configuration (single record)
type Settings struct {
	ID                  string  `json:"id"`
	ShopName            string  `json:"shop_name"`
	UPIVPA              string  `json:"upi_vpa"`
	MerchantName        string  `json:"merchant_name"`
	AdminPin            string  `json:"admin_pin"`
	Theme               string  `json:"theme"`
	TaxEnabled          bool    `json:"tax_enabled"`
	DefaultTaxRate      float64 `json:"default_tax_rate"`
	BackupEnabled       bool    `json:"backup_enabled"`
	BackupFolder        string  `json:"backup_folder"`
	BackupRetentionDays int     `json:"backup_retention_days"`
	DisplayScreen       int    `json:"display_screen"`        // 0 = primary, 1+ = secondary monitors
	DisplayScreenName   string `json:"display_screen_name"`   // screen name for identification
	DisplayScreenWidth  int    `json:"display_screen_width"`  // screen width for identification
	DisplayScreenHeight int    `json:"display_screen_height"` // screen height for identification
	AutoOpenDisplay     bool   `json:"auto_open_display"`     // auto-open display on secondary screen at startup
	PrinterName         string `json:"printer_name"`          // selected printer name for receipts
	AutoPrint           bool   `json:"auto_print"`            // auto-print after payment
	PaperWidth          int    `json:"paper_width"`           // 58 or 80 (mm) for thermal paper
	LastReceiptNumber   int    `json:"last_receipt_number"`   // rolling receipt counter
}

// ReportSummary represents a day's or period's sales summary
type ReportSummary struct {
	Date               string  `json:"date"`
	TotalTransactions  int     `json:"total_transactions"`
	TotalRevenue       float64 `json:"total_revenue"`
	TotalTax           float64 `json:"total_tax"`
	UPITransactions    int     `json:"upi_transactions"`
	CashTransactions   int     `json:"cash_transactions"`
}

// Now returns current time as RFC3339 string
func Now() string {
	return time.Now().UTC().Format(time.RFC3339)
}
