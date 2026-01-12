# Adaptive Monorepo

## Security & Architecture

This repository is designed with a "Zero CVE" philosophy using **Chainguard** images.

### 1. Secure Runtime (OS Layer)
We use the **Chainguard Node.js Image** (`cgr.dev/chainguard/node`) for our development environment and production builds.
- **Source**: [Chainguard Images Directory](https://images.chainguard.dev/directory/image/node/overview)
- **Benefit**: This image contains only the absolute minimum packages needed to run Node.js, all sourced from the Wolfi Linux distribution, which is designed for supply chain security. This eliminates typical OS-level vulnerabilities (like those found in standard Debian/Alpine images).

### 2. Secure Application Dependencies (npm Layer)
While the OS is secure via Chainguard, we must ensuring our own application dependencies (`node_modules`) are free of vulnerabilities.
- We use `pnpm audit` to scan for known vulnerabilities in our dependencies.
- We have added a `security-check` script to enforce this.

## Development

**Prerequisites**: Docker & VS Code.

1.  Open this folder in VS Code.
2.  Click "Reopen in Container".
3.  You are now working inside the minimal, secure Chainguard environment.

## Scripts

- `pnpm dev`: Start development servers.
- `pnpm build`: Build all packages.
- `pnpm audit`: Check for vulnerabilities in npm packages.
