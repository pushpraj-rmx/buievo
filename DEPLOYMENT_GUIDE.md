# 🚀 WhatsSuite Deployment Guide

## 🎯 **Overview**

This guide explains how to set up automatic deployment from your local development environment to production Docker containers. The workflow ensures that:

- ✅ **Local Development**: You develop on your host machine (no Docker)
- ✅ **Automatic Deployment**: Code gets deployed to Docker containers when you push
- ✅ **Production Safety**: Your production instance is always up-to-date
- ✅ **Zero Downtime**: Seamless updates without service interruption

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Local Dev     │    │   Git Push      │    │   Production    │
│   (Host)        │───▶│   to Main       │───▶│   (Docker)      │
│                 │    │                 │    │                 │
│ • PostgreSQL    │    │ • Triggers      │    │ • Auto-deploy   │
│ • Redis         │    │ • Webhook       │    │ • Build images  │
│ • Node.js       │    │ • CI/CD         │    │ • Run services  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 **Local Development Setup**

### **1. Install Local Dependencies**

```bash
# Install PostgreSQL
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql && brew services start postgresql

# Arch Linux
sudo pacman -S postgresql && sudo systemctl start postgresql

# Install Redis
# Ubuntu/Debian
sudo apt install redis-server && sudo systemctl start redis-server

# macOS
brew install redis && brew services start redis

# Arch Linux
sudo pacman -S redis && sudo systemctl start redis
```

### **2. Setup Local Development Environment**

```bash
# Run the automated setup script
./scripts/setup-local-dev.sh

# This will:
# - Create development branch
# - Setup local database 'whatssuite_dev'
# - Configure environment variables
# - Install dependencies
# - Run database migrations
```

### **3. Start Local Development**

```bash
# Start all development services
pnpm local:dev

# Your services will run on:
# - Admin Dashboard: http://localhost:3003
# - Web Client: http://localhost:3004
# - API: http://localhost:3005
# - Database: localhost:5432 (whatssuite_dev)
# - Redis: localhost:6379
```

## 🔄 **Development Workflow**

### **1. Feature Development**

```bash
# Create feature branch
git checkout -b feature/new-campaign-system

# Make your changes...

# Test locally
pnpm local:dev

# Commit and push
git add .
git commit -m "feat: implement new campaign system"
git push origin feature/new-campaign-system
```

### **2. Merge to Development**

```bash
# Create pull request to development branch
# Test thoroughly in development environment
git checkout development
git merge feature/new-campaign-system
git push origin development
```

### **3. Deploy to Production**

```bash
# Merge to main branch
git checkout main
git merge development
git push origin main

# This automatically triggers deployment to Docker containers!
```

## 🐳 **Automatic Deployment Setup**

### **Option 1: GitHub Actions (Recommended)**

The `.github/workflows/deploy.yml` file automatically deploys when you push to main:

1. **Builds Docker images** with your latest code
2. **Pushes to container registry** (GitHub Container Registry)
3. **Deploys to production server** via SSH
4. **Runs database migrations** automatically
5. **Performs health checks** to ensure deployment success

#### **Required GitHub Secrets:**

```bash
SSH_PRIVATE_KEY=your_ssh_private_key
SSH_USER=your_server_username
SSH_HOST=your_server_ip_or_domain
PROD_DOMAIN=your_production_domain
```

### **Option 2: Webhook Deployment**

Use the webhook script for manual or external trigger deployment:

```bash
# On your production server
export WEBHOOK_SECRET=your_secret_here
./scripts/webhook-deploy.sh
```

### **Option 3: Manual Deployment**

Deploy manually when needed:

```bash
# On your production server
./scripts/deploy-production.sh
```

## 🔧 **Production Server Setup**

### **1. Server Requirements**

- **OS**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 20GB, Recommended 50GB+
- **Docker**: Docker Engine 20.10+
- **Docker Compose**: Version 2.0+

### **2. Install Docker**

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

### **3. Setup Project Directory**

```bash
# Create project directory
sudo mkdir -p /opt/whatssuite
sudo chown $USER:$USER /opt/whatssuite

# Clone repository
cd /opt/whatssuite
git clone https://github.com/yourusername/whatssuite.git .

# Create production environment file
cp env.template .env
# Edit .env with your production credentials
```

### **4. Configure Production Environment**

```bash
# Edit .env file with production values
nano .env

# Key production variables:
POSTGRES_USER=whatssuite_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=whatssuite
PHONE_NUMBER_ID=your_prod_phone_number_id
ACCESS_TOKEN=your_prod_access_token
WABA_ID=your_prod_business_account_id
```

## 🚀 **Deployment Process**

### **What Happens When You Push to Main:**

1. **GitHub Actions Triggered**
   - Builds Docker images with your code
   - Pushes images to container registry
   - Connects to production server via SSH

2. **Production Server Updates**
   - Pulls latest code from git
   - Stops existing containers
   - Builds new containers with latest images
   - Starts all services

3. **Database Migration**
   - Runs Prisma migrations automatically
   - Ensures database schema is up-to-date

4. **Health Checks**
   - Verifies all services are running
   - Checks API responsiveness
   - Logs deployment status

5. **Cleanup**
   - Removes old Docker images
   - Frees up disk space

## 📊 **Monitoring & Logs**

### **View Deployment Logs**

```bash
# On production server
tail -f /var/log/whatssuite-deploy.log

# View container logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### **Health Monitoring**

```bash
# API health check
curl http://localhost:3001/

# Service status
docker-compose ps

# Resource usage
docker stats
```

## 🆘 **Troubleshooting**

### **Common Deployment Issues**

1. **Port Conflicts**

   ```bash
   # Check what's using the ports
   sudo netstat -tulpn | grep :3001
   sudo netstat -tulpn | grep :3002
   sudo netstat -tulpn | grep :3000
   ```

2. **Database Connection Issues**

   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql

   # Check database connectivity
   psql -h localhost -U whatssuite_user -d whatssuite
   ```

3. **Docker Issues**

   ```bash
   # Check Docker status
   sudo systemctl status docker

   # Check available disk space
   df -h

   # Clean up Docker
   docker system prune -a
   ```

### **Rollback Deployment**

```bash
# If deployment fails, rollback to previous version
git checkout HEAD~1
./scripts/deploy-production.sh
```

## 🔒 **Security Considerations**

### **Production Security**

- ✅ **Environment Variables**: Never commit `.env` files
- ✅ **SSH Keys**: Use key-based authentication
- ✅ **Firewall**: Restrict access to necessary ports only
- ✅ **Updates**: Keep system and Docker updated
- ✅ **Monitoring**: Set up log monitoring and alerts

### **Access Control**

```bash
# Restrict SSH access
# Edit /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
AllowUsers your_username

# Restart SSH service
sudo systemctl restart sshd
```

## 📈 **Scaling & Performance**

### **Resource Optimization**

```bash
# Monitor resource usage
docker stats

# Set resource limits in docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

### **Load Balancing**

For high-traffic scenarios, consider:

- **Nginx reverse proxy** for load balancing
- **Multiple API instances** behind a load balancer
- **Database clustering** for high availability
- **Redis clustering** for distributed caching

## 🎉 **Success!**

You now have a professional deployment pipeline that:

- ✅ **Develops locally** on your host machine
- ✅ **Deploys automatically** to Docker containers
- ✅ **Maintains zero downtime** during updates
- ✅ **Ensures production safety** with proper isolation
- ✅ **Scales easily** as your business grows

Your WhatsSuite platform is now ready for continuous development and deployment! 🚀

