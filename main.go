package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	appHandler := NewApp()

	app := application.New(application.Options{
		Name:        "One Man Shop",
		Description: "Offline POS System for Small Shops",
		Services: []application.Service{
			application.NewService(appHandler),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	appHandler.SetApp(app)

	// Create main POS window
	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "One Man Shop - POS",
		Width:            1280,
		Height:           800,
		MinWidth:         1024,
		MinHeight:        700,
		BackgroundColour: application.NewRGB(255, 255, 255),
		URL:              "/",
	})

	err := app.Run()
	if err != nil {
		log.Fatal(err)
	}
}
