package handlers

import (
	"fmt"
	"log"

	"one_man_shop/backend/db"
	"one_man_shop/backend/models"
)

// GetSettings returns the shop settings
func (a *AppHandler) GetSettings() (models.Settings, error) {
	records, err := db.App.FindRecordsByFilter("settings", "", "", 0, 0)
	if err != nil {
		log.Printf("[GetSettings] Error finding records: %v", err)
		return models.Settings{}, fmt.Errorf("failed to fetch settings: %w", err)
	}
	if len(records) == 0 {
		return models.Settings{}, fmt.Errorf("no settings found")
	}

	r := records[0]
	return models.Settings{
		ID:                  r.Id,
		ShopName:            r.GetString("shop_name"),
		UPIVPA:              r.GetString("upi_vpa"),
		MerchantName:        r.GetString("merchant_name"),
		AdminPin:            r.GetString("admin_pin"),
		Theme:               r.GetString("theme"),
		TaxEnabled:          r.GetBool("tax_enabled"),
		DefaultTaxRate:      r.GetFloat("default_tax_rate"),
		BackupEnabled:       r.GetBool("backup_enabled"),
		BackupFolder:        r.GetString("backup_folder"),
		BackupRetentionDays: int(r.GetInt("backup_retention_days")),
		DisplayScreen:       int(r.GetInt("display_screen")),
		DisplayScreenName:   r.GetString("display_screen_name"),
		DisplayScreenWidth:  int(r.GetInt("display_screen_width")),
		DisplayScreenHeight: int(r.GetInt("display_screen_height")),
	}, nil
}

// SaveSettings updates the shop settings
func (a *AppHandler) SaveSettings(s models.Settings) error {
	log.Printf("[SaveSettings] shop=%s, vpa=%s", s.ShopName, s.UPIVPA)
	records, err := db.App.FindRecordsByFilter("settings", "", "", 0, 0)
	if err != nil {
		return fmt.Errorf("failed to fetch settings: %w", err)
	}
	if len(records) == 0 {
		return fmt.Errorf("no settings found")
	}

	record := records[0]
	record.Set("shop_name", s.ShopName)
	record.Set("upi_vpa", s.UPIVPA)
	record.Set("merchant_name", s.MerchantName)
	record.Set("admin_pin", s.AdminPin)
	record.Set("theme", s.Theme)
	record.Set("tax_enabled", s.TaxEnabled)
	record.Set("default_tax_rate", s.DefaultTaxRate)
	record.Set("backup_enabled", s.BackupEnabled)
	record.Set("backup_folder", s.BackupFolder)
	record.Set("backup_retention_days", s.BackupRetentionDays)
	record.Set("display_screen", s.DisplayScreen)
	record.Set("display_screen_name", s.DisplayScreenName)
	record.Set("display_screen_width", s.DisplayScreenWidth)
	record.Set("display_screen_height", s.DisplayScreenHeight)

	if err := db.App.SaveNoValidate(record); err != nil {
		return fmt.Errorf("failed to save settings: %w", err)
	}
	return nil
}

// IsSetupComplete checks if the shop owner has configured settings
func (a *AppHandler) IsSetupComplete() bool {
	s, err := a.GetSettings()
	if err != nil {
		return false
	}
	return s.UPIVPA != "" && s.ShopName != ""
}
