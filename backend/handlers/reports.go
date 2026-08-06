package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"one_man_shop/backend/db"
	"one_man_shop/backend/models"
)

// GetDailyReport returns sales summary for a given date
func (a *AppHandler) GetDailyReport(date string) (models.ReportSummary, error) {
	records, err := db.App.FindRecordsByFilter("transactions", "", "", 0, 0)
	if err != nil {
		return models.ReportSummary{}, fmt.Errorf("failed to fetch report: %w", err)
	}

	summary := models.ReportSummary{Date: date}
	for _, r := range records {
		created := strings.Replace(r.GetString("created"), " ", "T", 1)
		t, err := time.Parse(time.RFC3339, created)
		if err != nil || t.UTC().Format("2006-01-02") != date {
			continue
		}
		summary.TotalTransactions++
		summary.TotalRevenue += r.GetFloat("total")
		summary.TotalTax += r.GetFloat("tax_total")
		if r.GetString("payment_method") == "upi" {
			summary.UPITransactions++
		} else {
			summary.CashTransactions++
		}
	}
	return summary, nil
}

// GetWeeklyReport returns sales summaries for 7 days starting from startDate
func (a *AppHandler) GetWeeklyReport(startDate string) ([]models.ReportSummary, error) {
	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		return nil, fmt.Errorf("invalid date format: %w", err)
	}

	records, err := db.App.FindRecordsByFilter("transactions", "", "", 0, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch transactions: %w", err)
	}

	summaries := make([]models.ReportSummary, 7)
	for i := 0; i < 7; i++ {
		summaries[i] = models.ReportSummary{Date: start.AddDate(0, 0, i).Format("2006-01-02")}
	}

	for _, r := range records {
		created := strings.Replace(r.GetString("created"), " ", "T", 1)
		t, err := time.Parse(time.RFC3339, created)
		if err != nil {
			continue
		}
		txDate := t.UTC().Format("2006-01-02")
		for i := 0; i < 7; i++ {
			if summaries[i].Date == txDate {
				summaries[i].TotalTransactions++
				summaries[i].TotalRevenue += r.GetFloat("total")
				summaries[i].TotalTax += r.GetFloat("tax_total")
				if r.GetString("payment_method") == "upi" {
					summaries[i].UPITransactions++
				} else {
					summaries[i].CashTransactions++
				}
				break
			}
		}
	}
	return summaries, nil
}

// ExportTransactionsCSV generates a CSV and returns the file path
func (a *AppHandler) ExportTransactionsCSV(startDate, endDate string) (string, error) {
	return a.exportTransactionsCSV(startDate, endDate, "")
}

// ExportTransactionsCSVToDir generates a CSV to a specific directory
func (a *AppHandler) ExportTransactionsCSVToDir(startDate, endDate, dir string) (string, error) {
	return a.exportTransactionsCSV(startDate, endDate, dir)
}

// GetTransactionsCSVContent generates CSV content and returns it as a string (for mobile browser download)
func (a *AppHandler) GetTransactionsCSVContent(startDate, endDate string) (string, error) {
	return a.generateTransactionsCSV(startDate, endDate)
}

func (a *AppHandler) generateTransactionsCSV(startDate, endDate string) (string, error) {
	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		return "", fmt.Errorf("invalid start date: %w", err)
	}
	start = start.UTC()

	end, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		return "", fmt.Errorf("invalid end date: %w", err)
	}
	end = end.Add(24*time.Hour - time.Second).UTC()

	records, err := db.App.FindRecordsByFilter("transactions", "", "", 0, 0)
	if err != nil {
		return "", fmt.Errorf("failed to fetch transactions: %w", err)
	}

	csv := "Date,Time,Items,Subtotal,Tax,Total,Payment Method\n"
	for _, r := range records {
		created := r.GetString("created")
		created = strings.Replace(created, " ", "T", 1)
		t, err := time.Parse(time.RFC3339, created)
		if err != nil {
			continue
		}
		t = t.UTC()
		if t.Before(start) || t.After(end) {
			continue
		}

		var items []models.CartItem
		itemsJSON := r.GetString("items")
		if itemsJSON != "" {
			if err := json.Unmarshal([]byte(itemsJSON), &items); err != nil {
				log.Printf("[ExportCSV] Failed to unmarshal items for transaction %s: %v", r.Id, err)
			}
		}

		itemNames := ""
		for j, item := range items {
			if j > 0 {
				itemNames += "; "
			}
			itemNames += fmt.Sprintf("%s x%d", item.Name, item.Qty)
		}
		itemNames = strings.ReplaceAll(itemNames, "\"", "\"\"")

		csv += fmt.Sprintf("%s,%s,\"%s\",%.2f,%.2f,%.2f,%s\n",
			t.Format("2006-01-02"), t.Format("15:04:05"), itemNames,
			r.GetFloat("subtotal"), r.GetFloat("tax_total"), r.GetFloat("total"), r.GetString("payment_method"),
		)
	}
	return csv, nil
}

func (a *AppHandler) exportTransactionsCSV(startDate, endDate, dir string) (string, error) {
	csv, err := a.generateTransactionsCSV(startDate, endDate)
	if err != nil {
		return "", err
	}

	filename := fmt.Sprintf("pos_report_%s_to_%s.csv", startDate, endDate)
	var filePath string
	if dir != "" {
		filePath = filepath.Join(dir, filename)
	} else {
		filePath = filepath.Join(os.TempDir(), filename)
	}

	if err := os.WriteFile(filePath, []byte(csv), 0644); err != nil {
		return "", fmt.Errorf("failed to write CSV: %w", err)
	}
	return filePath, nil
}
