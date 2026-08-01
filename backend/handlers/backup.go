package handlers

import (
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
