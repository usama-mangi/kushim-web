#!/bin/bash
# Neo4j Index Creation Script
# Run this against your Neo4j database to create tenant isolation indices

NEO4J_URI=${NEO4J_URI:-"bolt://localhost:7687"}
NEO4J_USERNAME=${NEO4J_USERNAME:-"neo4j"}
NEO4J_PASSWORD=${NEO4J_PASSWORD}

if [ -z "$NEO4J_PASSWORD" ]; then
  echo "Error: NEO4J_PASSWORD environment variable is required"
  exit 1
fi

echo "Creating tenant isolation indices in Neo4j..."

# Create index on Artifact.userId for tenant isolation
cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" \
  "CREATE INDEX artifact_user_id IF NOT EXISTS FOR (a:Artifact) ON (a.userId);"

echo "✓ Created index on Artifact.userId"

# Create index on ContextGroup.userId for tenant isolation
cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" \
  "CREATE INDEX context_group_user_id IF NOT EXISTS FOR (g:ContextGroup) ON (g.userId);"

echo "✓ Created index on ContextGroup.userId"

# Create composite index on Artifact(userId, timestamp) for better query performance
cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" \
  "CREATE INDEX artifact_user_timestamp IF NOT EXISTS FOR (a:Artifact) ON (a.userId, a.timestamp);"

echo "✓ Created composite index on Artifact(userId, timestamp)"

echo ""
echo "All indices created successfully!"
echo "Verify indices with: SHOW INDEXES"
