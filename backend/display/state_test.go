package display

import (
	"sync"
	"testing"
)

func TestNewManager(t *testing.T) {
	m := NewManager()

	state := m.GetState()
	if state.View != ViewMenu {
		t.Errorf("Initial view mismatch: got %s, want %s", state.View, ViewMenu)
	}
	if state.Theme != "light" {
		t.Errorf("Initial theme mismatch: got %s, want light", state.Theme)
	}
}

func TestSetMenu(t *testing.T) {
	m := NewManager()

	products := []Product{
		{ID: "p1", Name: "Product 1", Price: 10.00},
		{ID: "p2", Name: "Product 2", Price: 20.00},
	}

	m.SetMenu("Test Shop", products, "dark")

	state := m.GetState()
	if state.View != ViewMenu {
		t.Errorf("View mismatch: got %s, want %s", state.View, ViewMenu)
	}
	if state.ShopName != "Test Shop" {
		t.Errorf("ShopName mismatch: got %s, want Test Shop", state.ShopName)
	}
	if len(state.Products) != 2 {
		t.Errorf("Products length mismatch: got %d, want 2", len(state.Products))
	}
	if state.Theme != "dark" {
		t.Errorf("Theme mismatch: got %s, want dark", state.Theme)
	}
	// Cart should be cleared
	if len(state.CartItems) != 0 {
		t.Errorf("CartItems should be empty, got %d", len(state.CartItems))
	}
	if state.Total != 0 {
		t.Errorf("Total should be 0, got %f", state.Total)
	}
}

func TestSetBill(t *testing.T) {
	m := NewManager()

	cartItems := []CartItem{
		{ProductID: "p1", Name: "Item 1", Qty: 2, Price: 10.00, Subtotal: 20.00},
		{ProductID: "p2", Name: "Item 2", Qty: 1, Price: 15.00, Subtotal: 15.00},
	}

	m.SetBill(cartItems, 35.00, 3.50, "Test Shop", "light")

	state := m.GetState()
	if state.View != ViewBill {
		t.Errorf("View mismatch: got %s, want %s", state.View, ViewBill)
	}
	if len(state.CartItems) != 2 {
		t.Errorf("CartItems length mismatch: got %d, want 2", len(state.CartItems))
	}
	if state.Total != 35.00 {
		t.Errorf("Total mismatch: got %f, want 35.00", state.Total)
	}
	if state.Tax != 3.50 {
		t.Errorf("Tax mismatch: got %f, want 3.50", state.Tax)
	}
}

func TestSetPaymentMethod(t *testing.T) {
	m := NewManager()

	m.SetPaymentMethod("upi")

	state := m.GetState()
	if state.PaymentMethod != "upi" {
		t.Errorf("PaymentMethod mismatch: got %s, want upi", state.PaymentMethod)
	}
}

func TestSetUPIData(t *testing.T) {
	m := NewManager()

	m.SetUPIData("upi://pay?pa=test@upi&pn=Test")

	state := m.GetState()
	if state.UPIString != "upi://pay?pa=test@upi&pn=Test" {
		t.Errorf("UPIString mismatch: got %s, want upi://pay?pa=test@upi&pn=Test", state.UPIString)
	}
	// View should NOT change to ThankYou
	if state.View != ViewMenu {
		t.Errorf("View should stay on menu, got %s", state.View)
	}
}

func TestSetThankYou(t *testing.T) {
	m := NewManager()

	m.SetThankYou()

	state := m.GetState()
	if state.View != ViewThankYou {
		t.Errorf("View mismatch: got %s, want %s", state.View, ViewThankYou)
	}
}

func TestClear(t *testing.T) {
	m := NewManager()

	// Set some state first
	cartItems := []CartItem{
		{ProductID: "p1", Name: "Item 1", Qty: 1, Price: 10.00, Subtotal: 10.00},
	}
	m.SetBill(cartItems, 10.00, 1.00, "Test Shop", "light")
	m.SetPaymentMethod("cash")
	m.SetUPIData("upi://pay?pa=test@upi")

	// Clear
	m.Clear()

	state := m.GetState()
	if state.View != ViewMenu {
		t.Errorf("View should be menu after clear, got %s", state.View)
	}
	if len(state.CartItems) != 0 {
		t.Errorf("CartItems should be empty after clear, got %d", len(state.CartItems))
	}
	if state.Total != 0 {
		t.Errorf("Total should be 0 after clear, got %f", state.Total)
	}
	if state.Tax != 0 {
		t.Errorf("Tax should be 0 after clear, got %f", state.Tax)
	}
	if state.PaymentMethod != "" {
		t.Errorf("PaymentMethod should be empty after clear, got %s", state.PaymentMethod)
	}
}

func TestOnUpdate(t *testing.T) {
	m := NewManager()

	var receivedState State
	var wg sync.WaitGroup
	wg.Add(1)

	m.OnUpdate(func(s State) {
		receivedState = s
		wg.Done()
	})

	m.SetMenu("Test Shop", nil, "light")

	wg.Wait()

	if receivedState.ShopName != "Test Shop" {
		t.Errorf("Listener received wrong ShopName: got %s, want Test Shop", receivedState.ShopName)
	}
}

func TestConcurrentAccess(t *testing.T) {
	m := NewManager()

	var wg sync.WaitGroup
	numGoroutines := 100

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			m.SetMenu("Test", nil, "light")
			m.GetState()
			m.SetPaymentMethod("upi")
			m.GetState()
			m.Clear()
		}()
	}

	wg.Wait()

	// If we get here without race conditions, test passes
	// Run with -race flag to detect actual race conditions
}

func TestGetStateReturnsCopy(t *testing.T) {
	m := NewManager()

	m.SetMenu("Original Shop", nil, "light")

	state := m.GetState()
	state.ShopName = "Modified Shop"

	// Original state should not be affected
	originalState := m.GetState()
	if originalState.ShopName != "Original Shop" {
		t.Errorf("GetState returned reference, not copy. Got %s, want Original Shop", originalState.ShopName)
	}
}
