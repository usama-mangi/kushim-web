import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { UnifiedRecord, Link } from '@prisma/client';
import neo4j from 'neo4j-driver';

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);

  constructor(private neo4jService: Neo4jService) {}

  async syncRecord(record: UnifiedRecord) {
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
  }

  async syncLink(link: Link) {
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
  }

  async getContextGroup(recordId: string, depth: number = 2) {
    const cypher = `
      MATCH (start:Artifact {id: $id})
      CALL apoc.path.subgraphAll(start, {
        maxLevel: $depth,
        relationshipFilter: 'RELATED_TO'
      })
      YIELD nodes, relationships
      RETURN nodes, relationships
    `;

    const result = await this.neo4jService.run(cypher, { id: recordId, depth });
    return result[0];
  }

  async createContextGroup(recordAId: string, recordBId: string, title: string) {
    const groupId = crypto.randomUUID();
    const cypher = `
      MERGE (g:ContextGroup {id: $groupId})
      SET g.name = $title, 
          g.createdAt = datetime(), 
          g.updatedAt = datetime(),
          g.coherenceScore = 1.0,
          g.topics = [],
          g.status = 'active'
      WITH g
      MATCH (a:Artifact {id: $recordAId})
      MATCH (b:Artifact {id: $recordBId})
      MERGE (a)-[:BELONGS_TO {weight: 1.0}]->(g)
      MERGE (b)-[:BELONGS_TO {weight: 1.0}]->(g)
      RETURN g
    `;
    await this.neo4jService.run(cypher, { groupId, title, recordAId, recordBId });
    
    // Calculate initial topics and coherence
    await this.updateGroupMetadata(groupId);
    
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

  async mergeContextGroups(targetGroupId: string, sourceGroupId: string) {
    // Move all members of source group to target group
    const cypher = `
      MATCH (source:ContextGroup {id: $sourceGroupId})<-[r:BELONGS_TO]-(a:Artifact)
      MATCH (target:ContextGroup {id: $targetGroupId})
      MERGE (a)-[newR:BELONGS_TO]->(target)
      SET newR.weight = coalesce(r.weight, 1.0)
      SET target.updatedAt = datetime()
      DELETE r
      WITH source
      DETACH DELETE source
    `;
    await this.neo4jService.run(cypher, { targetGroupId, sourceGroupId });
    
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

  async deleteContextGroup(groupId: string) {
    const cypher = `
      MATCH (g:ContextGroup {id: $groupId})
      DETACH DELETE g
    `;
    await this.neo4jService.run(cypher, { groupId });
    this.logger.log(`Deleted context group ${groupId}`);
  }

  async renameContextGroup(groupId: string, newName: string) {
    const cypher = `
      MATCH (g:ContextGroup {id: $groupId})
      SET g.name = $newName, g.updatedAt = datetime()
      RETURN g
    `;
    await this.neo4jService.run(cypher, { groupId, newName });
    this.logger.log(`Renamed context group ${groupId} to "${newName}"`);
  }

  async removeFromContextGroup(groupId: string, recordId: string) {
    const cypher = `
      MATCH (a:Artifact {id: $recordId})-[r:BELONGS_TO]->(g:ContextGroup {id: $groupId})
      DELETE r
      SET g.updatedAt = datetime()
    `;
    await this.neo4jService.run(cypher, { groupId, recordId });
    
    // Update group metadata after removal
    await this.updateGroupMetadata(groupId);
    
    // Delete group if empty
    const deleteEmptyCypher = `
      MATCH (g:ContextGroup {id: $groupId})
      WHERE NOT EXISTS { MATCH (g)<-[:BELONGS_TO]-() }
      DETACH DELETE g
    `;
    await this.neo4jService.run(deleteEmptyCypher, { groupId });
    
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

  async deleteArtifact(externalIdOrId: string) {
    // Delete artifact and all its relationships (both incoming and outgoing)
    const cypher = `
      MATCH (a:Artifact)
      WHERE a.id = $identifier OR a.externalId = $identifier
      DETACH DELETE a
    `;
    
    await this.neo4jService.run(cypher, { identifier: externalIdOrId });
    this.logger.log(`Deleted artifact ${externalIdOrId} from Neo4j`);
  }
}

