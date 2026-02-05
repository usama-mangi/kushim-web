import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAIPromptTemplates() {
  console.log('🌱 Seeding AI prompt templates...');

  const templates = [
    {
      name: 'evidence_mapping_v1',
      description: 'Map evidence to SOC 2 controls with confidence scoring',
      template: `Analyze the following evidence and determine which SOC 2 controls it maps to.

EVIDENCE DETAILS:
Type: {{evidenceType}}
Collected: {{collectedAt}}
Data: {{evidenceData}}

AVAILABLE CONTROLS:
{{controlsList}}

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

Only include mappings with confidence >= 0.5. Maximum 10 mappings.`,
      variables: ['evidenceType', 'collectedAt', 'evidenceData', 'controlsList'],
      isActive: true,
      version: 1,
    },
    {
      name: 'control_recommendation_v1',
      description: 'Recommend controls based on integration type',
      template: `Given the following integration type and available data, recommend which SOC 2 controls should be monitored.

INTEGRATION TYPE: {{integrationType}}
AVAILABLE DATA POINTS: {{dataPoints}}

FRAMEWORK: SOC 2

Recommend the most relevant controls and explain why they should be monitored for this integration.

Return JSON format:
{
  "recommendations": [
    {
      "control_id": "CC6.1",
      "priority": "high",
      "reasoning": "Explanation"
    }
  ]
}`,
      variables: ['integrationType', 'dataPoints'],
      isActive: true,
      version: 1,
    },
  ];

  for (const template of templates) {
    await prisma.aIPromptTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template,
    });
  }

  console.log('✅ AI prompt templates seeded');
}

async function main() {
  try {
    await seedAIPromptTemplates();
  } catch (error) {
    console.error('❌ Error seeding AI templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
