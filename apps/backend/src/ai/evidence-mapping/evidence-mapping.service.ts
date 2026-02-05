import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { OpenAIService } from '../openai.service';
import { UsageTrackerService } from '../usage-tracker.service';
import { Evidence, Control, EvidenceMapping } from '@prisma/client';
import { ControlSuggestion } from './dto/mapping-response.dto';

interface MappingResult {
  controlId: string;
  confidence: number;
  reasoning: string;
}

interface AIResponse {
  mappings: Array<{
    control_id: string;
    confidence: number;
    reasoning: string;
  }>;
}

@Injectable()
export class EvidenceMappingService {
  private readonly logger = new Logger(EvidenceMappingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly openai: OpenAIService,
    private readonly usageTracker: UsageTrackerService,
  ) {}

  async mapEvidenceToControls(
    evidenceId: string,
    customerId: string,
    options?: {
      minConfidence?: number;
      maxSuggestions?: number;
      useGPT4?: boolean;
    },
  ): Promise<ControlSuggestion[]> {
    const cacheKey = `evidence-mapping:${evidenceId}`;
    const cached = await this.cache.get<ControlSuggestion[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Using cached mappings for evidence: ${evidenceId}`);
      return cached;
    }

    const evidence = await this.getEvidence(evidenceId, customerId);
    const controls = await this.getRelevantControls(evidence);

    if (controls.length === 0) {
      this.logger.warn(`No controls found for framework: ${evidence.control.framework}`);
      return [];
    }

    if (!this.openai.isConfigured()) {
      throw new BadRequestException('OpenAI API key not configured');
    }

    const mappingResults = await this.performAIMapping(
      evidence,
      controls,
      options?.useGPT4,
    );

    await this.usageTracker.logUsage({
      customerId,
      operation: 'evidence_mapping',
      model: options?.useGPT4 ? 'gpt-4' : 'gpt-3.5-turbo',
      usage: mappingResults.usage,
      metadata: {
        evidenceId,
        controlCount: controls.length,
        suggestionCount: mappingResults.suggestions.length,
      },
    });

    const minConfidence = options?.minConfidence ?? 0.5;
    const maxSuggestions = options?.maxSuggestions ?? 5;

    const filteredSuggestions = mappingResults.suggestions
      .filter((s) => s.confidence >= minConfidence)
      .slice(0, maxSuggestions);

    const cacheTTL = 86400; // 24 hours
    await this.cache.set(cacheKey, filteredSuggestions, cacheTTL);

    return filteredSuggestions;
  }

  private async performAIMapping(
    evidence: Evidence & { control: Control; integration: any },
    controls: Control[],
    useGPT4: boolean = false,
  ): Promise<{
    suggestions: ControlSuggestion[];
    usage: any;
  }> {
    const prompt = this.buildMappingPrompt(evidence, controls);

    const model = useGPT4 ? 'gpt-4' : 'gpt-3.5-turbo';
    const result = await this.openai.generateStructuredCompletion<AIResponse>(
      [
        {
          role: 'system',
          content:
            'You are a SOC 2 compliance expert. Analyze evidence and map it to relevant controls. Return a JSON object with a "mappings" array.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        model,
        temperature: 0.3,
        maxTokens: 2000,
      },
    );

    const suggestions: ControlSuggestion[] = result.data.mappings.map((m) => {
      const control = controls.find((c) => c.controlId === m.control_id);
      return {
        controlId: control?.id || '',
        controlIdentifier: m.control_id,
        title: control?.title || '',
        confidence: m.confidence,
        reasoning: m.reasoning,
      };
    });

    return {
      suggestions: suggestions.filter((s) => s.controlId),
      usage: result.usage,
    };
  }

  private buildMappingPrompt(
    evidence: Evidence & { control: Control; integration: any },
    controls: Control[],
  ): string {
    const evidenceType = evidence.integration.type;
    const evidenceData = JSON.stringify(evidence.data, null, 2);

    const controlsList = controls
      .map(
        (c) =>
          `${c.controlId}: ${c.title}\nDescription: ${c.description}\nTest: ${c.testProcedure}`,
      )
      .join('\n\n');

    return `Analyze the following evidence and determine which SOC 2 controls it maps to.

EVIDENCE DETAILS:
Type: ${evidenceType}
Collected: ${evidence.collectedAt.toISOString()}
Data: ${evidenceData}

AVAILABLE CONTROLS:
${controlsList}

TASK:
1. Identify which controls this evidence relates to
2. Assign a confidence score (0.0 to 1.0) based on:
   - How directly the evidence addresses the control
   - Completeness of the evidence
   - Quality and reliability of the evidence source
3. Provide clear reasoning for each mapping

SCORING GUIDELINES:
- 0.9-1.0: Direct, complete evidence that fully demonstrates control effectiveness
- 0.7-0.89: Strong evidence with minor gaps or indirect demonstration
- 0.5-0.69: Moderate evidence that partially addresses the control
- Below 0.5: Weak or tangential relationship

Return JSON format:
{
  "mappings": [
    {
      "control_id": "CC1.1",
      "confidence": 0.85,
      "reasoning": "Explanation of why this evidence maps to this control"
    }
  ]
}

Only include mappings with confidence >= 0.5. Maximum 10 mappings.`;
  }

  async createMapping(
    evidenceId: string,
    controlId: string,
    confidence: number,
    reasoning: string,
    customerId: string,
    options?: {
      isManualOverride?: boolean;
      createdBy?: string;
    },
  ): Promise<EvidenceMapping> {
    await this.validateEvidenceAndControl(evidenceId, controlId, customerId);

    const mapping = await this.prisma.evidenceMapping.create({
      data: {
        evidenceId,
        controlId,
        confidence,
        aiReasoning: reasoning,
        isManualOverride: options?.isManualOverride || false,
        createdBy: options?.createdBy,
      },
    });

    await this.cache.del(`evidence-mapping:${evidenceId}`);

    this.logger.log(
      `Created mapping: evidence=${evidenceId}, control=${controlId}, confidence=${confidence}`,
    );

    return mapping;
  }

  async updateMapping(
    mappingId: string,
    updates: {
      confidence?: number;
      aiReasoning?: string;
      manuallyVerified?: boolean;
      isManualOverride?: boolean;
    },
  ): Promise<EvidenceMapping> {
    const existing = await this.prisma.evidenceMapping.findUnique({
      where: { id: mappingId },
    });

    if (!existing) {
      throw new NotFoundException(`Mapping ${mappingId} not found`);
    }

    const updated = await this.prisma.evidenceMapping.update({
      where: { id: mappingId },
      data: updates,
    });

    await this.cache.del(`evidence-mapping:${existing.evidenceId}`);

    this.logger.log(`Updated mapping: ${mappingId}`);
    return updated;
  }

  async deleteMapping(mappingId: string): Promise<void> {
    const existing = await this.prisma.evidenceMapping.findUnique({
      where: { id: mappingId },
    });

    if (!existing) {
      throw new NotFoundException(`Mapping ${mappingId} not found`);
    }

    await this.prisma.evidenceMapping.delete({
      where: { id: mappingId },
    });

    await this.cache.del(`evidence-mapping:${existing.evidenceId}`);

    this.logger.log(`Deleted mapping: ${mappingId}`);
  }

  async getMappingsForEvidence(
    evidenceId: string,
    customerId: string,
  ): Promise<(EvidenceMapping & { control: Control })[]> {
    await this.getEvidence(evidenceId, customerId);

    return this.prisma.evidenceMapping.findMany({
      where: { evidenceId },
      include: {
        control: true,
      },
      orderBy: {
        confidence: 'desc',
      },
    });
  }

  async applyManualOverride(
    evidenceId: string,
    controlId: string,
    confidence: number,
    reasoning: string,
    userId: string,
    customerId: string,
  ): Promise<EvidenceMapping> {
    const existing = await this.prisma.evidenceMapping.findUnique({
      where: {
        evidenceId_controlId: {
          evidenceId,
          controlId,
        },
      },
    });

    if (existing) {
      return this.updateMapping(existing.id, {
        confidence,
        aiReasoning: reasoning,
        isManualOverride: true,
        manuallyVerified: true,
      });
    } else {
      return this.createMapping(
        evidenceId,
        controlId,
        confidence,
        reasoning,
        customerId,
        {
          isManualOverride: true,
          createdBy: userId,
        },
      );
    }
  }

  async calculateConfidence(params: {
    evidenceCompleteness: number;
    controlRelevance: number;
    sourceReliability: number;
  }): Promise<number> {
    const weights = {
      completeness: 0.4,
      relevance: 0.4,
      reliability: 0.2,
    };

    const confidence =
      params.evidenceCompleteness * weights.completeness +
      params.controlRelevance * weights.relevance +
      params.sourceReliability * weights.reliability;

    return Math.min(Math.max(confidence, 0), 1);
  }

  private async getEvidence(
    evidenceId: string,
    customerId: string,
  ): Promise<Evidence & { control: Control; integration: any }> {
    const evidence = await this.prisma.evidence.findFirst({
      where: {
        id: evidenceId,
        customerId,
      },
      include: {
        control: true,
        integration: true,
      },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence ${evidenceId} not found`);
    }

    return evidence;
  }

  private async getRelevantControls(
    evidence: Evidence & { control: Control },
  ): Promise<Control[]> {
    return this.prisma.control.findMany({
      where: {
        framework: evidence.control.framework,
      },
    });
  }

  private async validateEvidenceAndControl(
    evidenceId: string,
    controlId: string,
    customerId: string,
  ): Promise<void> {
    const evidence = await this.prisma.evidence.findFirst({
      where: {
        id: evidenceId,
        customerId,
      },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence ${evidenceId} not found`);
    }

    const control = await this.prisma.control.findUnique({
      where: { id: controlId },
    });

    if (!control) {
      throw new NotFoundException(`Control ${controlId} not found`);
    }
  }
}
