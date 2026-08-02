package handlers

import (
	"testing"

	"one_man_shop/backend/models"
)

func TestGetProductsEmpty(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	products, err := handler.GetProducts()
	if err != nil {
		t.Fatalf("GetProducts failed: %v", err)
	}

	if len(products) != 0 {
		t.Errorf("Expected 0 products, got %d", len(products))
	}
}

func TestCreateProduct(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	product := models.Product{
		Name:    "Test Product",
		Price:   99.99,
		TaxRate: 0.05,
	}

	created, err := handler.CreateProduct(product)
	if err != nil {
		t.Fatalf("CreateProduct failed: %v", err)
	}

	if created.ID == "" {
		t.Error("Created product should have an ID")
	}
	if created.Name != "Test Product" {
		t.Errorf("Name mismatch: got %s, want Test Product", created.Name)
	}
	if created.Price != 99.99 {
		t.Errorf("Price mismatch: got %f, want 99.99", created.Price)
	}
	if !created.Active {
		t.Error("Created product should be active")
	}
}

func TestGetProductsAfterCreate(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Create a product
	handler.CreateProduct(models.Product{Name: "Product 1", Price: 10.00})
	handler.CreateProduct(models.Product{Name: "Product 2", Price: 20.00})

	products, err := handler.GetProducts()
	if err != nil {
		t.Fatalf("GetProducts failed: %v", err)
	}

	if len(products) != 2 {
		t.Errorf("Expected 2 products, got %d", len(products))
	}
}

func TestCreateProductMax50(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Create 50 products
	for i := 0; i < 50; i++ {
		_, err := handler.CreateProduct(models.Product{Name: "Product", Price: 1.00})
		if err != nil {
			t.Fatalf("Failed to create product %d: %v", i, err)
		}
	}

	// 51st should fail
	_, err := handler.CreateProduct(models.Product{Name: "Product 51", Price: 1.00})
	if err == nil {
		t.Error("Expected error when creating 51st product, got nil")
	}
}

func TestUpdateProduct(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Create a product
	created, err := handler.CreateProduct(models.Product{Name: "Original", Price: 10.00})
	if err != nil {
		t.Fatalf("CreateProduct failed: %v", err)
	}

	// Update it
	created.Name = "Updated"
	created.Price = 25.00
	err = handler.UpdateProduct(created)
	if err != nil {
		t.Fatalf("UpdateProduct failed: %v", err)
	}

	// Verify update
	products, _ := handler.GetProducts()
	if len(products) != 1 {
		t.Fatalf("Expected 1 product, got %d", len(products))
	}
	if products[0].Name != "Updated" {
		t.Errorf("Name mismatch: got %s, want Updated", products[0].Name)
	}
	if products[0].Price != 25.00 {
		t.Errorf("Price mismatch: got %f, want 25.00", products[0].Price)
	}
}

func TestDeleteProductSoft(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Create a product
	created, err := handler.CreateProduct(models.Product{Name: "To Delete", Price: 10.00})
	if err != nil {
		t.Fatalf("CreateProduct failed: %v", err)
	}

	// Soft delete
	err = handler.DeleteProduct(created.ID)
	if err != nil {
		t.Fatalf("DeleteProduct failed: %v", err)
	}

	// Should not appear in GetProducts (which filters active=true)
	products, _ := handler.GetProducts()
	if len(products) != 0 {
		t.Errorf("Expected 0 active products after delete, got %d", len(products))
	}
}
