# Stage 1: Builder
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install turbo globally
RUN npm install -g turbo

# Prune the workspace to only include consumer-app and its dependencies
COPY . .
RUN turbo prune @app/consumer-app --docker

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
RUN cd apps/consumer-app && bun install && npx expo export -p web

# Stage 3: Runner
FROM nginx:alpine-slim AS runner

# Copy nginx config
COPY apps/consumer-app/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
# Expo export output directory is usually 'dist' for web
COPY --from=installer /app/apps/consumer-app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
