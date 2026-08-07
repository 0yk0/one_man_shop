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
		log.Printf("WARNING: Failed to create data directory %q: %v", dataDir, err)
		// Try fallback directory
		fallback := filepath.Join(os.TempDir(), "one_man_shop_data")
		log.Printf("Trying fallback data directory: %s", fallback)
		if err := os.MkdirAll(fallback, 0755); err != nil {
			log.Fatalf("FATAL: Failed to create fallback data directory %q: %v", fallback, err)
		}
		dataDir = fallback
	}

	// Use data subdirectory for PocketBase
	pbDataDir := filepath.Join(dataDir, "pb_data")
	if err := os.MkdirAll(pbDataDir, 0755); err != nil {
		log.Printf("WARNING: Failed to create PocketBase data directory %q: %v", pbDataDir, err)
		// Try fallback
		fallback := filepath.Join(os.TempDir(), "one_man_shop_data", "pb_data")
		log.Printf("Trying fallback PocketBase directory: %s", fallback)
		if err := os.MkdirAll(fallback, 0755); err != nil {
			log.Fatalf("FATAL: Failed to create fallback PocketBase directory %q: %v", fallback, err)
		}
		pbDataDir = fallback
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
	} else {
		migrateTransactionsCollection(transactionsCol)
	}

	settingsCol, _ := App.FindCollectionByNameOrId("settings")
	if settingsCol == nil {
		createSettingsCollection()
	} else {
		// Migrate existing collection if display fields are missing
		migrateSettingsCollection(settingsCol)
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
		&core.NumberField{Name: "receipt_number", Min: types.Pointer(0.0), OnlyInt: true},
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
		&core.TextField{Name: "admin_pin", Max: 10},
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
		&core.TextField{Name: "printer_name", Max: 200},
		&core.BoolField{Name: "auto_print"},
		&core.NumberField{Name: "paper_width", Min: types.Pointer(58.0), Max: types.Pointer(80.0), OnlyInt: true},
		&core.NumberField{Name: "last_receipt_number", Min: types.Pointer(0.0), OnlyInt: true},
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

// migrateSettingsCollection adds missing fields to an existing settings collection
func migrateSettingsCollection(col *core.Collection) {
	// Check which fields exist
	existingFields := make(map[string]bool)
	for _, f := range col.Fields {
		existingFields[f.GetName()] = true
	}

	// Add missing display fields
	fieldsToAdd := []core.Field{}
	if !existingFields["display_screen"] {
		fieldsToAdd = append(fieldsToAdd, &core.NumberField{Name: "display_screen", Min: types.Pointer(0.0), OnlyInt: true})
	}
	if !existingFields["display_screen_name"] {
		fieldsToAdd = append(fieldsToAdd, &core.TextField{Name: "display_screen_name", Max: 100})
	}
	if !existingFields["display_screen_width"] {
		fieldsToAdd = append(fieldsToAdd, &core.NumberField{Name: "display_screen_width", Min: types.Pointer(0.0), OnlyInt: true})
	}
	if !existingFields["display_screen_height"] {
		fieldsToAdd = append(fieldsToAdd, &core.NumberField{Name: "display_screen_height", Min: types.Pointer(0.0), OnlyInt: true})
	}
	if !existingFields["printer_name"] {
		fieldsToAdd = append(fieldsToAdd, &core.TextField{Name: "printer_name", Max: 200})
	}
	if !existingFields["auto_print"] {
		fieldsToAdd = append(fieldsToAdd, &core.BoolField{Name: "auto_print"})
	}
	if !existingFields["paper_width"] {
		fieldsToAdd = append(fieldsToAdd, &core.NumberField{Name: "paper_width", Min: types.Pointer(58.0), Max: types.Pointer(80.0), OnlyInt: true})
	}
	if !existingFields["last_receipt_number"] {
		fieldsToAdd = append(fieldsToAdd, &core.NumberField{Name: "last_receipt_number", Min: types.Pointer(0.0), OnlyInt: true})
	}

	if len(fieldsToAdd) > 0 {
		col.Fields.Add(fieldsToAdd...)
		if err := App.Save(col); err != nil {
			log.Printf("Failed to migrate settings collection: %v", err)
		} else {
			log.Printf("Migrated settings collection: added %d missing fields", len(fieldsToAdd))
		}
	}
}

// migrateTransactionsCollection adds receipt_number field and backfills existing transactions
func migrateTransactionsCollection(col *core.Collection) {
	existingFields := make(map[string]bool)
	for _, f := range col.Fields {
		existingFields[f.GetName()] = true
	}

	fieldsToAdd := []core.Field{}
	if !existingFields["receipt_number"] {
		fieldsToAdd = append(fieldsToAdd, &core.NumberField{Name: "receipt_number", Min: types.Pointer(0.0), OnlyInt: true})
	}

	if len(fieldsToAdd) > 0 {
		col.Fields.Add(fieldsToAdd...)
		if err := App.Save(col); err != nil {
			log.Printf("Failed to migrate transactions collection: %v", err)
			return
		}
		log.Printf("Migrated transactions collection: added %d missing fields", len(fieldsToAdd))

		// Backfill receipt numbers for existing transactions (ordered by created time)
		records, err := App.FindRecordsByFilter("transactions", "", "created", 0, 0)
		if err != nil {
			log.Printf("Failed to fetch transactions for backfill: %v", err)
			return
		}

		if len(records) > 0 {
			for i, r := range records {
				r.Set("receipt_number", i+1)
				if err := App.SaveNoValidate(r); err != nil {
					log.Printf("Failed to backfill receipt_number for transaction %s: %v", r.Id, err)
				}
			}
			log.Printf("Backfilled receipt numbers for %d transactions", len(records))

			// Update last_receipt_number in settings
			settingsRecords, _ := App.FindRecordsByFilter("settings", "", "", 0, 0)
			if len(settingsRecords) > 0 {
				settingsRecords[0].Set("last_receipt_number", len(records))
				App.SaveNoValidate(settingsRecords[0])
			}
		}
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
		record.Set("admin_pin", "")
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
		record.Set("printer_name", "")
		record.Set("auto_print", true)
		record.Set("paper_width", 80)
		record.Set("last_receipt_number", 0)

		if err := App.Save(record); err != nil {
			log.Printf("Failed to create default settings: %v", err)
		} else {
			log.Println("Created default settings record")
		}
	}
}
