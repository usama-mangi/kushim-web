/**
 * Mock Neo4jService for unit tests
 * Use this to avoid hitting the actual Neo4j instance in unit tests
 */
export const createMockNeo4jService = () => {
  const mockRecords: any[] = [];

  return {
    // Run a Cypher query
    run: jest.fn(async (query: string, params?: any) => {
      return {
        records: mockRecords,
        summary: {
          counters: {
            nodesCreated: () => 0,
            nodesDeleted: () => 0,
            relationshipsCreated: () => 0,
            relationshipsDeleted: () => 0,
            propertiesSet: () => 0,
          },
        },
      };
    }),

    // Write transaction
    writeTransaction: jest.fn(async (work: any) => {
      const mockTx = {
        run: jest.fn(async () => ({
          records: [],
          summary: { counters: {} },
        })),
      };
      return work(mockTx);
    }),

    // Read transaction
    readTransaction: jest.fn(async (work: any) => {
      const mockTx = {
        run: jest.fn(async () => ({
          records: [],
          summary: { counters: {} },
        })),
      };
      return work(mockTx);
    }),

    // Helper to add mock data
    _setMockRecords: (records: any[]) => {
      mockRecords.length = 0;
      mockRecords.push(...records);
    },

    // Clear mock data
    _clearMockRecords: () => {
      mockRecords.length = 0;
    },
  };
};

/**
 * Mock Neo4j Record
 * Use this to create mock Neo4j query results
 */
export const createMockNeo4jRecord = (data: Record<string, any>) => {
  return {
    get: (key: string) => data[key],
    has: (key: string) => key in data,
    keys: Object.keys(data),
    toObject: () => data,
    _fields: Object.values(data),
    _fieldLookup: Object.fromEntries(
      Object.keys(data).map((key, index) => [key, index])
    ),
  };
};

/**
 * Mock Neo4j Node
 * Use this to create mock Neo4j nodes
 */
export const createMockNeo4jNode = (
  id: number | string,
  labels: string[],
  properties: Record<string, any>
) => {
  return {
    identity: { low: typeof id === 'number' ? id : 0, high: 0 },
    labels,
    properties,
    toString: () => `Node{${id}}`,
  };
};

/**
 * Mock Neo4j Relationship
 * Use this to create mock Neo4j relationships
 */
export const createMockNeo4jRelationship = (
  id: number | string,
  type: string,
  startNodeId: number | string,
  endNodeId: number | string,
  properties: Record<string, any> = {}
) => {
  return {
    identity: { low: typeof id === 'number' ? id : 0, high: 0 },
    start: { low: typeof startNodeId === 'number' ? startNodeId : 0, high: 0 },
    end: { low: typeof endNodeId === 'number' ? endNodeId : 0, high: 0 },
    type,
    properties,
    toString: () => `Relationship{${id}}`,
  };
};
