# 1. Builder Stage: Build the entire monorepo once
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
RUN npm install -g pnpm

# Copy only files needed for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# --- FIX IS HERE ---
# Correct Order: Copy all source code BEFORE installing dependencies
COPY . .

# Now, pnpm install can see all the package.json files and will install prisma correctly
RUN pnpm install --frozen-lockfile --prod=false
# --- END FIX ---

# Generate Prisma client
RUN ["pnpm", "--filter", "@whatssuite/db", "exec", "prisma", "generate"]

# Build all apps and packages in the monorepo
RUN pnpm build

# Remove development-only dependencies
RUN pnpm prune --prod

# ---

# 2. API Production Stage
FROM node:20-alpine AS api
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy only the pruned production node_modules and necessary built packages
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/apps/api ./apps/api
COPY --from=builder /usr/src/app/packages ./packages

# Run the app
CMD ["node", "apps/api/dist/index.js"]

# ---

# 3. Wapp-Service Production Stage
FROM node:20-alpine AS wapp-service
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy only the pruned production node_modules and necessary built packages
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/apps/wapp-service ./apps/wapp-service
COPY --from=builder /usr/src/app/packages ./packages

# Run the app
CMD ["node", "apps/wapp-service/dist/index.js"]
