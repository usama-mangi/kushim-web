# Kushim - Compliance Automation Platform

A modern compliance automation platform built with NestJS and Next.js.

## Project Structure

This is a monorepo containing:

- `apps/backend/` - NestJS backend API
- `apps/web/` - Next.js frontend
- `packages/` - Shared code (types, utilities, configs)

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Docker and Docker Compose (for local development)

### Installation

```bash
# Install dependencies
npm install

# Start development environment with Docker
docker-compose up

# Or run services individually:

# Start PostgreSQL and Redis
docker-compose up postgres redis

# Run backend
npm run backend:dev

# Run frontend
npm run web:dev
```

### Database Setup

```bash
# Generate Prisma client
cd apps/backend
npm run prisma:generate

# Run migrations
npm run migrate

# Seed database
npm run seed
```

## Development

```bash
# Run all apps in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Build all apps
npm run build
```

## Phase 1 MVP Features

- ✅ Monorepo setup with Turborepo
- 🚧 Core integrations (AWS, GitHub, Okta, Jira, Slack)
- 🚧 Real-time compliance monitoring
- 🚧 Evidence collection with immutability
- 🚧 SOC 2 framework implementation
- 🚧 Dashboard UI

## Deployment

Complete production deployment configurations are available for:

- **Vercel + Render** (Recommended) - Managed services with auto-scaling
- **Docker** - Self-hosted deployment on any VPS/cloud
- **Kubernetes** - Enterprise-grade orchestration (coming soon)

### Quick Deploy

```bash
# Option 1: Vercel + Render (Recommended)
# See docs/DEPLOYMENT.md for full guide

# Option 2: Docker
cp .env.production.template .env.production
docker-compose -f docker-compose.production.yml up -d
```

### Deployment Documentation

- **[Main Deployment Guide](./docs/DEPLOYMENT.md)** - Complete step-by-step guide
- **[Quick Checklist](./docs/DEPLOYMENT_CHECKLIST.md)** - Fast deployment checklist
- **[Docker Deployment](./docs/DOCKER_DEPLOYMENT.md)** - Self-hosted guide
- **[GitHub Actions Setup](./docs/GITHUB_ACTIONS_SETUP.md)** - CI/CD configuration
- **[Deployment Overview](./docs/DEPLOYMENT_README.md)** - Options comparison

### Health Checks

Production deployments include comprehensive health check endpoints:

```bash
GET /health           # Basic service health
GET /health/db        # Database connectivity
GET /health/redis     # Redis connectivity
GET /health/ready     # Readiness probe
```

## License

UNLICENSED - Private project
