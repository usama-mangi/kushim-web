# Multi-stage build for Next.js frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace package files
COPY apps/web/package*.json ./apps/web/
COPY packages ./packages

# Install dependencies
RUN npm ci --workspace=apps/web

# Copy web source
COPY apps/web ./apps/web

# Build application
WORKDIR /app/apps/web
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies
COPY package*.json ./
COPY turbo.json ./
COPY apps/web/package*.json ./apps/web/

RUN npm ci --workspace=apps/web --omit=dev

# Copy built application
WORKDIR /app/apps/web
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/next.config.ts ./next.config.ts

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "start"]
