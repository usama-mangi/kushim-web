import { Controller, Get, UseGuards, Param, Request } from '@nestjs/common';
import { GraphService } from './graph.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Integer } from 'neo4j-driver';

@Controller('graph')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  private toPlainObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    // Handle Neo4j Integer
    if (obj instanceof Integer || (obj && typeof obj === 'object' && 'low' in obj && 'high' in obj)) {
      return typeof obj.toNumber === 'function' ? obj.toNumber() : Number(obj.low);
    }
    
    // Handle Neo4j DateTime and other temporal types
    if (obj && typeof obj === 'object' && 'toString' in obj && typeof obj.toString === 'function' && obj.constructor && obj.constructor.name && obj.constructor.name.includes('DateTime')) {
      return obj.toString();
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.toPlainObject(item));
    }
    
    // Handle objects
    if (typeof obj === 'object') {
      const plain: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          plain[key] = this.toPlainObject(obj[key]);
        }
      }
      return plain;
    }
    
    return obj;
  }

  @UseGuards(JwtAuthGuard)
  @Get('context-groups')
  async getContextGroups(@Request() req: any) {
    const cypher = `
      MATCH (g:ContextGroup)
      OPTIONAL MATCH (g)<-[:BELONGS_TO]-(a:Artifact)
      WHERE a.userId = $userId
      WITH g, count(a) as artifactCount
      WHERE artifactCount > 0
      RETURN g.id as id,
             g.name as name,
             artifactCount,
             g.coherenceScore as coherenceScore,
             g.topics as topics,
             g.status as status,
             g.createdAt as createdAt
      ORDER BY g.updatedAt DESC
    `;

    const result = await this.graphService['neo4jService'].run(cypher, {
      userId: req.user.userId
    });

    return result.map(record => this.toPlainObject({
      id: record.get('id'),
      name: record.get('name'),
      artifactCount: record.get('artifactCount'),
      coherenceScore: record.get('coherenceScore'),
      topics: record.get('topics'),
      status: record.get('status'),
      createdAt: record.get('createdAt')
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Get('context-groups/:id/graph')
  async getContextGroupGraph(@Param('id') groupId: string, @Request() req: any) {
    const cypher = `
      MATCH (g:ContextGroup {id: $groupId})<-[:BELONGS_TO]-(a:Artifact)
      WHERE a.userId = $userId
      WITH collect(a) as artifacts
      
      // Get all artifacts as nodes
      UNWIND artifacts as a
      WITH artifacts, {
        id: a.id,
        label: a.title,
        type: 'artifact',
        metadata: {
          platform: a.platform,
          artifactType: a.type,
          url: a.url,
          createdAt: a.timestamp
        }
      } as node
      
      WITH artifacts, collect(node) as nodes
      
      // Get all relationships between these artifacts
      UNWIND artifacts as a1
      UNWIND artifacts as a2
      WITH nodes, a1, a2
      WHERE id(a1) < id(a2)
      OPTIONAL MATCH (a1)-[r:RELATED_TO]-(a2)
      WITH nodes, collect({
        source: a1.id,
        target: a2.id,
        confidence: r.confidence,
        signal: r.method
      }) as links
      
      RETURN nodes, [link IN links WHERE link.confidence IS NOT NULL] as links
    `;

    const result = await this.graphService['neo4jService'].run(cypher, {
      groupId,
      userId: req.user.userId
    });

    if (result.length === 0) {
      return { nodes: [], links: [] };
    }

    return this.toPlainObject({
      nodes: result[0].get('nodes'),
      links: result[0].get('links')
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('full')
  async getFullGraph(@Request() req: any) {
    const cypher = `
      MATCH (a:Artifact)
      WHERE a.userId = $userId
      WITH collect(a) as artifacts
      
      // Get all artifacts as nodes
      UNWIND artifacts as a
      WITH artifacts, {
        id: a.id,
        label: a.title,
        type: 'artifact',
        metadata: {
          platform: a.platform,
          artifactType: a.type,
          url: a.url,
          createdAt: a.timestamp
        }
      } as node
      
      WITH artifacts, collect(node) as nodes
      
      // Get all relationships
      UNWIND artifacts as a1
      UNWIND artifacts as a2
      WITH nodes, a1, a2
      WHERE id(a1) < id(a2)
      OPTIONAL MATCH (a1)-[r:RELATED_TO]-(a2)
      WITH nodes, collect({
        source: a1.id,
        target: a2.id,
        confidence: r.confidence,
        signal: r.method
      }) as links
      
      RETURN nodes, [link IN links WHERE link.confidence IS NOT NULL] as links
    `;

    const result = await this.graphService['neo4jService'].run(cypher, {
      userId: req.user.userId
    });

    if (result.length === 0) {
      return { nodes: [], links: [] };
    }

    return this.toPlainObject({
      nodes: result[0].get('nodes'),
      links: result[0].get('links')
    });
  }
}
