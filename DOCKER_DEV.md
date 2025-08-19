# Docker Development Setup

This guide explains how to run WhatsSuite locally using Docker for a consistent development environment.

## 🚀 Quick Start

### 1. Start All Services

```bash
# Start all services with hot reloading
pnpm dev:docker

# Or start in detached mode (background)
pnpm dev:docker:detached
```

### 2. Access Applications

- **Admin Dashboard**: http://localhost:3002
- **Web Client**: http://localhost:3000
- **API**: http://localhost:3001
- **Database**: localhost:5432
- **Redis**: localhost:6379

## 📋 Available Scripts

### Development Commands

```bash
# Start development environment
pnpm dev:docker                    # Start with logs
pnpm dev:docker:detached          # Start in background
pnpm dev:docker:build             # Rebuild and start
pnpm dev:docker:stop              # Stop all services
pnpm dev:docker:restart           # Restart all services
pnpm dev:docker:clean             # Stop and remove volumes
pnpm dev:docker:logs              # View logs
```

### Database Commands

```bash
# Database operations
pnpm db:migrate                   # Run database migrations
pnpm db:generate                  # Generate Prisma client
pnpm db:studio                    # Open Prisma Studio
pnpm db:seed                      # Seed templates
```

## 🏗️ Architecture

### Services

- **postgres**: PostgreSQL database
- **redis**: Redis for caching and queues
- **api**: Backend API service
- **wapp-service**: WhatsApp service
- **admin**: Admin dashboard (Next.js)
- **web**: Web client (Next.js)

### Ports

- `3000`: Web client
- `3001`: API service
- `3002`: Admin dashboard
- `5432`: PostgreSQL
- `6379`: Redis

## 🔧 Development Features

### Hot Reloading

- All services support hot reloading
- Code changes are reflected immediately
- No need to restart containers

### Volume Mounts

- Source code is mounted for live changes
- Node modules are cached in containers
- Database data persists between restarts

### Health Checks

- Database and Redis have health checks
- Services start in the correct order
- Automatic retries on failures

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Check what's using the port
lsof -i :3001

# Kill the process or use different ports
```

#### 2. Database Connection Issues

```bash
# Check if database is running
pnpm dev:docker:logs postgres

# Reset database
pnpm dev:docker:clean
pnpm dev:docker:build
```

#### 3. Build Issues

```bash
# Rebuild all containers
pnpm dev:docker:build

# Clean and rebuild
pnpm dev:docker:clean
pnpm dev:docker:build
```

### Reset Everything

```bash
# Stop and remove everything
docker-compose -f docker-compose.dev.yml down -v --remove-orphans

# Remove all images
docker system prune -a

# Start fresh
pnpm dev:docker:build
```

## 🔄 Development Workflow

### 1. Daily Development

```bash
# Start the environment
pnpm dev:docker:detached

# View logs
pnpm dev:docker:logs

# Make code changes (hot reloading works)
# Test in browser

# Stop when done
pnpm dev:docker:stop
```

### 2. Database Changes

```bash
# After schema changes
pnpm db:generate
pnpm db:migrate

# To seed data
pnpm db:seed
```

### 3. Adding Dependencies

```bash
# Add to package.json
# Rebuild containers
pnpm dev:docker:build
```

## 📊 Monitoring

### View Logs

```bash
# All services
pnpm dev:docker:logs

# Specific service
docker-compose -f docker-compose.dev.yml logs -f api
```

### Check Status

```bash
# Service status
docker-compose -f docker-compose.dev.yml ps

# Resource usage
docker stats
```

## 🎯 Benefits

1. **Consistent Environment**: Same setup as production
2. **No Local Dependencies**: Everything runs in containers
3. **Easy Onboarding**: New developers just run one command
4. **Isolated Development**: No conflicts with local services
5. **Hot Reloading**: Instant feedback on code changes
6. **Easy Reset**: Clean slate with one command

## 🔗 Related Files

- `docker-compose.dev.yml`: Development services configuration
- `Dockerfile.dev`: Development Dockerfile
- `.dockerignore`: Files excluded from Docker build
- `package.json`: Scripts for Docker commands
