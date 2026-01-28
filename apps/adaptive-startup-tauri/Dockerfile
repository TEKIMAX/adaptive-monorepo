# Use Chainguard Node (dev variant for npm/pnpm support)
FROM cgr.dev/chainguard/node:latest-dev

WORKDIR /app

# Switch to root to install global packages (if needed, but usually chainguard runs as non-root 'node')
# Chainguard images typically do not allow root. We should install pnpm locally or use corepack if available.
# But 'node:latest-dev' is Wolfi-based.

USER root
# Install pnpm
RUN npm install -g pnpm

# Copy package management files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Revert to non-root user for security (optional, but good practice)
USER node

# The script expects arguments like --name=... --org-id=...
ENTRYPOINT ["npx", "tsx", "scripts/provision_tenant.ts"]
