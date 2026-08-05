# Stage 1: Pruner
FROM oven/bun:1-slim AS pruner
WORKDIR /app
RUN bun add -g turbo
COPY . .
RUN turbo prune @app/scraper-service --docker

# Stage 2: Builder
FROM oven/bun:1-slim AS builder
WORKDIR /app

# Add dependencies
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock
COPY --from=pruner /app/tsconfig.json ./tsconfig.json
COPY --from=pruner /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=pruner /app/bin ./bin
RUN bun install

# Copy source code
COPY --from=pruner /app/out/full/ .

# Stage 2.5: Production Dependencies
FROM oven/bun:1-slim AS prod-deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/bin ./bin
RUN rm -f bun.lock package-lock.json && bun install --production

# Stage 3: Runner
FROM oven/bun:1-slim AS runner
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*

# Copy only production dependencies and source code
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/scraper-service ./apps/scraper-service
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/tsconfig.base.json ./

# REMOVED: Playwright install steps
# RUN bun x playwright install-deps chromium

ENV NODE_ENV=production
ENV SCRAPER_API_PORT=3001

EXPOSE 3001

# Default entrypoint
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["bun", "run", "apps/scraper-service/src/index.ts", "--daemon"]
