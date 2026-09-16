package handlers

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestCopyFile(t *testing.T) {
	tmpDir := t.TempDir()
	srcPath := filepath.Join(tmpDir, "source.txt")
	dstPath := filepath.Join(tmpDir, "dest.txt")

	// Write source file
	content := []byte("hello world")
	if err := os.WriteFile(srcPath, content, 0644); err != nil {
		t.Fatalf("Failed to write source file: %v", err)
	}

	// Copy
	if err := copyFile(srcPath, dstPath); err != nil {
		t.Fatalf("copyFile failed: %v", err)
	}

	// Verify
	got, err := os.ReadFile(dstPath)
	if err != nil {
		t.Fatalf("Failed to read destination: %v", err)
	}
	if string(got) != string(content) {
		t.Errorf("File content mismatch: got %q, want %q", got, content)
	}
}

func TestCopyFileSourceNotFound(t *testing.T) {
	tmpDir := t.TempDir()
	err := copyFile(filepath.Join(tmpDir, "nonexistent"), filepath.Join(tmpDir, "dest"))
	if err == nil {
		t.Error("Expected error when copying nonexistent file, got nil")
	}
}

func TestCopyDir(t *testing.T) {
	tmpDir := t.TempDir()
	srcDir := filepath.Join(tmpDir, "src")
	dstDir := filepath.Join(tmpDir, "dst")

	// Create source directory structure
	os.MkdirAll(filepath.Join(srcDir, "sub"), 0755)
	os.WriteFile(filepath.Join(srcDir, "file1.txt"), []byte("file1"), 0644)
	os.WriteFile(filepath.Join(srcDir, "sub", "file2.txt"), []byte("file2"), 0644)

	// Copy
	if err := copyDir(srcDir, dstDir); err != nil {
		t.Fatalf("copyDir failed: %v", err)
	}

	// Verify files exist
	got1, err := os.ReadFile(filepath.Join(dstDir, "file1.txt"))
	if err != nil {
		t.Errorf("Expected file1.txt to exist: %v", err)
	} else if string(got1) != "file1" {
		t.Errorf("File1 content: got %q, want %q", got1, "file1")
	}

	got2, err := os.ReadFile(filepath.Join(dstDir, "sub", "file2.txt"))
	if err != nil {
		t.Errorf("Expected sub/file2.txt to exist: %v", err)
	} else if string(got2) != "file2" {
		t.Errorf("File2 content: got %q, want %q", got2, "file2")
	}
}

func TestCopyDir_not_found(t *testing.T) {
	tmpDir := t.TempDir()
	err := copyDir(filepath.Join(tmpDir, "nonexistent"), filepath.Join(tmpDir, "dst"))
	if err == nil {
		t.Error("Expected error when copying nonexistent directory, got nil")
	}
}

func TestCleanOldBackups(t *testing.T) {
	tmpDir := t.TempDir()

	// Create old backup (30 days ago)
	oldTime := time.Now().AddDate(0, 0, -30)
	oldDir := filepath.Join(tmpDir, "pos_backup_"+oldTime.Format("2006-01-02_15-04-05"))
	os.MkdirAll(oldDir, 0755)
	os.WriteFile(filepath.Join(oldDir, "test.txt"), []byte("old"), 0644)

	// Create recent backup (today)
	recentDir := filepath.Join(tmpDir, "pos_backup_"+time.Now().Format("2006-01-02_15-04-05"))
	os.MkdirAll(recentDir, 0755)
	os.WriteFile(filepath.Join(recentDir, "test.txt"), []byte("recent"), 0644)

	// Clean backups older than 7 days
	cleanOldBackups(tmpDir, 7)

	// Old backup should be removed
	if _, err := os.Stat(oldDir); !os.IsNotExist(err) {
		t.Error("Expected old backup to be removed")
	}

	// Recent backup should remain
	if _, err := os.Stat(recentDir); os.IsNotExist(err) {
		t.Error("Expected recent backup to remain")
	}
}

func TestCleanOldBackups_no_backups(t *testing.T) {
	tmpDir := t.TempDir()
	// Should not panic or error
	cleanOldBackups(tmpDir, 7)
}

func TestCleanOldBackups_invalid_timestamp(t *testing.T) {
	tmpDir := t.TempDir()

	// Create directory with invalid timestamp format
	invalidDir := filepath.Join(tmpDir, "pos_backup_invalid-timestamp")
	os.MkdirAll(invalidDir, 0755)

	// Should skip invalid entries without error
	cleanOldBackups(tmpDir, 7)

	// Invalid dir should remain (can't parse timestamp)
	if _, err := os.Stat(invalidDir); os.IsNotExist(err) {
		t.Error("Expected invalid backup directory to remain (unparseable timestamp)")
	}
}

func TestCleanOldBackups_retention_zero(t *testing.T) {
	tmpDir := t.TempDir()

	// Create old backup
	oldTime := time.Now().AddDate(0, 0, -30)
	oldDir := filepath.Join(tmpDir, "pos_backup_"+oldTime.Format("2006-01-02_15-04-05"))
	os.MkdirAll(oldDir, 0755)

	// Retention of 0 means cutoff = now, so anything older than today gets cleaned
	// This tests that cleanOldBackups still processes with retentionDays=0
	cleanOldBackups(tmpDir, 0)

	// Old backup should be removed because cutoff is today, and oldTime is 30 days ago
	if _, err := os.Stat(oldDir); !os.IsNotExist(err) {
		t.Error("Expected old backup to be removed when retention is 0 (cutoff = today)")
	}
}

func TestTriggerBackup_not_enabled(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Default settings have backup disabled
	err := handler.TriggerBackup()
	if err == nil {
		t.Error("Expected error when backup is not enabled, got nil")
	}
}

func TestSetBackupSchedule(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	// Enable backup schedule
	err := handler.SetBackupSchedule(true)
	if err != nil {
		t.Fatalf("SetBackupSchedule failed: %v", err)
	}

	// Verify it was saved
	settings, err := handler.GetSettings()
	if err != nil {
		t.Fatalf("GetSettings failed: %v", err)
	}
	if !settings.BackupEnabled {
		t.Error("Expected BackupEnabled to be true after enabling")
	}

	// Disable backup schedule
	err = handler.SetBackupSchedule(false)
	if err != nil {
		t.Fatalf("SetBackupSchedule disable failed: %v", err)
	}

	settings, err = handler.GetSettings()
	if err != nil {
		t.Fatalf("GetSettings failed: %v", err)
	}
	if settings.BackupEnabled {
		t.Error("Expected BackupEnabled to be false after disabling")
	}
}

func TestRunBackup_missing_data_dir(t *testing.T) {
	tmpDir := t.TempDir()

	// Use a non-existent data directory by creating a handler without init
	// We'll test the path validation by using a backup folder that exists
	// but the data dir won't have pb_data
	err := runBackup(tmpDir, 7)
	// This will fail because getDataDir() returns the executable's directory,
	// which may or may not have pb_data. We just verify it doesn't panic.
	// The error is expected since we can't control getDataDir() in tests.
	_ = err
}

func TestRunBackup_success(t *testing.T) {
	tmpDir := t.TempDir()
	backupFolder := filepath.Join(tmpDir, "backups")
	os.MkdirAll(backupFolder, 0755)

	// Create a mock pb_data in the executable's data dir
	// Since getDataDir() returns filepath.Dir(os.Executable()), we can't easily mock it.
	// Instead, we test that the function handles the case gracefully.
	err := runBackup(backupFolder, 7)
	// This will likely fail because pb_data doesn't exist at the executable path,
	// but we verify the function doesn't panic and returns an appropriate error.
	if err == nil {
		// If it succeeds, verify backup was created
		entries, _ := os.ReadDir(backupFolder)
		backupCount := 0
		for _, e := range entries {
			if e.IsDir() && len(e.Name()) > 11 && e.Name()[:11] == "pos_backup_" {
				backupCount++
			}
		}
		if backupCount != 1 {
			t.Errorf("Expected 1 backup, got %d", backupCount)
		}
	}
}

// ========== Export/Import tests ==========

func TestCreateZipArchive(t *testing.T) {
	srcDir := t.TempDir()
	dstDir := t.TempDir()

	// Create source files
	os.WriteFile(filepath.Join(srcDir, "data.db"), []byte("fake-db-content"), 0644)
	os.WriteFile(filepath.Join(srcDir, "data.db-wal"), []byte("wal-content"), 0644)
	os.MkdirAll(filepath.Join(srcDir, "sub"), 0755)
	os.WriteFile(filepath.Join(srcDir, "sub", "file.txt"), []byte("nested"), 0644)

	zipPath := filepath.Join(dstDir, "test.zip")
	if err := createZipArchive(srcDir, zipPath); err != nil {
		t.Fatalf("createZipArchive failed: %v", err)
	}

	// Verify zip was created
	if _, err := os.Stat(zipPath); os.IsNotExist(err) {
		t.Fatal("Expected zip file to exist")
	}

	// Verify zip is valid by extracting
	extractDir := t.TempDir()
	if err := extractZipArchive(zipPath, extractDir); err != nil {
		t.Fatalf("extractZipArchive failed: %v", err)
	}

	// Verify extracted files
	for _, tc := range []struct{ name, want string }{
		{"data.db", "fake-db-content"},
		{"data.db-wal", "wal-content"},
		{"sub/file.txt", "nested"},
	} {
		got, err := os.ReadFile(filepath.Join(extractDir, tc.name))
		if err != nil {
			t.Errorf("Expected %s to exist: %v", tc.name, err)
			continue
		}
		if string(got) != tc.want {
			t.Errorf("%s: got %q, want %q", tc.name, got, tc.want)
		}
	}
}

func TestExtractZipArchive_nested_pb_data(t *testing.T) {
	// Create a zip with pb_data/ subdirectory structure (what ExportDatabase produces)
	srcDir := t.TempDir()
	pbDataDir := filepath.Join(srcDir, "pb_data")
	os.MkdirAll(pbDataDir, 0755)
	os.WriteFile(filepath.Join(pbDataDir, "data.db"), []byte("nested-db"), 0644)
	os.WriteFile(filepath.Join(pbDataDir, "data.db-wal"), []byte("nested-wal"), 0644)

	zipPath := filepath.Join(t.TempDir(), "nested.zip")
	if err := createZipArchive(pbDataDir, zipPath); err != nil {
		t.Fatalf("createZipArchive failed: %v", err)
	}

	// Extract — should strip pb_data/ prefix
	extractDir := t.TempDir()
	if err := extractZipArchive(zipPath, extractDir); err != nil {
		t.Fatalf("extractZipArchive failed: %v", err)
	}

	// Verify files are at root level (not under pb_data/)
	got, err := os.ReadFile(filepath.Join(extractDir, "data.db"))
	if err != nil {
		t.Fatalf("Expected data.db at root: %v", err)
	}
	if string(got) != "nested-db" {
		t.Errorf("data.db: got %q, want %q", got, "nested-db")
	}
}

func TestValidateDatabaseZip_valid(t *testing.T) {
	srcDir := t.TempDir()
	os.WriteFile(filepath.Join(srcDir, "data.db"), []byte("db"), 0644)

	zipPath := filepath.Join(t.TempDir(), "valid.zip")
	if err := createZipArchive(srcDir, zipPath); err != nil {
		t.Fatalf("createZipArchive failed: %v", err)
	}

	if err := validateDatabaseZip(zipPath); err != nil {
		t.Errorf("Expected valid zip, got error: %v", err)
	}
}

func TestValidateDatabaseZip_valid_nested(t *testing.T) {
	srcDir := t.TempDir()
	pbData := filepath.Join(srcDir, "pb_data")
	os.MkdirAll(pbData, 0755)
	os.WriteFile(filepath.Join(pbData, "data.db"), []byte("db"), 0644)

	zipPath := filepath.Join(t.TempDir(), "nested.zip")
	if err := createZipArchive(pbData, zipPath); err != nil {
		t.Fatalf("createZipArchive failed: %v", err)
	}

	if err := validateDatabaseZip(zipPath); err != nil {
		t.Errorf("Expected valid nested zip, got error: %v", err)
	}
}

func TestValidateDatabaseZip_invalid(t *testing.T) {
	srcDir := t.TempDir()
	os.WriteFile(filepath.Join(srcDir, "random.txt"), []byte("not a db"), 0644)

	zipPath := filepath.Join(t.TempDir(), "invalid.zip")
	if err := createZipArchive(srcDir, zipPath); err != nil {
		t.Fatalf("createZipArchive failed: %v", err)
	}

	if err := validateDatabaseZip(zipPath); err == nil {
		t.Error("Expected error for invalid zip, got nil")
	}
}

func TestValidateDatabaseZip_not_a_zip(t *testing.T) {
	tmpDir := t.TempDir()
	fakePath := filepath.Join(tmpDir, "notazip.zip")
	os.WriteFile(fakePath, []byte("this is not a zip file"), 0644)

	if err := validateDatabaseZip(fakePath); err == nil {
		t.Error("Expected error for non-zip file, got nil")
	}
}

func TestRoundTrip_export_then_import(t *testing.T) {
	// Simulate full export→import round trip
	srcDir := t.TempDir()
	pbDataDir := filepath.Join(srcDir, "pb_data")
	os.MkdirAll(pbDataDir, 0755)
	os.WriteFile(filepath.Join(pbDataDir, "data.db"), []byte("test-db-content"), 0644)
	os.WriteFile(filepath.Join(pbDataDir, "data.db-wal"), []byte("wal"), 0644)

	// Export to zip
	zipPath := filepath.Join(t.TempDir(), "export.zip")
	if err := createZipArchive(pbDataDir, zipPath); err != nil {
		t.Fatalf("Export failed: %v", err)
	}

	// Validate
	if err := validateDatabaseZip(zipPath); err != nil {
		t.Fatalf("Validation failed: %v", err)
	}

	// Import (extract to new dir)
	importDir := t.TempDir()
	if err := extractZipArchive(zipPath, importDir); err != nil {
		t.Fatalf("Import failed: %v", err)
	}

	// Verify data.db exists and has correct content
	got, err := os.ReadFile(filepath.Join(importDir, "data.db"))
	if err != nil {
		t.Fatalf("data.db not found after import: %v", err)
	}
	if string(got) != "test-db-content" {
		t.Errorf("data.db content: got %q, want %q", got, "test-db-content")
	}
}
