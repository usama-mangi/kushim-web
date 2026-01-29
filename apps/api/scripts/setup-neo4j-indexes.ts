#!/usr/bin/env ts-node

/**
 * Neo4j Index Setup Script
 * 
 * This script creates indexes on Neo4j nodes to ensure tenant isolation
 * and improve query performance.
 * 
 * Run with: ts-node scripts/setup-neo4j-indexes.ts
 */

import 'dotenv/config';
import neo4j, { Driver, Session } from 'neo4j-driver';

async function setupIndexes() {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const username = process.env.NEO4J_USERNAME || 'neo4j';
  const password = process.env.NEO4J_PASSWORD;

  if (!password) {
    console.error('NEO4J_PASSWORD environment variable is required');
    process.exit(1);
  }

  const driver: Driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  let session: Session | null = null;

  try {
    session = driver.session();

    console.log('🔧 Setting up Neo4j indexes for tenant isolation...\n');

    // 1. Create index on Artifact.userId (critical for tenant isolation)
    console.log('Creating index on Artifact.userId...');
    await session.run(`
      CREATE INDEX artifact_user_id IF NOT EXISTS
      FOR (a:Artifact)
      ON (a.userId)
    `);
    console.log('✅ Index created: artifact_user_id\n');

    // 2. Create index on Artifact.id (for faster lookups)
    console.log('Creating index on Artifact.id...');
    await session.run(`
      CREATE INDEX artifact_id IF NOT EXISTS
      FOR (a:Artifact)
      ON (a.id)
    `);
    console.log('✅ Index created: artifact_id\n');

    // 3. Create index on Artifact.externalId
    console.log('Creating index on Artifact.externalId...');
    await session.run(`
      CREATE INDEX artifact_external_id IF NOT EXISTS
      FOR (a:Artifact)
      ON (a.externalId)
    `);
    console.log('✅ Index created: artifact_external_id\n');

    // 4. Create index on ContextGroup.userId (critical for tenant isolation)
    console.log('Creating index on ContextGroup.userId...');
    await session.run(`
      CREATE INDEX context_group_user_id IF NOT EXISTS
      FOR (g:ContextGroup)
      ON (g.userId)
    `);
    console.log('✅ Index created: context_group_user_id\n');

    // 5. Create index on ContextGroup.id (for faster lookups)
    console.log('Creating index on ContextGroup.id...');
    await session.run(`
      CREATE INDEX context_group_id IF NOT EXISTS
      FOR (g:ContextGroup)
      ON (g.id)
    `);
    console.log('✅ Index created: context_group_id\n');

    // 6. Create composite index for Artifact (userId + timestamp) - common query pattern
    console.log('Creating composite index on Artifact(userId, timestamp)...');
    await session.run(`
      CREATE INDEX artifact_user_timestamp IF NOT EXISTS
      FOR (a:Artifact)
      ON (a.userId, a.timestamp)
    `);
    console.log('✅ Index created: artifact_user_timestamp\n');

    console.log('🎉 All indexes created successfully!\n');

    // List all indexes
    console.log('📋 Current indexes:');
    const indexResult = await session.run('SHOW INDEXES');
    indexResult.records.forEach((record) => {
      const indexName = record.get('name');
      const labelsOrTypes = record.get('labelsOrTypes');
      const properties = record.get('properties');
      console.log(`  - ${indexName}: ${labelsOrTypes} (${properties.join(', ')})`);
    });

  } catch (error) {
    console.error('❌ Error setting up indexes:', error);
    process.exit(1);
  } finally {
    if (session) await session.close();
    await driver.close();
  }
}

// Run the setup
setupIndexes()
  .then(() => {
    console.log('\n✅ Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
