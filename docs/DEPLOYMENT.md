# Deployment Guide

Complete guide for deploying the Kushim platform to production using Vercel (frontend) and Render (backend).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Backend Deployment (Render)](#backend-deployment-render)
6. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
7. [Post-Deployment](#post-deployment)
8. [Custom Domains](#custom-domains)
9. [Monitoring & Logging](#monitoring--logging)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- GitHub account with repository access
- [Vercel account](https://vercel.com/signup) (free tier available)
- [Render account](https://render.com/signup) (free tier available)
- AWS account (for S3) OR Cloudflare account (for R2)
- API credentials for integrations (Okta, GitHub, Slack, Jira)

## Architecture Overview

```
┌─────────────┐
│   Vercel    │  ← Next.js Frontend
│  (Frontend) │     Port: 3000
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Render    │  ← NestJS Backend
│  (Backend)  │     Port: 3001
└──────┬──────┘
       │
       ├──────► PostgreSQL (Render Managed)
       │
       ├──────► Redis (Render Managed)
       │
       └──────► S3/R2 (Object Storage)
```

### Services

| Service | Platform | Purpose |
|---------|----------|---------|
| Frontend | Vercel | Next.js App Router UI |
| Backend API | Render Web Service | NestJS REST API |
| Database | Render PostgreSQL | Primary data store |
| Cache/Queue | Render Redis | BullMQ job queue |
| Storage | AWS S3 or Cloudflare R2 | Evidence files |

---

## Environment Setup

### 1. Generate Secrets

Generate secure secrets for JWT and other sensitive data:

```bash
# JWT Secret (64 characters)
openssl rand -base64 64

# JWT Refresh Secret (64 characters)
openssl rand -base64 64
```

### 2. Prepare Environment Variables

Copy the templates and fill in values:

```bash
# Backend environment
cp .env.production.template apps/backend/.env

# Frontend environment
cp .env.local.template apps/web/.env.local
```

Edit the files with your actual values (see templates for all required variables).

---

## Database Setup

### Render PostgreSQL

1. **Create Database**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "PostgreSQL"
   - Configuration:
     - Name: `kushim-postgres`
     - Database: `kushim`
     - User: `kushim`
     - Region: `Oregon` (or closest to your users)
     - Plan: `Starter` ($7/month) or `Free` (expires after 90 days)
   - Click "Create Database"

2. **Get Connection String**
   - Once created, copy the "External Database URL"
   - Format: `postgresql://user:password@host:port/database`
   - Save this for the backend environment variables

3. **Configure Backups** (Starter plan and above)
   - Enable automated daily backups
   - Set retention to 7 days minimum

---

## Backend Deployment (Render)

### Step 1: Create Redis Instance

1. Go to Render Dashboard → "New +" → "Redis"
2. Configuration:
   - Name: `kushim-redis`
   - Region: `Oregon` (same as database)
   - Plan: `Starter` ($10/month) or `Free` (25MB, no persistence)
   - Maxmemory Policy: `allkeys-lru`
3. Click "Create Redis"
4. Save the connection details

### Step 2: Deploy Backend Service

#### Option A: Using render.yaml (Recommended)

1. **Push Configuration to GitHub**
   ```bash
   git add render.yaml
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Create Blueprint**
   - Go to Render Dashboard
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml`
   - Click "Apply"

3. **Configure Secrets**
   
   Go to the created web service → "Environment" and add these secrets:
   
   ```bash
   # Required Secrets
   JWT_SECRET=<generated-secret>
   JWT_REFRESH_SECRET=<generated-refresh-secret>
   AWS_ACCESS_KEY_ID=<your-aws-key>
   AWS_SECRET_ACCESS_KEY=<your-aws-secret>
   AWS_S3_BUCKET=kushim-evidence-production
   SMTP_PASSWORD=<sendgrid-api-key>
   SMTP_FROM=noreply@yourdomain.com
   
   # Integration Secrets
   OKTA_CLIENT_ID=<okta-client-id>
   OKTA_CLIENT_SECRET=<okta-client-secret>
   OKTA_DOMAIN=<your-domain>.okta.com
   GITHUB_CLIENT_ID=<github-client-id>
   GITHUB_CLIENT_SECRET=<github-client-secret>
   SLACK_CLIENT_ID=<slack-client-id>
   SLACK_CLIENT_SECRET=<slack-client-secret>
   JIRA_CLIENT_ID=<jira-client-id>
   JIRA_CLIENT_SECRET=<jira-client-secret>
   ```

4. **Update Frontend URL**
   
   After getting your Render URL (e.g., `https://kushim-backend.onrender.com`), add:
   
   ```bash
   FRONTEND_URL=https://your-app.vercel.app
   ```

#### Option B: Manual Setup

1. **Create Web Service**
   - Dashboard → "New +" → "Web Service"
   - Connect GitHub repository
   - Configuration:
     - Name: `kushim-backend`
     - Runtime: `Node`
     - Region: `Oregon`
     - Branch: `main`
     - Root Directory: (leave empty)
     - Build Command: `cd apps/backend && npm install && npm run build`
     - Start Command: `cd apps/backend && npm run start:prod`
     - Plan: `Starter` ($7/month)

2. **Add Environment Variables**
   - Link PostgreSQL database (auto-adds `DATABASE_URL`)
   - Link Redis (auto-adds `REDIS_URL`)
   - Add all other variables from template

3. **Configure Health Check**
   - Path: `/health`
   - Initial delay: 60 seconds

### Step 3: Run Database Migrations

**After first deployment:**

1. Open the Render Shell (Web Service → "Shell" tab)

2. Run migrations:
   ```bash
   cd apps/backend
   npx prisma migrate deploy
   ```

3. Seed database (optional):
   ```bash
   npm run seed
   ```

**For future migrations:**

Use the migration script locally:

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run migration script
./scripts/migrate-production.sh
```

---

## Frontend Deployment (Vercel)

### Step 1: Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### Step 2: Configure Build Settings

Vercel should auto-detect these, but verify:

- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `cd apps/web && npm run build`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `npm install`

### Step 3: Environment Variables

Add in Vercel project settings → "Environment Variables":

```bash
# Production
NEXT_PUBLIC_API_URL=https://kushim-backend.onrender.com
NEXT_PUBLIC_APP_NAME=Kushim
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

Set for: **Production**, **Preview**, and **Development**

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Vercel will provide a URL: `https://your-project.vercel.app`

### Step 5: Update Backend FRONTEND_URL

Go back to Render backend environment variables and update:

```bash
FRONTEND_URL=https://your-project.vercel.app
```

---

## Post-Deployment

### 1. Verify Health Checks

Test all health endpoints:

```bash
# Basic health
curl https://kushim-backend.onrender.com/health

# Database connectivity
curl https://kushim-backend.onrender.com/health/db

# Redis connectivity
curl https://kushim-backend.onrender.com/health/redis

# Readiness probe
curl https://kushim-backend.onrender.com/health/ready
```

All should return `200 OK` with `{"status": "ok"}`.

### 2. Test Frontend

1. Visit your Vercel URL
2. Try logging in (seed creates admin user)
3. Check console for API errors

### 3. Configure OAuth Callbacks

Update OAuth applications with production URLs:

**GitHub OAuth**
- Homepage URL: `https://your-app.vercel.app`
- Callback URL: `https://kushim-backend.onrender.com/api/integrations/github/callback`

**Okta OAuth**
- Sign-in redirect URI: `https://kushim-backend.onrender.com/api/integrations/okta/callback`
- Sign-out redirect URI: `https://your-app.vercel.app`

**Slack OAuth**
- Redirect URL: `https://kushim-backend.onrender.com/api/integrations/slack/callback`

**Jira OAuth**
- Callback URL: `https://kushim-backend.onrender.com/api/integrations/jira/callback`

---

## Custom Domains

### Vercel Custom Domain

1. Go to Vercel Project → "Settings" → "Domains"
2. Add your domain: `app.kushim.com`
3. Add DNS records (Vercel will show you):
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```
4. Wait for DNS propagation (~5-60 minutes)
5. Vercel auto-provisions SSL certificate

### Render Custom Domain

1. Go to Render Web Service → "Settings" → "Custom Domains"
2. Add your domain: `api.kushim.com`
3. Add DNS records:
   ```
   Type: CNAME
   Name: api
   Value: kushim-backend.onrender.com
   ```
4. Render auto-provisions SSL certificate

### Update Environment Variables

After custom domains are set:

**Backend (Render):**
```bash
APP_URL=https://api.kushim.com
FRONTEND_URL=https://app.kushim.com
```

**Frontend (Vercel):**
```bash
NEXT_PUBLIC_API_URL=https://api.kushim.com
NEXT_PUBLIC_APP_URL=https://app.kushim.com
```

**OAuth Callbacks:**
Update all OAuth apps with new URLs.

---

## Monitoring & Logging

### Render Monitoring

**Built-in Metrics:**
- Dashboard shows CPU, Memory, Response Time
- Logs: Web Service → "Logs" tab
- Set up alerts for:
  - High error rate
  - Memory usage >80%
  - Response time >1s

**Log Streaming:**
```bash
# Install Render CLI
npm install -g @render/cli

# Stream logs
render logs <service-id>
```

### Vercel Analytics

1. Enable in Project Settings → "Analytics"
2. Free tier includes:
   - Web Vitals
   - Real User Monitoring
   - Error tracking

### External Monitoring (Optional)

**Sentry (Error Tracking):**

1. Create account at [sentry.io](https://sentry.io)
2. Add DSN to backend:
   ```bash
   SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```
3. Install SDK:
   ```bash
   cd apps/backend
   npm install @sentry/node
   ```

**Datadog (APM):**

Add to Render environment:
```bash
DATADOG_API_KEY=<your-key>
```

---

## Troubleshooting

### Backend Won't Start

**Check logs:**
```bash
render logs kushim-backend
```

**Common issues:**

1. **Database connection failed**
   - Verify `DATABASE_URL` is correct
   - Check PostgreSQL service is running
   - Ensure database accepts connections

2. **Redis connection failed**
   - Verify `REDIS_URL` is correct
   - Check Redis service is running

3. **Build failed**
   - Check Node version (should be 20+)
   - Verify all dependencies install correctly
   - Look for TypeScript compilation errors

### Frontend Build Errors

**Check build logs in Vercel:**

1. **"Module not found"**
   - Ensure `npm install` completed
   - Check import paths are correct

2. **"Environment variable not found"**
   - Verify all `NEXT_PUBLIC_*` vars are set
   - Rebuild after adding env vars

3. **API requests fail**
   - Check `NEXT_PUBLIC_API_URL` is correct
   - Verify CORS is enabled on backend
   - Check network tab in browser dev tools

### Database Migration Issues

**Migration failed:**

```bash
# Check migration status
cd apps/backend
npx prisma migrate status

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Deploy migrations
npx prisma migrate deploy
```

**Rollback using backup:**

```bash
# Restore from backup file
psql $DATABASE_URL < backups/backup_YYYYMMDD_HHMMSS.sql
```

### Health Checks Failing

**Database health check fails:**
```bash
# Test connection manually
psql $DATABASE_URL -c "SELECT 1"
```

**Redis health check fails:**
```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping
```

### SSL/TLS Issues

**Certificate not provisioning:**

1. Verify DNS records are correct
2. Wait 24-48 hours for propagation
3. Check domain ownership

**Mixed content errors:**

Ensure all resources use HTTPS:
```javascript
// Bad
const apiUrl = 'http://api.kushim.com'

// Good
const apiUrl = 'https://api.kushim.com'
```

### Performance Issues

**Slow API responses:**

1. Check Render metrics for CPU/Memory
2. Enable database query logging
3. Add indexes to frequently queried fields
4. Consider upgrading Render plan

**High memory usage:**

1. Check for memory leaks
2. Enable heap snapshots
3. Optimize Prisma queries
4. Increase instance size

### Deployment Fails

**Render deployment stuck:**

1. Check build logs for errors
2. Verify GitHub webhook is working
3. Try manual deploy
4. Contact Render support

**Vercel deployment fails:**

1. Check build logs
2. Verify vercel.json is valid
3. Test build locally: `npm run build`
4. Check Vercel status page

---

## Scaling Considerations

### Auto-Scaling (Render)

Current configuration in `render.yaml`:
- Min instances: 2
- Max instances: 10
- Scale triggers: CPU >80%, Memory >80%

**Adjust for your needs:**

```yaml
scaling:
  minInstances: 1  # Reduce costs in low-traffic periods
  maxInstances: 20 # Handle traffic spikes
```

### Database Scaling

**Render PostgreSQL plans:**
- Starter: 1 GB RAM, 10 GB storage
- Standard: 4 GB RAM, 50 GB storage
- Pro: 8 GB RAM, 100 GB storage

**Monitor:**
- Connection count
- Query performance
- Storage usage

### CDN for Assets

Use Vercel's built-in CDN:
- Static assets automatically cached
- Edge network for global performance

---

## Security Checklist

- [ ] All secrets stored in Render/Vercel (not in code)
- [ ] SSL/TLS enabled on all domains
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Database uses SSL connections
- [ ] Redis requires authentication
- [ ] Environment variables not exposed to frontend
- [ ] Security headers configured (via vercel.json)
- [ ] Regular dependency updates
- [ ] Automated backups enabled

---

## Backup Strategy

### Database Backups

**Automated (Render Starter+):**
- Daily backups at 3 AM UTC
- 7-day retention
- Point-in-time recovery

**Manual backup:**
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Code Backups

- GitHub serves as code repository
- Tag releases: `git tag v1.0.0`
- Never force-push to main

---

## Support & Resources

**Documentation:**
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [Next.js Docs](https://nextjs.org/docs)

**Community:**
- Render Discord
- Vercel Discord
- Stack Overflow

**Professional Support:**
- Render: Email support (Starter+)
- Vercel: Email support (Pro+)

---

## Next Steps

1. ✅ Deploy to production
2. ✅ Configure custom domains
3. ✅ Set up monitoring
4. 📊 Configure analytics
5. 🔔 Set up alerts
6. 📧 Configure transactional emails
7. 🧪 Run load tests
8. 📱 Set up status page
9. 📖 Write runbooks for common issues
10. 🚀 Launch!

---

**Need Help?**

Check the troubleshooting section or contact your team's DevOps lead.
