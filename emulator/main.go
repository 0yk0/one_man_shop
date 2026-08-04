package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"

	"thermal-printer-emulator/server"
)

func main() {
	tcpPort := flag.Int("tcp", 9100, "TCP port for ESC/POS data")
	webPort := flag.Int("web", 8080, "Web UI port")
	flag.Parse()

	// Create receipt hub (shared between TCP and WebSocket)
	hub := server.NewReceiptHub()

	// Start TCP server
	tcpAddr := fmt.Sprintf("127.0.0.1:%d", *tcpPort)
	tcpServer := server.NewTCPServer(tcpAddr, hub)
	if err := tcpServer.Start(); err != nil {
		log.Fatalf("Failed to start TCP server: %v", err)
	}
	defer tcpServer.Stop()

	// Setup HTTP server for Web UI + WebSocket
	mux := http.NewServeMux()

	// Serve static files (web UI)
	mux.Handle("/", http.FileServer(http.Dir("web")))

	// WebSocket endpoint for browser
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		hub.HandleWS(w, r)
	})

	// API: get status
	mux.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"tcp_port":%d,"web_port":%d,"status":"running"}`, *tcpPort, *webPort)
	})

	// API: clear history
	mux.HandleFunc("/api/clear", func(w http.ResponseWriter, r *http.Request) {
		hub.ClearHistory()
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"cleared"}`)
	})

	webAddr := fmt.Sprintf("127.0.0.1:%d", *webPort)
	log.Printf("========================================")
	log.Printf("  Thermal Printer Emulator")
	log.Printf("========================================")
	log.Printf("  TCP (ESC/POS):  %s", tcpAddr)
	log.Printf("  Web UI:         http://%s", webAddr)
	log.Printf("========================================")
	log.Printf("  Open the Web UI in your browser to")
	log.Printf("  see receipts as they arrive.")
	log.Printf("========================================")

	if err := http.ListenAndServe(webAddr, mux); err != nil {
		log.Fatalf("Web server failed: %v", err)
	}
}
