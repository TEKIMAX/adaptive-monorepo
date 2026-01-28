#!/bin/bash

# ============================================
# TEKIMAX Deploy Script
# Builds, deploys, and outputs the latest URL
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}🚀 TEKIMAX Deployment Script${NC}"
echo "=============================="
echo ""

# Clean and build
echo -e "${YELLOW}🧹 Cleaning dist...${NC}"
rm -rf dist

echo -e "${YELLOW}🔨 Building...${NC}"
npm run build

echo -e "${YELLOW}📤 Deploying to Cloudflare Pages...${NC}"

# Deploy and capture output
DEPLOY_OUTPUT=$(npx wrangler pages deploy dist --project-name tekimax-engineering-for-good --branch production --commit-dirty=true 2>&1)

echo "$DEPLOY_OUTPUT"

# Extract the preview URL
PREVIEW_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[a-z0-9]*\.tekimax-engineering-for-good\.pages\.dev' | head -1)
PRODUCTION_URL="https://tekimax.com"

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo -e "📍 Preview URL:     ${CYAN}${PREVIEW_URL}${NC}"
echo -e "📍 Production URL:  ${CYAN}${PRODUCTION_URL}${NC}"
echo ""
echo -e "${YELLOW}💡 If tekimax.com shows old content, purge Cloudflare cache or use the preview URL.${NC}"
echo ""
