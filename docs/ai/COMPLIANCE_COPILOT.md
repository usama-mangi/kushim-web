# Compliance Copilot

## Overview

Compliance Copilot is an AI-powered assistant that helps users understand and manage their SOC 2 compliance status. Think of it as "ChatGPT for compliance" - it provides context-aware, intelligent responses to questions about controls, evidence, policies, and integrations.

## Key Features

### 1. Natural Language Q&A
Ask questions in plain English and get expert answers:
- "What is CC1.2 and why is it important?"
- "Show me all failed controls from last week"
- "What policies do I need for access control?"
- "How is my compliance score trending?"

### 2. Context-Aware Responses
The Copilot uses **Retrieval-Augmented Generation (RAG)** to provide accurate, customer-specific answers:
- Automatically retrieves relevant controls, evidence, policies, and integration data
- Includes citations and sources in responses
- Maintains conversation history for contextual follow-ups

### 3. Smart Suggestions
Proactive recommendations based on your compliance status:
- Failed controls that need attention
- Stale integrations requiring sync
- Policies overdue for review
- Recent evidence collection successes

### 4. Cost-Optimized AI
Intelligent model selection to balance quality and cost:
- **GPT-3.5 Turbo** for simple queries (~$0.001-0.003 per message)
- **GPT-4 Turbo** for complex analysis (~$0.01-0.05 per message)
- Smart caching to reduce redundant API calls
- Token limits to prevent excessive costs

### 5. Conversation Memory
- Persistent conversation history
- Context-aware follow-up questions
- Archive old conversations
- Track costs per conversation

## API Endpoints

### Create Conversation
```http
POST /api/copilot/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Help with CC1.2" // optional
}
```

**Response:**
```json
{
  "id": "conv-123",
  "customerId": "customer-123",
  "userId": "user-123",
  "title": "Help with CC1.2",
  "status": "ACTIVE",
  "createdAt": "2024-02-05T12:00:00Z",
  "updatedAt": "2024-02-05T12:00:00Z",
  "lastMessageAt": null,
  "messageCount": 0
}
```

### Send Message
```http
POST /api/copilot/conversations/:id/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What is CC1.2?"
}
```

**Rate Limit:** 10 messages per minute per user

**Response:**
```json
{
  "id": "msg-123",
  "conversationId": "conv-123",
  "role": "ASSISTANT",
  "content": "CC1.2 is a SOC 2 Trust Services Criteria that focuses on...",
  "metadata": {
    "controls": ["CC1.2"],
    "policies": [],
    "evidence": [],
    "sources": [
      {
        "type": "control",
        "id": "ctrl-123",
        "title": "CC1.2"
      }
    ]
  },
  "tokens": 150,
  "cost": 0.0045,
  "createdAt": "2024-02-05T12:00:00Z"
}
```

### Get Conversation
```http
GET /api/copilot/conversations/:id
Authorization: Bearer <token>
```

**Response:** Conversation with full message history

### List Conversations
```http
GET /api/copilot/conversations
Authorization: Bearer <token>
```

**Response:** Array of active conversations (max 50)

### Archive Conversation
```http
DELETE /api/copilot/conversations/:id
Authorization: Bearer <token>
```

**Response:** 204 No Content

### Get Smart Suggestions
```http
GET /api/copilot/suggestions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "suggestions": [
    {
      "title": "3 controls need attention",
      "description": "CC1.2, CC6.1, and A1.2 have failed compliance checks",
      "type": "CONTROL",
      "priority": "HIGH",
      "action": "Review the failed controls and gather missing evidence",
      "metadata": {
        "controlIds": ["ctrl-1", "ctrl-2", "ctrl-3"]
      }
    }
  ],
  "healthScore": 0.85,
  "generatedAt": "2024-02-05T12:00:00Z"
}
```

## Example Use Cases

### 1. Understanding Controls
**User:** "What is CC1.2 and why is it important?"

**Copilot:** "CC1.2 is a SOC 2 Trust Services Criteria under the Common Criteria (CC) category. It focuses on the control environment and organizational structure.

**Why it's important:**
- Demonstrates that your organization has a structured approach to internal controls
- Shows commitment to compliance at all organizational levels
- Required for SOC 2 Type II certification

**Your Status:** CC1.2 is currently PASSING based on evidence collected on 2024-02-05. You have documented organizational charts and control responsibilities."

### 2. Analyzing Evidence
**User:** "Show me evidence for access control"

**Copilot:** "Here's your access control evidence:

**Recent Evidence:**
- AWS IAM policies (collected 2024-02-05) - Multi-factor authentication enforced
- Okta user access logs (collected 2024-02-04) - 150 active users
- GitHub branch protection rules (collected 2024-02-03) - Required reviews enabled

**Controls Covered:**
- CC6.1: Logical and Physical Access Controls
- CC6.2: Prior to Issuing System Credentials
- A1.2: Access Management

**Recommendation:** Your access control evidence is current. Consider setting up automated daily collection to maintain continuous compliance."

### 3. Policy Guidance
**User:** "What policies do I need for SOC 2?"

**Copilot:** "For SOC 2 compliance, you need these essential policies:

**Currently Approved:**
- Information Security Policy ✓
- Access Control Policy ✓
- Incident Response Policy ✓

**Draft Status (needs review):**
- Business Continuity Policy
- Risk Assessment Policy

**Missing:**
- Vendor Management Policy (HIGH priority)
- Change Management Policy (MEDIUM priority)

**Next Steps:**
1. Review and approve draft policies
2. Use our policy templates to create missing policies
3. Schedule quarterly policy reviews"

### 4. Compliance Score Analysis
**User:** "How is my compliance score?"

**Copilot:** "**Overall Compliance Health:** 85% (Good)

**Breakdown:**
- Passing Controls: 85/100
- Failed Controls: 10/100
- Warning Status: 5/100

**Recent Trends:**
- +5% improvement over last month
- 3 controls moved from FAIL to PASS this week

**Areas Needing Attention:**
1. Access Control (CC6.x) - 2 failed checks
2. Data Encryption (CC7.x) - 1 warning

**Recommendation:** Focus on the failed access control checks. Your integrations are healthy and evidence collection is on track."

## Cost Estimates

### Per Message Pricing

| Query Type | Model | Avg Tokens | Avg Cost |
|------------|-------|-----------|----------|
| Simple question (What is CC1.2?) | GPT-3.5 Turbo | 200-400 | $0.001-0.002 |
| Medium query (Show evidence) | GPT-3.5 Turbo | 400-800 | $0.002-0.004 |
| Complex analysis | GPT-4 Turbo | 800-1500 | $0.02-0.05 |

### Monthly Estimates

| Usage Level | Messages/Month | Estimated Cost |
|-------------|---------------|----------------|
| Light (5 users, 10 msg/day) | 1,500 | $3-7 |
| Medium (20 users, 20 msg/day) | 12,000 | $25-60 |
| Heavy (50 users, 30 msg/day) | 45,000 | $90-200 |

**Note:** Costs vary based on query complexity and context size.

## Architecture

### RAG (Retrieval-Augmented Generation)

1. **User sends question** → "What is CC1.2?"
2. **Context Retrieval:**
   - Search controls for "CC1.2" pattern
   - Get recent compliance checks for that control
   - Retrieve related evidence
   - Fetch integration status
3. **Prompt Construction:**
   - System prompt (role, capabilities, customer context)
   - Conversation history (last 10 messages)
   - User question + retrieved context
4. **OpenAI API Call:**
   - Model selection (GPT-3.5 or GPT-4)
   - Generate response
5. **Response Processing:**
   - Extract metadata (sources, controls, policies)
   - Store message with cost tracking
   - Return formatted response

### Context Retrieval Logic

The system automatically retrieves relevant data based on keywords:

- **Control IDs** (CC1.2, A1.2, etc.) → Fetch control details
- "evidence" or "proof" → Recent evidence with integration data
- "policy" or "policies" → Customer policies by relevance
- Integration names (AWS, GitHub, etc.) → Integration status
- Always includes compliance statistics

### Conversation Memory

- Stores last 10 messages in context window
- Enables follow-up questions without repeating context
- Automatically prunes old messages to control costs
- Tracks total tokens and cost per conversation

## Security & Privacy

### Data Isolation
- All queries are scoped to the user's customer ID
- No data leakage between customers
- Tenant isolation enforced at database level

### Sensitive Data Handling
- Credentials and secrets are never sent to OpenAI
- Evidence data is summarized (not full payloads)
- PII is sanitized from logs

### Rate Limiting
- 10 messages per minute per user
- Prevents abuse and cost overruns
- HTTP 429 response when limit exceeded

### Audit Trail
- All AI usage logged in `ai_usage_logs` table
- Tracks: model, tokens, cost, operation, timestamp
- Customer-level cost reporting available

## Best Practices

### For Users

1. **Be Specific:** "What is CC1.2?" is better than "Tell me about controls"
2. **Use Follow-ups:** Build on previous context instead of repeating
3. **Reference IDs:** Mention control IDs (CC1.2) or resource names
4. **Ask for Actions:** "What should I do about failed controls?" gets actionable advice

### For Developers

1. **Monitor Costs:** Track usage per customer via analytics
2. **Cache Common Queries:** Cache answers to "What is CC1.2?" type questions
3. **Optimize Context:** Only include relevant data in prompts
4. **Test Edge Cases:** Handle missing data, stale integrations, etc.

## Limitations

### What Copilot CAN Do
✅ Explain SOC 2 controls in plain English  
✅ Summarize customer compliance status  
✅ Analyze evidence and provide recommendations  
✅ Answer questions about policies and integrations  
✅ Suggest proactive improvements  

### What Copilot CANNOT Do
❌ Generate legally binding audit reports (use official export features)  
❌ Guarantee SOC 2 certification (requires official audit)  
❌ Modify controls, evidence, or policies directly (read-only)  
❌ Provide advice outside SOC 2 framework  
❌ Access data from other customers (strict isolation)  

## Troubleshooting

### "Conversation not found"
- Conversation was archived or deleted
- Check conversation ID in the URL
- Create a new conversation

### "Rate limit exceeded"
- Slow down to 10 messages per minute
- Wait 60 seconds and retry
- Consider batching multiple questions in one message

### Low-quality responses
- Provide more context in your question
- Reference specific controls or resources
- Try rephrasing the question
- Use follow-up questions to refine

### High costs
- Review usage logs in analytics dashboard
- Limit complex queries (triggers GPT-4)
- Archive old conversations
- Consider caching frequent questions

## Analytics & Monitoring

### Track Usage
```typescript
// Get usage stats for a customer
const stats = await usageTrackerService.getUsageStats({
  customerId: 'customer-123',
  startDate: new Date('2024-02-01'),
  endDate: new Date('2024-02-28'),
  operation: 'copilot_chat',
});

console.log(stats);
// {
//   totalCalls: 150,
//   totalTokens: 75000,
//   totalCostUsd: 15.50,
//   averageTokensPerCall: 500
// }
```

### Popular Questions
Query the database to find common patterns:
```sql
SELECT metadata->>'messageLength' as question_length, COUNT(*)
FROM ai_usage_logs
WHERE operation = 'copilot_chat'
GROUP BY question_length
ORDER BY COUNT(*) DESC;
```

## Future Enhancements

### Planned Features
- 🔄 **Streaming Responses:** Real-time message streaming via WebSocket
- 📊 **Conversation Analytics:** Popular questions, response quality metrics
- 🎯 **Smart Caching:** Cache common questions to reduce costs
- 🔍 **Semantic Search:** Vector embeddings for better context retrieval
- 📝 **Suggested Questions:** Show relevant questions based on context
- 🌐 **Multi-language:** Support for non-English queries
- 📱 **Mobile Optimizations:** Shorter responses for mobile clients

### Integration Ideas
- Slack bot for Copilot access
- Email digests with smart suggestions
- Calendar integration for policy review reminders
- Dashboard widget for quick questions

## Support

For issues or questions:
- **Technical Issues:** File a GitHub issue
- **Feature Requests:** Contact product team
- **Cost Concerns:** Review analytics dashboard or contact support

---

**Version:** 1.0.0  
**Last Updated:** February 5, 2024  
**Maintainer:** Kushim Engineering Team
