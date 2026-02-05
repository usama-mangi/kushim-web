# AI Cost Guide

## Overview

This guide helps you understand, monitor, and optimize AI costs in Kushim.

## Cost Breakdown

### Pricing Models (OpenAI GPT)

| Model | Input (per 1K tokens) | Output (per 1K tokens) | Use Case |
|-------|---------------------|----------------------|----------|
| GPT-3.5 Turbo | $0.0005 | $0.0015 | Evidence mapping, Copilot chat |
| GPT-4 Turbo | $0.01 | $0.03 | Policy drafting, complex analysis |
| GPT-4 | $0.03 | $0.06 | Not used (expensive, use Turbo instead) |

### Feature Costs (Average)

| Feature | Model | Avg Tokens | Avg Cost | Use Frequency |
|---------|-------|------------|----------|---------------|
| Evidence Mapping | GPT-3.5 | 450 | $0.002 | High (1000/month) |
| Policy Generation | GPT-4 Turbo | 3200 | $0.15 | Medium (20/month) |
| Policy Review | GPT-4 Turbo | 1200 | $0.06 | Medium (20/month) |
| Copilot Message | GPT-3.5 | 890 | $0.005 | Very High (5000/month) |
| Batch Mapping (10 items) | GPT-3.5 | 4500 | $0.012 | Medium (100 batches) |

## Monthly Cost Estimates

### Small Team (1-10 users)

```
Evidence Mapping:     100 items  × $0.002  = $0.20
Policy Drafting:      5 policies × $0.15   = $0.75
Copilot Messages:     500 msgs   × $0.005  = $2.50
--------------------------------
Total:                                      $3.45/month
```

### Medium Team (10-50 users)

```
Evidence Mapping:     500 items  × $0.002  = $1.00
Policy Drafting:      15 policies × $0.15  = $2.25
Copilot Messages:     2000 msgs  × $0.005  = $10.00
--------------------------------
Total:                                      $13.25/month
```

### Large Team (50-100 users)

```
Evidence Mapping:     1000 items × $0.002  = $2.00
Policy Drafting:      30 policies × $0.15  = $4.50
Copilot Messages:     5000 msgs  × $0.005  = $25.00
--------------------------------
Total:                                      $31.50/month
```

### Enterprise (100+ users)

```
Evidence Mapping:     5000 items × $0.002  = $10.00
Policy Drafting:      50 policies × $0.15  = $7.50
Copilot Messages:     20000 msgs × $0.005  = $100.00
--------------------------------
Total:                                      $117.50/month
```

## Cost Optimization Strategies

### 1. Aggressive Caching

**Impact:** 40-60% cost reduction

```typescript
// Cache hit rates by feature
{
  controlDescriptions: 95%,  // Rarely change
  policyTemplates: 78%,      // Daily refresh
  copilotResponses: 42%      // Hourly refresh
}
```

**Configuration:**
```bash
# .env
AI_CACHE_ENABLED=true
REDIS_URL=redis://localhost:6379
```

**Savings:** $12-18/month for medium team

### 2. Model Selection

**Impact:** 20-40% cost reduction

Use GPT-3.5 Turbo instead of GPT-4 where possible:

```typescript
// Current allocation
{
  evidenceMapping: 'gpt-3.5-turbo',    // ✅ Correct choice
  policyDrafting: 'gpt-4-turbo',       // ✅ Quality needed
  copilot: 'gpt-3.5-turbo',            // ✅ Correct choice
}

// Optimization: Use GPT-3.5 for policy reviews
{
  policyReview: 'gpt-3.5-turbo',       // Save 67% vs GPT-4 Turbo
}
```

**Savings:** $2-4/month for medium team

### 3. Batch Processing

**Impact:** 30-40% cost reduction

Process multiple items in single API call:

```typescript
// ❌ Individual processing (expensive)
for (const evidence of evidenceList) {
  await mapEvidence(evidence.id);
}
// Cost: 100 × $0.002 = $0.20

// ✅ Batch processing (cheaper)
await batchMapEvidence(evidenceList.map(e => e.id));
// Cost: 1 batch × $0.012 = $0.012 (40% savings)
```

**Savings:** $4-6/month for medium team

### 4. Request Deduplication

**Impact:** 10-20% cost reduction

Avoid redundant API calls:

```typescript
// Cache frequently asked questions
const popularQuestions = [
  'What is SOC 2 compliance?',
  'What controls are required?',
  // etc.
];

// Pre-generate and cache answers
for (const question of popularQuestions) {
  const answer = await copilot.chat(question);
  cache.set(`copilot:${hash(question)}`, answer, 24 * 60 * 60);
}
```

**Savings:** $1-3/month for medium team

### 5. Prompt Optimization

**Impact:** 15-25% cost reduction

Reduce token usage in prompts:

```typescript
// ❌ Verbose prompt (expensive)
const prompt = `
You are a compliance expert with deep knowledge of SOC 2, ISO 27001, 
HIPAA, and many other frameworks. You have worked with hundreds of 
companies to achieve compliance certification...
[2000 tokens of context]

Please map this evidence to a control: ${evidence}
`;

// ✅ Concise prompt (cheaper)
const prompt = `
Map evidence to SOC 2 control:
Evidence: ${evidence.title}
Description: ${evidence.description}
`;
```

**Savings:** $2-5/month for medium team

### 6. Smart Fallbacks

**Impact:** 10-30% cost reduction during failures

Use cheaper models as fallback:

```typescript
async function generatePolicy(data) {
  try {
    // Try GPT-4 Turbo first
    return await openai.chat('gpt-4-turbo', prompt);
  } catch (error) {
    if (error.code === 'rate_limit') {
      // Fallback to GPT-3.5 (67% cheaper)
      return await openai.chat('gpt-3.5-turbo', prompt);
    }
    throw error;
  }
}
```

**Savings:** Variable, helps avoid complete failures

## Cost Monitoring

### Set Up Alerts

```typescript
// apps/backend/src/ai/config/ai.config.ts

export default {
  costAlerts: {
    dailyLimit: 5.00,      // Alert if >$5/day
    weeklyLimit: 30.00,    // Alert if >$30/week
    monthlyLimit: 100.00,  // Hard limit $100/month
  },
  
  alertChannels: ['email', 'slack'],
};
```

### Monitor Usage Dashboard

```bash
# Get real-time usage
curl http://localhost:3001/api/ai/analytics/usage?days=7

# Get cost breakdown
curl http://localhost:3001/api/ai/analytics/costs

# Predict monthly costs
curl http://localhost:3001/api/ai/orchestrator/predict-costs
```

### Set Customer Limits

```typescript
// Prevent runaway costs
await prisma.customer.update({
  where: { id: customerId },
  data: {
    aiCostLimit: 50.00,  // $50/month hard limit
  },
});

// Requests will fail with HTTP 402 when exceeded
```

## Budgeting Recommendations

### By Company Size

| Company Size | Recommended Budget | Buffer | Total |
|-------------|-------------------|--------|-------|
| Startup (1-10) | $5/month | $5 | $10/month |
| Small (10-50) | $15/month | $10 | $25/month |
| Medium (50-100) | $35/month | $15 | $50/month |
| Large (100-500) | $100/month | $50 | $150/month |
| Enterprise (500+) | $300/month | $200 | $500/month |

### By Use Case

**Initial Compliance Setup (one-time):**
```
- Collect 500 evidence items
- Map all evidence: 500 × $0.002 = $1.00
- Generate 10 policies: 10 × $0.15 = $1.50
- Review policies: 10 × $0.06 = $0.60
- Total: $3.10 (one-time)
```

**Ongoing Compliance (monthly):**
```
- Map 100 new evidence: 100 × $0.002 = $0.20
- Update 2 policies: 2 × $0.15 = $0.30
- Copilot queries: 1000 × $0.005 = $5.00
- Total: $5.50/month
```

**Audit Preparation (one-time):**
```
- Review all evidence: 1000 queries × $0.005 = $5.00
- Generate reports: 5 × $0.15 = $0.75
- Copilot Q&A practice: 500 × $0.005 = $2.50
- Total: $8.25 (one-time)
```

## Cost Comparison: AI vs Manual

### Evidence Mapping

| Method | Time | Cost | Accuracy |
|--------|------|------|----------|
| Manual | 30 min/item | $25/item* | 95% |
| AI with review | 2 min/item | $0.002 + $2/item* | 88% |
| **Savings** | **93%** | **92%** | **-7%** |

*Assuming $50/hour labor cost

### Policy Drafting

| Method | Time | Cost | Quality |
|--------|------|------|---------|
| Manual | 4 hours/policy | $200/policy* | Excellent |
| AI with editing | 30 min/policy | $0.15 + $25/policy* | Very Good |
| **Savings** | **87%** | **87%** | **-10%** |

*Assuming $50/hour labor cost

### Copilot vs Research

| Method | Time | Cost |
|--------|------|------|
| Manual research | 15 min/question | $12.50/question* |
| Copilot | 30 sec/question | $0.005/question |
| **Savings** | **97%** | **99.96%** |

*Assuming $50/hour labor cost

### Total ROI

For a medium team (50 users):

```
Monthly AI Cost:        $13.25
Manual Equivalent:      $2,400
Savings:                $2,386.75/month
ROI:                    17,900%
Payback Period:         Immediate
```

## Cost Reduction Checklist

- [ ] Enable aggressive caching (`AI_CACHE_ENABLED=true`)
- [ ] Use batch processing for >10 items
- [ ] Review model selection (use GPT-3.5 where possible)
- [ ] Set customer cost limits
- [ ] Pre-cache common questions
- [ ] Optimize prompts (remove unnecessary context)
- [ ] Enable request deduplication
- [ ] Monitor usage dashboard weekly
- [ ] Set up cost alerts
- [ ] Review monthly cost trends

## Advanced Optimization

### Custom Fine-tuning (Future)

Fine-tune models on your data for 50-90% cost reduction:

```
Current:  GPT-4 Turbo @ $0.15/policy
Fine-tuned: GPT-3.5 Fine-tuned @ $0.02/policy
Savings:  87% per policy
```

**Requirements:**
- 1000+ training examples
- $500-2000 fine-tuning cost
- Payback: 3-6 months for medium team

### Self-hosted Models (Future)

Run open-source models locally for 95%+ cost reduction:

```
Current:  OpenAI GPT @ $30/month
Self-hosted: Llama 2 @ $0 (just infrastructure)
```

**Requirements:**
- GPU infrastructure ($200-500/month)
- Model expertise
- Lower quality than GPT-4

## Frequently Asked Questions

**Q: What happens if I exceed my cost limit?**

A: New AI requests will fail with HTTP 402 error. Existing data remains accessible.

**Q: Can I get a refund if AI suggestions are wrong?**

A: OpenAI charges are non-refundable. Use manual review to catch errors.

**Q: How do I reduce costs for high-volume usage?**

A: Enable caching, use batch processing, and consider custom fine-tuning.

**Q: What if OpenAI raises prices?**

A: We'll notify customers 30 days in advance. Cost limits protect against surprise bills.

**Q: Can I set different limits for different teams?**

A: Yes, cost limits are per customer. Contact support for multi-tenant setups.

## Support

For cost-related questions:
- Email: billing@kushim.ai
- Slack: #ai-cost-optimization
- Documentation: `/docs/ai/`

## Appendix: Token Estimation

### How to estimate tokens

**Rule of thumb:** 1 token ≈ 4 characters (English)

```typescript
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Example
const evidence = {
  title: "AWS IAM MFA Policy",      // ~20 chars = 5 tokens
  description: "All users must...", // ~200 chars = 50 tokens
};
// Total: ~55 tokens input
// AI response: ~400 tokens output
// Cost: (55 × $0.0005 + 400 × $0.0015) / 1000 = $0.0006
```

### Reducing token usage

1. **Shorter prompts** - Remove unnecessary instructions
2. **Summarize context** - Don't include full evidence text
3. **Structured output** - JSON instead of prose
4. **Limit response length** - Use `max_tokens` parameter

## Version History

- v1.0 (2024-01-15) - Initial cost guide
