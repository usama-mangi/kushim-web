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

## License

UNLICENSED - Private project
