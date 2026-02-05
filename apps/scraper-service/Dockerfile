# Stage 1: Build
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copy package manifests first for layer caching
COPY package.json bun.lockb ./
COPY packages/core/package.json ./packages/core/
COPY packages/infrastructure/package.json ./packages/infrastructure/
COPY apps/scraper-service/package.json ./apps/scraper-service/

# Install all dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/core ./packages/core
COPY packages/infrastructure ./packages/infrastructure
COPY apps/scraper-service ./apps/scraper-service
COPY convex ./convex
COPY tsconfig.json ./

# Stage 2: Production
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Install Chromium and dependencies for Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dumb-init

# Copy built artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/scraper-service ./apps/scraper-service
COPY --from=builder /app/convex ./convex
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./

# Set environment
ENV NODE_ENV=production
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV SCRAPER_API_PORT=3001

# Expose API port
EXPOSE 3001

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Default: daemon mode
CMD ["bun", "run", "apps/scraper-service/src/index.ts", "--daemon"]
