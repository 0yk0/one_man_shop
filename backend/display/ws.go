package display

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/coder/websocket"
)

// WSHub manages WebSocket connections and broadcasts state to all clients.
type WSHub struct {
	clients sync.Map // map[*websocket.Conn]struct{}
	mu      sync.Mutex
}

// NewWSHub creates a new WebSocket hub.
func NewWSHub() *WSHub {
	return &WSHub{}
}

// HandleWS upgrades an HTTP connection to WebSocket, sends current state, then keeps it alive.
func (h *WSHub) HandleWS(w http.ResponseWriter, r *http.Request, getState func() State) {
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		OriginPatterns: []string{"*"},
	})
	if err != nil {
		log.Printf("[WS] Accept error: %v", err)
		return
	}

	h.clients.Store(conn, struct{}{})
	log.Printf("[WS] Client connected (%d total)", h.clientCount())

	// Send current state immediately so the client isn't blank on load
	state := getState()
	if data, err := json.Marshal(state); err == nil {
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

// Broadcast sends the given state as JSON to all connected clients.
func (h *WSHub) Broadcast(state State) {
	data, err := json.Marshal(state)
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
}

func (h *WSHub) clientCount() int {
	count := 0
	h.clients.Range(func(_, _ any) bool {
		count++
		return true
	})
	return count
}
