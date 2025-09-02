# 🚀 WhatsSuite Development Workflow

## 🎯 **Overview**

This guide explains how to develop new features and fix bugs in WhatsSuite without affecting your production instance. The development environment runs completely separate from production with different ports, databases, and configurations.

## 🏗️ **Development Environment Setup**

### **Quick Start (Recommended)**

```bash
# 1. Run the automated setup script
./scripts/setup-dev.sh

# 2. Start all development services
pnpm dev:docker
```

### **Manual Setup**

```bash
# 1. Create development branch
git checkout -b development
git push origin development

# 2. Copy development environment
cp env.development .env

# 3. Start development database and Redis
docker-compose -f docker-compose.dev.yml up -d postgres-dev redis-dev

# 4. Install dependencies and setup database
pnpm install
pnpm --filter @whatssuite/db exec prisma generate
pnpm --filter @whatssuite/db exec prisma migrate deploy

# 5. Start all services
pnpm dev:docker
```

## 🌐 **Development Service Ports**

| Service             | Development Port | Production Port | Purpose                 |
| ------------------- | ---------------- | --------------- | ----------------------- |
| **Admin Dashboard** | 3003             | 3002            | Business user interface |
| **Web Client**      | 3004             | 3000            | Public-facing interface |
| **API**             | 3005             | 3001            | Backend services        |
| **PostgreSQL**      | 5433             | 5432            | Database                |
| **Redis**           | 6380             | 6379            | Cache & queues          |

## 🔄 **Development Workflow**

### **1. Feature Development**

```bash
# Create feature branch from development
git checkout development
git pull origin development
git checkout -b feature/new-campaign-system

# Make your changes...

# Test in development environment
pnpm dev:docker

# Commit and push
git add .
git commit -m "feat: implement new campaign system"
git push origin feature/new-campaign-system

# Create pull request to development branch
```

### **2. Bug Fixes**

```bash
# Create bugfix branch from development
git checkout development
git pull origin development
git checkout -b bugfix/media-upload-issue

# Fix the bug...

# Test in development environment
pnpm dev:docker

# Commit and push
git add .
git commit -m "fix: resolve media upload issue"
git push origin bugfix/media-upload-issue

# Create pull request to development branch
```

### **3. Testing & Validation**

```bash
# Start development environment
pnpm dev:docker

# Run tests
pnpm test

# Check types
pnpm check-types

# Lint code
pnpm lint

# Build for production
pnpm build
```

## 🐳 **Docker Commands**

### **Development Services**

```bash
# Start all development services
pnpm dev:docker

# Start in background
pnpm dev:docker:detached

# View logs
pnpm dev:docker:logs

# Stop services
pnpm dev:docker:stop

# Restart services
pnpm dev:docker:restart

# Clean up (removes volumes)
pnpm dev:docker:clean
```

### **Database Operations**

```bash
# Run migrations
pnpm dev:db:migrate

# Generate Prisma client
pnpm dev:db:generate

# Open Prisma Studio
pnpm dev:db:studio
```

## 🔧 **Environment Configuration**

### **Development Environment (.env.development)**

```bash
# Database
POSTGRES_USER=whatssuite_dev
POSTGRES_PASSWORD=dev_password_123
POSTGRES_DB=whatssuite_dev
DATABASE_URL=postgresql://whatssuite_dev:dev_password_123@localhost:5433/whatssuite_dev?schema=public

# Redis
REDIS_URL=redis://localhost:6380

# API
PORT=3005
NODE_ENV=development

# WhatsApp API (use test credentials)
PHONE_NUMBER_ID=your_dev_phone_number_id
ACCESS_TOKEN=your_dev_access_token
WABA_ID=your_dev_business_account_id

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3005
```

### **Production Environment (.env)**

```bash
# Database
POSTGRES_USER=whatssuite_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=whatssuite
DATABASE_URL=postgresql://whatssuite_user:your_secure_password@postgres:5432/whatssuite?schema=public

# Redis
REDIS_URL=redis://redis:6379

# API
PORT=3001
NODE_ENV=production

# WhatsApp API (production credentials)
PHONE_NUMBER_ID=your_prod_phone_number_id
ACCESS_TOKEN=your_prod_access_token
WABA_ID=your_prod_business_account_id

# Frontend
NEXT_PUBLIC_API_URL=http://your-domain.com:3001
```

## 📁 **Project Structure**

```
whatssuite/
├── apps/
│   ├── admin/          # Admin dashboard (port 3003)
│   ├── api/            # Backend API (port 3005)
│   ├── web/            # Web client (port 3004)
│   └── wapp-service/   # WhatsApp service
├── packages/            # Shared packages
├── scripts/             # Development scripts
├── docker-compose.yml           # Production
├── docker-compose.dev.yml       # Development
├── env.template                 # Production template
├── env.development             # Development template
└── scripts/setup-dev.sh        # Setup script
```

## 🚨 **Important Notes**

### **⚠️ Never Mix Environments**

- **NEVER** use production credentials in development
- **NEVER** run development commands on production
- **NEVER** commit `.env` files to git
- **ALWAYS** use different ports for development

### **🔒 Security Considerations**

- Development environment uses separate databases
- Development environment has different API endpoints
- Development environment can use test WhatsApp credentials
- Production environment remains completely isolated

### **📊 Database Management**

- Development database: `whatssuite_dev`
- Production database: `whatssuite`
- Each environment has its own migrations
- Development can be reset without affecting production

## 🚀 **Deployment Workflow**

### **1. Development → Staging**

```bash
# Merge feature to development branch
git checkout development
git merge feature/new-campaign-system
git push origin development

# Deploy to staging environment (if you have one)
# This would use staging docker-compose file
```

### **2. Development → Production**

```bash
# When ready for production
git checkout main
git merge development
git push origin main

# Deploy to production
pnpm prod:up
```

## 🆘 **Troubleshooting**

### **Common Issues**

1. **Port conflicts**: Ensure no other services use ports 3003, 3004, 3005, 5433, 6380
2. **Database connection**: Check if PostgreSQL and Redis containers are running
3. **Environment variables**: Verify `.env` file is properly configured
4. **Dependencies**: Run `pnpm install` if you encounter module errors

### **Reset Development Environment**

```bash
# Stop all services
pnpm dev:docker:stop

# Clean up volumes
pnpm dev:docker:clean

# Restart setup
./scripts/setup-dev.sh
```

## 📚 **Additional Resources**

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Documentation](https://docs.docker.com/)

---

**Remember**: Your production instance is completely safe while you develop new features in the development environment! 🎉

