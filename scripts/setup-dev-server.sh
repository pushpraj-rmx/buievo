#!/bin/bash

# Development Server Setup Script
# This script sets up the development server environment and deploys buievo

set -e

echo "🚀 Setting up buievo Development Server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/buievo-dev"
GITHUB_REPO="pushpraj-rmx/buievo"  # Your actual repository
BRANCH="development"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Checking system requirements..."

# Check available disk space (need at least 5GB)
AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
if [ "$AVAILABLE_SPACE" -lt 5242880 ]; then
    print_warning "Low disk space. Available: ${AVAILABLE_SPACE}KB. Recommended: at least 5GB"
fi

# Check available memory (need at least 4GB)
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
if [ "$TOTAL_MEM" -lt 4096 ]; then
    print_warning "Low memory. Available: ${TOTAL_MEM}MB. Recommended: at least 4GB"
fi

print_status "Creating project directory..."
sudo mkdir -p "$PROJECT_DIR"
sudo chown $USER:$USER "$PROJECT_DIR"
cd "$PROJECT_DIR"

print_status "Cloning repository..."
if [ -d ".git" ]; then
    print_status "Repository already exists, pulling latest changes..."
    git pull origin "$BRANCH"
else
    git clone -b "$BRANCH" "https://github.com/$GITHUB_REPO.git" .
fi

print_status "Setting up environment..."
cp env.dev-server .env

print_status "Creating necessary directories..."
mkdir -p uploads
mkdir -p logs

print_status "Setting up Docker environment..."
# Create .env file for Docker Compose
cat > .env << EOF
GITHUB_REPOSITORY=$GITHUB_REPO
WHATSAPP_API_TOKEN=your_whatsapp_api_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
EOF

print_status "Starting development services..."
docker-compose -f docker-compose.dev-server.yml up -d

print_status "Waiting for services to be ready..."
sleep 30

print_status "Checking service health..."
if docker-compose -f docker-compose.dev-server.yml ps | grep -q "Up"; then
    print_success "All services are running!"
else
    print_error "Some services failed to start. Check logs with: docker-compose -f docker-compose.dev-server.yml logs"
    exit 1
fi

print_status "Running database migrations..."
docker-compose -f docker-compose.dev-server.yml exec -T api pnpm --filter @buievo/db exec prisma migrate deploy

print_success "Development server setup completed!"
echo ""
echo "📱 Services deployed:"
echo "   • Admin Dashboard: http://localhost:3006"
echo "   • Web Client: http://localhost:3004"
echo "   • API: http://localhost:3005"
echo "   • WhatsApp Service: http://localhost:3007"
echo ""
echo "🔧 Useful commands:"
echo "   • View logs: docker-compose -f docker-compose.dev-server.yml logs -f"
echo "   • Stop services: docker-compose -f docker-compose.dev-server.yml down"
echo "   • Restart services: docker-compose -f docker-compose.dev-server.yml restart"
echo "   • Update services: git pull origin $BRANCH && docker-compose -f docker-compose.dev-server.yml up -d --build"
echo ""
print_success "Your development server is ready! 🎉"
