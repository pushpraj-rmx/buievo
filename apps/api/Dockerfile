# 1. Base image with Node.js and pnpm
FROM node:20-alpine AS base
WORKDIR /usr/src/app
RUN npm install -g pnpm

# ---

# 2. Installer stage: Install ALL dependencies
FROM base AS installer
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/wapp-service/package.json ./apps/wapp-service/
COPY packages/db/package.json ./packages/db/
COPY packages/redis/package.json ./packages/redis/
COPY packages/wapp-client/package.json ./packages/wapp-client/
# Install all dependencies, including devDependencies needed for the build
RUN pnpm install --frozen-lockfile --prod=false

# ---

# 3. Builder stage: Compile TypeScript to JavaScript
FROM base AS builder
WORKDIR /usr/src/app
COPY . .
COPY --from=installer /usr/src/app/node_modules ./node_modules
# Build the 'api' app and all of its internal dependencies
RUN pnpm build --filter @whatssuite/api...

# ---

# 4. Runner stage: Final production image
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy compiled code from the builder stage
COPY --from=builder /usr/src/app/apps/api/dist ./dist

# Copy dependencies from the installer stage
COPY --from=installer /usr/src/app/node_modules ./node_modules

# Remove devDependencies to keep the image lean
RUN pnpm prune --prod

# Expose the port for the API
EXPOSE 3001

# Run the app
CMD ["node", "dist/src/index.js"]