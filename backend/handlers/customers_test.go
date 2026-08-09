package handlers

import (
	"testing"

	"one_man_shop/backend/models"
)

func TestGetCustomersEmpty(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	customers, err := handler.GetCustomers()
	if err != nil {
		t.Fatalf("GetCustomers failed: %v", err)
	}

	if len(customers) != 0 {
		t.Errorf("Expected 0 customers, got %d", len(customers))
	}
}

func TestCreateCustomer(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	customer := models.Customer{
		Name:  "John Doe",
		Phone: "9876543210",
	}

	created, err := handler.CreateCustomer(customer)
	if err != nil {
		t.Fatalf("CreateCustomer failed: %v", err)
	}

	if created.ID == "" {
		t.Error("Created customer should have an ID")
	}
	if created.Name != "John Doe" {
		t.Errorf("Name mismatch: got %s, want John Doe", created.Name)
	}
	if created.Phone != "9876543210" {
		t.Errorf("Phone mismatch: got %s, want 9876543210", created.Phone)
	}
}

func TestCreateCustomerNormalizesPhone(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	customer := models.Customer{
		Name:  "John Doe",
		Phone: "987-654-3210",
	}

	created, err := handler.CreateCustomer(customer)
	if err != nil {
		t.Fatalf("CreateCustomer failed: %v", err)
	}

	if created.Phone != "9876543210" {
		t.Errorf("Phone not normalized: got %s, want 9876543210", created.Phone)
	}
}

func TestCreateCustomerDuplicatePhone(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Create first customer
	_, err := handler.CreateCustomer(models.Customer{Name: "John Doe", Phone: "9876543210"})
	if err != nil {
		t.Fatalf("First CreateCustomer failed: %v", err)
	}

	// Try to create second customer with same phone
	_, err = handler.CreateCustomer(models.Customer{Name: "Jane Smith", Phone: "9876543210"})
	if err == nil {
		t.Error("Expected error for duplicate phone, got nil")
	}
}

func TestCreateCustomerEmptyPhone(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	_, err := handler.CreateCustomer(models.Customer{Name: "John Doe", Phone: ""})
	if err == nil {
		t.Error("Expected error for empty phone, got nil")
	}
}

func TestGetCustomersAfterCreate(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	handler.CreateCustomer(models.Customer{Name: "John Doe", Phone: "9876543210"})
	handler.CreateCustomer(models.Customer{Name: "Jane Smith", Phone: "9876543211"})

	customers, err := handler.GetCustomers()
	if err != nil {
		t.Fatalf("GetCustomers failed: %v", err)
	}

	if len(customers) != 2 {
		t.Errorf("Expected 2 customers, got %d", len(customers))
	}
}

func TestUpdateCustomer(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Create a customer
	created, err := handler.CreateCustomer(models.Customer{Name: "John Doe", Phone: "9876543210"})
	if err != nil {
		t.Fatalf("CreateCustomer failed: %v", err)
	}

	// Update the customer
	err = handler.UpdateCustomer(models.Customer{
		ID:    created.ID,
		Name:  "John Updated",
		Phone: "9876543211",
	})
	if err != nil {
		t.Fatalf("UpdateCustomer failed: %v", err)
	}

	// Verify update
	customers, _ := handler.GetCustomers()
	found := false
	for _, c := range customers {
		if c.ID == created.ID {
			found = true
			if c.Name != "John Updated" {
				t.Errorf("Name not updated: got %s, want John Updated", c.Name)
			}
			if c.Phone != "9876543211" {
				t.Errorf("Phone not updated: got %s, want 9876543211", c.Phone)
			}
		}
	}
	if !found {
		t.Error("Updated customer not found")
	}
}

func TestUpdateCustomerNormalizesPhone(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Create a customer
	created, err := handler.CreateCustomer(models.Customer{Name: "John Doe", Phone: "9876543210"})
	if err != nil {
		t.Fatalf("CreateCustomer failed: %v", err)
	}

	// Update with non-normalized phone
	err = handler.UpdateCustomer(models.Customer{
		ID:    created.ID,
		Name:  "John Updated",
		Phone: "987-654-3211",
	})
	if err != nil {
		t.Fatalf("UpdateCustomer failed: %v", err)
	}

	// Verify phone was normalized
	customers, _ := handler.GetCustomers()
	for _, c := range customers {
		if c.ID == created.ID {
			if c.Phone != "9876543211" {
				t.Errorf("Phone not normalized: got %s, want 9876543211", c.Phone)
			}
		}
	}
}

func TestUpdateCustomerDuplicatePhone(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Create two customers
	c1, _ := handler.CreateCustomer(models.Customer{Name: "John Doe", Phone: "9876543210"})
	_, _ = handler.CreateCustomer(models.Customer{Name: "Jane Smith", Phone: "9876543211"})

	// Try to update c1 with c2's phone
	err := handler.UpdateCustomer(models.Customer{
		ID:    c1.ID,
		Name:  "John Doe",
		Phone: "9876543211",
	})
	if err == nil {
		t.Error("Expected error for duplicate phone, got nil")
	}
}

func TestUpdateCustomerEmptyID(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	err := handler.UpdateCustomer(models.Customer{
		ID:    "",
		Name:  "John Doe",
		Phone: "9876543210",
	})
	if err == nil {
		t.Error("Expected error for empty ID, got nil")
	}
}

func TestDeleteCustomer(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Create a customer
	created, err := handler.CreateCustomer(models.Customer{Name: "John Doe", Phone: "9876543210"})
	if err != nil {
		t.Fatalf("CreateCustomer failed: %v", err)
	}

	// Delete the customer
	err = handler.DeleteCustomer(created.ID)
	if err != nil {
		t.Fatalf("DeleteCustomer failed: %v", err)
	}

	// Verify deletion
	customers, _ := handler.GetCustomers()
	if len(customers) != 0 {
		t.Errorf("Expected 0 customers after delete, got %d", len(customers))
	}
}

func TestDeleteCustomerNotFound(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	err := handler.DeleteCustomer("nonexistent")
	if err == nil {
		t.Error("Expected error for nonexistent customer, got nil")
	}
}

func TestGetCustomerByID(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Create a customer
	created, err := handler.CreateCustomer(models.Customer{Name: "John Doe", Phone: "9876543210"})
	if err != nil {
		t.Fatalf("CreateCustomer failed: %v", err)
	}

	// Get by ID
	customer, err := handler.GetCustomerByID(created.ID)
	if err != nil {
		t.Fatalf("GetCustomerByID failed: %v", err)
	}

	if customer == nil {
		t.Fatal("Expected customer, got nil")
	}
	if customer.Name != "John Doe" {
		t.Errorf("Name mismatch: got %s, want John Doe", customer.Name)
	}
	if customer.Phone != "9876543210" {
		t.Errorf("Phone mismatch: got %s, want 9876543210", customer.Phone)
	}
}

func TestGetCustomerByIDNotFound(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	customer, err := handler.GetCustomerByID("nonexistent")
	if err != nil {
		t.Fatalf("GetCustomerByID failed: %v", err)
	}

	if customer != nil {
		t.Error("Expected nil for nonexistent customer, got non-nil")
	}
}

func TestGetCustomerByIDEmpty(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	customer, err := handler.GetCustomerByID("")
	if err != nil {
		t.Fatalf("GetCustomerByID failed: %v", err)
	}

	if customer != nil {
		t.Error("Expected nil for empty ID, got non-nil")
	}
}

func TestSearchCustomers(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Create customers
	handler.CreateCustomer(models.Customer{Name: "John Doe", Phone: "9876543210"})
	handler.CreateCustomer(models.Customer{Name: "Jane Smith", Phone: "9876543211"})

	// Search by phone prefix
	customers, err := handler.SearchCustomers("9876")
	if err != nil {
		t.Fatalf("SearchCustomers failed: %v", err)
	}

	if len(customers) != 2 {
		t.Errorf("Expected 2 customers, got %d", len(customers))
	}
}

func TestSearchCustomersNoMatch(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	handler.CreateCustomer(models.Customer{Name: "John Doe", Phone: "9876543210"})

	customers, err := handler.SearchCustomers("1234")
	if err != nil {
		t.Fatalf("SearchCustomers failed: %v", err)
	}

	if len(customers) != 0 {
		t.Errorf("Expected 0 customers, got %d", len(customers))
	}
}

func TestGetCustomersCSVContent(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Create customers
	handler.CreateCustomer(models.Customer{Name: "John Doe", Phone: "9876543210"})
	handler.CreateCustomer(models.Customer{Name: "Jane Smith", Phone: "9876543211"})

	// Get CSV content
	csv, err := handler.GetCustomersCSVContent()
	if err != nil {
		t.Fatalf("GetCustomersCSVContent failed: %v", err)
	}

	if csv == "" {
		t.Error("Expected non-empty CSV content")
	}

	// Check CSV header
	if len(csv) < 10 {
		t.Error("CSV content too short")
	}
}

func TestGetTransactionsByCustomerID(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Create a customer
	customer, err := handler.CreateCustomer(models.Customer{Name: "John Doe", Phone: "9876543210"})
	if err != nil {
		t.Fatalf("CreateCustomer failed: %v", err)
	}

	// Create a transaction for the customer
	txn := models.Transaction{
		Items:         []models.CartItem{{ProductID: "1", Name: "Test", Qty: 1, Price: 100, Subtotal: 100}},
		Subtotal:      100,
		TaxTotal:      0,
		Total:         100,
		PaymentMethod: "upi",
		CustomerName:  "John Doe",
		CustomerPhone: "9876543210",
	}
	_, err = handler.CreateTransaction(txn)
	if err != nil {
		t.Fatalf("CreateTransaction failed: %v", err)
	}

	// Get transactions by customer ID
	transactions, err := handler.GetTransactionsByCustomerID(customer.ID)
	if err != nil {
		t.Fatalf("GetTransactionsByCustomerID failed: %v", err)
	}

	if len(transactions) != 1 {
		t.Errorf("Expected 1 transaction, got %d", len(transactions))
	}
}

func TestGetTransactionsByCustomerIDEmpty(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Create a customer with no transactions
	customer, err := handler.CreateCustomer(models.Customer{Name: "John Doe", Phone: "9876543210"})
	if err != nil {
		t.Fatalf("CreateCustomer failed: %v", err)
	}

	transactions, err := handler.GetTransactionsByCustomerID(customer.ID)
	if err != nil {
		t.Fatalf("GetTransactionsByCustomerID failed: %v", err)
	}

	if len(transactions) != 0 {
		t.Errorf("Expected 0 transactions, got %d", len(transactions))
	}
}

func TestGetTransactionsByCustomerIDEmptyID(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	_, err := handler.GetTransactionsByCustomerID("")
	if err == nil {
		t.Error("Expected error for empty ID, got nil")
	}
}
