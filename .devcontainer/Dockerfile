FROM cgr.dev/chainguard/node:latest-dev

# Set up pnpm (if not present in the image, strictly speaking Chainguard dev images are minimal)
# Check if we need to install it. The dev image usually has coreutils and a shell.
# We might need to install pnpm via corepack or npm if available.
# Chainguard node-dev images typically have npm.

USER root

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /workspace

# Switch back to node user if desired, or stay root for dev container ease (often easier in dev containers to fix perms, but standard is non-root)
# vscode dev container usually handles user mapping.
