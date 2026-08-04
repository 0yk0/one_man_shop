package server

import (
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"sync"
	"time"

	"thermal-printer-emulator/escpos"
)

// TCPServer listens for ESC/POS bytes on a TCP port and broadcasts parsed receipts
type TCPServer struct {
	addr       string
	receiptHub *ReceiptHub
	listener   net.Listener
	stopped    bool
	mu         sync.Mutex
}

// NewTCPServer creates a new TCP server
func NewTCPServer(addr string, hub *ReceiptHub) *TCPServer {
	return &TCPServer{
		addr:       addr,
		receiptHub: hub,
	}
}

// Start starts the TCP server
func (s *TCPServer) Start() error {
	var err error
	s.listener, err = net.Listen("tcp", s.addr)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", s.addr, err)
	}

	log.Printf("[TCP] Listening on %s", s.addr)

	go s.acceptLoop()
	return nil
}

// Stop stops the TCP server
func (s *TCPServer) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.listener != nil && !s.stopped {
		s.stopped = true
		s.listener.Close()
		log.Printf("[TCP] Stopped")
	}
}

// acceptLoop accepts incoming TCP connections
func (s *TCPServer) acceptLoop() {
	for {
		conn, err := s.listener.Accept()
		if err != nil {
			s.mu.Lock()
			stopped := s.stopped
			s.mu.Unlock()
			if stopped || errors.Is(err, net.ErrClosed) {
				return
			}
			log.Printf("[TCP] Accept error: %v", err)
			continue
		}
		log.Printf("[TCP] Client connected: %s", conn.RemoteAddr())
		go s.handleConnection(conn)
	}
}

// handleConnection reads ESC/POS bytes from a TCP connection
func (s *TCPServer) handleConnection(conn net.Conn) {
	defer func() {
		conn.Close()
		log.Printf("[TCP] Client disconnected: %s", conn.RemoteAddr())
	}()

	parser := escpos.NewParser()
	buf := make([]byte, 4096)

	for {
		conn.SetReadDeadline(time.Now().Add(30 * time.Second))

		n, err := conn.Read(buf)
		if n > 0 {
			receipt := parser.Parse(buf[:n])

			if len(receipt.Commands) > 0 {
				s.receiptHub.BroadcastReceipt(receipt)
				log.Printf("[TCP] Received %d bytes → %d commands from %s",
					n, len(receipt.Commands), conn.RemoteAddr())
			}
		}

		if err != nil {
			if err != io.EOF {
				log.Printf("[TCP] Read error from %s: %v", conn.RemoteAddr(), err)
			}
			return
		}
	}
}
