# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:               |

We only provide security updates for the latest release. Please always use the most recent version.

## Reporting a Vulnerability

The security of One Man Shop is important to us. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **yatheesh.konduru@outlook.com**

Include the following information in your report:

- Type of vulnerability (e.g., SQL injection, XSS, data exposure)
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

### What to Expect

- **Acknowledgment**: We'll acknowledge receipt of your report within 48 hours
- **Assessment**: We'll investigate and validate the vulnerability
- **Fix**: We'll develop and test a fix
- **Disclosure**: We'll coordinate with you on public disclosure timing

We aim to resolve critical vulnerabilities within 7 days of confirmation.

### Scope

This security policy covers:

- The One Man Shop desktop application
- Data storage and handling (PocketBase/SQLite)
- Backup mechanisms
- Network communications (WebSocket, customer display)

### Out of Scope

- Third-party dependencies (report to upstream maintainers)
- Social engineering attacks
- Physical security

## Security Best Practices

### For Users

- Keep the application updated to the latest version
- Use a strong admin PIN
- Store backups in secure locations
- Don't share your admin PIN publicly

### For Contributors

- Never commit secrets, API keys, or credentials
- Validate all user inputs
- Use parameterized queries (already handled by PocketBase)
- Follow secure coding practices for Go and TypeScript

## Data Security

One Man Shop is designed with privacy in mind:

- **Local-first**: All data stays on your computer
- **No cloud**: No data is sent to external servers
- **No tracking**: No analytics or telemetry
- **Encrypted backups**: When using encrypted backup destinations

## Dependencies

We regularly audit dependencies for known vulnerabilities:

- Go modules: Checked via `govulncheck`
- npm packages: Checked via `npm audit`

If you find a vulnerability in a dependency, please report it following the process above.

---

Thank you for helping keep One Man Shop and its users safe!
