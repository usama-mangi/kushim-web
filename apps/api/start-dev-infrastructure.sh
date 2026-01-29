#!/bin/bash

# Development Infrastructure Startup Script
# Starts all required services for local development

set -e

echo "🚀 Starting Kushim Development Infrastructure"
echo "=============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start services
echo "📦 Starting services with Docker Compose..."
cd "$(dirname "$0")"
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check service health
echo ""
echo "🔍 Checking service status..."

check_service() {
    local service=$1
    local port=$2
    local protocol=${3:-http}
    
    if docker-compose -f docker-compose.dev.yml ps | grep -q "$service.*Up"; then
        echo "  ✅ $service is running (port $port)"
    else
        echo "  ❌ $service failed to start"
        return 1
    fi
}

check_service "kushim-postgres" "5432" "tcp"
check_service "kushim-neo4j" "7687" "tcp"
check_service "kushim-redis" "6379" "tcp"
check_service "kushim-jaeger" "16686" "http"

echo ""
echo "=============================================="
echo "✅ All services started successfully!"
echo ""
echo "Service URLs:"
echo "  📊 Jaeger UI:     http://localhost:16686"
echo "  🔵 Neo4j Browser: http://localhost:7474"
echo "  🔴 Redis:         localhost:6379"
echo "  🐘 PostgreSQL:    localhost:5432"
echo ""
echo "Default Credentials:"
echo "  Neo4j:      neo4j / kushim_dev_password"
echo "  PostgreSQL: kushim / kushim_dev_password"
echo ""
echo "Next steps:"
echo "  1. Update your .env file with these connection strings"
echo "  2. Run: npm run start:dev"
echo "  3. View traces at http://localhost:16686"
echo ""
echo "To stop all services:"
echo "  docker-compose -f docker-compose.dev.yml down"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.dev.yml logs -f [service-name]"
