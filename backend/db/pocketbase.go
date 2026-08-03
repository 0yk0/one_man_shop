package db

import (
	"log"
	"os"
	"path/filepath"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

var App *pocketbase.PocketBase

// Init creates and configures the PocketBase instance for embedded use
func Init(dataDir string) *pocketbase.PocketBase {
	// Ensure data directory exists
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Fatalf("Failed to create data directory: %v", err)
	}

	// Use data subdirectory for PocketBase
	pbDataDir := filepath.Join(dataDir, "pb_data")
	if err := os.MkdirAll(pbDataDir, 0755); err != nil {
		log.Fatalf("Failed to create PocketBase data directory: %v", err)
	}

	App = pocketbase.NewWithConfig(pocketbase.Config{
		DefaultDataDir: pbDataDir,
		HideStartBanner: true,
	})

	// Bootstrap PocketBase (opens DB, creates tables, etc.)
	if err := App.Bootstrap(); err != nil {
		log.Fatalf("Failed to bootstrap PocketBase: %v", err)
	}

	// Initialize collections on startup
	initCollections()

	return App
}

// initCollections creates required collections if they don't exist
func initCollections() {
	// Create collections if they don't exist
	productsCol, _ := App.FindCollectionByNameOrId("products")
	if productsCol == nil {
		createProductsCollection()
	}

	transactionsCol, _ := App.FindCollectionByNameOrId("transactions")
	if transactionsCol == nil {
		createTransactionsCollection()
	}

	settingsCol, _ := App.FindCollectionByNameOrId("settings")
	if settingsCol == nil {
		createSettingsCollection()
	}

	// Ensure default settings record
	ensureDefaultSettings()
}

// createProductsCollection creates the products collection
func createProductsCollection() {
	collection := core.NewBaseCollection("products")
	collection.Fields.Add(
		&core.TextField{Name: "name", Required: true, Max: 100},
		&core.NumberField{Name: "price", Required: true, Min: types.Pointer(0.0)},
		&core.NumberField{Name: "tax_rate", Min: types.Pointer(0.0), Max: types.Pointer(1.0)},
		&core.TextField{Name: "image_data", Max: 10000000}, // base64 data URL (~7.5MB)
		&core.BoolField{Name: "active", Required: false},
		&core.AutodateField{Name: "created", OnCreate: true},
		&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true},
	)

	// Allow public access for now (POS is single-user)
	collection.ViewRule = types.Pointer("")
	collection.CreateRule = types.Pointer("")
	collection.UpdateRule = types.Pointer("")
	collection.DeleteRule = types.Pointer("")

	if err := App.Save(collection); err != nil {
		log.Printf("Failed to create products collection: %v", err)
	} else {
		log.Println("Created products collection")
	}
}

// createTransactionsCollection creates the transactions collection
func createTransactionsCollection() {
	collection := core.NewBaseCollection("transactions")
	collection.Fields.Add(
		&core.JSONField{Name: "items"},
		&core.NumberField{Name: "subtotal", Required: true},
		&core.NumberField{Name: "tax_total", Required: true},
		&core.NumberField{Name: "total", Required: true},
		&core.TextField{Name: "payment_method", Required: true, Max: 10},
		&core.AutodateField{Name: "created", OnCreate: true},
		&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true},
	)

	collection.ViewRule = types.Pointer("")
	collection.CreateRule = types.Pointer("")
	collection.UpdateRule = types.Pointer("")
	collection.DeleteRule = types.Pointer("")

	if err := App.Save(collection); err != nil {
		log.Printf("Failed to create transactions collection: %v", err)
	} else {
		log.Println("Created transactions collection")
	}
}

// createSettingsCollection creates the settings collection (single record)
func createSettingsCollection() {
	collection := core.NewBaseCollection("settings")
	collection.Fields.Add(
		&core.TextField{Name: "shop_name", Max: 100},
		&core.TextField{Name: "upi_vpa", Max: 100},
		&core.TextField{Name: "merchant_name", Max: 100},
		&core.TextField{Name: "theme", Max: 50},
		&core.BoolField{Name: "tax_enabled"},
		&core.NumberField{Name: "default_tax_rate", Min: types.Pointer(0.0), Max: types.Pointer(1.0)},
		&core.BoolField{Name: "backup_enabled"},
		&core.TextField{Name: "backup_folder", Max: 500},
		&core.NumberField{Name: "backup_retention_days", Min: types.Pointer(1.0), OnlyInt: true},
		&core.NumberField{Name: "display_screen", Min: types.Pointer(0.0), OnlyInt: true},
		&core.TextField{Name: "display_screen_name", Max: 100},
		&core.NumberField{Name: "display_screen_width", Min: types.Pointer(0.0), OnlyInt: true},
		&core.NumberField{Name: "display_screen_height", Min: types.Pointer(0.0), OnlyInt: true},
	)

	collection.ViewRule = types.Pointer("")
	collection.CreateRule = types.Pointer("")
	collection.UpdateRule = types.Pointer("")
	collection.DeleteRule = types.Pointer("")

	if err := App.Save(collection); err != nil {
		log.Printf("Failed to create settings collection: %v", err)
	} else {
		log.Println("Created settings collection")
	}
}

// ensureDefaultSettings creates a default settings record if none exists
func ensureDefaultSettings() {
	records, _ := App.FindRecordsByFilter("settings", "", "", 0, 0)
	if len(records) == 0 {
		collection, _ := App.FindCollectionByNameOrId("settings")
		if collection == nil {
			return
		}

		record := core.NewRecord(collection)
		record.Set("shop_name", "My Shop")
		record.Set("upi_vpa", "")
		record.Set("merchant_name", "Shop Owner")
		record.Set("theme", "light")
		record.Set("tax_enabled", false)
		record.Set("default_tax_rate", 0.0)
		record.Set("backup_enabled", false)
		record.Set("backup_folder", "")
		record.Set("backup_retention_days", 30)
		record.Set("display_screen", 0)
		record.Set("display_screen_name", "")
		record.Set("display_screen_width", 0)
		record.Set("display_screen_height", 0)

		if err := App.Save(record); err != nil {
			log.Printf("Failed to create default settings: %v", err)
		} else {
			log.Println("Created default settings record")
		}
	}
}
