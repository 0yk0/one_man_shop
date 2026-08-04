package server

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/coder/websocket"

	"thermal-printer-emulator/escpos"
)

// ReceiptHub manages WebSocket connections and broadcasts receipts to all clients
type ReceiptHub struct {
	clients    sync.Map
	mu         sync.Mutex
	receipts   []escpos.Receipt // history of all received receipts
	maxHistory int
}

// NewReceiptHub creates a new receipt hub
func NewReceiptHub() *ReceiptHub {
	return &ReceiptHub{
		maxHistory: 50, // keep last 50 receipts
	}
}

// HandleWS upgrades an HTTP connection to WebSocket and keeps it alive
func (h *ReceiptHub) HandleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		OriginPatterns: []string{"*"},
	})
	if err != nil {
		log.Printf("[WS] Accept error: %v", err)
		return
	}

	h.clients.Store(conn, struct{}{})
	log.Printf("[WS] Client connected (%d total)", h.clientCount())

	// Send receipt history to new client
	history := h.GetHistory()
	if len(history) > 0 {
		historyMsg := map[string]interface{}{
			"type":     "history",
			"receipts": history,
		}
		if data, err := json.Marshal(historyMsg); err == nil {
			conn.Write(context.Background(), websocket.MessageText, data)
		}
	}

	// Send connection status
	statusMsg := map[string]interface{}{
		"type":   "status",
		"status": "connected",
	}
	if data, err := json.Marshal(statusMsg); err == nil {
		conn.Write(context.Background(), websocket.MessageText, data)
	}

	// Block until client disconnects
	for {
		_, _, err := conn.Read(r.Context())
		if err != nil {
			break
		}
	}

	h.clients.Delete(conn)
	conn.Close(websocket.StatusNormalClosure, "")
	log.Printf("[WS] Client disconnected (%d total)", h.clientCount())
}

// BroadcastReceipt sends a parsed receipt to all connected WebSocket clients
func (h *ReceiptHub) BroadcastReceipt(receipt escpos.Receipt) {
	// Add to history
	h.addReceipt(receipt)

	// Broadcast to clients
	msg := map[string]interface{}{
		"type":    "receipt",
		"receipt": receipt,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("[WS] Marshal error: %v", err)
		return
	}

	h.clients.Range(func(key, _ any) bool {
		conn := key.(*websocket.Conn)
		if err := conn.Write(context.Background(), websocket.MessageText, data); err != nil {
			log.Printf("[WS] Write error: %v", err)
			h.clients.Delete(conn)
			conn.Close(websocket.StatusNormalClosure, "")
		}
		return true
	})

	log.Printf("[WS] Broadcast receipt to %d clients", h.clientCount())
}

// GetHistory returns all stored receipts
func (h *ReceiptHub) GetHistory() []escpos.Receipt {
	h.mu.Lock()
	defer h.mu.Unlock()
	result := make([]escpos.Receipt, len(h.receipts))
	copy(result, h.receipts)
	return result
}

// ClearHistory clears the receipt history
func (h *ReceiptHub) ClearHistory() {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.receipts = nil
	log.Printf("[WS] Receipt history cleared")
}

// GetStatus returns the current status
func (h *ReceiptHub) GetStatus() map[string]interface{} {
	return map[string]interface{}{
		"type":      "status",
		"status":    "connected",
		"clients":   h.clientCount(),
		"receipts":  h.getReceiptCount(),
	}
}

func (h *ReceiptHub) addReceipt(receipt escpos.Receipt) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.receipts = append(h.receipts, receipt)
	// Trim history if too long
	if len(h.receipts) > h.maxHistory {
		h.receipts = h.receipts[len(h.receipts)-h.maxHistory:]
	}
}

func (h *ReceiptHub) getReceiptCount() int {
	h.mu.Lock()
	defer h.mu.Unlock()
	return len(h.receipts)
}

func (h *ReceiptHub) clientCount() int {
	count := 0
	h.clients.Range(func(_, _ any) bool {
		count++
		return true
	})
	return count
}
