//go:build !android

package main

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
)

const (
	// Config file name for storing user preferences
	configFileName = "config.json"
)

// appConfig holds persistent app configuration
type appConfig struct {
	DataDir string `json:"data_dir,omitempty"`
}

// getAppDataDir returns the data directory path for desktop platforms.
// Uses a relative "data" directory which works on desktop.
func getAppDataDir() string {
	// Check for user-selected directory in config
	if cfg := loadConfig(); cfg != nil && cfg.DataDir != "" {
		if ensureDir(cfg.DataDir) {
			log.Printf("[Desktop] Using user-selected data dir: %s", cfg.DataDir)
			return cfg.DataDir
		}
		log.Printf("[Desktop] User-selected dir %q not accessible, using default", cfg.DataDir)
	}

	return "data"
}

// getDataDirForDisplay returns a human-readable path for the settings UI.
func getDataDirForDisplay() string {
	dir := getAppDataDir()
	abs, _ := filepath.Abs(dir)
	return abs
}

// saveDataDir persists the user-selected data directory to config.
func saveDataDir(path string) error {
	cfg := loadConfig()
	if cfg == nil {
		cfg = &appConfig{}
	}
	cfg.DataDir = path
	return saveConfig(cfg)
}

// loadConfig reads the app configuration from the app's directory.
func loadConfig() *appConfig {
	// Try to find config file in known locations
	configPaths := []string{
		filepath.Join("data", configFileName),
		filepath.Join(".", configFileName),
	}

	// Also check user home directory for cross-platform config
	if home, err := os.UserHomeDir(); err == nil {
		configPaths = append(configPaths, filepath.Join(home, ".one_man_shop", configFileName))
	}

	for _, path := range configPaths {
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		var cfg appConfig
		if err := json.Unmarshal(data, &cfg); err != nil {
			log.Printf("[Desktop] Failed to parse config %q: %v", path, err)
			continue
		}
		log.Printf("[Desktop] Loaded config from %s", path)
		return &cfg
	}
	return nil
}

// saveConfig writes the app configuration to the app's directory.
func saveConfig(cfg *appConfig) error {
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}

	// Try to save config in the data directory first
	configPaths := []string{
		filepath.Join("data", configFileName),
	}

	// Also try user home directory
	if home, err := os.UserHomeDir(); err == nil {
		configDir := filepath.Join(home, ".one_man_shop")
		if err := os.MkdirAll(configDir, 0755); err == nil {
			configPaths = append(configPaths, filepath.Join(configDir, configFileName))
		}
	}

	for _, path := range configPaths {
		dir := filepath.Dir(path)
		if err := os.MkdirAll(dir, 0755); err != nil {
			continue
		}
		if err := os.WriteFile(path, data, 0644); err != nil {
			log.Printf("[Desktop] Failed to write config to %s: %v", path, err)
			continue
		}
		log.Printf("[Desktop] Saved config to %s", path)
		return nil
	}

	return err
}

// ensureDir creates a directory if it doesn't exist and returns true if successful.
func ensureDir(path string) bool {
	if err := os.MkdirAll(path, 0755); err != nil {
		return false
	}
	return true
}
