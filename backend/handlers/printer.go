package handlers

import (
	"fmt"
	"log"
	"net"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"one_man_shop/backend/models"
)

// VirtualPrinterName is the name shown in the printer dropdown for the emulator
const VirtualPrinterName = "Virtual Printer (localhost:9100)"

// PrinterInfo represents a detected printer
type PrinterInfo struct {
	Name      string `json:"name"`
	IsDefault bool   `json:"is_default"`
}

// GetAvailablePrinters detects printers connected to the system
func (h *AppHandler) GetAvailablePrinters() ([]PrinterInfo, error) {
	var printers []PrinterInfo

	// Auto-detect virtual printer emulator (only shows if running)
	if isVirtualPrinterAvailable() {
		printers = append(printers, PrinterInfo{Name: VirtualPrinterName, IsDefault: false})
	}

	var realPrinters []PrinterInfo
	var err error

	switch runtime.GOOS {
	case "darwin", "linux":
		realPrinters, err = getUnixPrinters()
	case "windows":
		realPrinters, err = getWindowsPrinters()
	default:
		return printers, nil
	}

	if err != nil {
		log.Printf("[Printer] Error detecting printers: %v", err)
		return printers, nil
	}

	printers = append(printers, realPrinters...)
	return printers, nil
}

// isVirtualPrinterAvailable checks if the emulator is running on localhost:9100
func isVirtualPrinterAvailable() bool {
	conn, err := net.DialTimeout("tcp", "127.0.0.1:9100", 500*time.Millisecond)
	if err != nil {
		return false
	}
	conn.Close()
	return true
}

// getUnixPrinters lists printers on macOS/Linux using lpstat
func getUnixPrinters() ([]PrinterInfo, error) {
	// Get printer list
	out, err := exec.Command("lpstat", "-p").Output()
	if err != nil {
		// lpstat returns non-zero when no printers are configured
		log.Printf("[Printer] lpstat -p returned error (possibly no printers): %v", err)
		return []PrinterInfo{}, nil
	}

	// Get default printer
	defaultOut, _ := exec.Command("lpstat", "-d").Output()
	defaultPrinter := strings.TrimSpace(strings.TrimPrefix(string(defaultOut), "system default destination:"))

	var printers []PrinterInfo
	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	for _, line := range lines {
		// Format: "printer PrinterName is idle." or "printer PrinterName disabled since ..."
		if strings.HasPrefix(line, "printer ") {
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				name := parts[1]
				printers = append(printers, PrinterInfo{
					Name:      name,
					IsDefault: name == defaultPrinter,
				})
			}
		}
	}

	return printers, nil
}

// getWindowsPrinters lists printers on Windows using PowerShell Get-Printer
func getWindowsPrinters() ([]PrinterInfo, error) {
	// Try PowerShell Get-Printer first (Windows 10 1803+)
	out, err := exec.Command("powershell", "-NoProfile", "-Command",
		`Get-Printer | Where-Object {$_.Type -ne 'Virtual' -and $_.PortName -ne 'nul'} | Select-Object Name,Default | ConvertTo-Json`).Output()
	if err == nil && len(strings.TrimSpace(string(out))) > 0 {
		return parsePowerShellPrinters(string(out))
	}

	// Fallback: try wmic (deprecated but works on older Windows)
	log.Printf("[Printer] PowerShell Get-Printer failed, trying wmic fallback")
	return getWindowsPrintersWmic()
}

// parsePowerShellPrinters parses JSON output from Get-Printer
func parsePowerShellPrinters(jsonOut string) ([]PrinterInfo, error) {
	var printers []PrinterInfo

	// PowerShell returns a single object (not array) when only one printer
	jsonOut = strings.TrimSpace(jsonOut)

	// Handle empty result
	if jsonOut == "" || jsonOut == "null" {
		return printers, nil
	}

	// Check if it's an array or single object
	if strings.HasPrefix(jsonOut, "[") {
		// Array of objects - parse manually for simplicity
		objects := strings.Split(jsonOut[1:strings.LastIndex(jsonOut, "]")], "},{")
		for _, obj := range objects {
			obj = strings.Trim(obj, "{}")
			name := extractJsonString(obj, "Name")
			isDefault := strings.Contains(obj, `"Default":true`)
			if name != "" {
				printers = append(printers, PrinterInfo{Name: name, IsDefault: isDefault})
			}
		}
	} else {
		// Single object
		name := extractJsonString(jsonOut, "Name")
		isDefault := strings.Contains(jsonOut, `"Default":true`)
		if name != "" {
			printers = append(printers, PrinterInfo{Name: name, IsDefault: isDefault})
		}
	}

	return printers, nil
}

// extractJsonString extracts a string value from simple JSON
func extractJsonString(json, key string) string {
	search := `"` + key + `":`
	idx := strings.Index(json, search)
	if idx == -1 {
		return ""
	}
	rest := json[idx+len(search):]
	// Skip whitespace
	rest = strings.TrimLeft(rest, " \t\n\r")
	if !strings.HasPrefix(rest, `"`) {
		return ""
	}
	rest = rest[1:]
	endIdx := strings.Index(rest, `"`)
	if endIdx == -1 {
		return ""
	}
	return rest[:endIdx]
}

// getWindowsPrintersWmic lists printers using deprecated wmic (fallback for older Windows)
func getWindowsPrintersWmic() ([]PrinterInfo, error) {
	out, err := exec.Command("wmic", "printer", "list", "brief").Output()
	if err != nil {
		log.Printf("[Printer] wmic printer list brief failed: %v", err)
		return []PrinterInfo{}, nil
	}

	// Get default printer from registry
	defaultOut, _ := exec.Command("reg", "query",
		`HKCU\Software\Microsoft\Windows NT\CurrentVersion\Windows`,
		"/v", "Device").Output()
	defaultPrinter := ""
	defaultStr := string(defaultOut)
	if idx := strings.Index(defaultStr, "REG_SZ"); idx != -1 {
		rest := strings.TrimSpace(defaultStr[idx+7:])
		if endIdx := strings.IndexAny(rest, "\r\n"); endIdx != -1 {
			defaultPrinter = strings.TrimSpace(rest[:endIdx])
		}
	}

	var printers []PrinterInfo
	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	if len(lines) < 2 {
		return printers, nil
	}

	// First line is header, parse column positions
	header := lines[0]
	nameCol := strings.Index(header, "Name")
	statusCol := strings.Index(header, "Status")

	for _, line := range lines[1:] {
		if len(line) > nameCol && nameCol >= 0 {
			end := statusCol
			if end < 0 || end > len(line) {
				end = len(line)
			}
			name := strings.TrimSpace(line[nameCol:end])
			if name != "" {
				printers = append(printers, PrinterInfo{
					Name:      name,
					IsDefault: name == defaultPrinter,
				})
			}
		}
	}

	return printers, nil
}

// PrintReceipt prints a receipt for the given transaction
func (h *AppHandler) PrintReceipt(t models.Transaction, settings models.Settings) error {
	if settings.PrinterName == "" {
		log.Println("[Printer] No printer configured, skipping print")
		return nil
	}

	// Virtual printer: send ESC/POS bytes to TCP emulator
	if settings.PrinterName == VirtualPrinterName {
		return printToVirtualPrinter(t, settings)
	}

	// Real printer: build plain text and send via OS print command
	receipt := buildReceiptText(t, settings)

	switch runtime.GOOS {
	case "darwin", "linux":
		return printUnix(receipt, settings.PrinterName)
	case "windows":
		return printWindows(receipt, settings.PrinterName)
	default:
		return fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}
}

// printToVirtualPrinter sends ESC/POS bytes to the emulator TCP server
func printToVirtualPrinter(t models.Transaction, s models.Settings) error {
	// Build ESC/POS bytes
	escposData := buildEscposBytes(t, s)

	// Connect to TCP server
	conn, err := net.DialTimeout("tcp", "127.0.0.1:9100", 3*time.Second)
	if err != nil {
		return fmt.Errorf("failed to connect to virtual printer (is the emulator running?): %w", err)
	}
	defer conn.Close()

	// Send ESC/POS bytes
	_, err = conn.Write(escposData)
	if err != nil {
		return fmt.Errorf("failed to send to virtual printer: %w", err)
	}

	log.Printf("[Printer] Receipt sent to virtual printer (%d bytes)", len(escposData))
	return nil
}

// buildReceiptText creates the plain-text receipt formatted for thermal printer
func buildReceiptText(t models.Transaction, s models.Settings) string {
	var b strings.Builder

	// Paper width: 58mm ≈ 32 chars, 80mm ≈ 48 chars
	width := 48
	if s.PaperWidth == 58 {
		width = 32
	}

	line := strings.Repeat("-", width)
	dline := strings.Repeat("=", width)

	// Shop name (centered, large)
	b.WriteString(centerText(s.ShopName, width))
	b.WriteString("\n")

	// Merchant name (if set)
	if s.MerchantName != "" {
		b.WriteString(centerText(s.MerchantName, width))
		b.WriteString("\n")
	}

	b.WriteString(centerText(getCurrentDateTime(), width))
	b.WriteString("\n")
	b.WriteString(line)
	b.WriteString("\n")

	// Items header
	header := fmt.Sprintf("%-*s %5s %10s", width-18, "Item", "Qty", "Amount")
	b.WriteString(header)
	b.WriteString("\n")
	b.WriteString(line)
	b.WriteString("\n")

	// Items
	for _, item := range t.Items {
		name := item.Name
		if len(name) > width-18 {
			name = name[:width-18-3] + "..."
		}
		itemLine := fmt.Sprintf("%-*s %5d %10s",
			width-18, name,
			item.Qty,
			fmt.Sprintf("₹%.2f", item.Subtotal))
		b.WriteString(itemLine)
		b.WriteString("\n")
	}

	b.WriteString(line)
	b.WriteString("\n")

	// Subtotal
	subtotalStr := fmt.Sprintf("%-*s %15s", width-18, fmt.Sprintf("Subtotal (%d)", getItemCount(t.Items)), fmt.Sprintf("₹%.2f", t.Subtotal))
	b.WriteString(subtotalStr)
	b.WriteString("\n")

	// Tax (if > 0)
	if t.TaxTotal > 0 {
		taxStr := fmt.Sprintf("%-*s %15s", width-18, "Tax", fmt.Sprintf("₹%.2f", t.TaxTotal))
		b.WriteString(taxStr)
		b.WriteString("\n")
	}

	// Total (bold via ESC/POS handled separately, just mark with =)
	b.WriteString(dline)
	totalStr := fmt.Sprintf("%-*s %15s", width-18, "TOTAL", fmt.Sprintf("₹%.2f", t.Total))
	b.WriteString(totalStr)
	b.WriteString("\n")
	b.WriteString(dline)
	b.WriteString("\n")

	// Payment method
	method := "Cash"
	if t.PaymentMethod == "upi" {
		method = "UPI"
	}
	payStr := fmt.Sprintf("%-*s %15s", width-18, "Payment", method)
	b.WriteString(payStr)
	b.WriteString("\n")

	b.WriteString("\n")

	// Thank you
	b.WriteString(centerText("Thank you!", width))
	b.WriteString("\n")
	b.WriteString(centerText("Powered by One Man Shop POS", width))
	b.WriteString("\n")

	// Feed paper
	b.WriteString("\n\n\n")

	return b.String()
}

// centerText centers a string within the given width
func centerText(text string, width int) string {
	if len(text) >= width {
		return text[:width]
	}
	padding := (width - len(text)) / 2
	return strings.Repeat(" ", padding) + text
}

// getItemCount returns total item quantity
func getItemCount(items []models.CartItem) int {
	total := 0
	for _, item := range items {
		total += item.Qty
	}
	return total
}

// getCurrentDateTime returns formatted current date and time
func getCurrentDateTime() string {
	return time.Now().Format("02-Jan-2006 15:04")
}

// ========== ESC/POS Builder ==========

// buildEscposBytes creates ESC/POS byte sequences for a receipt
func buildEscposBytes(t models.Transaction, s models.Settings) []byte {
	var buf []byte

	// Paper width: 58mm ≈ 32 chars, 80mm ≈ 48 chars
	width := 48
	if s.PaperWidth == 58 {
		width = 32
	}

	line := strings.Repeat("-", width)
	dline := strings.Repeat("=", width)

	// Initialize printer
	buf = append(buf, 0x1B, 0x40) // ESC @

	// Shop name (centered, bold, double size)
	buf = append(buf, 0x1B, 0x61, 0x01) // ESC a 1 (center)
	buf = append(buf, 0x1B, 0x45, 0x01) // ESC E 1 (bold on)
	buf = append(buf, 0x1D, 0x21, 0x11) // GS ! 17 (double size)
	buf = append(buf, []byte(centerText(s.ShopName, width/2))...) // double width = half chars
	buf = append(buf, 0x0A) // LF
	buf = append(buf, 0x1D, 0x21, 0x00) // GS ! 0 (normal size)
	buf = append(buf, 0x1B, 0x45, 0x00) // ESC E 0 (bold off)

	// Merchant name
	if s.MerchantName != "" {
		buf = append(buf, []byte(centerText(s.MerchantName, width))...)
		buf = append(buf, 0x0A)
	}

	// Date/time (centered)
	buf = append(buf, []byte(centerText(getCurrentDateTime(), width))...)
	buf = append(buf, 0x0A)

	// Separator
	buf = append(buf, []byte(line)...)
	buf = append(buf, 0x0A)

	// Items header
	header := fmt.Sprintf("%-*s %5s %10s", width-18, "Item", "Qty", "Amount")
	buf = append(buf, []byte(header)...)
	buf = append(buf, 0x0A)
	buf = append(buf, []byte(line)...)
	buf = append(buf, 0x0A)

	// Items
	for _, item := range t.Items {
		name := item.Name
		if len(name) > width-18 {
			name = name[:width-18-3] + "..."
		}
		itemLine := fmt.Sprintf("%-*s %5d %10s",
			width-18, name,
			item.Qty,
			fmt.Sprintf("₹%.2f", item.Subtotal))
		buf = append(buf, []byte(itemLine)...)
		buf = append(buf, 0x0A)
	}

	buf = append(buf, []byte(line)...)
	buf = append(buf, 0x0A)

	// Subtotal
	subtotalStr := fmt.Sprintf("%-*s %15s", width-18,
		fmt.Sprintf("Subtotal (%d)", getItemCount(t.Items)),
		fmt.Sprintf("₹%.2f", t.Subtotal))
	buf = append(buf, []byte(subtotalStr)...)
	buf = append(buf, 0x0A)

	// Tax (if > 0)
	if t.TaxTotal > 0 {
		taxStr := fmt.Sprintf("%-*s %15s", width-18, "Tax", fmt.Sprintf("₹%.2f", t.TaxTotal))
		buf = append(buf, []byte(taxStr)...)
		buf = append(buf, 0x0A)
	}

	// Total (bold, double underline style with ==)
	buf = append(buf, []byte(dline)...)
	buf = append(buf, 0x0A)
	buf = append(buf, 0x1B, 0x45, 0x01) // Bold on
	totalStr := fmt.Sprintf("%-*s %15s", width-18, "TOTAL", fmt.Sprintf("₹%.2f", t.Total))
	buf = append(buf, []byte(totalStr)...)
	buf = append(buf, 0x0A)
	buf = append(buf, 0x1B, 0x45, 0x00) // Bold off
	buf = append(buf, []byte(dline)...)
	buf = append(buf, 0x0A)

	// Payment method
	method := "Cash"
	if t.PaymentMethod == "upi" {
		method = "UPI"
	}
	payStr := fmt.Sprintf("%-*s %15s", width-18, "Payment", method)
	buf = append(buf, []byte(payStr)...)
	buf = append(buf, 0x0A)
	buf = append(buf, 0x0A)

	// Thank you (centered)
	buf = append(buf, 0x1B, 0x61, 0x01) // Center
	buf = append(buf, []byte("Thank you!")...)
	buf = append(buf, 0x0A)
	buf = append(buf, []byte("Powered by One Man Shop POS")...)
	buf = append(buf, 0x0A)
	buf = append(buf, 0x1B, 0x61, 0x00) // Left

	// Feed and partial cut
	buf = append(buf, 0x0A, 0x0A, 0x0A)
	buf = append(buf, 0x1D, 0x56, 0x01) // GS V 1 (partial cut)

	return buf
}

// printUnix sends the receipt to a printer on macOS/Linux using lpr
func printUnix(receipt string, printerName string) error {
	// Use lpr with -o raw to send text directly
	cmd := exec.Command("lpr", "-P", printerName, "-o", "raw")
	cmd.Stdin = strings.NewReader(receipt)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("lpr failed: %v (output: %s)", err, string(output))
	}
	log.Printf("[Printer] Receipt sent to %s", printerName)
	return nil
}

// printWindows sends the receipt to a printer on Windows
func printWindows(receipt string, printerName string) error {
	// Write receipt to temp file
	tmpFile := fmt.Sprintf("%s\\receipt_%d.txt", os.TempDir(), time.Now().UnixNano())
	if err := os.WriteFile(tmpFile, []byte(receipt), 0644); err != nil {
		return fmt.Errorf("failed to write temp receipt file: %v", err)
	}
	defer os.Remove(tmpFile)

	// Method 1: Use SumatraPDF / SumatraPDF-like print command (most reliable)
	// Use PowerShell to print raw text file to specific printer
	psCmd := fmt.Sprintf(`Start-Process -FilePath '%s' -Verb PrintTo -ArgumentList '%s' -Wait -WindowStyle Hidden`, tmpFile, printerName)
	cmd := exec.Command("powershell", "-NoProfile", "-Command", psCmd)
	output, err := cmd.CombinedOutput()
	if err == nil {
		log.Printf("[Printer] Receipt sent to %s via PrintTo", printerName)
		return nil
	}

	// Method 2: Use Get-Content piped to Out-Printer (PowerShell 5.1+)
	log.Printf("[Printer] PrintTo failed, trying Out-Printer: %s", string(output))
	psCmd2 := fmt.Sprintf(`Get-Content -Path '%s' -Raw | Out-Printer -PrinterName '%s'`, tmpFile, printerName)
	cmd = exec.Command("powershell", "-NoProfile", "-Command", psCmd2)
	output, err = cmd.CombinedOutput()
	if err == nil {
		log.Printf("[Printer] Receipt sent to %s via Out-Printer", printerName)
		return nil
	}

	// Method 3: Use Notepad's print (works on all Windows versions)
	log.Printf("[Printer] Out-Printer failed, trying Notepad: %s", string(output))
	cmd = exec.Command("notepad", "/p", tmpFile)
	output, err = cmd.CombinedOutput()

	if err != nil {
		return fmt.Errorf("all print methods failed for %s: %v (last output: %s)", printerName, err, string(output))
	}

	log.Printf("[Printer] Receipt sent to %s via Notepad", printerName)
	return nil
}
