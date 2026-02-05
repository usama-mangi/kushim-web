# Docker Production Deployment

Alternative deployment guide using Docker Compose for self-hosted environments.

## Overview

This setup deploys the entire Kushim stack using Docker:

- **PostgreSQL** - Database
- **Redis** - Cache and job queue
- **Backend** - NestJS API (port 3001)
- **Frontend** - Next.js app (port 3000)
- **Nginx** - Reverse proxy with SSL (optional)

## Prerequisites

- Docker 24.0+
- Docker Compose 2.0+
- At least 4GB RAM
- 20GB disk space
- Domain name (for SSL)

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository>
cd kushim-web
```

### 2. Configure Environment

```bash
# Create production environment file
cp .env.production.template .env.production

# Edit with your values
nano .env.production
```

**Required variables:**
```bash
# Database
POSTGRES_PASSWORD=<strong-password>
POSTGRES_USER=kushim
POSTGRES_DB=kushim

# Redis
REDIS_PASSWORD=<strong-password>

# JWT
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-refresh-secret>

# Application URLs
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# AWS/Email/Integrations
# ... (see template)
```

### 3. Build Images

```bash
# Build both frontend and backend
docker-compose -f docker-compose.production.yml build
```

### 4. Run Migrations

```bash
# Start database first
docker-compose -f docker-compose.production.yml up -d postgres redis

# Wait for database to be ready
sleep 10

# Run migrations
docker-compose -f docker-compose.production.yml run --rm backend sh -c "cd apps/backend && npx prisma migrate deploy"

# Seed database (optional)
docker-compose -f docker-compose.production.yml run --rm backend sh -c "cd apps/backend && npm run seed"
```

### 5. Start Services

```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Check status
docker-compose -f docker-compose.production.yml ps
```

### 6. Verify Deployment

```bash
# Check backend health
curl http://localhost:3001/health

# Check frontend
curl http://localhost:3000

# Check all services
docker-compose -f docker-compose.production.yml ps
```

## SSL/TLS Configuration

### Option 1: Let's Encrypt (Recommended)

Install Certbot:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d api.yourdomain.com -d app.yourdomain.com
```

Copy certificates:

```bash
# Create SSL directory
mkdir -p ssl

# Copy certificates (adjust paths)
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
sudo chmod 644 ssl/*.pem
```

### Option 2: Self-Signed (Development)

```bash
# Generate self-signed certificate
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem \
  -out ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

### Start with Nginx

```bash
# Start with nginx profile
docker-compose -f docker-compose.production.yml --profile with-nginx up -d
```

## Management Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.production.yml logs --tail=100
```

### Restart Services

```bash
# Restart all
docker-compose -f docker-compose.production.yml restart

# Restart specific service
docker-compose -f docker-compose.production.yml restart backend
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose -f docker-compose.production.yml build

# Stop services
docker-compose -f docker-compose.production.yml down

# Run migrations
docker-compose -f docker-compose.production.yml run --rm backend sh -c "cd apps/backend && npx prisma migrate deploy"

# Start services
docker-compose -f docker-compose.production.yml up -d
```

### Database Backup

```bash
# Create backup directory
mkdir -p backups

# Backup database
docker-compose -f docker-compose.production.yml exec postgres \
  pg_dump -U kushim kushim > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# List backups
ls -lh backups/
```

### Restore Database

```bash
# Stop backend
docker-compose -f docker-compose.production.yml stop backend

# Restore backup
cat backups/backup_YYYYMMDD_HHMMSS.sql | \
  docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U kushim kushim

# Start backend
docker-compose -f docker-compose.production.yml start backend
```

## Monitoring

### Resource Usage

```bash
# View container stats
docker stats

# View specific container
docker stats kushim-backend-prod
```

### Health Checks

```bash
# Backend health
curl http://localhost:3001/health
curl http://localhost:3001/health/db
curl http://localhost:3001/health/redis
curl http://localhost:3001/health/ready

# Frontend health
curl http://localhost:3000
```

### Database Monitoring

```bash
# Connect to database
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U kushim

# Check connections
SELECT count(*) FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size('kushim'));
```

### Redis Monitoring

```bash
# Connect to Redis
docker-compose -f docker-compose.production.yml exec redis redis-cli

# Check info
INFO

# Monitor commands
MONITOR

# Check queue
KEYS *
```

## Scaling

### Increase Resources

Edit `docker-compose.production.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Multiple Backend Instances

```bash
# Scale backend to 3 instances
docker-compose -f docker-compose.production.yml up -d --scale backend=3

# Use nginx for load balancing
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.production.yml logs backend

# Check if port is in use
sudo lsof -i :3001

# Remove and recreate
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

### Database Connection Issues

```bash
# Verify database is running
docker-compose -f docker-compose.production.yml ps postgres

# Check logs
docker-compose -f docker-compose.production.yml logs postgres

# Test connection
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U kushim -d kushim -c "SELECT 1"
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker-compose -f docker-compose.production.yml ps redis

# Test connection
docker-compose -f docker-compose.production.yml exec redis redis-cli ping
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove stopped containers
docker container prune
```

## Security Hardening

### 1. Firewall Rules

```bash
# Ubuntu/Debian with UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH only
sudo ufw enable
```

### 2. Limit PostgreSQL Access

In `docker-compose.production.yml`, remove port mapping:

```yaml
postgres:
  # ports:  # Remove this line
  #   - "5432:5432"
```

### 3. Limit Redis Access

```yaml
redis:
  # ports:  # Remove this line
  #   - "6379:6379"
```

### 4. Use Docker Secrets

```bash
# Create secrets
echo "super_secret_password" | docker secret create db_password -

# Use in compose file
secrets:
  db_password:
    external: true
```

## Cleanup

### Stop Services

```bash
docker-compose -f docker-compose.production.yml down
```

### Remove Everything

```bash
# Stop and remove containers, networks
docker-compose -f docker-compose.production.yml down

# Remove volumes (CAUTION: deletes data)
docker-compose -f docker-compose.production.yml down -v

# Remove images
docker-compose -f docker-compose.production.yml down --rmi all
```

## Production Checklist

- [ ] Set strong passwords for PostgreSQL and Redis
- [ ] Configure SSL/TLS certificates
- [ ] Set up automated backups
- [ ] Configure firewall rules
- [ ] Set up monitoring alerts
- [ ] Document recovery procedures
- [ ] Test backup restoration
- [ ] Configure log rotation
- [ ] Set resource limits
- [ ] Enable automatic security updates

## Support

For issues specific to Docker deployment, check:
- Container logs
- Docker daemon logs: `journalctl -u docker`
- System resources: `docker stats`

For application issues, see main [DEPLOYMENT.md](./DEPLOYMENT.md).
