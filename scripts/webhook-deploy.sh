#!/bin/bash

# buievo Webhook Deployment Script
# This script is triggered by GitHub webhooks to automatically deploy

set -e

echo "🚀 Webhook-triggered deployment started..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/buievo"
LOG_FILE="/var/log/buievo-deploy.log"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-your_webhook_secret_here}"

# Log function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Check if webhook secret is provided
if [ -z "$WEBHOOK_SECRET" ]; then
    log "❌ Error: WEBHOOK_SECRET environment variable not set"
    exit 1
fi

# Navigate to project directory
if [ ! -d "$PROJECT_DIR" ]; then
    log "❌ Error: Project directory $PROJECT_DIR not found"
    exit 1
fi

cd "$PROJECT_DIR"
log "📁 Working directory: $(pwd)"

# Pull latest changes from git
log "📥 Pulling latest changes from git..."
git fetch origin
git reset --hard origin/main
log "✅ Git repository updated"

# Check if .env file exists
if [ ! -f ".env" ]; then
    log "❌ Error: .env file not found. Please create it with production credentials."
    exit 1
fi

# Stop existing containers
log "🛑 Stopping existing containers..."
docker-compose down
log "✅ Containers stopped"

# Build and start production services
log "🏗️  Building and starting production services..."
docker-compose up -d --build
log "✅ Production services started"

# Wait for services to be ready
log "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
log "🔍 Checking service status..."
if docker-compose ps | grep -q "Up"; then
    log "✅ All services are running"
else
    log "❌ Some services failed to start"
    docker-compose ps
    exit 1
fi

# Run database migrations
log "🗄️  Running database migrations..."
if docker-compose exec -T api pnpm --filter @buievo/db exec prisma migrate deploy; then
    log "✅ Database migrations completed"
else
    log "⚠️  Database migrations failed or no new migrations"
fi

# Health check
log "🏥 Performing health checks..."
sleep 10

# Check API health
if curl -f http://localhost:3001/ > /dev/null 2>&1; then
    log "✅ API is responding"
else
    log "⚠️  API health check failed"
fi

# Clean up old images
log "🧹 Cleaning up old Docker images..."
docker image prune -f
log "✅ Cleanup completed"

log "🎉 Webhook deployment completed successfully!"
log "📱 Services deployed and running"

# Return success
exit 0

