package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"

	"one_man_shop/backend/db"
	"one_man_shop/backend/display"
	"one_man_shop/backend/handlers"
	"one_man_shop/backend/models"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// wsPort is the WebSocket port for the customer display.
// MUST match WS_PORT in frontend/src/stores/displayStore.ts
const wsPort = 9246

type App struct {
	ctx            context.Context
	app            *application.App
	handlers       *handlers.AppHandler
	customerWindow *application.WebviewWindow
	displayState   *display.Manager
}

func NewApp() *App {
	dataDir := getAppDataDir()
	log.Printf("Using data directory: %s", dataDir)
	db.Init(dataDir)
	h := handlers.NewAppHandler()
	h.StartBackupScheduler()

	dm := display.NewManager()

	// Start WebSocket server for customer display
	go func() {
		mux := http.NewServeMux()
		mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
			dm.WSHub().HandleWS(w, r, dm.GetState)
		})
		addr := fmt.Sprintf("127.0.0.1:%d", wsPort)
		log.Printf("[WS] Starting display WebSocket server on %s", addr)
		if err := http.ListenAndServe(addr, mux); err != nil {
			log.Printf("[WS] Server error: %v", err)
		}
	}()

	return &App{handlers: h, displayState: dm}
}

func (a *App) SetApp(app *application.App) {
	a.app = app
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	log.Println("App started successfully")
}

func (a *App) Shutdown(ctx context.Context) {
	if a.customerWindow != nil {
		a.customerWindow.Close()
		a.customerWindow = nil
	}
	log.Println("App shutting down")
}

// ========== Customer Display Window ==========

func (a *App) OpenCustomerDisplay(screenIndex int) error {
	// Close existing window if open, then open on the target screen
	if a.customerWindow != nil {
		a.customerWindow.Close()
		a.customerWindow = nil
	}

	screens := a.app.Screen.GetAll()
	targetScreen := a.app.Screen.GetPrimary()
	if screenIndex >= 0 && screenIndex < len(screens) {
		targetScreen = screens[screenIndex]
	}
	log.Printf("[Display] Opening on: %s (%dx%d)", targetScreen.Name, targetScreen.Size.Width, targetScreen.Size.Height)

	window := a.app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "Customer Display",
		Width:            targetScreen.Size.Width,
		Height:           targetScreen.Size.Height,
		BackgroundColour: application.NewRGB(15, 23, 42),
		URL:              "/#/customer-display",
	})

	a.customerWindow = window
	window.SetScreen(targetScreen)
	window.Fullscreen()

	return nil
}

func (a *App) CloseCustomerDisplay() {
	if a.customerWindow != nil {
		a.customerWindow.Close()
		a.customerWindow = nil
	}
}

// ========== Display State Updates ==========
// Each method updates state → Manager.notify() broadcasts via WebSocket automatically.

func (a *App) SendProductsToDisplay() {
	products, err := a.handlers.GetProducts()
	if err != nil {
		return
	}
	theme := "light"
	if s, err := a.handlers.GetSettings(); err == nil && s.Theme != "" {
		theme = s.Theme
	}

	dispProducts := make([]display.Product, len(products))
	for i, p := range products {
		dispProducts[i] = display.Product{ID: p.ID, Name: p.Name, Price: p.Price}
	}

	a.displayState.SetMenu(a.getShopName(), dispProducts, theme)
}

func (a *App) UpdateCustomerDisplay(cartItems []models.CartItem, total float64, taxTotal float64) {
	theme := "light"
	if s, err := a.handlers.GetSettings(); err == nil && s.Theme != "" {
		theme = s.Theme
	}

	items := make([]display.CartItem, len(cartItems))
	for i, ci := range cartItems {
		items[i] = display.CartItem{
			ProductID: ci.ProductID, Name: ci.Name, Qty: ci.Qty,
			Price: ci.Price, Subtotal: ci.Subtotal,
		}
	}

	a.displayState.SetBill(items, total, taxTotal, a.getShopName(), theme)
}

func (a *App) SendPaymentMethodToDisplay(method string) {
	a.displayState.SetPaymentMethod(method)
}

func (a *App) ShowQROnDisplay(upiString string, amount float64, vpa string) {
	a.displayState.SetUPIData(upiString)
}

func (a *App) ConfirmPayment() {
	a.displayState.SetThankYou()
}

func (a *App) ClearCustomerDisplay() {
	a.displayState.Clear()
}

// ========== Settings ==========

func (a *App) GetSettings() (models.Settings, error) {
	return a.handlers.GetSettings()
}

func (a *App) SaveSettings(s models.Settings) error {
	return a.handlers.SaveSettings(s)
}

func (a *App) IsSetupComplete() bool {
	return a.handlers.IsSetupComplete()
}

// ========== Products ==========

func (a *App) GetProducts() ([]models.Product, error) {
	return a.handlers.GetProducts()
}

func (a *App) CreateProduct(p models.Product) (models.Product, error) {
	return a.handlers.CreateProduct(p)
}

func (a *App) UpdateProduct(p models.Product) error {
	return a.handlers.UpdateProduct(p)
}

func (a *App) DeleteProduct(id string) error {
	return a.handlers.DeleteProduct(id)
}

// ========== Payment ==========

func (a *App) GetUPIString(amount float64) (string, error) {
	return a.handlers.GetUPIString(amount)
}

// ========== Transactions ==========

func (a *App) CreateTransaction(t models.Transaction) (models.Transaction, error) {
	return a.handlers.CreateTransaction(t)
}

func (a *App) GetTransactions(limit int, offset int) ([]models.Transaction, error) {
	return a.handlers.GetTransactions(limit, offset)
}

// ========== Reports ==========

func (a *App) GetDailyReport(date string) (models.ReportSummary, error) {
	return a.handlers.GetDailyReport(date)
}

func (a *App) GetWeeklyReport(startDate string) ([]models.ReportSummary, error) {
	return a.handlers.GetWeeklyReport(startDate)
}

func (a *App) ExportTransactionsCSV(startDate, endDate string) (string, error) {
	return a.handlers.ExportTransactionsCSV(startDate, endDate)
}

func (a *App) ExportTransactionsCSVToDir(startDate, endDate, dir string) (string, error) {
	return a.handlers.ExportTransactionsCSVToDir(startDate, endDate, dir)
}

func (a *App) SelectFolder(title string) (string, error) {
	if a.app == nil {
		return "", fmt.Errorf("app not initialized")
	}
	result, err := a.app.Dialog.OpenFile().
		SetTitle(title).
		CanChooseFiles(false).
		CanChooseDirectories(true).
		PromptForSingleSelection()
	if err != nil {
		return "", err
	}
	return result, nil
}

func (a *App) SelectSaveFile(title, defaultName string) (string, error) {
	if a.app == nil {
		return "", fmt.Errorf("app not initialized")
	}
	result, err := a.app.Dialog.SaveFile().
		SetFilename(defaultName).
		PromptForSingleSelection()
	if err != nil {
		return "", err
	}
	return result, nil
}

// SaveFile opens a save dialog and writes base64-encoded content to the chosen path
func (a *App) SaveFile(title, defaultName string, contentBase64 string) (string, error) {
	if a.app == nil {
		return "", fmt.Errorf("app not initialized")
	}

	path, err := a.app.Dialog.SaveFile().
		SetFilename(defaultName).
		PromptForSingleSelection()
	if err != nil {
		return "", err
	}

	data, err := base64.StdEncoding.DecodeString(contentBase64)
	if err != nil {
		return "", fmt.Errorf("failed to decode content: %w", err)
	}

	if err := os.WriteFile(path, data, 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	return path, nil
}

func (a *App) GetAvailableScreens() ([]map[string]interface{}, error) {
	if a.app == nil {
		return nil, fmt.Errorf("app not initialized")
	}
	screens := a.app.Screen.GetAll()
	result := make([]map[string]interface{}, 0, len(screens))
	for i, s := range screens {
		result = append(result, map[string]interface{}{
			"index": i, "name": s.Name, "width": s.Size.Width, "height": s.Size.Height,
		})
	}
	return result, nil
}

// ========== Printer ==========

func (a *App) GetAvailablePrinters() ([]map[string]interface{}, error) {
	printers, err := a.handlers.GetAvailablePrinters()
	if err != nil {
		return nil, err
	}
	result := make([]map[string]interface{}, 0, len(printers))
	for _, p := range printers {
		result = append(result, map[string]interface{}{
			"name":       p.Name,
			"is_default": p.IsDefault,
		})
	}
	return result, nil
}

func (a *App) PrintReceipt(t models.Transaction) error {
	s, err := a.handlers.GetSettings()
	if err != nil {
		return fmt.Errorf("failed to get settings: %w", err)
	}
	return a.handlers.PrintReceipt(t, s)
}

// ========== Backup ==========

func (a *App) TriggerBackup() error {
	return a.handlers.TriggerBackup()
}

func (a *App) SetBackupSchedule(enabled bool) error {
	return a.handlers.SetBackupSchedule(enabled)
}

// ========== Mobile/Data Directory Methods ==========

// IsMobile returns true if running on Android or iOS
func (a *App) IsMobile() bool {
	return runtime.GOOS == "android" || runtime.GOOS == "ios"
}

// GetDataDir returns the current data directory path
func (a *App) GetDataDir() string {
	return getDataDirForDisplay()
}

// SelectDataDir opens a folder picker and returns the selected path
func (a *App) SelectDataDir() (string, error) {
	if a.app == nil {
		return "", fmt.Errorf("app not initialized")
	}
	result, err := a.app.Dialog.OpenFile().
		SetTitle("Select Data Directory").
		CanChooseFiles(false).
		CanChooseDirectories(true).
		PromptForSingleSelection()
	if err != nil {
		return "", err
	}
	return result, nil
}

// SaveDataDir saves the selected data directory to config after validating it's writable
func (a *App) SaveDataDir(path string) error {
	if path == "" {
		return fmt.Errorf("data directory path cannot be empty")
	}

	// Normalize the path
	normalized := path
	if runtime.GOOS != "windows" {
		normalized = filepath.Clean(path)
	}

	log.Printf("[DataDir] Validating data directory: %s", normalized)

	// Create the directory if it doesn't exist
	if err := os.MkdirAll(normalized, 0755); err != nil {
		return fmt.Errorf("cannot create directory %q: %w", normalized, err)
	}

	// Test write access by creating a temp file
	testFile := filepath.Join(normalized, ".write_test")
	f, err := os.Create(testFile)
	if err != nil {
		return fmt.Errorf("directory %q is not writable: %w", normalized, err)
	}
	f.Close()
	os.Remove(testFile)

	log.Printf("[DataDir] Directory validated, saving preference: %s", normalized)

	// Save to config
	if err := saveDataDir(normalized); err != nil {
		return fmt.Errorf("failed to save data directory preference: %w", err)
	}

	log.Printf("[DataDir] Data directory preference saved. Restart app to use new location.")
	return nil
}

// ========== Helpers ==========

func (a *App) getShopName() string {
	s, err := a.handlers.GetSettings()
	if err != nil {
		return "Shop"
	}
	return s.ShopName
}

// getAppDataDir is defined in platform-specific files:
// - app_desktop.go (//go:build !android)
// - app_android.go (//go:build android)
