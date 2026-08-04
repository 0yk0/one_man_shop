package handlers

import (
	"strings"
	"testing"

	"one_man_shop/backend/models"
)

func TestBuildReceiptText_80mm(t *testing.T) {
	s := models.Settings{
		ShopName:      "Test Shop",
		MerchantName:  "Owner",
		PaperWidth:    80,
	}
	transaction := models.Transaction{
		Items: []models.CartItem{
			{Name: "Coffee", Qty: 2, Price: 50, Subtotal: 100},
			{Name: "Sandwich", Qty: 1, Price: 150, Subtotal: 150},
		},
		Subtotal:      250,
		TaxTotal:      12.50,
		Total:         262.50,
		PaymentMethod: "upi",
	}

	receipt := buildReceiptText(transaction, s)

	// Check shop name is present
	if !strings.Contains(receipt, "Test Shop") {
		t.Error("receipt should contain shop name")
	}

	// Check items are present
	if !strings.Contains(receipt, "Coffee") {
		t.Error("receipt should contain Coffee")
	}
	if !strings.Contains(receipt, "Sandwich") {
		t.Error("receipt should contain Sandwich")
	}

	// Check amounts
	if !strings.Contains(receipt, "262.50") {
		t.Error("receipt should contain total amount")
	}

	// Check tax
	if !strings.Contains(receipt, "12.50") {
		t.Error("receipt should contain tax amount")
	}

	// Check payment method
	if !strings.Contains(receipt, "UPI") {
		t.Error("receipt should contain payment method")
	}

	// Check footer
	if !strings.Contains(receipt, "Thank you!") {
		t.Error("receipt should contain thank you message")
	}

	// Should contain separator lines
	if !strings.Contains(receipt, "---") {
		t.Error("receipt should contain separator lines")
	}
}

func TestBuildReceiptText_58mm(t *testing.T) {
	s := models.Settings{
		ShopName:   "Shop",
		PaperWidth: 58,
	}
	transaction := models.Transaction{
		Items: []models.CartItem{
			{Name: "Item", Qty: 1, Price: 100, Subtotal: 100},
		},
		Subtotal:      100,
		TaxTotal:      0,
		Total:         100,
		PaymentMethod: "cash",
	}

	receipt := buildReceiptText(transaction, s)

	// Verify receipt contains key elements
	if !strings.Contains(receipt, "Shop") {
		t.Error("58mm receipt should contain shop name")
	}
	if !strings.Contains(receipt, "Item") {
		t.Error("58mm receipt should contain item")
	}
	if !strings.Contains(receipt, "100.00") {
		t.Error("58mm receipt should contain total")
	}

	// 58mm header line should be 32 chars
	lines := strings.Split(receipt, "\n")
	if len(lines) > 0 && len(lines[0]) > 32 {
		t.Errorf("shop name line too long for 58mm: %d chars", len(lines[0]))
	}
}

func TestBuildReceiptText_NoTax(t *testing.T) {
	s := models.Settings{ShopName: "Shop", PaperWidth: 80}
	transaction := models.Transaction{
		Items:         []models.CartItem{{Name: "Item", Qty: 1, Price: 100, Subtotal: 100}},
		Subtotal:      100,
		TaxTotal:      0,
		Total:         100,
		PaymentMethod: "cash",
	}

	receipt := buildReceiptText(transaction, s)

	// Tax line should not appear when tax is 0
	if strings.Contains(receipt, "Tax") {
		t.Error("receipt should not contain Tax line when tax_total is 0")
	}
}

func TestBuildReceiptText_WithTax(t *testing.T) {
	s := models.Settings{ShopName: "Shop", PaperWidth: 80}
	transaction := models.Transaction{
		Items:         []models.CartItem{{Name: "Item", Qty: 1, Price: 100, Subtotal: 100}},
		Subtotal:      100,
		TaxTotal:      5,
		Total:         105,
		PaymentMethod: "upi",
	}

	receipt := buildReceiptText(transaction, s)

	if !strings.Contains(receipt, "Tax") {
		t.Error("receipt should contain Tax line when tax_total > 0")
	}
}

func TestCenterText(t *testing.T) {
	tests := []struct {
		text     string
		width    int
		expected string
	}{
		{"Hi", 10, "    Hi"},
		{"Hello", 10, "  Hello"},
		{"HelloWorld", 10, "HelloWorld"},
		{"", 5, "     "},
	}

	for _, tt := range tests {
		result := centerText(tt.text, tt.width)
		if result != tt.expected {
			t.Errorf("centerText(%q, %d) = %q, want %q", tt.text, tt.width, result, tt.expected)
		}
	}
}

func TestGetItemCount(t *testing.T) {
	items := []models.CartItem{
		{Qty: 2},
		{Qty: 3},
		{Qty: 1},
	}
	total := getItemCount(items)
	if total != 6 {
		t.Errorf("expected 6, got %d", total)
	}

	// Empty cart
	if getItemCount(nil) != 0 {
		t.Error("expected 0 for nil items")
	}
}

func TestBuildEscposBytes_ContainsBold(t *testing.T) {
	s := models.Settings{ShopName: "Shop", PaperWidth: 80}
	transaction := models.Transaction{
		Items:         []models.CartItem{{Name: "Item", Qty: 1, Price: 100, Subtotal: 100}},
		Subtotal:      100,
		Total:         100,
		PaymentMethod: "cash",
	}

	data := buildEscposBytes(transaction, s)

	// Should contain ESC E (bold) sequences
	found := false
	for i := 0; i < len(data)-1; i++ {
		if data[i] == 0x1B && data[i+1] == 0x45 {
			found = true
			break
		}
	}
	if !found {
		t.Error("ESC/POS output should contain ESC E (bold) commands")
	}

	// Should contain GS V (cut) sequence
	foundCut := false
	for i := 0; i < len(data)-1; i++ {
		if data[i] == 0x1D && data[i+1] == 0x56 {
			foundCut = true
			break
		}
	}
	if !foundCut {
		t.Error("ESC/POS output should contain GS V (cut) command")
	}

	// Should contain ESC @ (initialize)
	foundInit := false
	for i := 0; i < len(data)-1; i++ {
		if data[i] == 0x1B && data[i+1] == 0x40 {
			foundInit = true
			break
		}
	}
	if !foundInit {
		t.Error("ESC/POS output should contain ESC @ (initialize) command")
	}
}

func TestBuildEscposBytes_TextContent(t *testing.T) {
	s := models.Settings{ShopName: "My Shop", PaperWidth: 80}
	transaction := models.Transaction{
		Items:         []models.CartItem{{Name: "Coffee", Qty: 2, Price: 50, Subtotal: 100}},
		Subtotal:      100,
		Total:         100,
		PaymentMethod: "upi",
	}

	data := buildEscposBytes(transaction, s)

	// Should contain shop name
	if !strings.Contains(string(data), "My Shop") {
		t.Error("ESC/POS output should contain shop name")
	}

	// Should contain item name
	if !strings.Contains(string(data), "Coffee") {
		t.Error("ESC/POS output should contain item name")
	}

	// Should contain total
	if !strings.Contains(string(data), "100.00") {
		t.Error("ESC/POS output should contain total amount")
	}
}

func TestIsVirtualPrinterAvailable(t *testing.T) {
	// When emulator is not running, should return false
	// (This test assumes no emulator is running on port 9100 during tests)
	result := isVirtualPrinterAvailable()
	// We can't assert the value since it depends on whether the emulator is running
	// But we can verify it doesn't panic
	_ = result
}
