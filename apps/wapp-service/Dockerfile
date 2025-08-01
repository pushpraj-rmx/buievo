# 1. Builder Stage: Install, build, and prune all in one place
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
RUN npm install -g pnpm

COPY . .
RUN pnpm install --frozen-lockfile --prod=false
# Generate the Prisma client based on your schema
RUN pnpm --filter @whatssuite/db exec prisma generate

# Build the 'wapp-service' app and all of its internal dependencies
RUN pnpm build --filter @whatssuite/wapp-service...
RUN pnpm prune --prod

# ---

# 2. Runner Stage: Final production image
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy the pruned node_modules and all the built code from the builder stage
COPY --from=builder /usr/src/app .

# Run the app using its full path from the WORKDIR
CMD ["node", "apps/wapp-service/dist/index.js"]