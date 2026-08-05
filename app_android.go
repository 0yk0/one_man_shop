//go:build android

package main

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"strings"
)

const (
	// Android package name for the app
	androidPackageName = "in.yk0.oms"

	// Config file name for storing user preferences
	configFileName = "config.json"
)

// appConfig holds persistent app configuration
type appConfig struct {
	DataDir string `json:"data_dir,omitempty"`
}

// getAppDataDir returns the data directory path for Android.
// Priority order:
// 1. User-selected directory (from config) — validated for write access
// 2. External files directory (persists across uninstalls on Android 11+)
// 3. Internal files directory (always available)
// 4. Temp directory fallback
func getAppDataDir() string {
	// 1. Check for user-selected directory in config
	if cfg := loadConfig(); cfg != nil && cfg.DataDir != "" {
		// Validate the path is actually writable before using it
		if ensureDir(cfg.DataDir) && isWritable(cfg.DataDir) {
			log.Printf("[Android] Using user-selected data dir: %s", cfg.DataDir)
			return cfg.DataDir
		}
		log.Printf("[Android] User-selected dir %q is not writable, clearing config and using defaults", cfg.DataDir)
		// Clear the bad path from config so next launch doesn't fail again
		clearDataDirConfig()
	}

	// 2. Try external files directory (persists across uninstalls on Android 11+)
	// This is the recommended location for Android apps
	externalPaths := []string{
		"/storage/emulated/0/Android/data/" + androidPackageName + "/files/" + androidPackageName,
		"/storage/emulated/0/Android/data/" + androidPackageName + "/files",
		filepath.Join("/sdcard/Android/data", androidPackageName, "files"),
	}

	for _, path := range externalPaths {
		if ensureDir(path) && isWritable(path) {
			log.Printf("[Android] Using external storage: %s", path)
			return path
		}
	}

	// 3. Try internal files directory (always available, but wiped on uninstall)
	internalPaths := []string{
		"/data/data/" + androidPackageName + "/files",
		"/data/user/0/" + androidPackageName + "/files",
	}

	for _, path := range internalPaths {
		if ensureDir(path) && isWritable(path) {
			log.Printf("[Android] Using internal storage: %s", path)
			return path
		}
	}

	// 4. Final fallback: temp directory (last resort)
	fallback := filepath.Join(os.TempDir(), "one_man_shop_data")
	if ensureDir(fallback) {
		log.Printf("[Android] Using fallback temp path: %s", fallback)
		return fallback
	}

	log.Printf("[Android] WARNING: Could not find writable data directory")
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

// clearDataDirConfig removes the saved data directory from config.
// Called when a saved path turns out to be unwritable.
func clearDataDirConfig() {
	cfg := loadConfig()
	if cfg != nil {
		cfg.DataDir = ""
		_ = saveConfig(cfg)
	}
}

// loadConfig reads the app configuration from internal storage.
func loadConfig() *appConfig {
	// Config is always stored in internal storage (never wiped by user)
	configPaths := []string{
		"/data/data/" + androidPackageName + "/files/" + configFileName,
		"/data/user/0/" + androidPackageName + "/files/" + configFileName,
		filepath.Join(os.Getenv("HOME"), configFileName),
	}

	for _, path := range configPaths {
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		var cfg appConfig
		if err := json.Unmarshal(data, &cfg); err != nil {
			log.Printf("[Android] Failed to parse config %q: %v", path, err)
			continue
		}
		log.Printf("[Android] Loaded config from %s", path)
		return &cfg
	}
	return nil
}

// saveConfig writes the app configuration to internal storage.
func saveConfig(cfg *appConfig) error {
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}

	// Try to save to internal storage first (most reliable)
	configPaths := []string{
		"/data/data/" + androidPackageName + "/files/" + configFileName,
		"/data/user/0/" + androidPackageName + "/files/" + configFileName,
	}

	for _, path := range configPaths {
		dir := filepath.Dir(path)
		if !ensureDir(dir) {
			continue
		}
		if err := os.WriteFile(path, data, 0644); err != nil {
			log.Printf("[Android] Failed to write config to %s: %v", path, err)
			continue
		}
		log.Printf("[Android] Saved config to %s", path)
		return nil
	}

	return err
}

// isWritable checks if a directory exists and is writable.
func isWritable(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	if !info.IsDir() {
		return false
	}
	// Try to create a temp file to test write access
	tmpFile := filepath.Join(path, ".write_test")
	f, err := os.Create(tmpFile)
	if err != nil {
		return false
	}
	f.Close()
	os.Remove(tmpFile)
	return true
}

// ensureDir creates a directory if it doesn't exist and returns true if successful.
func ensureDir(path string) bool {
	if err := os.MkdirAll(path, 0755); err != nil {
		return false
	}
	return true
}

// normalizePath cleans and normalizes a file path.
func normalizePath(path string) string {
	return filepath.Clean(strings.TrimSpace(path))
}
