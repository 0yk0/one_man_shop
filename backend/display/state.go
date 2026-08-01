package display

import (
	"log"
	"sync"
)

// View represents what the customer display should show
type View string

const (
	ViewMenu       View = "menu"       // Show product list
	ViewBill       View = "bill"       // Show cart items + totals
	ViewThankYou   View = "thankyou"   // Show payment received
)

// CartItem represents a single item in the cart for display
type CartItem struct {
	ProductID string  `json:"product_id"`
	Name      string  `json:"name"`
	Qty       int     `json:"qty"`
	Price     float64 `json:"price"`
	Subtotal  float64 `json:"subtotal"`
}

// Product represents a product for display
type Product struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
}

// State holds the current customer display state
type State struct {
	mu            sync.RWMutex
	View          View        `json:"view"`
	ShopName      string      `json:"shop_name"`
	Products      []Product   `json:"products"`
	CartItems     []CartItem  `json:"cart_items"`
	Total         float64     `json:"total"`
	Tax           float64     `json:"tax"`
	PaymentMethod string      `json:"payment_method"`
	UPIString     string      `json:"upi_string"`
	Theme         string      `json:"theme"`
}

// Manager manages the display state and notifies listeners
type Manager struct {
	state     *State
	listeners []func(State)
	wsHub     *WSHub
	mu        sync.Mutex
}

// NewManager creates a new display state manager
func NewManager() *Manager {
	return &Manager{
		state: &State{
			View:  ViewMenu,
			Theme: "light",
		},
		wsHub: NewWSHub(),
	}
}

// WSHub returns the WebSocket hub for HTTP handler registration
func (m *Manager) WSHub() *WSHub {
	return m.wsHub
}

// GetState returns a copy of the current state
func (m *Manager) GetState() State {
	m.state.mu.RLock()
	defer m.state.mu.RUnlock()
	return *m.state
}

// SetMenu shows the product menu
func (m *Manager) SetMenu(shopName string, products []Product, theme string) {
	m.state.mu.Lock()
	m.state.View = ViewMenu
	m.state.ShopName = shopName
	m.state.Products = products
	m.state.Theme = theme
	m.state.CartItems = nil
	m.state.Total = 0
	m.state.Tax = 0
	m.state.PaymentMethod = ""
	m.state.mu.Unlock()
	m.notify()
	log.Printf("[Display] Menu: %s (%d products)", shopName, len(products))
}

// SetBill shows the cart items and totals
func (m *Manager) SetBill(cartItems []CartItem, total, tax float64, shopName, theme string) {
	m.state.mu.Lock()
	m.state.View = ViewBill
	m.state.CartItems = cartItems
	m.state.Total = total
	m.state.Tax = tax
	m.state.ShopName = shopName
	m.state.Theme = theme
	m.state.mu.Unlock()
	m.notify()
	log.Printf("[Display] Bill: %d items, total=%.2f", len(cartItems), total)
}

// SetPaymentMethod records the payment method
func (m *Manager) SetPaymentMethod(method string) {
	m.state.mu.Lock()
	m.state.PaymentMethod = method
	m.state.mu.Unlock()
	m.notify()
	log.Printf("[Display] Payment method: %s", method)
}

// SetUPIData adds UPI QR data to the bill (does NOT change view)
func (m *Manager) SetUPIData(upiString string) {
	m.state.mu.Lock()
	m.state.UPIString = upiString
	m.state.mu.Unlock()
	m.notify()
	log.Printf("[Display] UPI data set, bill shows QR")
}

// SetThankYou shows the thank you screen
func (m *Manager) SetThankYou() {
	m.state.mu.Lock()
	m.state.View = ViewThankYou
	m.state.mu.Unlock()
	m.notify()
	log.Printf("[Display] ThankYou")
}

// Clear resets the display to menu
func (m *Manager) Clear() {
	m.state.mu.Lock()
	m.state.View = ViewMenu
	m.state.CartItems = nil
	m.state.Total = 0
	m.state.Tax = 0
	m.state.PaymentMethod = ""
	m.state.mu.Unlock()
	m.notify()
	log.Printf("[Display] Cleared → menu")
}

// OnUpdate registers a listener for state changes
func (m *Manager) OnUpdate(fn func(State)) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.listeners = append(m.listeners, fn)
}

func (m *Manager) notify() {
	m.state.mu.RLock()
	state := *m.state
	m.state.mu.RUnlock()

	// Broadcast to WebSocket clients
	if m.wsHub != nil {
		m.wsHub.Broadcast(state)
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	for _, fn := range m.listeners {
		fn(state)
	}
}
