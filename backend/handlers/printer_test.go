package handlers

import (
	"strings"
	"testing"

	"one_man_shop/backend/models"
)

func TestBuildReceiptText_80mm(t *testing.T) {
	s := models.Settings{
		ShopName:     "Test Shop",
		MerchantName: "Owner",
		PaperWidth:   80,
	}
	transaction := models.Transaction{
		ReceiptNumber: 42,
		Items: []models.CartItem{
			{Name: "Coffee", Qty: 2, Price: 50, Subtotal: 100},
			{Name: "Sandwich", Qty: 1, Price: 150, Subtotal: 150},
		},
		Subtotal:      250,
		TaxTotal:      12.50,
		Total:         262.50,
		PaymentMethod: "upi",
		Created:       "2026-08-04T12:06:00Z",
	}

	receipt := buildReceiptText(transaction, s)

	// Check shop name
	if !strings.Contains(receipt, "Test Shop") {
		t.Error("receipt should contain shop name")
	}

	// Check receipt ID
	if !strings.Contains(receipt, "#000042") {
		t.Error("receipt should contain receipt ID #000042")
	}

	// Check transaction date (not current time)
	if !strings.Contains(receipt, "04-Aug-2026 12:06") {
		t.Error("receipt should contain transaction date from Created field")
	}

	// Check items
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
}

func TestBuildReceiptText_NoReceiptNumber(t *testing.T) {
	s := models.Settings{ShopName: "Shop", PaperWidth: 80}
	transaction := models.Transaction{
		ReceiptNumber: 0, // No receipt number (old transaction)
		Items:         []models.CartItem{{Name: "Item", Qty: 1, Price: 100, Subtotal: 100}},
		Subtotal:      100,
		Total:         100,
		PaymentMethod: "cash",
		Created:       "2026-08-04T10:00:00Z",
	}

	receipt := buildReceiptText(transaction, s)

	// Should NOT contain receipt ID when number is 0
	if strings.Contains(receipt, "#") {
		// Check it's not a receipt ID line
		lines := strings.Split(receipt, "\n")
		for _, line := range lines {
			trimmed := strings.TrimSpace(line)
			if len(trimmed) == 7 && strings.HasPrefix(trimmed, "#") {
				t.Error("receipt should not contain receipt ID when ReceiptNumber is 0")
			}
		}
	}

	// Should still contain the transaction date
	if !strings.Contains(receipt, "04-Aug-2026 10:00") {
		t.Error("receipt should contain transaction date")
	}
}

func TestBuildReceiptText_58mm(t *testing.T) {
	s := models.Settings{
		ShopName:   "Shop",
		PaperWidth: 58,
	}
	transaction := models.Transaction{
		ReceiptNumber: 1,
		Items:         []models.CartItem{{Name: "Item", Qty: 1, Price: 100, Subtotal: 100}},
		Subtotal:      100,
		Total:         100,
		PaymentMethod: "cash",
		Created:       "2026-08-04T10:00:00Z",
	}

	receipt := buildReceiptText(transaction, s)

	if !strings.Contains(receipt, "Shop") {
		t.Error("58mm receipt should contain shop name")
	}
	if !strings.Contains(receipt, "#000001") {
		t.Error("58mm receipt should contain receipt ID")
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
		Created:       "2026-08-04T10:00:00Z",
	}

	receipt := buildReceiptText(transaction, s)

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
		Created:       "2026-08-04T10:00:00Z",
	}

	receipt := buildReceiptText(transaction, s)

	if !strings.Contains(receipt, "Tax") {
		t.Error("receipt should contain Tax line when tax_total > 0")
	}
}

func TestFormatReceiptID(t *testing.T) {
	tests := []struct {
		num      int
		expected string
	}{
		{0, "#000000"},
		{1, "#000001"},
		{42, "#000042"},
		{1234, "#001234"},
		{999999, "#999999"},
	}

	for _, tt := range tests {
		result := formatReceiptID(tt.num)
		if result != tt.expected {
			t.Errorf("formatReceiptID(%d) = %q, want %q", tt.num, result, tt.expected)
		}
	}
}

func TestFormatReceiptTime(t *testing.T) {
	result := formatReceiptTime("2026-08-04T12:06:00Z")
	if result != "04-Aug-2026 12:06" {
		t.Errorf("formatReceiptTime = %q, want %q", result, "04-Aug-2026 12:06")
	}

	// Invalid time should fallback
	result = formatReceiptTime("invalid")
	if result == "" {
		t.Error("formatReceiptTime should not return empty for invalid input")
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
		{"", 5, "  "},     // centerText left-pads only: (5-0)/2 = 2 spaces
		{"A", 5, "  A"},   // (5-1)/2 = 2 spaces
		{"AB", 5, " AB"},  // (5-2)/2 = 1 space
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

	if getItemCount(nil) != 0 {
		t.Error("expected 0 for nil items")
	}
}

func TestBuildEscposBytes_ContainsReceiptID(t *testing.T) {
	s := models.Settings{ShopName: "Shop", PaperWidth: 80}
	transaction := models.Transaction{
		ReceiptNumber: 42,
		Items:         []models.CartItem{{Name: "Item", Qty: 1, Price: 100, Subtotal: 100}},
		Subtotal:      100,
		Total:         100,
		PaymentMethod: "cash",
		Created:       "2026-08-04T12:06:00Z",
	}

	data := buildEscposBytes(transaction, s)

	// Should contain receipt ID
	if !strings.Contains(string(data), "#000042") {
		t.Error("ESC/POS output should contain receipt ID #000042")
	}

	// Should contain transaction date
	if !strings.Contains(string(data), "04-Aug-2026 12:06") {
		t.Error("ESC/POS output should contain transaction date")
	}

	// Should contain shop name
	if !strings.Contains(string(data), "Shop") {
		t.Error("ESC/POS output should contain shop name")
	}
}

func TestBuildEscposBytes_BoldAndCut(t *testing.T) {
	s := models.Settings{ShopName: "Shop", PaperWidth: 80}
	transaction := models.Transaction{
		Items:         []models.CartItem{{Name: "Item", Qty: 1, Price: 100, Subtotal: 100}},
		Subtotal:      100,
		Total:         100,
		PaymentMethod: "cash",
		Created:       "2026-08-04T10:00:00Z",
	}

	data := buildEscposBytes(transaction, s)

	// Should contain ESC E (bold)
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

	// Should contain GS V (cut)
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
}

func TestIsVirtualPrinterAvailable(t *testing.T) {
	result := isVirtualPrinterAvailable()
	_ = result // Just verify it doesn't panic
}
