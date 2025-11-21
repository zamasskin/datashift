# Multi-stage Dockerfile for production

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copy source
COPY . .

# Build TypeScript and any configured assets
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app

# Set production env
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3333

# Create non-root user for security
RUN adduser -D -u 10001 appuser

# Copy only build output and necessary runtime files
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/resources ./resources
COPY --from=build /app/config ./config
COPY --from=build /app/start ./start
COPY --from=build /app/ace.js ./ace.js

# Expose application port
EXPOSE 3333

USER appuser

# Use compiled server entrypoint
CMD ["node", "build/bin/server.js"]