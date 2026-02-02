import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { IntegrationType } from '@prisma/client';

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getEffectiveCustomerId(customerId: string): Promise<string> {
    // Check if any integrations belong to this ID
    const count = await this.prisma.integration.count({ where: { customerId } });
    if (count > 0) return customerId;

    // Fallback for Demo: If no integrations found for this User ID, 
    // it's likely we're using the default Demo Customer record.
    const demoCustomer = await this.prisma.customer.findUnique({
      where: { email: 'demo@kushim.io' },
    });
    
    if (demoCustomer) return demoCustomer.id;

    // Last resort fallback to first customer
    const firstCustomer = await this.prisma.customer.findFirst();
    return firstCustomer?.id || customerId;
  }

  async listIntegrations(customerId: string) {
    const effectiveId = await this.getEffectiveCustomerId(customerId);
    
    // In demo mode, we want to see everything from both the user's personal space
    // and the global demo shared space.
    const integrations = await this.prisma.integration.findMany({
      where: {
        OR: [
          { customerId: customerId },
          { customerId: effectiveId }
        ]
      },
    });

    // If we have duplicates of the same type, we should probably prefer the user's personal one,
    // but for now unique by ID is fine.
    return integrations;
  }

  async getIntegration(customerId: string, id: string) {
    const effectiveId = await this.getEffectiveCustomerId(customerId);
    const integration = await this.prisma.integration.findFirst({
      where: { 
        id, 
        OR: [
            { customerId: customerId },
            { customerId: effectiveId }
        ]
      },
    });

    if (!integration) {
      throw new NotFoundException(`Integration ${id} not found`);
    }

    return integration;
  }

  async deleteIntegration(customerId: string, id: string) {
    const effectiveId = await this.getEffectiveCustomerId(customerId);
    const integration = await this.prisma.integration.findFirst({
      where: { 
        id, 
        OR: [
            { customerId: customerId },
            { customerId: effectiveId }
        ]
      },
    });

    if (!integration) {
      throw new NotFoundException(`Integration ${id} not found`);
    }

    // Handle cascading cleanup if needed, but Prisma schema might already handle it
    return this.prisma.integration.delete({
      where: { id },
    });
  }

  async deleteIntegrationByType(customerId: string, type: string) {
    const normalizedType = type.toUpperCase() as IntegrationType;
    const effectiveId = await this.getEffectiveCustomerId(customerId);
    
    // Search in both user space and demo space to be safe in demo mode
    const integrations = await this.prisma.integration.findMany({
        where: {
            OR: [
                { customerId: customerId, type: normalizedType },
                { customerId: effectiveId, type: normalizedType }
            ]
        }
    });

    if (integrations.length === 0) {
        // If not found in DB, we consider it already disconnected
        // This prevents 404 errors for demo integrations that exist only in config
        return { count: 0, message: `No database record for ${normalizedType} found, already disconnected.` };
    }

    // Delete from both spaces
    return this.prisma.integration.deleteMany({
      where: {
        OR: [
            { customerId: customerId, type: normalizedType },
            { customerId: effectiveId, type: normalizedType }
        ]
      },
    });
  }
}
