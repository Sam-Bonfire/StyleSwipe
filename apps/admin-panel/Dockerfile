# Stage 1: Builder
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install turbo globally
RUN npm install -g turbo

# Prune the workspace to only include admin-panel and its dependencies
COPY . .
RUN turbo prune @app/admin-panel --docker

# Stage 2: Installer & Builder
FROM oven/bun:1-alpine AS installer
WORKDIR /app

# Add dependencies
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/bun.lockb ./bun.lockb
RUN bun install --frozen-lockfile

# Copy source code
COPY --from=builder /app/out/full/ .

# Build the project
# We use 'bun run build' which should trigger 'expo export -p web'
RUN cd apps/admin-panel && bun install && npx expo export -p web

# Stage 3: Runner
FROM nginx:alpine-slim AS runner

# Copy nginx config
COPY apps/admin-panel/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
# Expo export output directory is usually 'dist' for web
COPY --from=installer /app/apps/admin-panel/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
