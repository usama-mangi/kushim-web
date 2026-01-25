import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnifiedRecord, Link } from '@prisma/client';
import { RedisService } from '../common/redis.service';
import neo4j from 'neo4j-driver';

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);

  constructor(
    private neo4jService: Neo4jService,
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async syncRecord(record: UnifiedRecord) {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        const cypher = `
          MERGE (a:Artifact {id: $id})
          SET a.title = $title,
              a.externalId = $externalId,
              a.platform = $platform,
              a.type = $type,
              a.url = $url,
              a.timestamp = $timestamp,
              a.userId = $userId,
              a.participants = $participants,
              a.metadata = $metadata,
              a.body = $body
        `;
        
        await this.neo4jService.run(cypher, {
          id: record.id,
          title: record.title,
          externalId: record.externalId,
          platform: record.sourcePlatform,
          type: record.artifactType,
          url: record.url || '',
          timestamp: record.timestamp.toISOString(),
          userId: record.userId,
          participants: record.participants,
          metadata: JSON.stringify(record.metadata),
          body: record.body.substring(0, 1000) // Truncate body for graph performance
        });
        
        this.logger.debug(`Successfully synced record ${record.id} to Neo4j`);
        return; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        
        if (retryCount > maxRetries) {
          this.logger.error(
            `Failed to sync record ${record.id} to Neo4j after ${maxRetries} retries`,
            error,
          );
          
          // Log sync failure for reconciliation
          await this.logSyncFailure('record', record.id, error.message);
          
          throw new Error(`Neo4j sync failed for record ${record.id}: ${error.message}`);
        }
        
        // Exponential backoff
        const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
        this.logger.warn(
          `Neo4j sync failed for record ${record.id} (attempt ${retryCount}/${maxRetries}). Retrying in ${backoffMs}ms...`,
        );
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  async syncLink(link: Link) {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        const cypher = `
          MATCH (s:Artifact {id: $sourceId})
          MATCH (t:Artifact {id: $targetId})
          MERGE (s)-[r:RELATED_TO]->(t)
          SET r.confidence = $confidence,
              r.type = $type,
              r.method = $method
        `;

        await this.neo4jService.run(cypher, {
          sourceId: link.sourceRecordId,
          targetId: link.targetRecordId,
          confidence: link.confidenceScore,
          type: link.relationshipType,
          method: link.discoveryMethod
        });
        
        this.logger.debug(`Successfully synced link ${link.id} to Neo4j`);
        return; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        
        if (retryCount > maxRetries) {
          this.logger.error(
            `Failed to sync link ${link.id} to Neo4j after ${maxRetries} retries`,
            error,
          );
          
          // Log sync failure for reconciliation
          await this.logSyncFailure('link', link.id, error.message);
          
          throw new Error(`Neo4j sync failed for link ${link.id}: ${error.message}`);
        }
        
        // Exponential backoff
        const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
        this.logger.warn(
          `Neo4j sync failed for link ${link.id} (attempt ${retryCount}/${maxRetries}). Retrying in ${backoffMs}ms...`,
        );
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  private async logSyncFailure(entityType: string, entityId: string, error: string) {
    try {
      // Create a sync failure log entry in PostgreSQL for reconciliation
      await this.prisma.activityLog.create({
        data: {
          action: 'NEO4J_SYNC_FAILURE',
          resource: `${entityType}/${entityId}`,
          payload: {
            entityType,
            entityId,
            error,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (logError) {
      this.logger.error(`Failed to log sync failure for ${entityType} ${entityId}`, logError);
    }
  }

  async getContextGroup(recordId: string, userId: string, depth: number = 2) {
    // Try cache first
    const cacheKey = `${recordId}:${depth}`;
    const cached = await this.redisService.getCachedContextGroup(userId, cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for context group: ${cacheKey}`);
      return cached;
    }

    const cypher = `
      MATCH (start:Artifact {id: $id})
      WHERE start.userId = $userId
      CALL apoc.path.subgraphAll(start, {
        maxLevel: $depth,
        relationshipFilter: 'RELATED_TO',
        labelFilter: '+Artifact',
        filterStartNode: true
      })
      YIELD nodes, relationships
      WITH nodes, relationships
      WHERE all(n IN nodes WHERE n.userId = $userId)
      RETURN nodes, relationships
    `;

    const result = await this.neo4jService.run(cypher, { id: recordId, userId, depth });
    const data = result[0];

    // Cache the result
    await this.redisService.cacheContextGroup(userId, cacheKey, data);
    
    return data;
  }

  async createContextGroup(recordAId: string, recordBId: string, userId: string, title: string) {
    const groupId = crypto.randomUUID();
    const cypher = `
      MERGE (g:ContextGroup {id: $groupId})
      SET g.name = $title, 
          g.createdAt = datetime(), 
          g.updatedAt = datetime(),
          g.coherenceScore = 1.0,
          g.topics = [],
          g.status = 'active',
          g.userId = $userId
      WITH g
      MATCH (a:Artifact {id: $recordAId})
      WHERE a.userId = $userId
      MATCH (b:Artifact {id: $recordBId})
      WHERE b.userId = $userId
      MERGE (a)-[:BELONGS_TO {weight: 1.0}]->(g)
      MERGE (b)-[:BELONGS_TO {weight: 1.0}]->(g)
      RETURN g
    `;
    await this.neo4jService.run(cypher, { groupId, title, recordAId, recordBId, userId });
    
    // Calculate initial topics and coherence
    await this.updateGroupMetadata(groupId);
    
    // Invalidate cache for affected records
    await this.redisService.invalidateUserContextGroups(userId);
    
    return groupId;
  }

  async updateGroupMetadata(groupId: string) {
    // Get all artifacts in the group
    const cypher = `
      MATCH (g:ContextGroup {id: $groupId})<-[:BELONGS_TO]-(a:Artifact)
      RETURN a.title as title, a.body as body, a.metadata as metadata
    `;
    const artifacts = await this.neo4jService.run(cypher, { groupId });
    
    if (artifacts.length === 0) return;

    // Extract topics using simple keyword extraction
    const allText = artifacts.map(r => 
      `${r.get('title')} ${r.get('body')}`
    ).join(' ');
    
    const topics = this.extractTopics(allText);
    const coherenceScore = await this.calculateCoherenceScore(groupId);

    // Update group with metadata
    const updateCypher = `
      MATCH (g:ContextGroup {id: $groupId})
      SET g.topics = $topics,
          g.coherenceScore = $coherenceScore,
          g.updatedAt = datetime()
    `;
    await this.neo4jService.run(updateCypher, { groupId, topics, coherenceScore });
  }

  private extractTopics(text: string, maxTopics: number = 5): string[] {
    // Simple keyword extraction: most common meaningful words
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Remove common stopwords
    const stopwords = new Set(['this', 'that', 'with', 'from', 'have', 'been', 'were', 'will', 'would', 'could', 'should']);
    const filtered = words.filter(w => !stopwords.has(w));
    
    // Count frequency
    const frequency: Record<string, number> = {};
    filtered.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Get top N topics
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTopics)
      .map(([word]) => word);
  }

  async calculateCoherenceScore(groupId: string): Promise<number> {
    // Calculate coherence based on link density and temporal proximity
    const cypher = `
      MATCH (g:ContextGroup {id: $groupId})<-[:BELONGS_TO]-(a:Artifact)
      WITH g, collect(a) as artifacts, count(a) as artifactCount
      
      // Count links between artifacts in the group
      UNWIND artifacts as a1
      UNWIND artifacts as a2
      WITH g, artifacts, artifactCount, a1, a2
      WHERE id(a1) < id(a2)
      OPTIONAL MATCH (a1)-[r:RELATED_TO]-(a2)
      
      WITH g, artifactCount, 
           count(r) as linkCount,
           artifactCount * (artifactCount - 1) / 2.0 as maxPossibleLinks,
           artifacts
      
      // Calculate average confidence of existing links
      UNWIND artifacts as a1
      UNWIND artifacts as a2
      WITH g, artifactCount, linkCount, maxPossibleLinks, a1, a2
      WHERE id(a1) < id(a2)
      OPTIONAL MATCH (a1)-[r:RELATED_TO]-(a2)
      
      WITH linkCount, maxPossibleLinks, avg(r.confidence) as avgConfidence
      
      // Coherence = (linkDensity * 0.7) + (avgConfidence * 0.3)
      RETURN 
        CASE 
          WHEN maxPossibleLinks = 0 THEN 1.0
          ELSE (linkCount / maxPossibleLinks) * 0.7 + coalesce(avgConfidence, 0.5) * 0.3
        END as coherenceScore
    `;
    
    const result = await this.neo4jService.run(cypher, { groupId });
    return result.length > 0 ? result[0].get('coherenceScore') : 1.0;
  }

  async addToContextGroup(groupId: string, recordId: string) {
    const cypher = `
      MATCH (g:ContextGroup {id: $groupId})
      MATCH (a:Artifact {id: $recordId})
      MERGE (a)-[:BELONGS_TO {weight: 1.0}]->(g)
      SET g.updatedAt = datetime()
    `;
    await this.neo4jService.run(cypher, { groupId, recordId });
    
    // Update group metadata
    await this.updateGroupMetadata(groupId);
    
    // Check if group needs splitting after adding new member
    await this.checkAndSplitGroup(groupId);
  }

  async mergeContextGroups(targetGroupId: string, sourceGroupId: string, userId: string) {
    // Move all members of source group to target group
    const cypher = `
      MATCH (source:ContextGroup {id: $sourceGroupId})
      WHERE source.userId = $userId
      MATCH (target:ContextGroup {id: $targetGroupId})
      WHERE target.userId = $userId
      MATCH (source)<-[r:BELONGS_TO]-(a:Artifact)
      WHERE a.userId = $userId
      MERGE (a)-[newR:BELONGS_TO]->(target)
      SET newR.weight = coalesce(r.weight, 1.0)
      SET target.updatedAt = datetime()
      DELETE r
      WITH source
      DETACH DELETE source
    `;
    await this.neo4jService.run(cypher, { targetGroupId, sourceGroupId, userId });
    
    // Recalculate metadata for merged group
    await this.updateGroupMetadata(targetGroupId);
    
    // Check if merged group needs splitting
    await this.checkAndSplitGroup(targetGroupId);
  }

  async checkAndSplitGroup(groupId: string): Promise<string[]> {
    const coherenceScore = await this.calculateCoherenceScore(groupId);
    
    // If coherence is below threshold, consider splitting
    const COHERENCE_THRESHOLD = 0.4;
    const MIN_GROUP_SIZE = 5;
    
    if (coherenceScore >= COHERENCE_THRESHOLD) {
      return []; // No split needed
    }
    
    // Get group size
    const sizeCypher = `
      MATCH (g:ContextGroup {id: $groupId})<-[:BELONGS_TO]-(a:Artifact)
      RETURN count(a) as size
    `;
    const sizeResult = await this.neo4jService.run(sizeCypher, { groupId });
    const groupSize = sizeResult[0]?.get('size') || 0;
    
    if (groupSize < MIN_GROUP_SIZE) {
      return []; // Too small to split
    }
    
    this.logger.log(`Group ${groupId} has low coherence (${coherenceScore.toFixed(2)}). Attempting split...`);
    
    // Use community detection to find natural clusters
    return await this.splitGroupByCommunities(groupId);
  }

  private async splitGroupByCommunities(groupId: string): Promise<string[]> {
    // Get all artifacts and their relationships within the group
    const cypher = `
      MATCH (g:ContextGroup {id: $groupId})<-[:BELONGS_TO]-(a:Artifact)
      WITH g, collect(a) as artifacts
      
      // Find weakly connected components within the group
      UNWIND artifacts as a1
      OPTIONAL MATCH path = (a1)-[:RELATED_TO*1..2]-(a2:Artifact)
      WHERE a2 IN artifacts
      
      WITH a1, collect(DISTINCT a2) as connected
      RETURN a1.id as artifactId, connected
    `;
    
    const result = await this.neo4jService.run(cypher, { groupId });
    
    if (result.length < 2) return [];
    
    // Simple clustering: group artifacts by connectivity
    const clusters = this.clusterArtifacts(result);
    
    if (clusters.length < 2) return [];
    
    this.logger.log(`Splitting group ${groupId} into ${clusters.length} communities`);
    
    // Create new groups for each cluster
    const newGroupIds: string[] = [];
    
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      if (cluster.length < 2) continue; // Skip tiny clusters
      
      const newGroupId = crypto.randomUUID();
      const createCypher = `
        CREATE (g:ContextGroup {
          id: $newGroupId,
          name: $name,
          createdAt: datetime(),
          updatedAt: datetime(),
          coherenceScore: 1.0,
          topics: [],
          status: 'active'
        })
      `;
      
      await this.neo4jService.run(createCypher, {
        newGroupId,
        name: `Split Group ${i + 1}`
      });
      
      // Move artifacts to new group
      for (const artifactId of cluster) {
        const moveCypher = `
          MATCH (a:Artifact {id: $artifactId})
          MATCH (oldG:ContextGroup {id: $oldGroupId})
          MATCH (newG:ContextGroup {id: $newGroupId})
          
          OPTIONAL MATCH (a)-[oldRel:BELONGS_TO]->(oldG)
          DELETE oldRel
          
          MERGE (a)-[:BELONGS_TO {weight: 1.0}]->(newG)
        `;
        
        await this.neo4jService.run(moveCypher, {
          artifactId,
          oldGroupId: groupId,
          newGroupId
        });
      }
      
      // Update metadata for new group
      await this.updateGroupMetadata(newGroupId);
      newGroupIds.push(newGroupId);
    }
    
    // Delete old group if empty
    const deleteEmptyCypher = `
      MATCH (g:ContextGroup {id: $groupId})
      WHERE NOT EXISTS { MATCH (g)<-[:BELONGS_TO]-() }
      DETACH DELETE g
    `;
    await this.neo4jService.run(deleteEmptyCypher, { groupId });
    
    return newGroupIds;
  }

  private clusterArtifacts(connectivityData: any[]): string[][] {
    // Simple greedy clustering based on connectivity
    const visited = new Set<string>();
    const clusters: string[][] = [];
    
    for (const row of connectivityData) {
      const artifactId = row.get('artifactId');
      
      if (visited.has(artifactId)) continue;
      
      const connected = row.get('connected') || [];
      const cluster = [artifactId, ...connected.map((a: any) => a.properties?.id).filter(Boolean)];
      
      // Mark all as visited
      cluster.forEach(id => visited.add(id));
      
      if (cluster.length > 0) {
        clusters.push(cluster);
      }
    }
    
    return clusters;
  }

  async getRecordGroups(recordId: string): Promise<string[]> {
    const cypher = `
      MATCH (a:Artifact {id: $recordId})-[:BELONGS_TO]->(g:ContextGroup)
      RETURN g.id as id
    `;
    const result = await this.neo4jService.run(cypher, { recordId });
    return result.map(r => r.get('id'));
  }

  async deleteContextGroup(groupId: string, userId: string) {
    const cypher = `
      MATCH (g:ContextGroup {id: $groupId})
      WHERE g.userId = $userId
      DETACH DELETE g
    `;
    await this.neo4jService.run(cypher, { groupId, userId });
    this.logger.log(`Deleted context group ${groupId}`);
  }

  async renameContextGroup(groupId: string, newName: string, userId: string) {
    const cypher = `
      MATCH (g:ContextGroup {id: $groupId})
      WHERE g.userId = $userId
      SET g.name = $newName, g.updatedAt = datetime()
      RETURN g
    `;
    await this.neo4jService.run(cypher, { groupId, newName, userId });
    this.logger.log(`Renamed context group ${groupId} to "${newName}"`);
  }

  async removeFromContextGroup(groupId: string, recordId: string, userId: string) {
    const cypher = `
      MATCH (g:ContextGroup {id: $groupId})
      WHERE g.userId = $userId
      MATCH (a:Artifact {id: $recordId})-[r:BELONGS_TO]->(g)
      WHERE a.userId = $userId
      DELETE r
      SET g.updatedAt = datetime()
    `;
    await this.neo4jService.run(cypher, { groupId, recordId, userId });
    
    // Update group metadata after removal
    await this.updateGroupMetadata(groupId);
    
    // Delete group if empty
    const deleteEmptyCypher = `
      MATCH (g:ContextGroup {id: $groupId})
      WHERE g.userId = $userId
      WHERE NOT EXISTS { MATCH (g)<-[:BELONGS_TO]-() }
      DETACH DELETE g
    `;
    await this.neo4jService.run(deleteEmptyCypher, { groupId, userId });
    
    this.logger.log(`Removed artifact ${recordId} from group ${groupId}`);
  }

  async getContextGroups(userId: string) {
    const cypher = `
      MATCH (g:ContextGroup)
      WHERE EXISTS {
        MATCH (a:Artifact)-[:BELONGS_TO]->(g)
        WHERE a.userId = $userId
      }
      OPTIONAL MATCH (a:Artifact)-[r:BELONGS_TO]->(g)
      RETURN g, collect({node: a, rel: r}) as members
      ORDER BY g.updatedAt DESC
    `;
    const result = await this.neo4jService.run(cypher, { userId });
    return result.map(r => {
      const groupProps = r.get('g').properties;
      return {
        id: groupProps.id,
        name: groupProps.name,
        updatedAt: groupProps.updatedAt || groupProps.createdAt,
        coherenceScore: groupProps.coherenceScore || 1.0,
        topics: groupProps.topics || [],
        status: groupProps.status || 'active',
        memberCount: r.get('members').length,
        members: r.get('members').map((m: any) => ({
          weight: m.rel?.properties.weight || 1.0,
          record: {
            id: m.node.properties.id,
            title: m.node.properties.title,
            externalId: m.node.properties.externalId,
            sourcePlatform: m.node.properties.platform,
            artifactType: m.node.properties.type,
            url: m.node.properties.url,
            timestamp: m.node.properties.timestamp,
            participants: m.node.properties.participants || [],
            metadata: m.node.properties.metadata ? JSON.parse(m.node.properties.metadata) : {},
            body: m.node.properties.body || '' 
          }
        }))
      };
    });
  }

  async findLinkingCandidates(recordId: string, userId: string, maxCandidates: number = 100): Promise<any[]> {
    const cypher = `
      MATCH (target:Artifact {id: $recordId})
      MATCH (candidate:Artifact)
      WHERE candidate.userId = $userId
        AND candidate.id <> $recordId
        AND duration.between(datetime(candidate.timestamp), datetime()).days <= 30
        AND NOT EXISTS {
          MATCH (target)-[:RELATED_TO]-(candidate)
        }
      RETURN candidate
      ORDER BY datetime(candidate.timestamp) DESC
      LIMIT $maxCandidates
    `;
    
    const result = await this.neo4jService.run(cypher, { 
      recordId, 
      userId,
      maxCandidates: neo4j.int(maxCandidates) // Convert to Neo4j integer type
    });

    return result.map(r => {
      const props = r.get('candidate').properties;
      return {
        id: props.id,
        externalId: props.externalId,
        sourcePlatform: props.platform,
        artifactType: props.type,
        title: props.title,
        body: props.body || '',
        url: props.url || '',
        author: props.author || 'unknown',
        timestamp: new Date(props.timestamp),
        participants: props.participants || [],
        metadata: props.metadata ? JSON.parse(props.metadata) : {},
        userId: props.userId
      };
    });
  }

  /**
   * Hybrid fetch approach: Get candidate IDs from Neo4j, then hydrate with full records from PostgreSQL
   * This ensures embeddings are available for ML scoring
   */
  async findLinkingCandidateIds(recordId: string, userId: string, maxCandidates: number = 100): Promise<string[]> {
    const cypher = `
      MATCH (target:Artifact {id: $recordId})
      MATCH (candidate:Artifact)
      WHERE candidate.userId = $userId
        AND candidate.id <> $recordId
        AND duration.between(datetime(candidate.timestamp), datetime()).days <= 30
        AND NOT EXISTS {
          MATCH (target)-[:RELATED_TO]-(candidate)
        }
      RETURN candidate.id as id
      ORDER BY datetime(candidate.timestamp) DESC
      LIMIT $maxCandidates
    `;
    
    const result = await this.neo4jService.run(cypher, { 
      recordId, 
      userId,
      maxCandidates: neo4j.int(maxCandidates)
    });

    return result.map(r => r.get('id'));
  }

  /**
   * Hydrate full UnifiedRecord objects from PostgreSQL by IDs
   * Includes embeddings and all other fields needed for ML scoring
   */
  async hydrateRecordsFromIds(ids: string[]): Promise<UnifiedRecord[]> {
    if (ids.length === 0) return [];

    return this.prisma.unifiedRecord.findMany({
      where: {
        id: { in: ids }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
  }

  async calculateGraphSignals(recordAId: string, recordBId: string): Promise<{
    hasIdMatch: boolean;
    hasUrlReference: boolean;
    hasSharedMetadata: boolean;
    sharedMetadataKeys: string[];
  }> {
    const cypher = `
      MATCH (a:Artifact {id: $aId})
      MATCH (b:Artifact {id: $bId})
      WITH a, b,
        (b.externalId IN [word IN split(toLower(a.title + ' ' + a.body), ' ') | word] OR 
         a.externalId IN [word IN split(toLower(b.title + ' ' + b.body), ' ') | word]) as idMatch,
        (b.url <> '' AND (a.body CONTAINS b.url OR a.title CONTAINS b.url) OR
         a.url <> '' AND (b.body CONTAINS a.url OR b.title CONTAINS a.url)) as urlRef
      RETURN 
        idMatch,
        urlRef,
        a.metadata as metaA,
        b.metadata as metaB
    `;

    const result = await this.neo4jService.run(cypher, { 
      aId: recordAId, 
      bId: recordBId 
    });

    if (result.length === 0) {
      return {
        hasIdMatch: false,
        hasUrlReference: false,
        hasSharedMetadata: false,
        sharedMetadataKeys: []
      };
    }

    const row = result[0];
    const metaA = row.get('metaA') ? JSON.parse(row.get('metaA')) : {};
    const metaB = row.get('metaB') ? JSON.parse(row.get('metaB')) : {};
    
    const sharedKeys: string[] = [];
    const keysToCheck = ['branch', 'commit', 'ref', 'ticketId'];
    
    for (const key of keysToCheck) {
      if (metaA[key] && metaA[key] === metaB[key]) {
        sharedKeys.push(key);
      }
    }

    return {
      hasIdMatch: row.get('idMatch') || false,
      hasUrlReference: row.get('urlRef') || false,
      hasSharedMetadata: sharedKeys.length > 0,
      sharedMetadataKeys: sharedKeys
    };
  }

  async deleteArtifact(externalIdOrId: string, userId: string) {
    // Delete artifact and all its relationships (both incoming and outgoing)
    const cypher = `
      MATCH (a:Artifact)
      WHERE (a.id = $identifier OR a.externalId = $identifier)
        AND a.userId = $userId
      DETACH DELETE a
    `;
    
    await this.neo4jService.run(cypher, { identifier: externalIdOrId, userId });
    this.logger.log(`Deleted artifact ${externalIdOrId} from Neo4j`);
  }

  /**
   * Reconciliation job to fix PostgreSQL-Neo4j sync inconsistencies
   * Should be run periodically (e.g., daily) or triggered by monitoring alerts
   */
  async reconcileSyncFailures(limit: number = 100): Promise<number> {
    this.logger.log('Starting Neo4j sync reconciliation...');
    
    // Get failed sync operations from activity logs
    const failures = await this.prisma.activityLog.findMany({
      where: {
        action: 'NEO4J_SYNC_FAILURE',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    if (failures.length === 0) {
      this.logger.log('No sync failures found to reconcile');
      return 0;
    }

    this.logger.log(`Found ${failures.length} sync failures to reconcile`);
    let reconciledCount = 0;

    for (const failure of failures) {
      const payload = failure.payload as any;
      const entityType = payload.entityType;
      const entityId = payload.entityId;

      try {
        if (entityType === 'record') {
          // Re-sync the record
          const record = await this.prisma.unifiedRecord.findUnique({
            where: { id: entityId },
          });

          if (record) {
            await this.syncRecord(record);
            reconciledCount++;
            this.logger.log(`Reconciled record ${entityId}`);
          } else {
            this.logger.warn(`Record ${entityId} not found in PostgreSQL, skipping`);
          }
        } else if (entityType === 'link') {
          // Re-sync the link
          const link = await this.prisma.link.findUnique({
            where: { id: entityId },
          });

          if (link) {
            await this.syncLink(link);
            reconciledCount++;
            this.logger.log(`Reconciled link ${entityId}`);
          } else {
            this.logger.warn(`Link ${entityId} not found in PostgreSQL, skipping`);
          }
        }

        // Mark as reconciled by deleting the failure log
        await this.prisma.activityLog.delete({
          where: { id: failure.id },
        });
      } catch (error) {
        this.logger.error(
          `Failed to reconcile ${entityType} ${entityId}`,
          error,
        );
        // Leave the failure log for next reconciliation attempt
      }
    }

    this.logger.log(`Reconciliation complete. Reconciled ${reconciledCount}/${failures.length} entities`);
    return reconciledCount;
  }
}


