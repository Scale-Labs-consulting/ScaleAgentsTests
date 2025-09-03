#!/bin/bash

# Deployment script for ScaleAgents
# Usage: ./scripts/deploy.sh [environment]
# Environments: dev, qa, prod

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENV=${1:-dev}

echo -e "${BLUE}🚀 ScaleAgents Deployment Script${NC}"
echo -e "${BLUE}Environment: ${ENV}${NC}"
echo ""

# Validate environment
case $ENV in
  dev|development)
    ENV_NAME="development"
    ENV_FILE="env.development"
    BUILD_SCRIPT="build:dev"
    ;;
  qa|staging)
    ENV_NAME="qa"
    ENV_FILE="env.qa"
    BUILD_SCRIPT="build:qa"
    ;;
  prod|production)
    ENV_NAME="production"
    ENV_FILE="env.production"
    BUILD_SCRIPT="build:prod"
    ;;
  *)
    echo -e "${RED}❌ Invalid environment: $ENV${NC}"
    echo "Valid environments: dev, qa, prod"
    exit 1
    ;;
esac

echo -e "${YELLOW}📋 Environment: $ENV_NAME${NC}"
echo -e "${YELLOW}📁 Config file: $ENV_FILE${NC}"
echo -e "${YELLOW}🔨 Build script: $BUILD_SCRIPT${NC}"
echo ""

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ Environment file not found: $ENV_FILE${NC}"
  exit 1
fi

# Load environment variables
echo -e "${BLUE}📥 Loading environment variables from $ENV_FILE${NC}"
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Check required environment variables
echo -e "${BLUE}🔍 Checking required environment variables...${NC}"
required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "OPENAI_KEY")

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo -e "${YELLOW}⚠️  Warning: $var is not set${NC}"
  else
    echo -e "${GREEN}✅ $var is set${NC}"
  fi
done

echo ""

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
pnpm install

# Run linting
echo -e "${BLUE}🔍 Running linting...${NC}"
pnpm lint

# Build the application
echo -e "${BLUE}🔨 Building application for $ENV_NAME environment...${NC}"
pnpm run $BUILD_SCRIPT

# Check build success
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Build successful!${NC}"
else
  echo -e "${RED}❌ Build failed!${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}🎉 Deployment preparation completed for $ENV_NAME environment!${NC}"

# Environment-specific next steps
case $ENV_NAME in
  development)
    echo -e "${BLUE}📝 Next steps:${NC}"
    echo "  - Run: pnpm dev"
    echo "  - Visit: http://localhost:3000"
    ;;
  qa)
    echo -e "${BLUE}📝 Next steps:${NC}"
    echo "  - Deploy to QA environment"
    echo "  - Run: pnpm start:qa"
    echo "  - Test thoroughly before production"
    ;;
  production)
    echo -e "${BLUE}📝 Next steps:${NC}"
    echo "  - Deploy to production environment"
    echo "  - Monitor application health"
    echo "  - Run: pnpm start"
    ;;
esac

echo ""
echo -e "${GREEN}✨ All done!${NC}"

