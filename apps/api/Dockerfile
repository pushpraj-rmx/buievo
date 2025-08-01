# Base image for installing dependencies
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# Install pnpm
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
# --- CORRECTED LINE BELOW ---
COPY packages/wapp-client/package.json ./packages/wapp-client/

# Install ALL dependencies for the entire workspace
RUN pnpm install --frozen-lockfile
# ---

# Builder image for compiling TypeScript
FROM base AS builder
COPY . .
COPY --from=installer /usr/src/app/node_modules ./node_modules
# RUN pnpm --filter @whatssuite/api build
RUN pnpm build --filter @whatssuite/api...
# ---

# Final production image
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy built app and dependencies
COPY --from=builder /usr/src/app/apps/api/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Expose the port
EXPOSE 3001

# Run the app
CMD ["node", "dist/src/index.js"]
