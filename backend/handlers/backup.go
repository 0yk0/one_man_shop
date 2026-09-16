package handlers

import (
	"archive/zip"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// TriggerBackup copies the PocketBase data to the backup folder
func (a *AppHandler) TriggerBackup() error {
	s, err := a.GetSettings()
	if err != nil {
		return fmt.Errorf("failed to get settings: %w", err)
	}

	if !s.BackupEnabled || s.BackupFolder == "" {
		return fmt.Errorf("backup is not enabled or no folder configured")
	}

	return runBackup(s.BackupFolder, s.BackupRetentionDays)
}

// SetBackupSchedule enables or disables the nightly backup
func (a *AppHandler) SetBackupSchedule(enabled bool) error {
	s, err := a.GetSettings()
	if err != nil {
		return err
	}
	s.BackupEnabled = enabled
	return a.SaveSettings(s)
}

// StartBackupScheduler starts a goroutine that runs backup nightly
func (a *AppHandler) StartBackupScheduler() {
	go func() {
		for {
			time.Sleep(24 * time.Hour)
			s, err := a.GetSettings()
			if err != nil || !s.BackupEnabled || s.BackupFolder == "" {
				continue
			}
			log.Printf("[Backup] Starting nightly backup...")
			if err := runBackup(s.BackupFolder, s.BackupRetentionDays); err != nil {
				log.Printf("[Backup] Error: %v", err)
			} else {
				log.Printf("[Backup] Nightly backup completed")
			}
		}
	}()
}

// runBackup copies pb_data to timestamped folder and cleans old backups
func runBackup(backupFolder string, retentionDays int) error {
	dataDir := getDataDir()
	pbDataDir := filepath.Join(dataDir, "pb_data")

	if _, err := os.Stat(pbDataDir); os.IsNotExist(err) {
		return fmt.Errorf("PocketBase data directory not found: %s", pbDataDir)
	}

	// Create backup subfolder with timestamp
	timestamp := time.Now().Format("2006-01-02_15-04-05")
	backupDir := filepath.Join(backupFolder, "pos_backup_"+timestamp)

	if err := os.MkdirAll(backupDir, 0755); err != nil {
		return fmt.Errorf("failed to create backup directory: %w", err)
	}

	// Copy pb_data directory
	if err := copyDir(pbDataDir, filepath.Join(backupDir, "pb_data")); err != nil {
		return fmt.Errorf("failed to copy data: %w", err)
	}

	log.Printf("[Backup] Backup created at: %s", backupDir)

	// Clean old backups
	if retentionDays > 0 {
		cleanOldBackups(backupFolder, retentionDays)
	}

	return nil
}

// cleanOldBackups removes backups older than retentionDays
func cleanOldBackups(backupFolder string, retentionDays int) {
	entries, err := os.ReadDir(backupFolder)
	if err != nil {
		return
	}

	cutoff := time.Now().AddDate(0, 0, -retentionDays)

	// Find backup directories
	var backups []string
	for _, entry := range entries {
		if entry.IsDir() && strings.HasPrefix(entry.Name(), "pos_backup_") {
			backups = append(backups, entry.Name())
		}
	}

	// Sort and remove old ones
	sort.Strings(backups)
	for _, name := range backups {
		// Parse timestamp from directory name
		ts := strings.TrimPrefix(name, "pos_backup_")
		t, err := time.Parse("2006-01-02_15-04-05", ts)
		if err != nil {
			continue
		}
		if t.Before(cutoff) {
			dirPath := filepath.Join(backupFolder, name)
			log.Printf("[Backup] Removing old backup: %s", name)
			os.RemoveAll(dirPath)
		}
	}
}

// ExportDatabaseToTemp creates a zip archive of the pb_data directory in the given temp directory.
// Used by Android where the file is later copied to Downloads via MediaStore.
func (a *AppHandler) ExportDatabaseToTemp(dataDir string, tempDir string) (string, error) {
	pbDataDir := filepath.Join(dataDir, "pb_data")

	if _, err := os.Stat(pbDataDir); os.IsNotExist(err) {
		return "", fmt.Errorf("PocketBase data directory not found: %s", pbDataDir)
	}

	timestamp := time.Now().Format("2006-01-02_15-04-05")
	zipName := "pos_database_export_" + timestamp + ".zip"
	zipPath := filepath.Join(tempDir, zipName)

	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create temp directory: %w", err)
	}

	if err := createZipArchive(pbDataDir, zipPath); err != nil {
		return "", fmt.Errorf("failed to create zip archive: %w", err)
	}

	log.Printf("[Export] Database zip created at: %s", zipPath)
	return zipPath, nil
}

// ExportDatabase creates a zip archive of the pb_data directory and saves it to the given target directory.
// Returns the path of the created zip file.
func (a *AppHandler) ExportDatabase(dataDir string, targetDir string) (string, error) {
	pbDataDir := filepath.Join(dataDir, "pb_data")

	if _, err := os.Stat(pbDataDir); os.IsNotExist(err) {
		return "", fmt.Errorf("PocketBase data directory not found: %s", pbDataDir)
	}

	timestamp := time.Now().Format("2006-01-02_15-04-05")
	zipName := "pos_database_export_" + timestamp + ".zip"
	zipPath := filepath.Join(targetDir, zipName)

	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create export directory: %w", err)
	}

	if err := createZipArchive(pbDataDir, zipPath); err != nil {
		return "", fmt.Errorf("failed to create zip archive: %w", err)
	}

	log.Printf("[Export] Database exported to: %s", zipPath)
	return zipPath, nil
}

// ImportDatabase extracts a zip archive into the pb_data_import staging directory.
// The actual swap happens on next app startup in db.Init().
func (a *AppHandler) ImportDatabase(dataDir string, sourcePath string) error {
	// Validate the source zip contains a valid database
	if err := validateDatabaseZip(sourcePath); err != nil {
		return fmt.Errorf("invalid database file: %w", err)
	}

	// Check available disk space — require at least 2x the zip file size
	zipInfo, err := os.Stat(sourcePath)
	if err != nil {
		return fmt.Errorf("cannot read import file: %w", err)
	}
	stagingDir := filepath.Join(dataDir, "pb_data_import")

	// Remove any leftover staging from a previous interrupted import
	if err := os.RemoveAll(stagingDir); err != nil {
		return fmt.Errorf("failed to clean staging directory: %w", err)
	}

	if err := os.MkdirAll(stagingDir, 0755); err != nil {
		return fmt.Errorf("failed to create staging directory: %w", err)
	}

	// Check free disk space before extraction
	freeSpace, err := getFreeSpace(dataDir)
	if err == nil && freeSpace < zipInfo.Size()*2 {
		os.RemoveAll(stagingDir)
		return fmt.Errorf("insufficient disk space: need at least %d bytes, have %d bytes", zipInfo.Size()*2, freeSpace)
	}

	if err := extractZipArchive(sourcePath, stagingDir); err != nil {
		os.RemoveAll(stagingDir) // clean up on failure
		return fmt.Errorf("failed to extract database: %w", err)
	}

	log.Printf("[Import] Database staged for import at: %s", stagingDir)
	return nil
}

// validateDatabaseZip checks that the zip file contains a data.db file
// either at the root or inside a pb_data/ subdirectory.
func validateDatabaseZip(zipPath string) error {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return fmt.Errorf("cannot open zip file: %w", err)
	}
	defer r.Close()

	for _, f := range r.File {
		name := filepath.ToSlash(f.Name)
		// Check for data.db at root or inside pb_data/
		if name == "data.db" || name == "pb_data/data.db" {
			return nil
		}
	}

	return fmt.Errorf("zip does not contain a valid PocketBase database (data.db not found)")
}

// createZipArchive creates a zip archive of the source directory.
func createZipArchive(sourceDir string, zipPath string) error {
	zipFile, err := os.Create(zipPath)
	if err != nil {
		return err
	}
	defer zipFile.Close()

	w := zip.NewWriter(zipFile)
	defer w.Close()

	return filepath.Walk(sourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip directories (zip entries are created implicitly)
		if info.IsDir() {
			return nil
		}

		// Compute relative path within the zip
		relPath, err := filepath.Rel(sourceDir, path)
		if err != nil {
			return err
		}

		// Use forward slashes in zip
		zipName := filepath.ToSlash(relPath)

		f, err := w.Create(zipName)
		if err != nil {
			return err
		}

		srcFile, err := os.Open(path)
		if err != nil {
			return err
		}
		_, err = io.Copy(f, srcFile)
		srcFile.Close()
		return err
	})
}

// maxImportSize is the maximum allowed total decompressed size for a database import (1 GB).
const maxImportSize int64 = 1 * 1024 * 1024 * 1024

// extractZipArchive extracts a zip file into the target directory.
// If the zip contains files at root (data.db), they are placed directly in targetDir.
// If the zip contains a pb_data/ subdirectory, its contents are placed in targetDir.
func extractZipArchive(zipPath string, targetDir string) error {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}
	defer r.Close()

	// Detect structure: does the zip have files at root or inside pb_data/?
	hasNestedPB := false
	for _, f := range r.File {
		name := filepath.ToSlash(f.Name)
		if strings.HasPrefix(name, "pb_data/") {
			hasNestedPB = true
			break
		}
	}

	// Check total decompressed size to prevent zip bombs
	var totalSize int64
	for _, f := range r.File {
		if f.FileInfo().IsDir() {
			continue
		}
		totalSize += int64(f.UncompressedSize64)
		if totalSize > maxImportSize {
			return fmt.Errorf("database file is too large (%d bytes decompressed, max %d bytes)", totalSize, maxImportSize)
		}
	}

	for _, f := range r.File {
		name := filepath.ToSlash(f.Name)

		// Determine the output path
		var outRel string
		if hasNestedPB && strings.HasPrefix(name, "pb_data/") {
			// Strip the pb_data/ prefix — extract contents into targetDir
			outRel = strings.TrimPrefix(name, "pb_data/")
		} else {
			// Files are at root level — extract directly into targetDir
			outRel = name
		}

		// Skip empty paths (directory entries)
		if outRel == "" || strings.HasSuffix(outRel, "/") {
			continue
		}

		outPath := filepath.Join(targetDir, filepath.FromSlash(outRel))

		// Ensure parent directory exists
		if err := os.MkdirAll(filepath.Dir(outPath), 0755); err != nil {
			return err
		}

		outFile, err := os.Create(outPath)
		if err != nil {
			return err
		}

		srcFile, err := f.Open()
		if err != nil {
			outFile.Close()
			return err
		}

		_, err = io.Copy(outFile, srcFile)
		srcFile.Close()
		outFile.Close()
		if err != nil {
			return err
		}
	}

	return nil
}

// getDataDir returns the application data directory
func getDataDir() string {
	execPath, _ := os.Executable()
	return filepath.Dir(execPath)
}

// copyDir recursively copies src to dst
func copyDir(src, dst string) error {
	srcInfo, err := os.Stat(src)
	if err != nil {
		return err
	}

	if err := os.MkdirAll(dst, srcInfo.Mode()); err != nil {
		return err
	}

	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())

		if entry.IsDir() {
			if err := copyDir(srcPath, dstPath); err != nil {
				return err
			}
		} else {
			if err := copyFile(srcPath, dstPath); err != nil {
				return err
			}
		}
	}

	return nil
}

// copyFile copies a single file
func copyFile(src, dst string) error {
	srcFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	dstFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer dstFile.Close()

	_, err = io.Copy(dstFile, srcFile)
	return err
}
