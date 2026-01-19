import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { UnifiedRecord, Link } from '@prisma/client';

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
      SET g.name = $title, g.createdAt = datetime(), g.updatedAt = datetime()
      WITH g
      MATCH (a:Artifact {id: $recordAId})
      MATCH (b:Artifact {id: $recordBId})
      MERGE (a)-[:BELONGS_TO {weight: 1.0}]->(g)
      MERGE (b)-[:BELONGS_TO {weight: 1.0}]->(g)
      RETURN g
    `;
    await this.neo4jService.run(cypher, { groupId, title, recordAId, recordBId });
    return groupId;
  }

  async addToContextGroup(groupId: string, recordId: string) {
    const cypher = `
      MATCH (g:ContextGroup {id: $groupId})
      MATCH (a:Artifact {id: $recordId})
      MERGE (a)-[:BELONGS_TO {weight: 1.0}]->(g)
      SET g.updatedAt = datetime()
    `;
    await this.neo4jService.run(cypher, { groupId, recordId });
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
  }

  async getRecordGroups(recordId: string): Promise<string[]> {
    const cypher = `
      MATCH (a:Artifact {id: $recordId})-[:BELONGS_TO]->(g:ContextGroup)
      RETURN g.id as id
    `;
    const result = await this.neo4jService.run(cypher, { recordId });
    return result.map(r => r.get('id'));
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
    return result.map(r => ({
      id: r.get('g').properties.id,
      name: r.get('g').properties.name,
      updatedAt: r.get('g').properties.updatedAt || r.get('g').properties.createdAt,
      members: r.get('members').map((m: any) => ({
        weight: m.rel.properties.weight || 1.0,
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
    }));
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
      maxCandidates 
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
}

