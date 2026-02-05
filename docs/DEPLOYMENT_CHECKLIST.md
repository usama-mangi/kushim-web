# Production Deployment Checklist

Quick checklist for deploying Kushim to production.

## Pre-Deployment

### 1. Environment Configuration
- [ ] Copy `.env.production.template` to `apps/backend/.env`
- [ ] Copy `.env.local.template` to `apps/web/.env.local`
- [ ] Generate JWT secrets: `openssl rand -base64 64`
- [ ] Configure all required environment variables
- [ ] Set up AWS S3 bucket OR Cloudflare R2

### 2. OAuth Applications
- [ ] Create GitHub OAuth App
- [ ] Create Okta OAuth App
- [ ] Create Slack OAuth App  
- [ ] Create Jira OAuth App
- [ ] Save all client IDs and secrets

### 3. Email Configuration
- [ ] Sign up for SendGrid (or alternative SMTP)
- [ ] Verify sender email domain
- [ ] Get API key/credentials

---

## Render Setup

### Database
- [ ] Create PostgreSQL database
  - Name: `kushim-postgres`
  - Region: Oregon (or preferred)
  - Plan: Starter or higher
- [ ] Copy connection string
- [ ] Enable automated backups

### Redis
- [ ] Create Redis instance
  - Name: `kushim-redis`
  - Region: Same as database
  - Plan: Starter or higher
- [ ] Copy connection details

### Backend Service
- [ ] Push `render.yaml` to GitHub
- [ ] Create Blueprint from repo
- [ ] Configure all secret environment variables:
  - [ ] `JWT_SECRET`
  - [ ] `JWT_REFRESH_SECRET`
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `AWS_S3_BUCKET`
  - [ ] `SMTP_PASSWORD`
  - [ ] All OAuth client IDs/secrets
- [ ] Wait for initial deployment
- [ ] Note the service URL

### Database Migration
- [ ] Open Render Shell
- [ ] Run: `cd apps/backend && npx prisma migrate deploy`
- [ ] Run: `npm run seed` (optional)
- [ ] Verify migration: `npx prisma migrate status`

---

## Vercel Setup

### Frontend Deployment
- [ ] Import GitHub repository
- [ ] Configure build settings:
  - Root: `apps/web`
  - Build: `cd apps/web && npm run build`
  - Output: `apps/web/.next`
- [ ] Add environment variables:
  - [ ] `NEXT_PUBLIC_API_URL` (Render backend URL)
  - [ ] `NEXT_PUBLIC_APP_NAME`
  - [ ] `NEXT_PUBLIC_APP_URL`
- [ ] Deploy
- [ ] Note the Vercel URL

### Update Backend
- [ ] Add `FRONTEND_URL` to Render (Vercel URL)
- [ ] Redeploy backend service

---

## Post-Deployment

### Health Checks
- [ ] Test `/health` endpoint
- [ ] Test `/health/db` endpoint
- [ ] Test `/health/redis` endpoint
- [ ] Test `/health/ready` endpoint

### Frontend Testing
- [ ] Visit Vercel URL
- [ ] Test login functionality
- [ ] Check API connectivity
- [ ] Verify no console errors

### OAuth Callbacks
- [ ] Update GitHub OAuth callback URL
- [ ] Update Okta redirect URIs
- [ ] Update Slack redirect URL
- [ ] Update Jira callback URL

---

## Custom Domains (Optional)

### Vercel Domain
- [ ] Add custom domain in Vercel
- [ ] Configure DNS CNAME record
- [ ] Wait for SSL provisioning
- [ ] Update `NEXT_PUBLIC_APP_URL`

### Render Domain
- [ ] Add custom domain in Render
- [ ] Configure DNS CNAME record
- [ ] Wait for SSL provisioning
- [ ] Update `APP_URL` in backend env

### Update All URLs
- [ ] Update all OAuth callback URLs
- [ ] Update email templates
- [ ] Update `FRONTEND_URL` in backend
- [ ] Redeploy both services

---

## Monitoring & Alerts

- [ ] Enable Vercel Analytics
- [ ] Configure Render alerts:
  - [ ] High error rate
  - [ ] Memory usage >80%
  - [ ] CPU usage >80%
- [ ] Set up Sentry (optional)
- [ ] Configure log retention

---

## Security Review

- [ ] All secrets in environment variables (not code)
- [ ] SSL/TLS enabled on all domains
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Database uses SSL
- [ ] Redis requires authentication

---

## Documentation

- [ ] Document production URLs
- [ ] Create runbook for common issues
- [ ] Document rollback procedure
- [ ] Share credentials with team (use password manager)

---

## Launch

- [ ] Final smoke test
- [ ] Announce to team
- [ ] Monitor for 24-48 hours
- [ ] Celebrate! 🎉

---

## Emergency Contacts

| Role | Contact | 
|------|---------|
| DevOps Lead | |
| Backend Lead | |
| Frontend Lead | |
| Render Support | support@render.com |
| Vercel Support | support@vercel.com |

---

## Quick Commands

```bash
# View backend logs
render logs kushim-backend

# Run database migration
./scripts/migrate-production.sh

# Create database backup
pg_dump $DATABASE_URL > backup.sql

# Test health endpoint
curl https://your-backend.onrender.com/health

# Deploy frontend
git push origin main  # Auto-deploys via Vercel

# Deploy backend
git push origin main  # Auto-deploys via Render
```

---

**Full documentation:** See [docs/DEPLOYMENT.md](./DEPLOYMENT.md)
