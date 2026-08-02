package handlers

import (
	"os"
	"path/filepath"
	"testing"

	"one_man_shop/backend/db"
)

// setupTestDB creates a temporary PocketBase instance for testing
func setupTestDB(t *testing.T) func() {
	t.Helper()

	tmpDir := t.TempDir()
	pbDataDir := filepath.Join(tmpDir, "pb_data")

	if err := os.MkdirAll(pbDataDir, 0755); err != nil {
		t.Fatalf("Failed to create test data dir: %v", err)
	}

	// Initialize PocketBase with test data directory
	db.Init(tmpDir)

	return func() {
		// Cleanup is handled by t.TempDir()
	}
}
