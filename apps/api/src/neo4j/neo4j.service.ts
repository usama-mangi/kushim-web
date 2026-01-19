import { Injectable, OnApplicationShutdown, Logger } from '@nestjs/common';
import neo4j, { Driver, Session, SessionConfig } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnApplicationShutdown {
  private driver: Driver;
  private readonly logger = new Logger(Neo4jService.name);

  constructor() {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'kushim_graph_pass';

    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    this.logger.log(`Neo4j Driver connected to ${uri}`);
  }

  getDriver(): Driver {
    return this.driver;
  }

  getSession(config?: SessionConfig): Session {
    return this.driver.session(config);
  }

  async onApplicationShutdown() {
    await this.driver.close();
  }

  async run(cypher: string, params?: Record<string, any>): Promise<any[]> {
    const session = this.getSession();
    try {
      const result = await session.run(cypher, params);
      return result.records;
    } finally {
      await session.close();
    }
  }
}
