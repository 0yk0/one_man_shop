package handlers

import (
	"fmt"
	"log"

	"one_man_shop/backend/db"
	"one_man_shop/backend/models"

	"github.com/pocketbase/pocketbase/core"
)

// GetProducts returns all active products
func (a *AppHandler) GetProducts() ([]models.Product, error) {
	records, err := db.App.FindRecordsByFilter("products", "", "", 0, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch products: %w", err)
	}

	products := make([]models.Product, 0)
	for _, r := range records {
		if !r.GetBool("active") {
			continue
		}
		products = append(products, models.Product{
			ID:        r.Id,
			Name:      r.GetString("name"),
			Price:     r.GetFloat("price"),
			TaxRate:   r.GetFloat("tax_rate"),
			ImageData: r.GetString("image_data"),
			Active:    r.GetBool("active"),
			Created:   r.GetString("created"),
		})
	}
	return products, nil
}

// CreateProduct adds a new product
func (a *AppHandler) CreateProduct(p models.Product) (models.Product, error) {
	allRecords, _ := db.App.FindRecordsByFilter("products", "", "", 0, 0)
	activeCount := 0
	for _, r := range allRecords {
		if r.GetBool("active") {
			activeCount++
		}
	}
	if activeCount >= 50 {
		return models.Product{}, fmt.Errorf("maximum 50 products allowed")
	}

	collection, err := db.App.FindCollectionByNameOrId("products")
	if err != nil {
		return models.Product{}, fmt.Errorf("failed to find collection: %w", err)
	}

	record := core.NewRecord(collection)
	record.Set("name", p.Name)
	record.Set("price", p.Price)
	record.Set("tax_rate", p.TaxRate)
	record.Set("image_data", p.ImageData)
	record.Set("active", true)

	if err := db.App.SaveNoValidate(record); err != nil {
		return models.Product{}, fmt.Errorf("failed to create product: %w", err)
	}

	log.Printf("[CreateProduct] id=%s, name=%s", record.Id, p.Name)
	return models.Product{
		ID: record.Id, Name: p.Name, Price: p.Price, TaxRate: p.TaxRate,
		ImageData: p.ImageData, Active: true, Created: record.GetString("created"),
	}, nil
}

// UpdateProduct updates an existing product
func (a *AppHandler) UpdateProduct(p models.Product) error {
	record, err := db.App.FindRecordById("products", p.ID)
	if err != nil {
		return fmt.Errorf("product not found: %w", err)
	}

	record.Set("name", p.Name)
	record.Set("price", p.Price)
	record.Set("tax_rate", p.TaxRate)
	record.Set("image_data", p.ImageData)
	record.Set("active", p.Active)

	if err := db.App.SaveNoValidate(record); err != nil {
		return fmt.Errorf("failed to update product: %w", err)
	}
	return nil
}

// DeleteProduct soft-deletes a product
func (a *AppHandler) DeleteProduct(id string) error {
	record, err := db.App.FindRecordById("products", id)
	if err != nil {
		return fmt.Errorf("product not found: %w", err)
	}
	record.Set("active", false)
	return db.App.Save(record)
}
