# Contributing to One Man Shop

Thank you for your interest in contributing! Every contribution helps make this POS system better for small shop owners.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Your First Contribution](#your-first-contribution)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Testing](#testing)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior by opening an issue.

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check [existing issues](https://github.com/0yk0/one_man_shop/issues) to avoid duplicates.

When creating a bug report, include:

- **A clear and descriptive title**
- **Steps to reproduce** the problem
- **What you expected** to happen
- **What actually happened**
- **Your environment** (OS, app version, screen setup)

Use the [Bug Report template](https://github.com/0yk0/one_man_shop/issues/new?template=bug_report.md) when filing issues.

### Suggesting Features

Feature requests are welcome! Please use the [Feature Request template](https://github.com/0yk0/one_man_shop/issues/new?template=feature_request.md) and describe:

- **The problem** your feature would solve
- **Your proposed solution**
- **Alternatives** you considered
- **Additional context** (screenshots, mockups, etc.)

### Your First Contribution

Not sure where to start? Look for issues labeled:

- `good first issue` — Simple tasks perfect for newcomers
- `help wanted` — Issues where we need community help
- `documentation` — Docs improvements (great first contribution!)

## Development Setup

### Prerequisites

- [Go](https://go.dev/dl/) 1.25+
- [Node.js](https://nodejs.org/) 18+
- [Wails v3](https://wails.io/) (`go install github.com/wailsapp/wails/v3/cmd/wails@latest`)

### Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/one_man_shop.git
   cd one_man_shop
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/0yk0/one_man_shop.git
   ```
4. **Install dependencies**:
   ```bash
   cd frontend && npm install && cd ..
   ```
5. **Start development**:
   ```bash
   wails3 dev
   ```

## Making Changes

### Branch Naming

Create a descriptive branch from `main`:

```bash
git checkout -b feature/add-inventory-tracking
git checkout -b fix/customer-display-freeze
git checkout -b docs/update-installation-guide
```

### Commit Messages

Write clear, concise commit messages:

```
Add CSV export for daily reports

- Add export button to Reports page
- Generate CSV with date, items, and totals
- Include UPI vs cash breakdown

Closes #42
```

**Guidelines:**
- Use the imperative mood ("Add feature" not "Added feature")
- Keep the first line under 72 characters
- Reference issues and PRs when relevant

### Code Style

#### Go (Backend)

- Follow standard [Go conventions](https://go.dev/doc/effective_go)
- Run `gofmt` before committing
- Add comments for exported functions
- Handle errors explicitly

#### TypeScript/React (Frontend)

- Use TypeScript for all new code
- Follow existing component patterns
- Use functional components with hooks
- Keep components small and focused

## Pull Request Process

1. **Update your fork**:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create your feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and test thoroughly

4. **Run the test suite**:
   ```bash
   # Backend tests
   go test ./backend/... -v

   # Frontend tests
   cd frontend && npm test
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** against `main`

### PR Checklist

Before submitting, ensure:

- [ ] Code compiles without errors
- [ ] All existing tests pass
- [ ] New tests added (if applicable)
- [ ] Documentation updated (if needed)
- [ ] No console.log or debug code left
- [ ] Commit messages are clear

### What We Look For

- **Working code** — Does it solve the problem?
- **Tests** — Is the new code covered?
- **Documentation** — Are docs updated?
- **Clean code** — Is it readable and maintainable?

## Style Guidelines

### Go

- Use `gofmt` for formatting
- Follow [Effective Go](https://go.dev/doc/effective_go) conventions
- Use meaningful variable and function names
- Handle errors with context

### TypeScript/React

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use meaningful component and variable names
- Keep components focused (single responsibility)
- Use Tailwind CSS classes consistently

### General

- Write code for humans, not computers
- Comment complex logic
- Keep functions short and focused
- Prefer composition over inheritance

## Testing

### Backend (Go)

```bash
go test ./backend/... -v           # Verbose output
go test -race ./backend/...        # With race detector
go test -cover ./backend/...       # With coverage
```

### Frontend (Vitest)

```bash
cd frontend
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

### Writing Tests

- Test one thing per test case
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies

## Questions?

If you have questions about contributing:

1. Check this guide and the [README](README.md)
2. Search [existing issues](https://github.com/0yk0/one_man_shop/issues)
3. Open a [new issue](https://github.com/0yk0/one_man_shop/issues/new) with your question

Thank you for contributing! 🎉
