package handlers

import (
	"strings"
	"testing"

	"one_man_shop/backend/models"
)

func TestGetTransactionsEmpty(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	transactions, err := handler.GetTransactions(50, 0)
	if err != nil {
		t.Fatalf("GetTransactions failed: %v", err)
	}

	if len(transactions) != 0 {
		t.Errorf("Expected 0 transactions, got %d", len(transactions))
	}
}

func TestCreateTransaction(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	txn := models.Transaction{
		Items: []models.CartItem{
			{ProductID: "p1", Name: "Item 1", Qty: 2, Price: 10.00, TaxRate: 0.05, Subtotal: 20.00, TaxAmount: 1.00},
		},
		Subtotal:      20.00,
		TaxTotal:      1.00,
		Total:         21.00,
		PaymentMethod: "upi",
	}

	created, err := handler.CreateTransaction(txn)
	if err != nil {
		t.Fatalf("CreateTransaction failed: %v", err)
	}

	if created.ID == "" {
		t.Error("Created transaction should have an ID")
	}
	if created.Total != 21.00 {
		t.Errorf("Total mismatch: got %f, want 21.00", created.Total)
	}
	if created.PaymentMethod != "upi" {
		t.Errorf("PaymentMethod mismatch: got %s, want upi", created.PaymentMethod)
	}
	if len(created.Items) != 1 {
		t.Errorf("Items length mismatch: got %d, want 1", len(created.Items))
	}
}

func TestGetTransactionsAfterCreate(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Create a transaction
	handler.CreateTransaction(models.Transaction{
		Items:         []models.CartItem{{Name: "Item 1", Qty: 1, Price: 10.00, Subtotal: 10.00}},
		Subtotal:      10.00,
		TaxTotal:      0.00,
		Total:         10.00,
		PaymentMethod: "cash",
	})

	transactions, err := handler.GetTransactions(50, 0)
	if err != nil {
		t.Fatalf("GetTransactions failed: %v", err)
	}

	if len(transactions) != 1 {
		t.Fatalf("Expected 1 transaction, got %d", len(transactions))
	}
	if transactions[0].Total != 10.00 {
		t.Errorf("Total mismatch: got %f, want 10.00", transactions[0].Total)
	}
	if transactions[0].PaymentMethod != "cash" {
		t.Errorf("PaymentMethod mismatch: got %s, want cash", transactions[0].PaymentMethod)
	}
}

func TestGetTransactionsLimitOffset(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Create multiple transactions
	for i := 0; i < 5; i++ {
		handler.CreateTransaction(models.Transaction{
			Items:         []models.CartItem{{Name: "Item", Qty: 1, Price: float64(i + 1), Subtotal: float64(i + 1)}},
			Subtotal:      float64(i + 1),
			Total:         float64(i + 1),
			PaymentMethod: "upi",
		})
	}

	// Get with limit
	transactions, _ := handler.GetTransactions(2, 0)
	if len(transactions) != 2 {
		t.Errorf("Expected 2 transactions with limit=2, got %d", len(transactions))
	}

	// Get with offset
	transactions, _ = handler.GetTransactions(2, 3)
	if len(transactions) != 2 {
		t.Errorf("Expected 2 transactions with offset=3, got %d", len(transactions))
	}
}

func TestGetUPIString(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// First configure settings with UPI VPA
	settings, _ := handler.GetSettings()
	settings.UPIVPA = "merchant@upi"
	settings.MerchantName = "Test Merchant"
	handler.SaveSettings(settings)

	// Get UPI string
	upiString, err := handler.GetUPIString(100.50)
	if err != nil {
		t.Fatalf("GetUPIString failed: %v", err)
	}

	if !strings.Contains(upiString, "pa=merchant@upi") {
		t.Errorf("UPI string should contain VPA, got: %s", upiString)
	}
	if !strings.Contains(upiString, "am=100.50") {
		t.Errorf("UPI string should contain amount, got: %s", upiString)
	}
	if !strings.Contains(upiString, "cu=INR") {
		t.Errorf("UPI string should contain currency, got: %s", upiString)
	}
}
