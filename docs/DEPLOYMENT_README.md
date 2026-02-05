# Deployment Overview

This directory contains all deployment configurations and documentation for the Kushim platform.

## Quick Links

- **[Full Deployment Guide](./DEPLOYMENT.md)** - Complete step-by-step deployment to Vercel + Render
- **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Quick checklist for production deployment
- **[Docker Deployment](./DOCKER_DEPLOYMENT.md)** - Self-hosted Docker deployment guide
- **[GitHub Actions Setup](./GITHUB_ACTIONS_SETUP.md)** - CI/CD pipeline configuration

## Deployment Options

### Option 1: Managed Services (Recommended)

**Best for:** Most production deployments, startups, small-to-medium teams

**Stack:**
- Frontend: Vercel
- Backend: Render Web Service
- Database: Render PostgreSQL
- Redis: Render Redis
- Storage: AWS S3 or Cloudflare R2

**Pros:**
- ✅ Zero infrastructure management
- ✅ Auto-scaling built-in
- ✅ SSL certificates automatic
- ✅ Simple deployment (git push)
- ✅ Built-in monitoring

**Cons:**
- ❌ Higher cost at scale
- ❌ Less control over infrastructure

**Cost Estimate:**
- Vercel: Free (Hobby) or $20/month (Pro)
- Render Backend: $7/month (Starter)
- Render PostgreSQL: $7/month (Starter)
- Render Redis: $10/month (Starter)
- **Total: ~$24-44/month**

**Setup Time:** ~2 hours

📖 **Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

### Option 2: Self-Hosted Docker

**Best for:** Enterprise deployments, custom infrastructure, cost optimization at scale

**Stack:**
- Docker Compose
- PostgreSQL container
- Redis container
- Backend container (NestJS)
- Frontend container (Next.js)
- Nginx reverse proxy

**Pros:**
- ✅ Full control over infrastructure
- ✅ Lower cost at scale
- ✅ Can run on any VPS/cloud
- ✅ Easy local development parity

**Cons:**
- ❌ Manual infrastructure management
- ❌ Need to handle SSL, backups, scaling
- ❌ Higher DevOps overhead

**Cost Estimate:**
- DigitalOcean Droplet (4GB): $24/month
- Or AWS t3.medium: ~$30/month
- **Total: ~$24-30/month**

**Setup Time:** ~4 hours

📖 **Guide:** [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

---

### Option 3: Kubernetes (Advanced)

**Best for:** Large-scale enterprise, high availability requirements

**Stack:**
- Kubernetes cluster (GKE/EKS/AKS)
- Helm charts
- Managed PostgreSQL
- Redis cluster
- Load balancer

**Pros:**
- ✅ Highly scalable
- ✅ Built-in high availability
- ✅ Advanced deployment strategies
- ✅ Multi-region support

**Cons:**
- ❌ Complex setup and management
- ❌ Higher cost
- ❌ Requires Kubernetes expertise

**Cost Estimate:** $200+/month

**Setup Time:** 1-2 days

📖 **Guide:** Coming soon

---

## File Structure

```
kushim-web/
├── vercel.json                      # Vercel configuration
├── render.yaml                      # Render Blueprint
├── docker-compose.production.yml    # Production Docker setup
├── nginx.conf                       # Nginx reverse proxy config
├── .env.production.template         # Backend env vars template
├── .env.local.template             # Frontend env vars template
├── scripts/
│   └── migrate-production.sh       # Database migration script
├── .github/
│   └── workflows/
│       └── ci-cd.yml               # GitHub Actions CI/CD
├── apps/
│   ├── backend/
│   │   ├── Dockerfile              # Backend container image
│   │   └── .dockerignore
│   └── web/
│       ├── Dockerfile              # Frontend container image
│       └── .dockerignore
└── docs/
    ├── DEPLOYMENT.md               # Full deployment guide
    ├── DEPLOYMENT_CHECKLIST.md     # Quick checklist
    ├── DOCKER_DEPLOYMENT.md        # Docker deployment guide
    └── GITHUB_ACTIONS_SETUP.md     # CI/CD setup
```

## Quick Start Guides

### Deploy to Vercel + Render (Fastest)

```bash
# 1. Setup environment
cp .env.production.template apps/backend/.env
cp .env.local.template apps/web/.env.local

# 2. Fill in values
nano apps/backend/.env

# 3. Push to GitHub
git add .
git commit -m "Add deployment configs"
git push origin main

# 4. Deploy backend to Render
# - Go to render.com
# - Create Blueprint from render.yaml
# - Add secrets

# 5. Deploy frontend to Vercel
# - Go to vercel.com
# - Import repository
# - Auto-deploys on push

# Done! ✅
```

### Deploy with Docker

```bash
# 1. Setup environment
cp .env.production.template .env.production
nano .env.production

# 2. Build and run
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# 3. Run migrations
docker-compose -f docker-compose.production.yml exec backend \
  sh -c "cd apps/backend && npx prisma migrate deploy"

# Done! ✅
```

## Environment Variables

### Backend (Required)

```bash
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# JWT
JWT_SECRET=<64-char-secret>
JWT_REFRESH_SECRET=<64-char-secret>

# AWS/Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PASSWORD=...
```

### Frontend (Required)

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME=Kushim
```

Full list: See `.env.production.template`

## Health Checks

All deployment options include health check endpoints:

```bash
# Basic health
curl https://api.yourdomain.com/health

# Database connectivity
curl https://api.yourdomain.com/health/db

# Redis connectivity
curl https://api.yourdomain.com/health/redis

# Readiness probe (all dependencies)
curl https://api.yourdomain.com/health/ready
```

## CI/CD Pipeline

Automated testing and deployment using GitHub Actions:

1. **On Pull Request:** Run tests + E2E tests
2. **On Push to main:** Deploy to production
3. **Security scanning:** Trivy + npm audit

Setup: [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)

## Database Migrations

### Production Migration Script

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run migration with backup
./scripts/migrate-production.sh
```

### Manual Migration

```bash
cd apps/backend
npx prisma migrate deploy
npm run seed  # Optional
```

## Monitoring

### Vercel
- Built-in analytics
- Real User Monitoring
- Error tracking

### Render
- CPU/Memory metrics
- Response time tracking
- Log streaming

### External (Optional)
- **Sentry:** Error tracking
- **Datadog:** APM
- **New Relic:** Full stack monitoring

## Backup Strategy

### Database Backups

**Render (Automatic):**
- Daily backups (Starter plan+)
- 7-day retention
- Point-in-time recovery

**Docker (Manual):**
```bash
# Create backup
docker-compose exec postgres pg_dump -U kushim kushim > backup.sql

# Restore
cat backup.sql | docker-compose exec -T postgres psql -U kushim
```

### Code Backups
- Git repository (GitHub)
- Tag releases: `git tag v1.0.0`

## Troubleshooting

### Common Issues

**1. Backend won't start**
- Check logs: `render logs <service-id>`
- Verify DATABASE_URL is correct
- Ensure migrations ran successfully

**2. Frontend API errors**
- Check CORS configuration
- Verify NEXT_PUBLIC_API_URL
- Check network tab in browser

**3. Database connection failed**
- Verify PostgreSQL is running
- Check connection string format
- Test with `psql $DATABASE_URL`

**4. SSL/TLS errors**
- Verify DNS records
- Wait 24-48h for propagation
- Check certificate validity

Full troubleshooting: [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting)

## Security Checklist

- [ ] All secrets in environment variables
- [ ] SSL/TLS enabled on all domains
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Database uses SSL
- [ ] Regular dependency updates
- [ ] Automated backups enabled

## Support

**Documentation Issues:**
- File an issue on GitHub
- Check existing documentation

**Deployment Help:**
- Render: support@render.com
- Vercel: support@vercel.com

**Community:**
- Render Discord
- Vercel Discord

## Next Steps

After deployment:

1. ✅ Verify all health checks pass
2. ✅ Configure custom domains
3. ✅ Set up monitoring alerts
4. ✅ Document runbooks
5. ✅ Test backup restoration
6. 🚀 Launch!

---

**Choose your deployment path and get started!**

- New to deployment? → [DEPLOYMENT.md](./DEPLOYMENT.md)
- Need a checklist? → [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- Self-hosting? → [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)
- Setting up CI/CD? → [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)
