import { Controller, Get, Post, Patch, Delete, UseGuards, Param, Request, Body, HttpCode, Logger } from '@nestjs/common';
import { GraphService } from './graph.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Integer } from 'neo4j-driver';
import { randomUUID } from 'crypto';

@Controller('graph')
export class GraphController {
  private readonly logger = new Logger(GraphController.name);
  
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
      WHERE a.userId = $userId OR a IS NULL
      WITH g, count(a) as artifactCount
      WHERE artifactCount >= 0
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
      
      // Build nodes list with DISTINCT
      WITH collect(DISTINCT {
        id: a.id,
        label: a.title,
        type: 'artifact',
        metadata: {
          platform: a.platform,
          artifactType: a.type,
          url: a.url,
          createdAt: a.timestamp
        }
      }) as nodes
      
      // Build links separately - only actual relationships within this group
      MATCH (g:ContextGroup {id: $groupId})<-[:BELONGS_TO]-(a1:Artifact)
      MATCH (g)<-[:BELONGS_TO]-(a2:Artifact)
      WHERE a1.userId = $userId 
        AND a2.userId = $userId
        AND id(a1) < id(a2)
      OPTIONAL MATCH (a1)-[r:RELATED_TO]-(a2)
      WHERE r IS NOT NULL
      
      WITH nodes, collect(DISTINCT {
        source: a1.id,
        target: a2.id,
        confidence: r.confidence,
        signal: r.method
      }) as links
      
      RETURN nodes, links
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
      
      // Build nodes list with DISTINCT to avoid duplicates
      WITH collect(DISTINCT {
        id: a.id,
        label: a.title,
        type: 'artifact',
        metadata: {
          platform: a.platform,
          artifactType: a.type,
          url: a.url,
          createdAt: a.timestamp
        }
      }) as nodes
      
      // Build links separately - only get actual relationships
      MATCH (a1:Artifact)-[r:RELATED_TO]-(a2:Artifact)
      WHERE a1.userId = $userId 
        AND a2.userId = $userId
        AND id(a1) < id(a2)
      
      WITH nodes, collect(DISTINCT {
        source: a1.id,
        target: a2.id,
        confidence: r.confidence,
        signal: r.method
      }) as links
      
      RETURN nodes, links
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

  @UseGuards(JwtAuthGuard)
  @Post('context-groups')
  async createContextGroup(
    @Request() req: any,
    @Body() body: { name: string; artifactIds?: string[] }
  ) {
    this.logger.log(`Creating context group: ${body.name} for user ${req.user.userId}`);
    
    if (!body.name) {
      return { success: false, message: 'Group name is required' };
    }

    // Create empty group
    const groupId = randomUUID();
    const cypher = `
      CREATE (g:ContextGroup {
        id: $groupId,
        name: $name,
        createdAt: datetime(),
        updatedAt: datetime(),
        coherenceScore: 1.0,
        topics: [],
        status: 'active'
      })
      RETURN g.id as id
    `;
    
    this.logger.log(`Executing cypher to create group ${groupId}`);
    await this.graphService['neo4jService'].run(cypher, {
      groupId,
      name: body.name
    });

    // Add artifacts if provided
    if (body.artifactIds && body.artifactIds.length > 0) {
      for (const artifactId of body.artifactIds) {
        await this.graphService.addToContextGroup(groupId, artifactId, req.user.userId);
      }
    }

    this.logger.log(`Successfully created context group ${groupId}`);
    return { success: true, groupId, message: 'Context group created' };
  }

  @UseGuards(JwtAuthGuard)
  @UseGuards(JwtAuthGuard)
  @Patch('context-groups/:id')
  async updateContextGroup(
    @Param('id') groupId: string,
    @Body() body: { name?: string },
    @Request() req: any
  ) {
    if (body.name) {
      await this.graphService.renameContextGroup(groupId, body.name, req.user.userId);
    }
    return { success: true, message: 'Context group updated' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('context-groups/:id')
  @HttpCode(204)
  async deleteContextGroup(
    @Param('id') groupId: string,
    @Request() req: any
  ) {
    await this.graphService.deleteContextGroup(groupId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('context-groups/:id/artifacts')
  async addArtifactToGroup(
    @Param('id') groupId: string,
    @Body() body: { artifactId: string },
    @Request() req: any
  ) {
    if (!body.artifactId) {
      return { success: false, message: 'Artifact ID is required' };
    }
    
    this.logger.log(`Adding artifact ${body.artifactId} to group ${groupId} for user ${req.user.userId}`);
    
    try {
      await this.graphService.addToContextGroup(groupId, body.artifactId, req.user.userId);
      this.logger.log(`Successfully added artifact ${body.artifactId} to group ${groupId}`);
      return { success: true, message: 'Artifact added to group' };
    } catch (error) {
      this.logger.error(`Failed to add artifact ${body.artifactId} to group ${groupId}`, error.stack);
      return { success: false, message: error.message || 'Failed to add artifact to group' };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('context-groups/:id/artifacts/:artifactId')
  @HttpCode(204)
  async removeArtifactFromGroup(
    @Param('id') groupId: string,
    @Param('artifactId') artifactId: string,
    @Request() req: any
  ) {
    this.logger.log(`Removing artifact ${artifactId} from group ${groupId}`);
    
    try {
      await this.graphService.removeFromContextGroup(groupId, artifactId, req.user.userId);
      this.logger.log(`Successfully removed artifact ${artifactId} from group ${groupId}`);
    } catch (error) {
      this.logger.error(`Failed to remove artifact ${artifactId} from group ${groupId}`, error.stack);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('context-groups/:id/merge')
  async mergeGroups(
    @Param('id') targetGroupId: string,
    @Body() body: { sourceGroupId: string },
    @Request() req: any
  ) {
    if (!body.sourceGroupId) {
      return { success: false, message: 'Source group ID is required' };
    }
    await this.graphService.mergeContextGroups(targetGroupId, body.sourceGroupId, req.user.userId);
    return { success: true, message: 'Groups merged successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('context-groups/:id/split')
  async splitGroup(@Param('id') groupId: string) {
    const newGroupIds = await this.graphService.checkAndSplitGroup(groupId);
    if (newGroupIds.length === 0) {
      return { success: false, message: 'Group coherence is good, no split needed' };
    }
    return { success: true, newGroupIds, message: `Group split into ${newGroupIds.length} new groups` };
  }
}
