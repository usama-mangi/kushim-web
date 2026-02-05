import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';

export interface PromptVariables {
  [key: string]: string | number | boolean | object;
}

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTemplate(name: string): Promise<string> {
    const template = await this.prisma.aIPromptTemplate.findFirst({
      where: {
        name,
        isActive: true,
      },
    });

    if (!template) {
      throw new NotFoundException(`Prompt template "${name}" not found`);
    }

    return template.template;
  }

  async renderTemplate(
    name: string,
    variables: PromptVariables,
  ): Promise<string> {
    const template = await this.getTemplate(name);
    return this.interpolate(template, variables);
  }

  private interpolate(template: string, variables: PromptVariables): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = variables[key];
      if (value === undefined) {
        this.logger.warn(`Missing variable: ${key}`);
        return match;
      }
      return typeof value === 'object'
        ? JSON.stringify(value, null, 2)
        : String(value);
    });
  }

  async createTemplate(
    name: string,
    description: string,
    template: string,
    variables: string[],
  ): Promise<void> {
    await this.prisma.aIPromptTemplate.create({
      data: {
        name,
        description,
        template,
        variables,
        isActive: true,
        version: 1,
      },
    });
    this.logger.log(`Created prompt template: ${name}`);
  }

  async updateTemplate(
    name: string,
    updates: {
      description?: string;
      template?: string;
      variables?: string[];
      isActive?: boolean;
    },
  ): Promise<void> {
    const existing = await this.prisma.aIPromptTemplate.findUnique({
      where: { name },
    });

    if (!existing) {
      throw new NotFoundException(`Prompt template "${name}" not found`);
    }

    await this.prisma.aIPromptTemplate.update({
      where: { name },
      data: {
        ...updates,
        version: existing.version + 1,
      },
    });

    this.logger.log(`Updated prompt template: ${name}`);
  }
}
