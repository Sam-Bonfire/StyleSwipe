# Stage 1: Builder
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install turbo globally
RUN bun add -g turbo

# Prune the workspace to only include consumer-app and its dependencies
COPY . .
RUN turbo prune @app/consumer-app --docker

# Stage 2: Installer & Builder
FROM oven/bun:1-alpine AS installer
WORKDIR /app

# Add dependencies
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/bun.lock ./bun.lock
COPY --from=builder /app/tsconfig.base.json ./tsconfig.base.json
RUN bun install

# Copy source code and global assets
COPY --from=builder /app/out/full/ .
COPY --from=builder /app/assets ./assets

# Build the project
# We use 'bun run build' which should trigger 'expo export -p web'
# Root bun install already handled dependencies, sub-folder install can break links.
RUN cd apps/consumer-app && bunx expo export -p web

# Stage 3: Runner
FROM nginx:alpine-slim AS runner

# Copy nginx config
COPY apps/consumer-app/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
# Expo export output directory is usually 'dist' for web
COPY --from=installer /app/apps/consumer-app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
