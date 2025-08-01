# 1. Builder Stage: Install, build, and prune all in one place
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
RUN npm install -g pnpm

# Copy all source code
COPY . .

# Install ALL dependencies, including devDependencies for the build
RUN pnpm install --frozen-lockfile --prod=false

# Build the 'api' app and all of its internal dependencies
RUN pnpm build --filter @whatssuite/api...

# Remove devDependencies, leaving only a clean production node_modules
RUN pnpm prune --prod

# ---

# 2. Runner Stage: Final production image
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy the pruned node_modules and all the built code from the builder stage
COPY --from=builder /usr/src/app .

# Set the final working directory to the app we want to run
WORKDIR /usr/src/app/apps/api

EXPOSE 3001
CMD ["node", "dist/src/index.js"]