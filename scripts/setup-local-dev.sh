#!/bin/bash

# buievo Local Development Environment Setup Script
# This script sets up a development environment on your HOST MACHINE (no Docker)

set -e

echo "🚀 Setting up buievo Local Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "env.development" ]; then
    echo -e "${RED}❌ Error: Please run this script from the buievo root directory${NC}"
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

# Check if PostgreSQL is running locally
echo -e "${BLUE}🗄️  Checking PostgreSQL connection...${NC}"
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: PostgreSQL is not running on localhost:5432${NC}"
    echo -e "${YELLOW}Please install and start PostgreSQL first:${NC}"
    echo -e "${BLUE}  Ubuntu/Debian: sudo apt install postgresql postgresql-contrib${NC}"
    echo -e "${BLUE}  macOS: brew install postgresql && brew services start postgresql${NC}"
    echo -e "${BLUE}  Arch: sudo pacman -S postgresql && sudo systemctl start postgresql${NC}"
    exit 1
fi

# Check if Redis is running locally
echo -e "${BLUE}🔴 Checking Redis connection...${NC}"
if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Redis is not running on localhost:6379${NC}"
    echo -e "${YELLOW}Please install and start Redis first:${NC}"
    echo -e "${BLUE}  Ubuntu/Debian: sudo apt install redis-server && sudo systemctl start redis-server${NC}"
    echo -e "${BLUE}  macOS: brew install redis && brew services start redis${NC}"
    echo -e "${BLUE}  Arch: sudo pacman -S redis && sudo systemctl start redis${NC}"
    exit 1
fi

# Create development database
echo -e "${BLUE}🗄️  Creating development database...${NC}"
if ! psql -h localhost -U postgres -c "SELECT 1 FROM pg_database WHERE datname='buievo_dev'" | grep -q 1; then
    echo "Creating database 'buievo_dev'..."
    psql -h localhost -U postgres -c "CREATE DATABASE buievo_dev;"
    echo -e "${GREEN}✅ Database 'buievo_dev' created${NC}"
else
    echo -e "${GREEN}✅ Database 'buievo_dev' already exists${NC}"
fi

# Create development user if it doesn't exist
echo -e "${BLUE}👤 Setting up database user...${NC}"
if ! psql -h localhost -U postgres -c "SELECT 1 FROM pg_user WHERE usename='buievo_dev'" | grep -q 1; then
    echo "Creating user 'buievo_dev'..."
    psql -h localhost -U postgres -c "CREATE USER buievo_dev WITH PASSWORD 'dev_password_123';"
    psql -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE buievo_dev TO buievo_dev;"
    echo -e "${GREEN}✅ User 'buievo_dev' created with privileges${NC}"
else
    echo -e "${GREEN}✅ User 'buievo_dev' already exists${NC}"
fi

# Install dependencies if needed
echo -e "${BLUE}📦 Installing dependencies...${NC}"
pnpm install

# Generate Prisma client
echo -e "${BLUE}🔧 Generating Prisma client...${NC}"
pnpm --filter @buievo/db exec prisma generate

# Run migrations
echo -e "${BLUE}🔄 Running database migrations...${NC}"
pnpm --filter @buievo/db exec prisma migrate deploy

echo -e "${GREEN}🎉 Local development environment setup complete!${NC}"
echo ""
echo -e "${BLUE}📱 Your local development services will run on:${NC}"
echo -e "   • Admin Dashboard: ${GREEN}http://localhost:3003${NC}"
echo -e "   • Web Client: ${GREEN}http://localhost:3004${NC}"
echo -e "   • API: ${GREEN}http://localhost:3005${NC}"
echo -e "   • Database: ${GREEN}localhost:5432 (buievo_dev)${NC}"
echo -e "   • Redis: ${GREEN}localhost:6379${NC}"
echo ""
echo -e "${BLUE}🚀 To start development services:${NC}"
echo -e "   ${YELLOW}pnpm dev${NC}"
echo ""
echo -e "${BLUE}🔒 To deploy to production (Docker):${NC}"
echo -e "   ${YELLOW}git push origin main${NC}"
echo -e "   ${YELLOW}pnpm prod:up${NC}"
echo ""
echo -e "${YELLOW}⚠️  Remember: This local environment is completely separate from production!${NC}"
echo -e "${YELLOW}🚀 When you push to main, everything gets deployed to Docker containers automatically!${NC}"

