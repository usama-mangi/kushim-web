#!/bin/bash

# ==============================================
# Production Database Migration Script
# ==============================================
# This script handles database migrations for production environments
# with backup and rollback capabilities

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_database_url() {
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL environment variable is not set"
        exit 1
    fi
    log_info "Database URL is configured"
}

create_backup() {
    log_info "Creating database backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Extract connection details from DATABASE_URL
    # Format: postgresql://user:password@host:port/database
    if command -v pg_dump &> /dev/null; then
        pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
        log_info "Backup created: $BACKUP_FILE"
    else
        log_warn "pg_dump not found. Skipping backup."
        log_warn "Install PostgreSQL client tools for backup support."
    fi
}

run_migrations() {
    log_info "Running Prisma migrations..."
    
    cd apps/backend
    
    # Generate Prisma Client
    log_info "Generating Prisma Client..."
    npx prisma generate
    
    # Run migrations
    log_info "Deploying migrations..."
    npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        log_info "Migrations completed successfully"
    else
        log_error "Migration failed"
        exit 1
    fi
    
    cd ../..
}

seed_database() {
    log_info "Seeding database with initial data..."
    
    cd apps/backend
    
    # Check if seed script exists
    if [ -f "prisma/seed.ts" ]; then
        npm run seed
        log_info "Database seeded successfully"
    else
        log_warn "Seed file not found. Skipping seeding."
    fi
    
    cd ../..
}

verify_migration() {
    log_info "Verifying migration..."
    
    cd apps/backend
    
    # Check migration status
    npx prisma migrate status
    
    cd ../..
}

rollback() {
    log_error "Rolling back changes..."
    
    if [ -f "$BACKUP_FILE" ]; then
        log_info "Restoring from backup: $BACKUP_FILE"
        
        if command -v psql &> /dev/null; then
            # Drop all tables and restore
            psql "$DATABASE_URL" < "$BACKUP_FILE"
            log_info "Rollback completed"
        else
            log_error "psql not found. Cannot restore backup automatically."
            log_error "Restore manually using: psql \$DATABASE_URL < $BACKUP_FILE"
        fi
    else
        log_error "No backup file found. Manual intervention required."
    fi
}

# Main execution
main() {
    log_info "Starting production database migration..."
    log_info "Timestamp: $TIMESTAMP"
    
    # Check prerequisites
    check_database_url
    
    # Ask for confirmation
    read -p "This will run migrations on the production database. Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warn "Migration cancelled"
        exit 0
    fi
    
    # Create backup
    create_backup
    
    # Run migrations
    if run_migrations; then
        log_info "Migration successful!"
        
        # Ask if we should seed
        read -p "Would you like to seed the database with initial data? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            seed_database
        fi
        
        # Verify migration
        verify_migration
        
        log_info "All done! 🚀"
    else
        log_error "Migration failed!"
        
        # Ask if we should rollback
        read -p "Would you like to rollback? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback
        fi
        
        exit 1
    fi
}

# Run main function
main "$@"
