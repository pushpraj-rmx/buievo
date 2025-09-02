#!/bin/bash

# WhatsSuite Development Environment Setup Script
# This script sets up a development environment without affecting production

set -e

echo "🚀 Setting up WhatsSuite Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "docker-compose.dev.yml" ]; then
    echo -e "${RED}❌ Error: Please run this script from the WhatsSuite root directory${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Checking current git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes. Consider committing or stashing them first.${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create development branch if it doesn't exist
echo -e "${BLUE}🌿 Setting up development branch...${NC}"
if ! git show-ref --verify --quiet refs/heads/development; then
    echo "Creating development branch..."
    git checkout -b development
    echo -e "${GREEN}✅ Development branch created${NC}"
else
    echo "Switching to development branch..."
    git checkout development
    echo -e "${GREEN}✅ Switched to development branch${NC}"
fi

# Copy development environment file
echo -e "${BLUE}⚙️  Setting up environment variables...${NC}"
if [ -f "env.development" ]; then
    cp env.development .env
    echo -e "${GREEN}✅ Development environment file copied to .env${NC}"
else
    echo -e "${RED}❌ Error: env.development file not found${NC}"
    exit 1
fi

# Start development database and Redis
echo -e "${BLUE}🐳 Starting development database and Redis...${NC}"
docker-compose -f docker-compose.dev.yml up -d postgres-dev redis-dev

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check if services are healthy
if ! docker-compose -f docker-compose.dev.yml exec -T postgres-dev pg_isready -U whatssuite_dev -d whatssuite_dev > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: PostgreSQL is not ready${NC}"
    exit 1
fi

if ! docker-compose -f docker-compose.dev.yml exec -T redis-dev redis-cli ping > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Redis is not ready${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Development database and Redis are ready${NC}"

# Run database migrations
echo -e "${BLUE}🗄️  Setting up database schema...${NC}"
docker-compose -f docker-compose.dev.yml exec -T postgres-dev createdb -U whatssuite_dev whatssuite_dev 2>/dev/null || true

# Install dependencies if needed
echo -e "${BLUE}📦 Installing dependencies...${NC}"
pnpm install

# Generate Prisma client
echo -e "${BLUE}🔧 Generating Prisma client...${NC}"
pnpm --filter @whatssuite/db exec prisma generate

# Run migrations
echo -e "${BLUE}🔄 Running database migrations...${NC}"
pnpm --filter @whatssuite/db exec prisma migrate deploy

echo -e "${GREEN}🎉 Development environment setup complete!${NC}"
echo ""
echo -e "${BLUE}📱 Your development services are running on:${NC}"
echo -e "   • Admin Dashboard: ${GREEN}http://localhost:3003${NC}"
echo -e "   • Web Client: ${GREEN}http://localhost:3004${NC}"
echo -e "   • API: ${GREEN}http://localhost:3005${NC}"
echo -e "   • Database: ${GREEN}localhost:5433${NC}"
echo -e "   • Redis: ${GREEN}localhost:6380${NC}"
echo ""
echo -e "${BLUE}🚀 To start all development services:${NC}"
echo -e "   ${YELLOW}pnpm dev:docker${NC}"
echo ""
echo -e "${BLUE}🛑 To stop development services:${NC}"
echo -e "   ${YELLOW}pnpm dev:docker:stop${NC}"
echo ""
echo -e "${BLUE}📊 To view logs:${NC}"
echo -e "   ${YELLOW}pnpm dev:docker:logs${NC}"
echo ""
echo -e "${YELLOW}⚠️  Remember: This development environment is completely separate from production!${NC}"

