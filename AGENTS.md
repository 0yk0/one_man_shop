# AGENTS.md

## What This Is

Wails v3 (alpha) desktop POS app: Go backend + React/TypeScript frontend, bundled into a native desktop app. PocketBase is embedded as the database (no external DB server). Target: small single-operator shops, offline-first.

## Project Layout

```
main.go          — entrypoint, Wails app bootstrap, window config
app.go           — App struct: routes Go methods to handlers, manages customer display window
backend/
  db/            — PocketBase init, collection schema (products, transactions, settings)
  handlers/      — business logic (CRUD, reports, backups, settings)
  models/        — shared Go types (Product, Cart, Transaction, Settings, ReportSummary)
  display/       — customer display state manager
frontend/
  src/
    bindings.ts  — AUTO-GENERATED TypeScript wrappers for Go methods (wails3 generate bindings)
    App.tsx      — routes, setup wizard, theme init
    pages/       — POSScreen, ProductsPage, ReportsPage, SettingsPage
    components/  — Layout, CustomerDisplay, Products, Reports, SetupWizard
    stores/      — Zustand store for customer display state
    hooks/       — useSettings hook
  dist/          — built frontend (embedded into Go binary via //go:embed)
build/           — Taskfile includes, platform-specific build tasks, Docker config
data/            — PocketBase data at runtime (pb_data/)
```

## Commands

```bash
# Development (full app with hot-reload)
wails3 dev

# Build for production
wails3 build

# Task runner (alternative to wails3 CLI)
task dev                    # same as wails3 dev
task build                  # platform-aware build
task run                    # run built binary

# Frontend only (cd frontend first)
npm run dev                 # Vite dev server on port 9245
npm run build               # tsc + vite build (production)
npm run build:dev           # tsc + vite build (dev mode, no minify)

# Regenerate frontend bindings after changing Go methods
wails3 generate bindings -clean=true -ts -i
```

## Key Conventions

- **Frontend router**: HashRouter (`/#/customer-display`). Do NOT switch to BrowserRouter.
- **Frontend bindings** (`frontend/bindings.ts`): auto-generated. Never edit manually. Regenerate with `wails3 generate bindings`.
- **Wails API methods** are defined on the `App` struct in `app.go`. Each exported method becomes a callable function in `frontend/bindings.ts`.
- **Customer display** opens in a separate native window (`/#/customer-display`), synced to Go state via Wails events (`display-update`). The Go `App` struct owns the `customerWindow` handle.
- **Theme**: DaisyUI theme set via `document.documentElement.setAttribute('data-theme', ...)`. Theme is stored in PocketBase settings.
- **CSS**: Tailwind v4 + DaisyUI v5. Style is just `@import "tailwindcss"; @plugin "daisyui" { themes: all; };` — no config file.
- **State**: Zustand for customer display state. React state + `useSettings` hook for settings.
- **Data dir**: hardcoded as `data/` in `app.go:getAppDataDir()`. PocketBase data lives at `data/pb_data/`.
- **Package manager**: npm by default (controlled by `PACKAGE_MANAGER` env var in Taskfile).
- **`.npmrc`**: `minimum-release-age=10080` — packages must be 7+ days old before install.

## Gotchas

- Wails v3 is **alpha** (v3.0.0-alpha2.120). APIs may change. Check Wails v3 docs, not v2.
- `frontend/dist` is committed to `.gitignore` — it must be built before `go build` (embedded via `//go:embed`).
- Go module path is `one_man_shop`. Import backend packages as `one_man_shop/backend/...`.
- `tsconfig.json`: `noImplicitAny: false`, `noUnusedLocals: true` — unused variables error, but implicit any is allowed.
- No tests, linter, formatter, or CI configured in this repo.
- The `build/config.yml` contains dev_mode config and build asset metadata — update `build/config.yml` then run `wails3 update build-assets` if you change app info.
- Customer display state is pushed from Go via `app.Event.Emit("display-update", state)`. The frontend reads it from `window.__DISPLAY_STATE__` or the event payload.
- `getDataDir()` in `backup.go` returns `filepath.Dir(os.Executable())`, which differs from `getAppDataDir()` in `app.go` (returns `"data"`). This is a known inconsistency.

## Adding a New Go Method (Backend → Frontend)

1. Add the method on `*App` in `app.go` (or delegate to a handler).
2. Run `wails3 generate bindings` — this regenerates `frontend/bindings.ts`.
3. Import and call the new function from `frontend/src/bindings` in your React code.

## Frontend Stack

React 18, TypeScript 5, Vite 8, Tailwind CSS v4, DaisyUI v5, Zustand, React Router 7 (HashRouter), Recharts, lucide-react, notistack, qrcode.react.
