# Kushim - Compliance Automation Platform

A Turborepo monorepo with NestJS backend and Next.js frontend for automating SOC 2 compliance.

## Architecture

### Monorepo Structure

- **apps/backend/** - NestJS API with Prisma ORM
- **apps/web/** - Next.js 15+ App Router frontend with Radix UI
- **packages/** - Shared code (types, utils, configs)

### Backend Architecture

- **NestJS modules** organized by domain:
  - `auth/` - JWT authentication, user management
  - `integrations/` - Third-party service connectors (AWS, GitHub, Okta, Jira, Slack)
  - `compliance/` - Compliance checks and monitoring
  - `evidence/` - Evidence collection with immutability
  - `shared/` - Common utilities and base classes

- **Data layer**: Prisma with PostgreSQL
- **Background jobs**: BullMQ with Redis for async compliance checks
- **Key models**: Customer (multi-tenant), User, Integration, ComplianceCheck, Evidence, JiraTask

### Frontend Architecture

- **Next.js App Router** (app directory)
- **Components**: shadcn/ui (Radix UI primitives)
- **State**: Zustand for global state
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS

## Build, Test, and Lint

### Running Everything

```bash
# Development (all workspaces)
npm run dev

# Build all apps
npm run build

# Test all apps
npm test

# Lint all apps
npm run lint
```

### Backend-Specific

```bash
# Development
npm run backend:dev

# Run single test file
cd apps/backend && npm test -- <file-pattern>

# Run tests in watch mode
cd apps/backend && npm run test:watch

# E2E tests
cd apps/backend && npm run test:e2e

# Database operations
npm run db:migrate          # Run migrations
npm run db:seed            # Seed database
cd apps/backend && npm run prisma:generate  # Generate Prisma client
cd apps/backend && npm run prisma:studio    # Open Prisma Studio
```

### Frontend-Specific

```bash
# Development
npm run web:dev

# Build
cd apps/web && npm run build

# Lint
cd apps/web && npm run lint
```

## Key Conventions

### Database Schema Changes

1. Edit `apps/backend/prisma/schema.prisma`
2. Run `npm run db:migrate` to create and apply migration
3. Prisma Client auto-regenerates - no manual `prisma:generate` needed after migrate

### Integration Pattern

All integrations follow a consistent structure in `apps/backend/src/integrations/<service>/`:
- `<service>.service.ts` - Core integration logic
- `<service>.controller.ts` - REST endpoints (if needed)
- Each service extends base patterns for error handling and rate limiting

OAuth integrations use the centralized `oauth/` module for callback handling.

### Environment Variables

- Root `.env` is NOT used - each app has its own
- Backend: `apps/backend/.env` (see `.env.example` for all required vars)
- Frontend: `apps/web/.env.local`
- Docker Compose handles env vars for containerized services

### Turborepo Pipeline

- `build` depends on `^build` (builds dependencies first)
- `dev` runs persistently with caching disabled
- `test` depends on `build` and outputs coverage
- All commands respect workspace dependencies

### Component Development

- UI components in `apps/web/components/ui/` use shadcn/ui conventions
- Feature components in `apps/web/components/<feature>/`
- Prefer server components by default; mark with `'use client'` only when needed
- Use `cn()` utility (clsx + tailwind-merge) for conditional class names

### Multi-tenancy

- All customer-scoped data must include `customerId` field
- Use Prisma relation filters to ensure tenant isolation
- Backend services receive `customerId` from JWT claims

## Development Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose for local dev

### Quick Start

```bash
# Install dependencies
npm install

# Start infrastructure (PostgreSQL + Redis)
docker-compose up postgres redis -d

# Setup database
cd apps/backend
npm run prisma:generate
npm run migrate
npm run seed

# Start development
npm run dev  # Runs both backend and web
```

### Running with Docker

```bash
# Everything in containers
docker-compose up

# Backend runs on http://localhost:3001
# Frontend runs on http://localhost:3000
```

## Important Notes

- All integrations require API tokens/credentials in `.env` (see `.env.example`)
- BullMQ queues handle async compliance checks - ensure Redis is running
- Evidence collection creates immutable records - never delete/modify Evidence entries
- Jira integration auto-creates tickets for failed compliance controls
- Phase 1 MVP focuses on SOC 2 framework (see `docs/PHASE_1.md`)
