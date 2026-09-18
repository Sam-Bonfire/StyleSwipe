# Stage 1: Pruner
FROM node:20-slim AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune @app/scraper-service --docker

# Stage 2: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Add dependencies (patches/ required: pnpm-lock references patchedDependencies hashes)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/patches ./patches
COPY --from=pruner /app/tsconfig.json ./tsconfig.json
COPY --from=pruner /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=pruner /app/bin ./bin
RUN corepack enable pnpm && pnpm install

# Copy source code
COPY --from=pruner /app/out/full/ .

# Stage 2.5: Production Dependencies
FROM node:20-slim AS prod-deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/bin ./bin
# The pruned scraper tree contains neither patched package
# (onnxruntime-react-native, expo-modules-core), so drop patch entries
# that would otherwise fail the install with ERR_PNPM_PATCH_NOT_APPLIED.
RUN rm -f pnpm-lock.yaml package-lock.json && node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));if(p.pnpm)delete p.pnpm.patchedDependencies;fs.writeFileSync('package.json',JSON.stringify(p,null,2))" && corepack enable pnpm && pnpm install --production

# Stage 3: Runner
FROM node:20-slim AS runner
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
# RUN pnpm dlx playwright install-deps chromium

ENV NODE_ENV=production
ENV SCRAPER_API_PORT=3001

EXPOSE 3001

# Default entrypoint
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["npx", "tsx", "apps/scraper-service/src/index.ts", "--daemon"]
