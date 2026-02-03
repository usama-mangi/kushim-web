import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { IntegrationType } from '@prisma/client';
import { encrypt, decrypt } from '../shared/utils/encryption.util';

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listIntegrations(customerId: string) {
    return this.prisma.integration.findMany({
      where: { customerId: customerId },
    });
  }

  async getIntegration(customerId: string, id: string) {
    const integration = await this.prisma.integration.findFirst({
      where: { id, customerId: customerId },
    });

    if (!integration) {
      throw new NotFoundException(`Integration ${id} not found`);
    }

    return integration;
  }

  async deleteIntegration(customerId: string, id: string) {
    const integration = await this.prisma.integration.findFirst({
      where: { id, customerId: customerId },
    });

    if (!integration) {
      throw new NotFoundException(`Integration ${id} not found`);
    }

    return this.prisma.integration.delete({
      where: { id },
    });
  }

  async deleteIntegrationByType(customerId: string, type: string) {
    const normalizedType = type.toUpperCase() as IntegrationType;
    const integrations = await this.prisma.integration.findMany({
        where: { customerId: customerId, type: normalizedType }
    });

    if (integrations.length === 0) {
        // If not found in DB, we consider it already disconnected
        return { count: 0, message: `No database record for ${normalizedType} found, already disconnected.` };
    }

    return this.prisma.integration.deleteMany({
      where: { customerId: customerId, type: normalizedType },
    });
  }

  async connect(customerId: string, type: IntegrationType, config: any) {
    // Encrypt sensitive fields
    const sensitiveKeys = [
      'personalAccessToken', 
      'token', 
      'secretAccessKey', 
      'apiToken', 
      'webhookUrl', 
      'secret',
    ];

    const encryptedConfig = { ...config };
    for (const key of sensitiveKeys) {
      if (encryptedConfig[key]) {
        encryptedConfig[key] = encrypt(encryptedConfig[key]);
      }
    }

    // Find existing or create new
    const existing = await this.prisma.integration.findFirst({
        where: { customerId, type }
    });

    if (existing) {
        return this.prisma.integration.update({
            where: { id: existing.id },
            data: {
                config: encryptedConfig,
                status: 'ACTIVE',
                lastSyncAt: new Date(),
            }
        });
    }

    return this.prisma.integration.create({
      data: {
        customerId,
        type,
        config: encryptedConfig,
        status: 'ACTIVE',
      },
    });
  }
  async getDecryptedConfig(customerId: string, type: IntegrationType): Promise<any> {
    const integration = await this.prisma.integration.findFirst({
        where: { customerId, type }
    });

    if (!integration) return null;
    return this.decryptConfig(integration.config);
  }

  private decryptConfig(config: any): any {
    if (!config) return config;
    const decrypted = { ...config };
    const sensitiveKeys = [
      'personalAccessToken',
      'token',
      'secretAccessKey',
      'apiToken',
      'webhookUrl',
      'secret',
    ];

    for (const key of sensitiveKeys) {
      if (decrypted[key] && typeof decrypted[key] === 'string' && decrypted[key].includes(':')) {
        try {
          decrypted[key] = decrypt(decrypted[key]);
        } catch (error) {
          // Log and continue
        }
      }
    }
    return decrypted;
  }
}
