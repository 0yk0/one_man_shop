# One Man Shop

Offline POS for small shops. Free and open source.

Built for a friend's small shop. Made open source for everyone.

![One Man Shop POS](website/public/screenshots/screenshot-06.png)

## Features

- **UPI QR Payments** — Generate a QR code in one tap. Customers pay with GPay, PhonePe, Paytm, or any UPI app.
- **Customer Display** — Show your menu, live bill, and payment QR on a second screen for customers to see.
- **Product Management** — Add up to 50 products with images, prices, and optional tax rates.
- **Sales Reports** — Daily and weekly reports with revenue charts and UPI vs cash breakdown. Export as CSV.
- **Auto Backups** — Nightly backups to OneDrive, Dropbox, or any folder you choose. Never lose data.
- **35 Themes** — Switch between 35 built-in themes instantly. Light, dark, and everything in between.

## Screenshots

| POS Screen | Customer Display | Reports |
|---|---|---|
| ![POS](website/public/screenshots/screenshot-06.png) | ![Display](website/public/screenshots/screenshot-08.png) | ![Reports](website/public/screenshots/screenshot-10.png) |

| Products | Settings | Setup Wizard |
|---|---|---|
| ![Products](website/public/screenshots/screenshot-03.png) | ![Settings](website/public/screenshots/screenshot-12.png) | ![Setup](website/public/screenshots/screenshot-01.png) |

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop framework | [Wails v3](https://wails.io/) (alpha) |
| Backend | Go |
| Frontend | React 18, TypeScript, Vite |
| Database | [PocketBase](https://pocketbase.io/) (embedded SQLite) |
| Styling | Tailwind CSS, DaisyUI |
| State | Zustand |
| Charts | Recharts |

## Installation

### Download

Download the latest release from [GitHub Releases](https://github.com/0yk0/one_man_shop/releases/latest).

- **macOS** — Unzip and drag to Applications. Works on Apple Silicon and Intel.
- **Windows** — Download the `.exe` and run it.

### First Launch

1. Enter your shop name
2. Set your UPI VPA (e.g. `yourname@upi`)
3. Enter your merchant name
4. Start adding products and selling

## Development

### Prerequisites

- [Go](https://go.dev/dl/) 1.25+
- [Node.js](https://nodejs.org/) 18+
- [Wails v3](https://wails.io/docs/guides/linux) (`go install github.com/wailsapp/wails/v3/cmd/wails@latest`)

### Run in Development

```bash
# Ensure wails3 is in PATH
export PATH="$HOME/go/bin:$PATH"

# Start dev server with hot-reload
wails3 dev
```

This starts both the Go backend and Vite frontend with hot-reload.

### Frontend Only

```bash
cd frontend
npm install
npm run dev    # Vite dev server on port 9245
```

## Building

```bash
# Build for your current platform
wails3 build

# The binary will be in the build/ directory
```

### Platform-Specific

```bash
# macOS (universal binary)
task build:darwin

# Windows
task build:windows
```

## Project Structure

```
one_man_shop/
├── main.go                 # Entry point, Wails bootstrap
├── app.go                  # App struct, routes Go methods to handlers
├── backend/
│   ├── db/                 # PocketBase init, collection schemas
│   ├── handlers/           # Business logic (CRUD, reports, backups)
│   ├── models/             # Shared Go types
│   └── display/            # Customer display state manager
├── frontend/
│   └── src/
│       ├── bindings.ts     # Auto-generated TypeScript wrappers
│       ├── pages/          # POS, Products, Reports, Settings
│       ├── components/     # UI components
│       └── stores/         # Zustand store
├── website/                # Landing page (Vite + framer-motion)
├── build/                  # Build configs, icons, platform tasks
└── screenshots/            # App screenshots
```

## FAQ

**Is it really free?**
Yes. No subscriptions, no hidden fees, no sign-up. Download and start selling.

**Does it work offline?**
Yes. All data stays on your computer. No internet required.

**What payment methods?**
UPI (via QR code) and Cash.

**Can I use a second monitor?**
Yes. Open the Customer Display on a separate screen.

**How many products?**
Up to 50 active products.

## Contributing

Contributions are welcome! Open an issue or submit a pull request.

## License

[MIT](LICENSE)
