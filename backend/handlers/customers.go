package handlers

import (
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"

	"one_man_shop/backend/db"
	"one_man_shop/backend/models"

	"github.com/pocketbase/pocketbase/core"
)

var nonDigitRe = regexp.MustCompile(`\D+`)

// normalizePhone strips all non-digit characters from a phone number
func normalizePhone(phone string) string {
	return nonDigitRe.ReplaceAllString(phone, "")
}

// FindOrCreateCustomer looks up a customer by phone, creates if not found.
// Returns the customer_id.
func (a *AppHandler) FindOrCreateCustomer(name, phone string) (string, error) {
	normalizedPhone := normalizePhone(phone)
	if normalizedPhone == "" {
		return "", nil // no phone provided, skip customer linking
	}

	collection, err := db.App.FindCollectionByNameOrId("customers")
	if err != nil {
		return "", fmt.Errorf("failed to find customers collection: %w", err)
	}

	// Search for existing customer by normalized phone using PocketBase filter
	records, err := db.App.FindRecordsByFilter("customers", "phone = '"+normalizedPhone+"'", "", 1, 0)
	if err != nil {
		return "", fmt.Errorf("failed to search customers: %w", err)
	}

	if len(records) > 0 {
		r := records[0]
		// Customer exists — update name if provided and different
		if name != "" && r.GetString("name") != name {
			r.Set("name", name)
			if err := db.App.SaveNoValidate(r); err != nil {
				log.Printf("[FindOrCreateCustomer] Failed to update customer name: %v", err)
			}
		}
		return r.Id, nil
	}

	// Customer not found — create new
	record := core.NewRecord(collection)
	record.Set("name", name)
	record.Set("phone", normalizedPhone)

	if err := db.App.SaveNoValidate(record); err != nil {
		return "", fmt.Errorf("failed to create customer: %w", err)
	}

	log.Printf("[FindOrCreateCustomer] Created customer: %s (%s)", name, normalizedPhone)
	return record.Id, nil
}

// SearchCustomers returns customers whose phone starts with the given prefix.
// Returns up to 5 matches.
func (a *AppHandler) SearchCustomers(phonePrefix string) ([]models.Customer, error) {
	normalizedPrefix := normalizePhone(phonePrefix)
	if len(normalizedPrefix) < 1 {
		return nil, nil
	}

	// Use PocketBase filter: phone LIKE 'prefix%'
	// ~ operator uses SQL LIKE, % is the wildcard
	filter := fmt.Sprintf("phone ~ '%s%%'", normalizedPrefix)
	records, err := db.App.FindRecordsByFilter("customers", filter, "-created", 5, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to search customers: %w", err)
	}

	var results []models.Customer
	seen := make(map[string]bool) // deduplicate by phone

	for _, r := range records {
		if len(results) >= 5 {
			break
		}

		phone := normalizePhone(r.GetString("phone"))
		if phone == "" || seen[phone] {
			continue
		}

		seen[phone] = true
		results = append(results, models.Customer{
			ID:      r.Id,
			Name:    r.GetString("name"),
			Phone:   r.GetString("phone"),
			Created: r.GetString("created"),
		})
	}

	return results, nil
}

// GetCustomers returns all customers sorted by name
func (a *AppHandler) GetCustomers() ([]models.Customer, error) {
	records, err := db.App.FindRecordsByFilter("customers", "", "name", 0, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch customers: %w", err)
	}

	customers := make([]models.Customer, 0)
	for _, r := range records {
		customers = append(customers, models.Customer{
			ID:      r.Id,
			Name:    r.GetString("name"),
			Phone:   r.GetString("phone"),
			Created: r.GetString("created"),
		})
	}
	return customers, nil
}

// CreateCustomer adds a new customer after normalizing phone and checking for duplicates
func (a *AppHandler) CreateCustomer(c models.Customer) (models.Customer, error) {
	phone := normalizePhone(c.Phone)
	if phone == "" {
		return models.Customer{}, fmt.Errorf("phone number is required")
	}

	// Check for duplicate phone
	existing, err := db.App.FindRecordsByFilter("customers", "phone = '"+phone+"'", "", 1, 0)
	if err == nil && len(existing) > 0 {
		return models.Customer{}, fmt.Errorf("a customer with this phone number already exists")
	}

	collection, err := db.App.FindCollectionByNameOrId("customers")
	if err != nil {
		return models.Customer{}, fmt.Errorf("failed to find collection: %w", err)
	}

	record := core.NewRecord(collection)
	record.Set("name", c.Name)
	record.Set("phone", phone)

	if err := db.App.SaveNoValidate(record); err != nil {
		return models.Customer{}, fmt.Errorf("failed to create customer: %w", err)
	}

	log.Printf("[CreateCustomer] id=%s, name=%s, phone=%s", record.Id, c.Name, phone)
	return models.Customer{
		ID:      record.Id,
		Name:    c.Name,
		Phone:   phone,
		Created: record.GetString("created"),
	}, nil
}

// UpdateCustomer updates an existing customer's name and/or phone
func (a *AppHandler) UpdateCustomer(c models.Customer) error {
	if c.ID == "" {
		return fmt.Errorf("customer ID is required")
	}

	phone := normalizePhone(c.Phone)
	if phone == "" {
		return fmt.Errorf("phone number is required")
	}

	// Check for duplicate phone (excluding this customer)
	existing, err := db.App.FindRecordsByFilter("customers", "phone = '"+phone+"' && id != '"+c.ID+"'", "", 1, 0)
	if err == nil && len(existing) > 0 {
		return fmt.Errorf("another customer with this phone number already exists")
	}

	record, err := db.App.FindRecordById("customers", c.ID)
	if err != nil {
		return fmt.Errorf("customer not found: %w", err)
	}

	record.Set("name", c.Name)
	record.Set("phone", phone)

	if err := db.App.SaveNoValidate(record); err != nil {
		return fmt.Errorf("failed to update customer: %w", err)
	}
	return nil
}

// DeleteCustomer permanently removes a customer record
func (a *AppHandler) DeleteCustomer(id string) error {
	record, err := db.App.FindRecordById("customers", id)
	if err != nil {
		return fmt.Errorf("customer not found: %w", err)
	}
	return db.App.Delete(record)
}

// GetCustomerByID returns a customer by their ID
func (a *AppHandler) GetCustomerByID(id string) (*models.Customer, error) {
	if id == "" {
		return nil, nil
	}

	record, err := db.App.FindRecordById("customers", id)
	if err != nil {
		return nil, nil // customer not found, not an error
	}

	return &models.Customer{
		ID:      record.Id,
		Name:    record.GetString("name"),
		Phone:   record.GetString("phone"),
		Created: record.GetString("created"),
	}, nil
}

// GetCustomersByIDs returns multiple customers by their IDs in a single query
func (a *AppHandler) GetCustomersByIDs(ids []string) map[string]*models.Customer {
	result := make(map[string]*models.Customer)
	if len(ids) == 0 {
		return result
	}

	// Build filter: id = 'id1' || id = 'id2' || ...
	var conditions []string
	for _, id := range ids {
		if id != "" {
			conditions = append(conditions, "id = '"+id+"'")
		}
	}
	if len(conditions) == 0 {
		return result
	}

	filter := strings.Join(conditions, " || ")
	records, err := db.App.FindRecordsByFilter("customers", filter, "", 0, 0)
	if err != nil {
		log.Printf("[GetCustomersByIDs] Failed to batch fetch customers: %v", err)
		return result
	}

	for _, r := range records {
		result[r.Id] = &models.Customer{
			ID:      r.Id,
			Name:    r.GetString("name"),
			Phone:   r.GetString("phone"),
			Created: r.GetString("created"),
		}
	}

	return result
}

// GetCustomersCSVContent returns a CSV string of all customers with transaction stats
func (a *AppHandler) GetCustomersCSVContent() (string, error) {
	// Fetch all customers
	customers, err := a.GetCustomers()
	if err != nil {
		return "", fmt.Errorf("failed to fetch customers: %w", err)
	}

	// Fetch all transactions to compute stats per customer
	records, err := db.App.FindRecordsByFilter("transactions", "", "-created", 0, 0)
	if err != nil {
		return "", fmt.Errorf("failed to fetch transactions: %w", err)
	}

	// Compute stats per customer
	type customerStats struct {
		TransactionCount int
		TotalSpent       float64
		LastVisit        string
	}
	stats := make(map[string]*customerStats)

	for _, r := range records {
		cid := r.GetString("customer_id")
		if cid == "" {
			continue
		}
		if _, ok := stats[cid]; !ok {
			stats[cid] = &customerStats{}
		}
		s := stats[cid]
		s.TransactionCount++
		s.TotalSpent += r.GetFloat("total")
		created := r.GetString("created")
		if created > s.LastVisit {
			s.LastVisit = created
		}
	}

	// Build CSV
	csv := "Name,Phone,Total Transactions,Total Spent,Last Visit\n"
	for _, c := range customers {
		s := stats[c.ID]
		txCount := 0
		totalSpent := 0.0
		lastVisit := ""
		if s != nil {
			txCount = s.TransactionCount
			totalSpent = s.TotalSpent
			lastVisit = s.LastVisit
		}

		// Format last visit as date only
		if lastVisit != "" {
			if t, err := time.Parse(time.RFC3339, lastVisit); err == nil {
				lastVisit = t.Format("2006-01-02")
			}
		}

		// Escape names with commas or quotes
		name := c.Name
		if len(name) > 0 {
			name = fmt.Sprintf("%q", name)
		}

		csv += fmt.Sprintf("%s,%s,%d,%.2f,%s\n",
			name, c.Phone, txCount, totalSpent, lastVisit)
	}

	return csv, nil
}
