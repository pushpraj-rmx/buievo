# 🚀 Development Server Deployment Guide

This guide will help you deploy your WhatsSuite development version to a live server so you can test changes in a production-like environment.

## 📋 Prerequisites

### 1. Development Server Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+ (recommended)
- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended)
- **Storage**: 20GB+ available space
- **Network**: Public IP address or domain name

### 2. Software Requirements
- Docker 20.10+
- Docker Compose 2.0+
- Git
- curl (for health checks)

### 3. GitHub Repository Access
- Your WhatsSuite repository must be accessible
- SSH key configured for GitHub access

## 🔧 Setup Steps

### Step 1: Prepare Your Development Server

1. **SSH into your development server:**
   ```bash
   ssh user@your-dev-server-ip
   ```

2. **Install Docker and Docker Compose:**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   
   # Logout and login again for group changes to take effect
   exit
   ssh user@your-dev-server-ip
   ```

### Step 2: Configure GitHub Secrets

1. **Go to your GitHub repository → Settings → Secrets and variables → Actions**

2. **Add the following secrets:**
   ```
   DEV_SSH_PRIVATE_KEY: Your SSH private key for the dev server
   DEV_SSH_USER: Username for SSH access to dev server
   DEV_SSH_HOST: IP address or hostname of your dev server
   DEV_DOMAIN: Domain name or IP of your dev server
   ```

3. **Generate SSH key pair for the dev server:**
   ```bash
   ssh-keygen -t ed25519 -C "whatssuite-dev-server"
   # Copy the public key to your dev server's ~/.ssh/authorized_keys
   # Copy the private key content to GitHub secret DEV_SSH_PRIVATE_KEY
   ```

### Step 3: Deploy to Development Server

#### Option A: Automatic Deployment (Recommended)

1. **Push your changes to the `development` branch:**
   ```bash
   git add .
   git commit -m "feat: new feature for testing"
   git push origin development
   ```

2. **GitHub Actions will automatically:**
   - Build Docker images with `:dev` tag
   - Deploy to your development server
   - Run database migrations
   - Perform health checks

#### Option B: Manual Deployment

1. **Copy the setup script to your dev server:**
   ```bash
   scp scripts/setup-dev-server.sh user@your-dev-server-ip:~/
   ```

2. **SSH into your dev server and run:**
   ```bash
   ssh user@your-dev-server-ip
   chmod +x setup-dev-server.sh
   ./setup-dev-server.sh
   ```

3. **Update the repository URL in the script first:**
   ```bash
   # Edit the script and change:
   GITHUB_REPO="your-username/whatssuite"
   # to your actual repository
   ```

### Step 4: Configure Environment Variables

1. **Edit the environment file on your dev server:**
   ```bash
   cd /opt/whatssuite-dev
   nano .env
   ```

2. **Update WhatsApp API credentials:**
   ```bash
   WHATSAPP_API_TOKEN=your_actual_token
   WHATSAPP_PHONE_NUMBER_ID=your_actual_phone_id
   WHATSAPP_BUSINESS_ACCOUNT_ID=your_actual_account_id
   ```

3. **Restart services:**
   ```bash
   docker-compose -f docker-compose.dev-server.yml restart
   ```

## 🌐 Access Your Development Environment

Once deployed, your services will be available at:

- **Admin Dashboard**: `http://your-dev-server-ip:3006`
- **Web Client**: `http://your-dev-server-ip:3004`
- **API**: `http://your-dev-server-ip:3005`
- **WhatsApp Service**: `http://your-dev-server-ip:3007`

## 🔄 Development Workflow

### 1. **Local Development**
   - Make changes locally
   - Test with local services
   - Commit and push to `development` branch

### 2. **Automatic Deployment**
   - GitHub Actions builds and deploys to dev server
   - Test changes in live environment
   - Verify functionality with real data

### 3. **Production Deployment**
   - When ready, merge `development` → `main`
   - GitHub Actions deploys to production server
   - Production remains stable and unaffected

## 🛠️ Management Commands

### View Service Status
```bash
cd /opt/whatssuite-dev
docker-compose -f docker-compose.dev-server.yml ps
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.dev-server.yml logs -f

# Specific service
docker-compose -f docker-compose.dev-server.yml logs -f api
```

### Update Services
```bash
cd /opt/whatssuite-dev
git pull origin development
docker-compose -f docker-compose.dev-server.yml up -d --build
```

### Stop Services
```bash
docker-compose -f docker-compose.dev-server.yml down
```

### Restart Services
```bash
docker-compose -f docker-compose.dev-server.yml restart
```

## 🔍 Troubleshooting

### Common Issues

1. **Services not starting:**
   ```bash
   docker-compose -f docker-compose.dev-server.yml logs
   # Check for error messages
   ```

2. **Database connection issues:**
   ```bash
   docker-compose -f docker-compose.dev-server.yml exec postgres psql -U whatssuite_dev -d whatssuite_dev
   ```

3. **Redis connection issues:**
   ```bash
   docker-compose -f docker-compose.dev-server.yml exec redis redis-cli ping
   ```

4. **Port conflicts:**
   ```bash
   # Check what's using the ports
   sudo netstat -tlnp | grep :300
   ```

### Health Checks

```bash
# API Health
curl http://your-dev-server-ip:3001/health

# Admin Dashboard
curl http://your-dev-server-ip:3002

# Web Client
curl http://your-dev-server-ip:3000
```

## 📊 Monitoring

### Resource Usage
```bash
# Docker resource usage
docker stats

# System resource usage
htop
df -h
free -h
```

### Log Rotation
```bash
# Set up log rotation for Docker
sudo nano /etc/docker/daemon.json
# Add:
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
sudo systemctl restart docker
```

## 🔐 Security Considerations

1. **Firewall Configuration:**
   ```bash
   # Only expose necessary ports
   sudo ufw allow 22    # SSH
   sudo ufw allow 3000  # Web
   sudo ufw allow 3001  # API
   sudo ufw allow 3002  # Admin
   sudo ufw allow 3003  # WhatsApp Service
   sudo ufw enable
   ```

2. **Environment Variables:**
   - Never commit real API keys to Git
   - Use strong passwords for development
   - Rotate secrets regularly

3. **Access Control:**
   - Limit SSH access to trusted IPs
   - Use key-based authentication
   - Regular security updates

## 🎯 Next Steps

1. **Set up your development server**
2. **Configure GitHub secrets**
3. **Push to development branch**
4. **Test your live development environment**
5. **Iterate and improve**

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose -f docker-compose.dev-server.yml logs`
2. Verify environment variables
3. Check network connectivity
4. Review this guide for common solutions

---

**Happy Developing! 🚀**

Your development environment is now ready for live testing while keeping production safe and stable.
