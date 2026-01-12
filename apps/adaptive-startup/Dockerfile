FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package management files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (including Convex CLI)
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# The script expects arguments like --name=... --org-id=...
# These should be passed to the run command
ENTRYPOINT ["npx", "tsx", "scripts/provision_tenant.ts"]
