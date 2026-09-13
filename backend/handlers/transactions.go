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

	// Link customer if name/phone provided
	var customerID string
	if t.CustomerPhone != "" || t.CustomerName != "" {
		cid, err := a.FindOrCreateCustomer(t.CustomerName, t.CustomerPhone)
		if err != nil {
			log.Printf("[CreateTransaction] Warning: failed to link customer: %v", err)
		} else {
			customerID = cid
		}
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
	record.Set("customer_id", customerID)

	if err := db.App.SaveNoValidate(record); err != nil {
		return models.Transaction{}, fmt.Errorf("failed to save transaction: %w", err)
	}

	// Deduct stock for each product sold
	for _, item := range t.Items {
		productRecord, err := db.App.FindRecordById("products", item.ProductID)
		if err != nil {
			log.Printf("[CreateTransaction] Warning: could not find product %s for stock deduction: %v", item.ProductID, err)
			continue
		}
		currentStock := int(productRecord.GetInt("stock"))
		newStock := currentStock - item.Qty
		if newStock < 0 {
			log.Printf("[CreateTransaction] Warning: stock for product %s would go negative (%d), clamping to 0", item.ProductID, newStock)
			newStock = 0
		}
		productRecord.Set("stock", newStock)
		if err := db.App.SaveNoValidate(productRecord); err != nil {
			log.Printf("[CreateTransaction] Warning: failed to deduct stock for product %s: %v", item.ProductID, err)
		} else {
			log.Printf("[CreateTransaction] Stock deducted: product=%s, was=%d, now=%d, sold=%d", item.ProductID, currentStock, newStock, item.Qty)
		}
	}

	createdAt := time.Now().UTC().Format(time.RFC3339)

	return models.Transaction{
		ID: record.Id, ReceiptNumber: receiptNum, Items: t.Items,
		Subtotal: t.Subtotal, TaxTotal: t.TaxTotal,
		Total: t.Total, PaymentMethod: t.PaymentMethod,
		CustomerID: customerID, Created: createdAt,
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

	// Collect unique customer IDs for batch lookup
	customerIDSet := make(map[string]bool)
	for _, r := range records {
		cid := r.GetString("customer_id")
		if cid != "" {
			customerIDSet[cid] = true
		}
	}
	var customerIDs []string
	for id := range customerIDSet {
		customerIDs = append(customerIDs, id)
	}

	// Batch fetch all customers in one query
	customers := a.GetCustomersByIDs(customerIDs)

	transactions := make([]models.Transaction, len(records))
	for i, r := range records {
		var items []models.CartItem
		itemsJSON := r.GetString("items")
		if itemsJSON != "" {
			if err := json.Unmarshal([]byte(itemsJSON), &items); err != nil {
				log.Printf("[GetTransactions] Failed to unmarshal items for transaction %s: %v", r.Id, err)
			}
		}

		customerID := r.GetString("customer_id")
		var customerName, customerPhone string
		if customerID != "" {
			if cust, ok := customers[customerID]; ok && cust != nil {
				customerName = cust.Name
				customerPhone = cust.Phone
			}
		}

		transactions[i] = models.Transaction{
			ID: r.Id, ReceiptNumber: int(r.GetInt("receipt_number")),
			Items: items, Subtotal: r.GetFloat("subtotal"), TaxTotal: r.GetFloat("tax_total"),
			Total: r.GetFloat("total"), PaymentMethod: r.GetString("payment_method"),
			CustomerID: customerID, CustomerName: customerName, CustomerPhone: customerPhone,
			Created: r.GetString("created"),
		}
	}
	return transactions, nil
}

// GetTransactionsByCustomerID returns all transactions for a specific customer
func (a *AppHandler) GetTransactionsByCustomerID(customerID string) ([]models.Transaction, error) {
	if customerID == "" {
		return nil, fmt.Errorf("customer ID is required")
	}

	records, err := db.App.FindRecordsByFilter("transactions", "customer_id = '"+customerID+"'", "-created", 0, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch transactions: %w", err)
	}

	// Fetch customer info
	customers := a.GetCustomersByIDs([]string{customerID})
	customer := customers[customerID]

	transactions := make([]models.Transaction, len(records))
	for i, r := range records {
		var items []models.CartItem
		itemsJSON := r.GetString("items")
		if itemsJSON != "" {
			if err := json.Unmarshal([]byte(itemsJSON), &items); err != nil {
				log.Printf("[GetTransactionsByCustomerID] Failed to unmarshal items for transaction %s: %v", r.Id, err)
			}
		}

		var customerName, customerPhone string
		if customer != nil {
			customerName = customer.Name
			customerPhone = customer.Phone
		}

		transactions[i] = models.Transaction{
			ID: r.Id, ReceiptNumber: int(r.GetInt("receipt_number")),
			Items: items, Subtotal: r.GetFloat("subtotal"), TaxTotal: r.GetFloat("tax_total"),
			Total: r.GetFloat("total"), PaymentMethod: r.GetString("payment_method"),
			CustomerID: customerID, CustomerName: customerName, CustomerPhone: customerPhone,
			Created: r.GetString("created"),
		}
	}
	return transactions, nil
}
