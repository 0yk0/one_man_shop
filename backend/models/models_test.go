package models

import (
	"encoding/json"
	"testing"
	"time"
)

func TestNow(t *testing.T) {
	result := Now()

	// Verify it's a valid RFC3339 timestamp
	_, err := time.Parse(time.RFC3339, result)
	if err != nil {
		t.Errorf("Now() returned invalid RFC3339 timestamp: %s, error: %v", result, err)
	}
}

func TestProductJSON(t *testing.T) {
	product := Product{
		ID:        "test-123",
		Name:      "Test Product",
		Price:     99.99,
		TaxRate:   0.05,
		ImageData: "data:image/png;base64,abc123",
		Active:    true,
		Created:   "2026-01-01T00:00:00Z",
	}

	// Marshal to JSON
	data, err := json.Marshal(product)
	if err != nil {
		t.Fatalf("Failed to marshal Product: %v", err)
	}

	// Unmarshal back
	var decoded Product
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal Product: %v", err)
	}

	// Verify all fields
	if decoded.ID != product.ID {
		t.Errorf("ID mismatch: got %s, want %s", decoded.ID, product.ID)
	}
	if decoded.Name != product.Name {
		t.Errorf("Name mismatch: got %s, want %s", decoded.Name, product.Name)
	}
	if decoded.Price != product.Price {
		t.Errorf("Price mismatch: got %f, want %f", decoded.Price, product.Price)
	}
	if decoded.TaxRate != product.TaxRate {
		t.Errorf("TaxRate mismatch: got %f, want %f", decoded.TaxRate, product.TaxRate)
	}
	if decoded.ImageData != product.ImageData {
		t.Errorf("ImageData mismatch: got %s, want %s", decoded.ImageData, product.ImageData)
	}
	if decoded.Active != product.Active {
		t.Errorf("Active mismatch: got %v, want %v", decoded.Active, product.Active)
	}
	if decoded.Created != product.Created {
		t.Errorf("Created mismatch: got %s, want %s", decoded.Created, product.Created)
	}
}

func TestCartItemJSON(t *testing.T) {
	item := CartItem{
		ProductID: "prod-123",
		Name:      "Test Item",
		Qty:       3,
		Price:     25.50,
		TaxRate:   0.10,
		Subtotal:  76.50,
		TaxAmount: 7.65,
	}

	data, err := json.Marshal(item)
	if err != nil {
		t.Fatalf("Failed to marshal CartItem: %v", err)
	}

	var decoded CartItem
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal CartItem: %v", err)
	}

	if decoded.ProductID != item.ProductID {
		t.Errorf("ProductID mismatch: got %s, want %s", decoded.ProductID, item.ProductID)
	}
	if decoded.Qty != item.Qty {
		t.Errorf("Qty mismatch: got %d, want %d", decoded.Qty, item.Qty)
	}
	if decoded.Price != item.Price {
		t.Errorf("Price mismatch: got %f, want %f", decoded.Price, item.Price)
	}
	if decoded.Subtotal != item.Subtotal {
		t.Errorf("Subtotal mismatch: got %f, want %f", decoded.Subtotal, item.Subtotal)
	}
	if decoded.TaxAmount != item.TaxAmount {
		t.Errorf("TaxAmount mismatch: got %f, want %f", decoded.TaxAmount, item.TaxAmount)
	}
}

func TestTransactionJSON(t *testing.T) {
	txn := Transaction{
		ID: "txn-123",
		Items: []CartItem{
			{ProductID: "p1", Name: "Item 1", Qty: 2, Price: 10.00, TaxRate: 0.05, Subtotal: 20.00, TaxAmount: 1.00},
			{ProductID: "p2", Name: "Item 2", Qty: 1, Price: 15.00, TaxRate: 0.10, Subtotal: 15.00, TaxAmount: 1.50},
		},
		Subtotal:      35.00,
		TaxTotal:      2.50,
		Total:         37.50,
		PaymentMethod: "upi",
		Created:       "2026-08-02T10:30:00Z",
	}

	data, err := json.Marshal(txn)
	if err != nil {
		t.Fatalf("Failed to marshal Transaction: %v", err)
	}

	var decoded Transaction
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal Transaction: %v", err)
	}

	if len(decoded.Items) != 2 {
		t.Fatalf("Items length mismatch: got %d, want 2", len(decoded.Items))
	}
	if decoded.Items[0].Name != "Item 1" {
		t.Errorf("Items[0].Name mismatch: got %s, want Item 1", decoded.Items[0].Name)
	}
	if decoded.Total != 37.50 {
		t.Errorf("Total mismatch: got %f, want 37.50", decoded.Total)
	}
	if decoded.PaymentMethod != "upi" {
		t.Errorf("PaymentMethod mismatch: got %s, want upi", decoded.PaymentMethod)
	}
}

func TestSettingsJSON(t *testing.T) {
	settings := Settings{
		ID:                  "settings-1",
		ShopName:            "Test Shop",
		UPIVPA:              "test@upi",
		MerchantName:        "Test Merchant",
		Theme:               "dark",
		TaxEnabled:          true,
		DefaultTaxRate:      0.18,
		BackupEnabled:       true,
		BackupFolder:        "/backups",
		BackupRetentionDays: 30,
		DisplayScreen:       1,
	}

	data, err := json.Marshal(settings)
	if err != nil {
		t.Fatalf("Failed to marshal Settings: %v", err)
	}

	var decoded Settings
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal Settings: %v", err)
	}

	if decoded.ShopName != settings.ShopName {
		t.Errorf("ShopName mismatch: got %s, want %s", decoded.ShopName, settings.ShopName)
	}
	if decoded.TaxEnabled != settings.TaxEnabled {
		t.Errorf("TaxEnabled mismatch: got %v, want %v", decoded.TaxEnabled, settings.TaxEnabled)
	}
	if decoded.DefaultTaxRate != settings.DefaultTaxRate {
		t.Errorf("DefaultTaxRate mismatch: got %f, want %f", decoded.DefaultTaxRate, settings.DefaultTaxRate)
	}
	if decoded.BackupRetentionDays != settings.BackupRetentionDays {
		t.Errorf("BackupRetentionDays mismatch: got %d, want %d", decoded.BackupRetentionDays, settings.BackupRetentionDays)
	}
}

func TestReportSummaryJSON(t *testing.T) {
	report := ReportSummary{
		Date:              "2026-08-02",
		TotalTransactions: 15,
		TotalRevenue:      1250.75,
		TotalTax:          125.08,
		UPITransactions:   10,
		CashTransactions:  5,
	}

	data, err := json.Marshal(report)
	if err != nil {
		t.Fatalf("Failed to marshal ReportSummary: %v", err)
	}

	var decoded ReportSummary
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal ReportSummary: %v", err)
	}

	if decoded.TotalTransactions != report.TotalTransactions {
		t.Errorf("TotalTransactions mismatch: got %d, want %d", decoded.TotalTransactions, report.TotalTransactions)
	}
	if decoded.TotalRevenue != report.TotalRevenue {
		t.Errorf("TotalRevenue mismatch: got %f, want %f", decoded.TotalRevenue, report.TotalRevenue)
	}
	if decoded.UPITransactions != report.UPITransactions {
		t.Errorf("UPITransactions mismatch: got %d, want %d", decoded.UPITransactions, report.UPITransactions)
	}
}

func TestTransactionItemJSON(t *testing.T) {
	item := TransactionItem{
		ProductID: "prod-456",
		Name:      "Transaction Item",
		Qty:       5,
		Price:     30.00,
		TaxRate:   0.05,
		Subtotal:  150.00,
		TaxAmount: 7.50,
	}

	data, err := json.Marshal(item)
	if err != nil {
		t.Fatalf("Failed to marshal TransactionItem: %v", err)
	}

	var decoded TransactionItem
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal TransactionItem: %v", err)
	}

	if decoded.ProductID != item.ProductID {
		t.Errorf("ProductID mismatch: got %s, want %s", decoded.ProductID, item.ProductID)
	}
	if decoded.Qty != item.Qty {
		t.Errorf("Qty mismatch: got %d, want %d", decoded.Qty, item.Qty)
	}
}
