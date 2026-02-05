# AI Features - Getting Started

## Quick Start (5 minutes)

### 1. Setup OpenAI API Key

```bash
# Add to apps/backend/.env
OPENAI_API_KEY=sk-...your-key-here...
AI_ENABLED=true
```

Get your API key from: https://platform.openai.com/api-keys

### 2. Start the Backend

```bash
npm run backend:dev
```

### 3. Test AI Features

#### Test Evidence Mapping

```bash
curl -X POST http://localhost:3001/api/ai/evidence-mapping \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "evidenceId": "evidence-123"
  }'
```

#### Test Policy Generation

```bash
curl -X POST http://localhost:3001/api/ai/policy-drafting \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "policyType": "ACCESS_CONTROL",
    "controlIds": ["CC6.1", "CC6.2"]
  }'
```

#### Test Copilot Chat

```bash
curl -X POST http://localhost:3001/api/ai/copilot/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "What is SOC 2 compliance?"
  }'
```

## Feature Walkthroughs

### Evidence Mapping

**Use Case:** You've collected 50 AWS security configurations and need to map them to SOC 2 controls.

**Steps:**

1. **Collect Evidence**
   ```typescript
   // Evidence is auto-collected via integrations
   // Or manually uploaded via UI
   ```

2. **Map Single Evidence**
   ```typescript
   const mapping = await fetch('/api/ai/evidence-mapping', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`,
     },
     body: JSON.stringify({ evidenceId: 'evidence-1' }),
   });
   ```

3. **Review AI Suggestion**
   ```json
   {
     "id": "mapping-1",
     "evidenceId": "evidence-1",
     "controlId": "CC6.1",
     "confidence": 0.92,
     "reasoning": "Evidence shows MFA enforcement which directly addresses logical access control requirements in CC6.1",
     "isManuallyReviewed": false
   }
   ```

4. **Approve or Reject**
   ```typescript
   await fetch(`/api/ai/evidence-mapping/${mappingId}/approve`, {
     method: 'POST',
   });
   ```

5. **Batch Process** (recommended for >10 items)
   ```typescript
   const result = await fetch('/api/ai/orchestrator/batch/map-evidence', {
     method: 'POST',
     body: JSON.stringify({
       evidenceIds: ['ev-1', 'ev-2', 'ev-3', ...],
       concurrency: 5,
     }),
   });
   
   // Response
   {
     "successful": 48,
     "failed": 2,
     "totalCost": 0.096,
     "duration": 12400
   }
   ```

### Policy Drafting

**Use Case:** You need an Access Control Policy aligned with SOC 2 CC6.1 and CC6.2.

**Steps:**

1. **Generate Policy**
   ```typescript
   const policy = await fetch('/api/ai/policy-drafting', {
     method: 'POST',
     body: JSON.stringify({
       policyType: 'ACCESS_CONTROL',
       controlIds: ['CC6.1', 'CC6.2'],
       title: 'Access Control Policy',
     }),
   });
   ```

2. **Review Generated Content**
   ```json
   {
     "id": "policy-1",
     "title": "Access Control Policy",
     "content": "# Access Control Policy\n\n## 1. Purpose...",
     "soc2Alignment": 0.89,
     "controlsCovered": ["CC6.1", "CC6.2"],
     "cost": 0.142
   }
   ```

3. **Get AI Review**
   ```typescript
   const review = await fetch(`/api/ai/policy-drafting/${policyId}/review`, {
     method: 'POST',
   });
   
   // Response
   {
     "overallScore": 0.87,
     "completeness": 0.91,
     "clarity": 0.85,
     "suggestions": [
       {
         "section": "Access Termination",
         "issue": "Missing specific timeline for access revocation",
         "suggestion": "Add explicit timeline (e.g., 'within 24 hours')",
         "priority": "high"
       }
     ]
   }
   ```

4. **Refine and Approve**
   ```typescript
   // Make edits based on suggestions
   await fetch(`/api/ai/policy-drafting/${policyId}`, {
     method: 'PUT',
     body: JSON.stringify({
       content: updatedContent,
       status: 'APPROVED',
     }),
   });
   ```

5. **Export Policy**
   ```typescript
   const exported = await fetch(`/api/ai/policy-drafting/${policyId}/export`, {
     method: 'POST',
     body: JSON.stringify({ format: 'markdown' }),
   });
   ```

### Compliance Copilot

**Use Case:** Auditor asks "What evidence do you have for access control?"

**Steps:**

1. **Start Conversation**
   ```typescript
   const response = await fetch('/api/ai/copilot/chat', {
     method: 'POST',
     body: JSON.stringify({
       message: 'What evidence do we have for access control?',
     }),
   });
   ```

2. **Review Response with Citations**
   ```json
   {
     "id": "msg-1",
     "conversationId": "conv-1",
     "message": "We have 12 pieces of evidence for access control:\n\n1. IAM MFA Policy - Enforces multi-factor authentication...",
     "citations": [
       {
         "evidenceId": "ev-123",
         "title": "IAM MFA Policy",
         "excerpt": "All users must enable MFA...",
         "relevanceScore": 0.94,
         "controlId": "CC6.1"
       }
     ]
   }
   ```

3. **Follow-up Questions**
   ```typescript
   // Context is maintained
   const followUp = await fetch('/api/ai/copilot/chat', {
     method: 'POST',
     body: JSON.stringify({
       message: 'What about encryption at rest?',
       conversationId: 'conv-1',
     }),
   });
   ```

4. **Common Questions**

   - "What is our compliance status?"
   - "What controls are we missing?"
   - "Show me recent evidence for CC6.1"
   - "What policies need to be updated?"
   - "Explain the difference between Type I and Type II SOC 2"
   - "What are the requirements for CC7.2?"

## Common Use Cases

### Scenario 1: Initial Compliance Setup

```typescript
// 1. Collect evidence from integrations
await integrationsService.syncAll();

// 2. Batch map all evidence
const mappingResult = await orchestrator.batchMapEvidence({
  evidenceIds: allEvidenceIds,
  concurrency: 10,
});

// 3. Identify control gaps
const gaps = await copilot.chat({
  message: 'What controls are we missing?',
});

// 4. Generate policies for missing controls
for (const control of gaps.missingControls) {
  await policyDrafting.generatePolicy({
    controlIds: [control],
  });
}
```

### Scenario 2: Monthly Compliance Check

```typescript
// 1. Ask Copilot for status
const status = await copilot.chat({
  message: 'What is our current compliance status?',
});

// 2. Review unmapped evidence
const unmapped = await evidenceMapping.getUnmapped();

// 3. Map new evidence
await orchestrator.batchMapEvidence({
  evidenceIds: unmapped.map(e => e.id),
});

// 4. Check for outdated policies
const insights = await orchestrator.getDashboardData();
```

### Scenario 3: Audit Preparation

```typescript
// 1. Export all policies
const policies = await policyDrafting.listPolicies();
for (const policy of policies) {
  await policyDrafting.exportPolicy({
    policyId: policy.id,
    format: 'pdf',
  });
}

// 2. Generate evidence report
const report = await copilot.chat({
  message: 'Generate a summary of all evidence mapped to controls',
});

// 3. Practice auditor Q&A
const qa = [
  'How do you enforce MFA?',
  'What is your backup retention policy?',
  'How often are access reviews conducted?',
];

for (const question of qa) {
  const answer = await copilot.chat({ message: question });
  console.log(`Q: ${question}\nA: ${answer.message}\n`);
}
```

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional (defaults shown)
AI_ENABLED=true
AI_COST_LIMIT_PER_CUSTOMER=100
AI_MODEL_DEFAULT=gpt-3.5-turbo
AI_MODEL_PREMIUM=gpt-4-turbo-preview

# Rate Limiting
AI_RATE_LIMIT_PER_MINUTE=60
AI_RATE_LIMIT_PER_HOUR=1000
AI_RATE_LIMIT_PER_DAY=10000

# Feature Toggles
AI_EVIDENCE_MAPPING_ENABLED=true
AI_POLICY_DRAFTING_ENABLED=true
AI_COPILOT_ENABLED=true

# Caching
AI_CACHE_ENABLED=true

# Retry Logic
AI_RETRY_MAX_ATTEMPTS=3
AI_RETRY_BACKOFF_MS=1000
AI_RETRY_BACKOFF_MULTIPLIER=2
```

### Cost Monitoring

```typescript
// Get usage statistics
const usage = await fetch('/api/ai/analytics/usage?days=30');

// Get cost breakdown
const costs = await fetch('/api/ai/analytics/costs');

// Predict monthly costs
const prediction = await fetch('/api/ai/orchestrator/predict-costs');

console.log(`Estimated monthly cost: $${prediction.estimatedMonthlyCost}`);
```

### Setting Cost Limits

```typescript
// Set customer cost limit
await prisma.customer.update({
  where: { id: customerId },
  data: { aiCostLimit: 50 }, // $50/month limit
});

// AI requests will fail when limit exceeded
```

## Troubleshooting

### Issue: "OpenAI API Error: Rate limit exceeded"

**Solution:**
```typescript
// Reduce concurrency
await orchestrator.batchMapEvidence({
  evidenceIds: ids,
  concurrency: 3, // Lower from 10
});

// Or wait and retry
```

### Issue: "Low confidence scores on evidence mapping"

**Solution:**
- Provide more detailed evidence descriptions
- Include relevant metadata
- Use manual mapping as fallback
- Review control definitions

### Issue: "High costs"

**Solution:**
```typescript
// Check usage breakdown
const costs = await analytics.getCostBreakdown(customerId);

// Enable aggressive caching
AI_CACHE_ENABLED=true

// Use GPT-3.5 more
AI_MODEL_DEFAULT=gpt-3.5-turbo

// Batch operations
```

## Next Steps

1. ✅ Complete this getting started guide
2. 📖 Read [AI_API_REFERENCE.md](./AI_API_REFERENCE.md) for full API docs
3. 💰 Review [AI_COST_GUIDE.md](./AI_COST_GUIDE.md) for cost optimization
4. 🎯 Explore example use cases in `apps/backend/src/ai/__tests__/e2e/`

## Support

- **Documentation**: `/docs/ai/`
- **API Reference**: See `AI_API_REFERENCE.md`
- **Issues**: GitHub Issues
- **Email**: support@kushim.ai
