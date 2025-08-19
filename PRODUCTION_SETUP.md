# Production Setup Guide

This guide explains the differences between local development and production environments, and how to align them.

## 🔍 **Current Environment Differences**

### **Local Development** (`docker-compose.dev.yml`)

- ✅ Hot reloading enabled
- ✅ Source code mounted
- ✅ Health checks
- ✅ Hardcoded database credentials
- ✅ All ports exposed for debugging

### **Production** (`docker-compose.yml`)

- ✅ Optimized builds
- ✅ Environment variables
- ✅ No volume mounts (security)
- ✅ Health checks (now added)
- ✅ Service dependencies with conditions

## 🎯 **Key Differences Summary**

| Feature                  | Local           | Production      | Status          |
| ------------------------ | --------------- | --------------- | --------------- |
| **Hot Reloading**        | ✅ Yes          | ❌ No           | ✅ **Intended** |
| **Volume Mounts**        | ✅ Yes          | ❌ No           | ✅ **Intended** |
| **Health Checks**        | ✅ Yes          | ✅ Yes          | ✅ **Aligned**  |
| **Environment Vars**     | ❌ Hardcoded    | ✅ Variables    | ✅ **Aligned**  |
| **Service Dependencies** | ✅ Health-based | ✅ Health-based | ✅ **Aligned**  |
| **Build Process**        | Dev build       | Prod build      | ✅ **Intended** |

## 🚀 **Production Deployment**

### 1. **Environment Variables**

Create `.env.production` with:

```bash
# Database
POSTGRES_USER=whatssuite_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=whatssuite

# API
PORT=3001
NODE_ENV=production

# Database URL
DATABASE_URL=postgresql://whatssuite_user:your_secure_password@postgres:5432/whatssuite?schema=public

# Redis
REDIS_URL=redis://redis:6379

# WhatsApp Business API
PHONE_NUMBER_ID=your_phone_number_id
ACCESS_TOKEN=your_access_token
WABA_ID=your_business_account_id
WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
META_API_VERSION=v21.0

# Next.js Public URLs
NEXT_PUBLIC_API_URL=http://your-domain.com:3001
```

### 2. **Deploy Commands**

```bash
# Build and start production
docker-compose up -d --build

# Run migrations
docker-compose exec api pnpm --filter @whatssuite/db exec prisma migrate deploy

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. **Production Scripts**

Add to `package.json`:

```json
{
  "scripts": {
    "prod:up": "docker-compose up -d --build",
    "prod:down": "docker-compose down",
    "prod:logs": "docker-compose logs -f",
    "prod:migrate": "docker-compose exec api pnpm --filter @whatssuite/db exec prisma migrate deploy",
    "prod:restart": "docker-compose restart"
  }
}
```

## 🔧 **Making Environments More Identical**

### **Option 1: Production with Development Features** (Not Recommended)

- Add volume mounts for debugging
- Enable hot reloading
- Expose database ports

### **Option 2: Development with Production Features** (Recommended)

- Use environment variables in development
- Add health checks (✅ Done)
- Use service dependencies (✅ Done)

### **Option 3: Hybrid Approach** (Current)

- Keep development features for local work
- Keep production optimizations for deployment
- Share common configurations

## 📊 **Current Alignment Status**

### ✅ **Aligned Features**

- **Health Checks**: Both environments have health checks
- **Service Dependencies**: Both use health-based dependencies
- **Database**: Both use PostgreSQL 15-alpine
- **Redis**: Both use Redis 7-alpine
- **Ports**: Both expose application ports correctly

### 🔄 **Intended Differences**

- **Hot Reloading**: Local only (development feature)
- **Volume Mounts**: Local only (development feature)
- **Build Process**: Different for dev vs prod
- **Environment Variables**: Local hardcoded, prod external

### 🎯 **Recommendation**

The current setup is **appropriately different** for each environment:

- **Local**: Optimized for development (hot reloading, debugging)
- **Production**: Optimized for performance and security

## 🔒 **Security Considerations**

### **Production Security**

- ✅ No source code mounted
- ✅ Environment variables for secrets
- ✅ No development ports exposed
- ✅ Optimized builds

### **Local Security**

- ⚠️ Database credentials in compose file
- ⚠️ All ports exposed
- ✅ Isolated containers

## 📝 **Next Steps**

1. **Create production environment file**
2. **Add production scripts to package.json**
3. **Document deployment process**
4. **Set up CI/CD pipeline**
5. **Configure monitoring and logging**

## 🎉 **Conclusion**

The environments are **appropriately different** for their purposes:

- **Local**: Development-friendly with debugging features
- **Production**: Secure and optimized for deployment

The key is maintaining **functional parity** while keeping **operational differences** that serve each environment's needs.
