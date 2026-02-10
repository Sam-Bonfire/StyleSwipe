# Stage 1: Pruner
FROM oven/bun:1-alpine AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune @app/scraper-service --docker

# Stage 2: Builder
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Add dependencies
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lockb ./bun.lockb
RUN bun install --frozen-lockfile

# Copy source code
COPY --from=pruner /app/out/full/ .

# Build/Prepare
# For Bun apps, we might not strictly need a build step if running ts directly, 
# but we can check types or just prepare the environment.
# If we were bundling, we would run 'bun build'.
# Here we just prepare the runner stage.

# Stage 3: Runner
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Install system dependencies for Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dumb-init

ENV NODE_ENV=production
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV SCRAPER_API_PORT=3001

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/scraper-service ./apps/scraper-service
COPY --from=builder /app/convex ./convex
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["bun", "run", "apps/scraper-service/src/index.ts", "--daemon"]
