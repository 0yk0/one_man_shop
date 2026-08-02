package handlers

import (
	"os"
	"testing"
)

func TestGetDailyReportEmpty(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	report, err := handler.GetDailyReport("2026-08-02")
	if err != nil {
		t.Fatalf("GetDailyReport failed: %v", err)
	}

	if report.TotalTransactions != 0 {
		t.Errorf("Expected 0 transactions, got %d", report.TotalTransactions)
	}
	if report.TotalRevenue != 0 {
		t.Errorf("Expected 0 revenue, got %f", report.TotalRevenue)
	}
	if report.Date != "2026-08-02" {
		t.Errorf("Date mismatch: got %s, want 2026-08-02", report.Date)
	}
}

func TestGetWeeklyReportInvalidDate(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	_, err := handler.GetWeeklyReport("invalid-date")
	if err == nil {
		t.Error("Expected error for invalid date format, got nil")
	}
}

func TestGetWeeklyReportStructure(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	summaries, err := handler.GetWeeklyReport("2026-08-01")
	if err != nil {
		t.Fatalf("GetWeeklyReport failed: %v", err)
	}

	if len(summaries) != 7 {
		t.Fatalf("Expected 7 days, got %d", len(summaries))
	}

	// Verify dates
	expectedDates := []string{"2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04", "2026-08-05", "2026-08-06", "2026-08-07"}
	for i, s := range summaries {
		if s.Date != expectedDates[i] {
			t.Errorf("Day %d date mismatch: got %s, want %s", i, s.Date, expectedDates[i])
		}
	}
}

func TestExportTransactionsCSVInvalidDate(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	_, err := handler.ExportTransactionsCSV("invalid", "2026-08-02")
	if err == nil {
		t.Error("Expected error for invalid start date, got nil")
	}

	_, err = handler.ExportTransactionsCSV("2026-08-01", "invalid")
	if err == nil {
		t.Error("Expected error for invalid end date, got nil")
	}
}

func TestExportTransactionsCSVEmpty(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	filePath, err := handler.ExportTransactionsCSV("2026-08-01", "2026-08-31")
	if err != nil {
		t.Fatalf("ExportTransactionsCSV failed: %v", err)
	}

	// File should exist
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		t.Errorf("CSV file should exist at %s", filePath)
	}

	// Clean up
	os.Remove(filePath)
}

func TestExportTransactionsCSVToDir(t *testing.T) {
	setupTestDB(t)
	handler := NewAppHandler()

	tmpDir := t.TempDir()

	filePath, err := handler.ExportTransactionsCSVToDir("2026-08-01", "2026-08-31", tmpDir)
	if err != nil {
		t.Fatalf("ExportTransactionsCSVToDir failed: %v", err)
	}

	// File should be in the specified directory
	if filePath[:len(tmpDir)] != tmpDir {
		t.Errorf("CSV file should be in specified directory, got %s", filePath)
	}

	// Clean up
	os.Remove(filePath)
}
