/**
 * Neo4j Types
 * Type definitions for Neo4j query results
 */

import { Integer, Node, Relationship, Record } from 'neo4j-driver';

/**
 * Neo4j Node properties
 */
export interface ArtifactNodeProperties {
  id: string;
  userId: string;
  title: string;
  type: string;
  platform: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContextGroupNodeProperties {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  coherenceScore?: number;
}

/**
 * Neo4j Relationship properties
 */
export interface LinkRelationshipProperties {
  id: string;
  confidenceScore: number;
  discoveryMethod: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface BelongsToRelationshipProperties {
  addedAt: string;
}

/**
 * Typed Neo4j nodes
 */
export type ArtifactNode = Node<Integer, ArtifactNodeProperties>;
export type ContextGroupNode = Node<Integer, ContextGroupNodeProperties>;

/**
 * Typed Neo4j relationships
 */
export type LinkRelationship = Relationship<Integer, LinkRelationshipProperties>;
export type BelongsToRelationship = Relationship<Integer, BelongsToRelationshipProperties>;

/**
 * Query result types
 */
export interface GraphQueryResult {
  records: Record[];
  summary: {
    query: {
      text: string;
      parameters: Record<string, unknown>;
    };
    counters: {
      nodesCreated: number;
      nodesDeleted: number;
      relationshipsCreated: number;
      relationshipsDeleted: number;
      propertiesSet: number;
    };
  };
}

export interface ArtifactWithLinks {
  artifact: ArtifactNodeProperties;
  links: Array<{
    target: ArtifactNodeProperties;
    relationship: LinkRelationshipProperties;
  }>;
}

export interface ContextGroupWithMembers {
  group: ContextGroupNodeProperties;
  members: ArtifactNodeProperties[];
}

/**
 * Graph signals for ML scoring
 */
export interface GraphSignals {
  sharedAuthors: number;
  temporalProximity: number;
  sharedParticipants: number;
  pathDistance: number;
  commonNeighbors: number;
}

/**
 * Helper to extract node properties with type safety
 */
export function extractNodeProperties<T>(node: Node): T {
  return node.properties as T;
}

/**
 * Helper to extract relationship properties with type safety
 */
export function extractRelationshipProperties<T>(rel: Relationship): T {
  return rel.properties as T;
}

/**
 * Convert Neo4j Integer to JavaScript number
 */
export function toNumber(value: unknown): number {
  if (value instanceof Integer) {
    return value.toNumber();
  }
  if (typeof value === 'number') {
    return value;
  }
  return 0;
}

/**
 * Convert Neo4j value to plain JavaScript object
 */
export function toPlainObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Neo4j Integer
  if (obj instanceof Integer || (typeof obj === 'object' && 'low' in obj && 'high' in obj)) {
    return toNumber(obj);
  }

  // Handle Neo4j DateTime
  if (
    obj &&
    typeof obj === 'object' &&
    'toString' in obj &&
    obj.constructor?.name?.includes('DateTime')
  ) {
    return (obj as { toString: () => string }).toString();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => toPlainObject(item));
  }

  // Handle Node
  if (obj instanceof Node) {
    return toPlainObject(obj.properties);
  }

  // Handle Relationship
  if (obj instanceof Relationship) {
    return toPlainObject(obj.properties);
  }

  // Handle objects
  if (typeof obj === 'object') {
    const plain: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      plain[key] = toPlainObject(value);
    }
    return plain;
  }

  return obj;
}
