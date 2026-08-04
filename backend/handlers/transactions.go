package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"one_man_shop/backend/db"
	"one_man_shop/backend/models"

	"github.com/pocketbase/pocketbase/core"
)

// GetUPIString builds the UPI payment URL
func (a *AppHandler) GetUPIString(amount float64) (string, error) {
	s, err := a.GetSettings()
	if err != nil {
		return "", fmt.Errorf("failed to get settings: %w", err)
	}
	return fmt.Sprintf("upi://pay?pa=%s&pn=%s&am=%.2f&cu=INR", s.UPIVPA, s.MerchantName, amount), nil
}

// nextReceiptNumber atomically increments and returns the next receipt number
func (a *AppHandler) nextReceiptNumber() (int, error) {
	settings, err := a.GetSettings()
	if err != nil {
		return 0, fmt.Errorf("failed to get settings for receipt number: %w", err)
	}

	nextNum := settings.LastReceiptNumber + 1
	settings.LastReceiptNumber = nextNum

	// Save updated counter
	records, err := db.App.FindRecordsByFilter("settings", "", "", 0, 0)
	if err != nil || len(records) == 0 {
		return 0, fmt.Errorf("failed to find settings record for receipt number")
	}
	records[0].Set("last_receipt_number", nextNum)
	if err := db.App.SaveNoValidate(records[0]); err != nil {
		return 0, fmt.Errorf("failed to save receipt number: %w", err)
	}

	return nextNum, nil
}

// CreateTransaction saves a completed transaction
func (a *AppHandler) CreateTransaction(t models.Transaction) (models.Transaction, error) {
	log.Printf("[CreateTransaction] total=%.2f, method=%s", t.Total, t.PaymentMethod)
	collection, err := db.App.FindCollectionByNameOrId("transactions")
	if err != nil {
		return models.Transaction{}, fmt.Errorf("failed to find collection: %w", err)
	}

	// Generate rolling receipt number
	receiptNum, err := a.nextReceiptNumber()
	if err != nil {
		log.Printf("[CreateTransaction] Warning: failed to generate receipt number: %v", err)
		receiptNum = 0 // fallback
	}

	items := make([]models.TransactionItem, len(t.Items))
	for i, item := range t.Items {
		items[i] = models.TransactionItem{
			ProductID: item.ProductID, Name: item.Name, Qty: item.Qty,
			Price: item.Price, TaxRate: item.TaxRate, Subtotal: item.Subtotal, TaxAmount: item.TaxAmount,
		}
	}
	itemsJSON, _ := json.Marshal(items)

	record := core.NewRecord(collection)
	record.Set("items", string(itemsJSON))
	record.Set("subtotal", t.Subtotal)
	record.Set("tax_total", t.TaxTotal)
	record.Set("total", t.Total)
	record.Set("payment_method", t.PaymentMethod)
	record.Set("receipt_number", receiptNum)

	if err := db.App.SaveNoValidate(record); err != nil {
		return models.Transaction{}, fmt.Errorf("failed to save transaction: %w", err)
	}

	createdAt := time.Now().UTC().Format(time.RFC3339)

	return models.Transaction{
		ID: record.Id, ReceiptNumber: receiptNum, Items: t.Items,
		Subtotal: t.Subtotal, TaxTotal: t.TaxTotal,
		Total: t.Total, PaymentMethod: t.PaymentMethod, Created: createdAt,
	}, nil
}

// GetTransactions returns recent transactions
func (a *AppHandler) GetTransactions(limit int, offset int) ([]models.Transaction, error) {
	if limit <= 0 {
		limit = 50
	}

	records, err := db.App.FindRecordsByFilter("transactions", "", "", limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch transactions: %w", err)
	}

	transactions := make([]models.Transaction, len(records))
	for i, r := range records {
		var items []models.CartItem
		itemsJSON := r.GetString("items")
		if itemsJSON != "" {
			if err := json.Unmarshal([]byte(itemsJSON), &items); err != nil {
				log.Printf("[GetTransactions] Failed to unmarshal items for transaction %s: %v", r.Id, err)
			}
		}
		transactions[i] = models.Transaction{
			ID: r.Id, ReceiptNumber: int(r.GetInt("receipt_number")),
			Items: items, Subtotal: r.GetFloat("subtotal"), TaxTotal: r.GetFloat("tax_total"),
			Total: r.GetFloat("total"), PaymentMethod: r.GetString("payment_method"), Created: r.GetString("created"),
		}
	}
	return transactions, nil
}
