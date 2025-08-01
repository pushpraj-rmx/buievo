# Base image
FROM node:20-alpine AS base
WORKDIR /usr/src/app
RUN npm install -g pnpm

# ---
# Installer image for dependencies
FROM base AS installer
# Copy all package manifests and workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/wapp-service/package.json ./apps/wapp-service/
COPY packages/db/package.json ./packages/db/
COPY packages/redis/package.json ./packages/redis/
COPY packages-wapp-client/package.json ./packages/wapp-client/

# Install ALL dependencies for the entire workspace
RUN pnpm install --frozen-lockfile
# ---
    
# Builder
FROM base AS builder
COPY . .
COPY --from=installer /usr/src/app/node_modules ./node_modules
# RUN pnpm --filter @whatssuite/wapp-service build
RUN pnpm build --filter @whatssuite/wapp-service...

# ---

# Runner
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY --from=builder /usr/src/app/apps/wapp-service/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

CMD ["node", "dist/src/index.js"]
