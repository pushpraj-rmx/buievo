# 1. Builder Stage: Install, build, and prune all in one place
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
RUN npm install -g pnpm

COPY . .
RUN pnpm install --frozen-lockfile --prod=false
RUN pnpm build --filter @whatssuite/api...
RUN pnpm prune --prod

# ---

# 2. Runner Stage: Final production image
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy the pruned node_modules and all the built code from the builder stage
COPY --from=builder /usr/src/app .

EXPOSE 3001
# Run the app using its full path from the WORKDIR
CMD ["node", "apps/api/dist/index.js"]