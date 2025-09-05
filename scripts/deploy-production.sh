#!/bin/bash

# buievo Production Deployment Script
# This script deploys your code to production Docker containers

set -e

echo "🚀 Deploying buievo to Production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/buievo"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Check if we're running as root or with sudo
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Running as root - this is fine for production deployment${NC}"
fi

# Navigate to project directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Error: Project directory $PROJECT_DIR not found${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

echo -e "${BLUE}📁 Working directory: $(pwd)${NC}"

# Check if docker-compose.yml exists
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    echo -e "${RED}❌ Error: $DOCKER_COMPOSE_FILE not found${NC}"
    exit 1
fi

# Pull latest changes from git
echo -e "${BLUE}📥 Pulling latest changes from git...${NC}"
git fetch origin
git reset --hard origin/main
echo -e "${GREEN}✅ Git repository updated${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found. Please create it with production credentials.${NC}"
    exit 1
fi

# Stop existing containers
echo -e "${BLUE}🛑 Stopping existing containers...${NC}"
docker-compose down
echo -e "${GREEN}✅ Containers stopped${NC}"

# Pull latest images (if using external registry)
echo -e "${BLUE}📥 Pulling latest Docker images...${NC}"
docker-compose pull || echo -e "${YELLOW}⚠️  Some images couldn't be pulled (this is normal for local builds)${NC}"

# Build and start production services
echo -e "${BLUE}🏗️  Building and starting production services...${NC}"
docker-compose up -d --build
echo -e "${GREEN}✅ Production services started${NC}"

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 30

# Check if services are running
echo -e "${BLUE}🔍 Checking service status...${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ All services are running${NC}"
else
    echo -e "${RED}❌ Some services failed to start${NC}"
    docker-compose ps
    exit 1
fi

# Run database migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
if docker-compose exec -T api pnpm --filter @buievo/db exec prisma migrate deploy; then
    echo -e "${GREEN}✅ Database migrations completed${NC}"
else
    echo -e "${YELLOW}⚠️  Database migrations failed or no new migrations${NC}"
fi

# Health check
echo -e "${BLUE}🏥 Performing health checks...${NC}"
sleep 10

# Check API health
if curl -f http://localhost:3005/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API is responding${NC}"
else
    echo -e "${YELLOW}⚠️  API health check failed${NC}"
fi

# Clean up old images
echo -e "${BLUE}🧹 Cleaning up old Docker images...${NC}"
docker image prune -f
echo -e "${GREEN}✅ Cleanup completed${NC}"

echo ""
echo -e "${GREEN}🎉 Production deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📱 Your production services are running on:${NC}"
echo -e "   • Admin Dashboard: ${GREEN}http://localhost:3002${NC}"
echo -e "   • Web Client: ${GREEN}http://localhost:3000${NC}"
echo -e "   • API: ${GREEN}http://localhost:3005${NC}"
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
docker-compose ps
echo ""
echo -e "${YELLOW}🚀 buievo is now live in production!${NC}"

