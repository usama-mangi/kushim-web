import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { OpenAIService } from '../openai.service';
import { UsageTrackerService } from '../usage-tracker.service';
import { PolicyStatus } from '@prisma/client';
import { GeneratePolicyDto, UpdatePolicyDto, ReviewResultDto } from './dto';
import MarkdownIt from 'markdown-it';
import puppeteer from 'puppeteer';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PolicyDraftingService {
  private markdown: MarkdownIt;

  constructor(
    private prisma: PrismaService,
    private openai: OpenAIService,
    private usageTracker: UsageTrackerService,
  ) {
    this.markdown = new MarkdownIt();
  }

  async generatePolicy(
    customerId: string,
    userId: string,
    dto: GeneratePolicyDto,
  ) {
    const template = await this.prisma.policyTemplate.findUnique({
      where: { id: dto.templateId },
      include: {
        policyTemplateControls: {
          include: {
            control: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Policy template not found');
    }

    if (!template.isActive) {
      throw new BadRequestException('Policy template is not active');
    }

    const prompt = this.buildGenerationPrompt(template, dto);

    const { content, usage } = await this.openai.generateChatCompletion(
      [
        {
          role: 'system',
          content: 'You are an expert compliance policy writer specializing in SOC 2 and information security policies. Generate comprehensive, professional policy documents.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        model: 'gpt-4',
        temperature: 0.3,
      },
    );

    await this.usageTracker.logUsage({
      customerId,
      model: 'gpt-4',
      usage,
      operation: 'policy_generation',
      metadata: { templateId: dto.templateId },
    });

    const title = this.extractTitle(content, template.name);

    const policy = await this.prisma.policy.create({
      data: {
        customerId,
        templateId: dto.templateId,
        title,
        content,
        version: 1,
        status: PolicyStatus.DRAFT,
        createdBy: userId,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    await this.prisma.policyVersion.create({
      data: {
        policyId: policy.id,
        version: 1,
        title,
        content,
        createdBy: userId,
        changes: 'Initial generation',
      },
    });

    return policy;
  }

  async customizePolicy(
    policyId: string,
    customerId: string,
    userId: string,
    dto: UpdatePolicyDto,
  ) {
    const policy = await this.prisma.policy.findFirst({
      where: {
        id: policyId,
        customerId,
      },
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    if (policy.status === PolicyStatus.APPROVED) {
      throw new BadRequestException('Cannot modify approved policy');
    }

    const newVersion = policy.version + 1;

    const updated = await this.prisma.policy.update({
      where: { id: policyId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.content && { content: dto.content }),
        ...(dto.status && { status: dto.status }),
        version: newVersion,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    await this.prisma.policyVersion.create({
      data: {
        policyId,
        version: newVersion,
        title: dto.title || policy.title,
        content: dto.content || policy.content,
        createdBy: userId,
        changes: dto.changes || 'Policy updated',
      },
    });

    return updated;
  }

  async reviewPolicy(
    policyId: string,
    customerId: string,
  ): Promise<ReviewResultDto> {
    const policy = await this.prisma.policy.findFirst({
      where: {
        id: policyId,
        customerId,
      },
      include: {
        template: {
          include: {
            policyTemplateControls: {
              include: {
                control: true,
              },
            },
          },
        },
      },
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    const prompt = `
Analyze the following ${policy.template.name} policy and provide a comprehensive review:

POLICY CONTENT:
${policy.content}

LINKED SOC 2 CONTROLS:
${policy.template.policyTemplateControls.map(ptc => `- ${ptc.control.controlId}: ${ptc.control.title}`).join('\n')}

Please evaluate:
1. Completeness - Does it cover all necessary sections?
2. Gaps - What's missing or inadequately addressed?
3. Suggestions - How can it be improved?
4. Consistency - Any contradictions or inconsistencies?
5. Compliance Score - Rate 0-100 based on SOC 2 requirements

Respond in JSON format:
{
  "score": number,
  "completeness": "string",
  "gaps": ["string"],
  "suggestions": ["string"],
  "consistencyIssues": ["string"]
}
`;

    const { content, usage } = await this.openai.generateChatCompletion(
      [
        {
          role: 'system',
          content: 'You are a SOC 2 compliance auditor reviewing security policies. Provide thorough, constructive feedback.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        model: 'gpt-4',
        temperature: 0.2,
        responseFormat: { type: 'json_object' },
      },
    );

    await this.usageTracker.logUsage({
      customerId,
      model: 'gpt-4',
      usage,
      operation: 'policy_review',
      metadata: { policyId },
    });

    return JSON.parse(content);
  }

  async suggestImprovements(
    policyId: string,
    customerId: string,
    section?: string,
  ): Promise<string[]> {
    const policy = await this.prisma.policy.findFirst({
      where: {
        id: policyId,
        customerId,
      },
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    const contentToAnalyze = section || policy.content;

    const prompt = `
Suggest specific improvements for this policy ${section ? 'section' : 'document'}:

${contentToAnalyze}

Provide 5-7 actionable, specific improvement suggestions that would enhance clarity, completeness, and compliance.
`;

    const { content, usage } = await this.openai.generateChatCompletion(
      [
        {
          role: 'system',
          content: 'You are a policy writing consultant. Provide specific, actionable improvement suggestions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
      },
    );

    await this.usageTracker.logUsage({
      customerId,
      model: 'gpt-3.5-turbo',
      usage,
      operation: 'policy_suggestions',
      metadata: { policyId },
    });

    const suggestions = content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .filter(line => /^\d+\./.test(line.trim()) || /^-/.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim());

    return suggestions;
  }

  async exportPolicy(
    policyId: string,
    customerId: string,
    format: 'pdf' | 'docx' | 'markdown',
  ): Promise<Buffer> {
    const policy = await this.prisma.policy.findFirst({
      where: {
        id: policyId,
        customerId,
      },
      include: {
        template: true,
      },
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    switch (format) {
      case 'pdf':
        return this.exportToPdf(policy, customer);
      case 'docx':
        return this.exportToDocx(policy, customer);
      case 'markdown':
        return Buffer.from(policy.content, 'utf-8');
      default:
        throw new BadRequestException('Invalid export format');
    }
  }

  async approvePolicy(
    policyId: string,
    customerId: string,
    userId: string,
    userRole: string,
  ) {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can approve policies');
    }

    const policy = await this.prisma.policy.findFirst({
      where: {
        id: policyId,
        customerId,
      },
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    if (policy.status !== PolicyStatus.IN_REVIEW) {
      throw new BadRequestException('Policy must be in review to approve');
    }

    return this.prisma.policy.update({
      where: { id: policyId },
      data: {
        status: PolicyStatus.APPROVED,
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });
  }

  async submitForReview(
    policyId: string,
    customerId: string,
    userId: string,
  ) {
    const policy = await this.prisma.policy.findFirst({
      where: {
        id: policyId,
        customerId,
      },
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    if (policy.status !== PolicyStatus.DRAFT) {
      throw new BadRequestException('Only draft policies can be submitted for review');
    }

    return this.prisma.policy.update({
      where: { id: policyId },
      data: {
        status: PolicyStatus.IN_REVIEW,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });
  }

  async getPolicyVersions(policyId: string, customerId: string) {
    const policy = await this.prisma.policy.findFirst({
      where: {
        id: policyId,
        customerId,
      },
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    return this.prisma.policyVersion.findMany({
      where: { policyId },
      orderBy: { version: 'desc' },
    });
  }

  async revertToVersion(
    policyId: string,
    customerId: string,
    userId: string,
    version: number,
  ) {
    const policy = await this.prisma.policy.findFirst({
      where: {
        id: policyId,
        customerId,
      },
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    if (policy.status === PolicyStatus.APPROVED) {
      throw new BadRequestException('Cannot revert approved policy');
    }

    const targetVersion = await this.prisma.policyVersion.findUnique({
      where: {
        policyId_version: {
          policyId,
          version,
        },
      },
    });

    if (!targetVersion) {
      throw new NotFoundException('Version not found');
    }

    const newVersion = policy.version + 1;

    return this.prisma.policy.update({
      where: { id: policyId },
      data: {
        title: targetVersion.title,
        content: targetVersion.content,
        version: newVersion,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });
  }

  private buildGenerationPrompt(template: any, dto: GeneratePolicyDto): string {
    const { customizationData, additionalInstructions } = dto;

    return `
Generate a comprehensive ${template.name} based on the following template and customization data.

TEMPLATE STRUCTURE:
${template.templateContent}

CUSTOMIZATION DATA:
${JSON.stringify(customizationData, null, 2)}

LINKED SOC 2 CONTROLS:
${template.policyTemplateControls.map(ptc => `- ${ptc.control.controlId}: ${ptc.control.title}`).join('\n')}

${additionalInstructions ? `ADDITIONAL INSTRUCTIONS:\n${additionalInstructions}\n` : ''}

Requirements:
1. Generate complete, production-ready policy content
2. Use the customization data to tailor the policy
3. Ensure all SOC 2 controls are addressed
4. Use professional, clear language
5. Include all necessary sections from the template
6. Replace ALL placeholders with actual values
7. Format in clean markdown

Generate the complete policy document now:
`;
  }

  private extractTitle(content: string, fallback: string): string {
    const lines = content.split('\n');
    const titleLine = lines.find(line => line.startsWith('# '));
    if (titleLine) {
      return titleLine.replace('# ', '').trim();
    }
    return fallback;
  }

  private async exportToPdf(policy: any, customer: any): Promise<Buffer> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    h1 { color: #1a1a1a; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; }
    h2 { color: #2d3748; margin-top: 30px; }
    h3 { color: #4a5568; }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 20px;
    }
    .company-name { font-size: 24px; font-weight: bold; color: #4f46e5; }
    .metadata {
      margin-top: 20px;
      padding: 15px;
      background: #f7fafc;
      border-left: 4px solid #4f46e5;
      font-size: 14px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #718096;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${customer?.name || 'Company'}</div>
    <h1>${policy.title}</h1>
  </div>
  
  <div class="metadata">
    <strong>Version:</strong> ${policy.version}<br>
    <strong>Status:</strong> ${policy.status}<br>
    <strong>Last Updated:</strong> ${new Date(policy.updatedAt).toLocaleDateString()}<br>
    ${policy.approvedAt ? `<strong>Approved:</strong> ${new Date(policy.approvedAt).toLocaleDateString()}<br>` : ''}
  </div>

  ${this.markdown.render(policy.content)}

  <div class="footer">
    <strong>Document ID:</strong> ${policy.id}<br>
    <strong>Generated:</strong> ${new Date().toLocaleString()}
  </div>
</body>
</html>
`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html);
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    await browser.close();
    return Buffer.from(pdf);
  }

  private async exportToDocx(policy: any, customer: any): Promise<Buffer> {
    const paragraphs: Paragraph[] = [];

    paragraphs.push(
      new Paragraph({
        text: customer?.name || 'Company',
        heading: HeadingLevel.HEADING_1,
        alignment: 'center',
      }),
    );

    paragraphs.push(
      new Paragraph({
        text: policy.title,
        heading: HeadingLevel.HEADING_1,
        alignment: 'center',
      }),
    );

    paragraphs.push(new Paragraph({ text: '' }));

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Version: ', bold: true }),
          new TextRun(policy.version.toString()),
        ],
      }),
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Status: ', bold: true }),
          new TextRun(policy.status),
        ],
      }),
    );

    paragraphs.push(new Paragraph({ text: '' }));

    const lines = policy.content.split('\n');
    for (const line of lines) {
      if (line.startsWith('# ')) {
        paragraphs.push(
          new Paragraph({
            text: line.replace('# ', ''),
            heading: HeadingLevel.HEADING_1,
          }),
        );
      } else if (line.startsWith('## ')) {
        paragraphs.push(
          new Paragraph({
            text: line.replace('## ', ''),
            heading: HeadingLevel.HEADING_2,
          }),
        );
      } else if (line.startsWith('### ')) {
        paragraphs.push(
          new Paragraph({
            text: line.replace('### ', ''),
            heading: HeadingLevel.HEADING_3,
          }),
        );
      } else {
        paragraphs.push(new Paragraph({ text: line }));
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    return Packer.toBuffer(doc);
  }
}
