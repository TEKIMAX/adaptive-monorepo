#!/bin/bash

# ============================================
# Adaptive Startup Deployment Script
# Handles dev/prod environment variables dynamically
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "🚀 Adaptive Startup Deployment Script"
echo "=============================="
echo ""

# Check environment argument
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: ./deploy.sh [dev|prod]${NC}"
    exit 1
fi

ENV=$1
ENV_FILE=".env.local"

if [ "$ENV" == "prod" ]; then
    ENV_FILE=".env.production"
    echo -e "${GREEN}🔧 Using PRODUCTION environment ($ENV_FILE)${NC}"
else
    echo -e "${GREEN}🔧 Using DEVELOPMENT environment ($ENV_FILE)${NC}"
fi

# Load variables from the selected file
if [ -f "$ENV_FILE" ]; then
    # Export variables ignoring comments and empty lines
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo -e "${RED}❌ Environment file $ENV_FILE not found!${NC}"
    exit 1
fi

# Validate Critical Variables
if [ -z "$CONVEX_DEPLOYMENT" ]; then
    echo -e "${RED}❌ Missing CONVEX_DEPLOYMENT in $ENV_FILE${NC}"
    exit 1
fi

echo ""
echo "📋 Configuration Loaded:"
echo "   Target: $CONVEX_DEPLOYMENT"
echo "   Host:   $HOST_URL"
echo ""

# ============================================
# Set Convex Environment Variables
# ============================================

echo -e "${YELLOW}📦 Setting Convex environment variables...${NC}"

# Explicitly ensure correct deployment target
export CONVEX_DEPLOYMENT=$CONVEX_DEPLOYMENT

# Sync specific keys to Convex
npx convex env set WORKOS_CLIENT_ID "$WORKOS_CLIENT_ID"
npx convex env set WORKOS_API_KEY "$WORKOS_API_KEY"
npx convex env set WORKOS_REDIRECT_URI "$WORKOS_REDIRECT_URI"
npx convex env set WORKOS_WEBHOOK_SECRET "$WORKOS_WEBHOOK_SECRET"
npx convex env set HOST_URL "$HOST_URL"
npx convex env set GEMINI_API_KEY "$GEMINI_API_KEY"
npx convex env set STRIPE_SECRET_KEY "$STRIPE_SECRET_KEY"
npx convex env set STRIPE_WEBHOOK_SECRET "$STRIPE_WEBHOOK_SECRET"
npx convex env set STRIPE_BASE_PRICE_ID "$STRIPE_BASE_PRICE_ID"
npx convex env set STRIPE_YEARLY_PRICE_ID "$STRIPE_YEARLY_PRICE_ID"
npx convex env set STRIPE_SEAT_PRICE_ID "$STRIPE_SEAT_PRICE_ID"
npx convex env set STRIPE_SEAT_PRICE_ID_YEARLY "$STRIPE_SEAT_PRICE_ID_YEARLY"
npx convex env set PIXABAY_API_KEY "$PIXABAY_API_KEY"
npx convex env set STRIPE_CLIENT_ID "$STRIPE_CLIENT_ID"
npx convex env set STRIPE_TOKEN_PACK_PRICE_ID "$STRIPE_TOKEN_PACK_PRICE_ID"
npx convex env set API_KEY "$API_KEY"
npx convex env set PRICE_ID "$PRICE_ID"
npx convex env set OLLAMA_BASE_URL "$OLLAMA_BASE_URL"
npx convex env set OLLAMA_MODEL "$OLLAMA_MODEL"
npx convex env set EXTERNAL_AI_KEY "$EXTERNAL_AI_KEY"
npx convex env set CLOUDFLARE_ACCESS_ID "$CLOUDFLARE_ACCESS_ID"
npx convex env set CLOUDFLARE_ACCESS_SECRET "$CLOUDFLARE_ACCESS_SECRET"

echo -e "${GREEN}✅ Convex environment variables synced${NC}"

# ============================================
# Deploy Convex Functions
# ============================================

echo ""
echo -e "${YELLOW}🔄 Deploying Convex functions...${NC}"
npx convex deploy --yes
echo -e "${GREEN}✅ Convex functions deployed${NC}"

# ============================================
# Build & Deploy Frontend (Production Only)
# ============================================

if [ "$ENV" == "prod" ]; then
    echo ""
    echo -e "${YELLOW}🏗️  Building frontend for production...${NC}"
    
    # Ensure VITE_ vars are picked up by build
    # We load them from .env.production by temporarily copying it or just letting Vite pick up .env.production 
    # Vite automatically loads .env.production when mode is production, but we ensure it here.
    
    # NOTE: Vite loads .env.[mode]. We run build which defaults to production.
    # So valid VITE_ keys in .env.production will be automatically embedded.
    
    pnpm run build
    
    echo -e "${GREEN}✅ Frontend build complete${NC}"
    echo ""
    echo -e "${YELLOW}🚀 Deploying to Cloudflare Pages...${NC}"
    
    # Deploy to Cloudflare
    npx wrangler pages deploy dist --project-name pillaros --branch main
    
    echo -e "${GREEN}🎉 Successfully deployed to Cloudflare!${NC}"
fi

echo ""
echo -e "${GREEN}✨ Deployment Pipeline Complete!${NC}"
echo ""
