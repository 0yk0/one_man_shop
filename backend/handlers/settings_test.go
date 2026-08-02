package handlers

import (
	"testing"
)

func TestGetSettings(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	settings, err := handler.GetSettings()
	if err != nil {
		t.Fatalf("GetSettings failed: %v", err)
	}

	// Should have default values
	if settings.ShopName != "My Shop" {
		t.Errorf("Default ShopName mismatch: got %s, want My Shop", settings.ShopName)
	}
	if settings.Theme != "light" {
		t.Errorf("Default Theme mismatch: got %s, want light", settings.Theme)
	}
	if settings.TaxEnabled {
		t.Error("Default TaxEnabled should be false")
	}
	if settings.BackupRetentionDays != 30 {
		t.Errorf("Default BackupRetentionDays mismatch: got %d, want 30", settings.BackupRetentionDays)
	}
}

func TestSaveSettings(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Get current settings
	settings, err := handler.GetSettings()
	if err != nil {
		t.Fatalf("GetSettings failed: %v", err)
	}

	// Modify
	settings.ShopName = "Updated Shop"
	settings.TaxEnabled = true
	settings.DefaultTaxRate = 0.18

	// Save
	err = handler.SaveSettings(settings)
	if err != nil {
		t.Fatalf("SaveSettings failed: %v", err)
	}

	// Verify
	saved, _ := handler.GetSettings()
	if saved.ShopName != "Updated Shop" {
		t.Errorf("ShopName mismatch: got %s, want Updated Shop", saved.ShopName)
	}
	if !saved.TaxEnabled {
		t.Error("TaxEnabled should be true after save")
	}
	if saved.DefaultTaxRate != 0.18 {
		t.Errorf("DefaultTaxRate mismatch: got %f, want 0.18", saved.DefaultTaxRate)
	}
}

func TestIsSetupComplete(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Default settings have empty UPI VPA, so setup is not complete
	if handler.IsSetupComplete() {
		t.Error("IsSetupComplete should return false with default settings")
	}

	// Configure settings
	settings, _ := handler.GetSettings()
	settings.ShopName = "Test Shop"
	settings.UPIVPA = "test@upi"
	handler.SaveSettings(settings)

	// Now setup should be complete
	if !handler.IsSetupComplete() {
		t.Error("IsSetupComplete should return true after configuration")
	}
}

func TestIsSetupIncompleteNoUPI(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Set shop name but no UPI
	settings, _ := handler.GetSettings()
	settings.ShopName = "Test Shop"
	settings.UPIVPA = ""
	handler.SaveSettings(settings)

	if handler.IsSetupComplete() {
		t.Error("IsSetupComplete should return false without UPI VPA")
	}
}
