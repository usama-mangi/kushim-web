# Multi-stage build for NestJS backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace package files
COPY apps/backend/package*.json ./apps/backend/
COPY packages ./packages

# Install dependencies
RUN npm ci --workspace=apps/backend

# Copy backend source
COPY apps/backend ./apps/backend

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY turbo.json ./
COPY apps/backend/package*.json ./apps/backend/

RUN npm ci --workspace=apps/backend --omit=dev

# Copy Prisma schema and migrations
COPY apps/backend/prisma ./apps/backend/prisma

# Generate Prisma Client in production
WORKDIR /app/apps/backend
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/apps/backend/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main"]
