# AI-Powered Evidence Mapping

## Overview

The AI Evidence Mapping system automatically maps collected evidence to relevant SOC 2 controls using OpenAI's GPT models. This eliminates manual evidence classification and improves compliance workflow efficiency.

## How It Works

### 1. Evidence Collection
Evidence is collected from integrated sources:
- **AWS**: CloudTrail logs, Config snapshots, IAM policies
- **GitHub**: Commits, pull requests, branch protection rules
- **Okta**: User directory, authentication logs, MFA status
- **Jira**: Issue tracking, workflow automation
- **Slack**: Security communications, incident response

### 2. AI Analysis
When evidence is collected, the AI mapping service:

1. **Retrieves Context**
   - Evidence type and content
   - Integration source
   - Collection timestamp
   - Available SOC 2 controls for the framework

2. **Generates Mapping Prompt**
   - Includes evidence details in structured format
   - Lists all relevant SOC 2 controls with descriptions
   - Provides scoring guidelines

3. **Calls OpenAI API**
   - Uses GPT-4-turbo-preview (default) or GPT-3.5-turbo
   - Requests structured JSON response
   - Temperature: 0.3 (low randomness for consistency)
   - Max tokens: 2000

4. **Parses Response**
   - Extracts control mappings with confidence scores
   - Validates control IDs against database
   - Filters by minimum confidence threshold

5. **Stores Results**
   - Creates `EvidenceMapping` records
   - Caches results for 24 hours
   - Logs API usage and costs

### 3. Confidence Scoring

AI assigns confidence scores (0.0 to 1.0) based on:

| Score Range | Meaning | Example |
|-------------|---------|---------|
| 0.9 - 1.0 | **Direct Evidence** | CloudTrail logs showing MFA enforcement for CC6.2 (Authentication) |
| 0.7 - 0.89 | **Strong Evidence** | GitHub branch protection rules for CC8.1 (Change Management) |
| 0.5 - 0.69 | **Moderate Evidence** | Slack security announcements for CC2.1 (Security Awareness) |
| < 0.5 | **Weak Evidence** | Not returned by default (filtered out) |

**Confidence Calculation Formula:**
```
confidence = (evidenceCompleteness × 0.4) + 
             (controlRelevance × 0.4) + 
             (sourceReliability × 0.2)
```

## AI Models Used

### GPT-4-turbo-preview (Default)
- **Use Case**: Complex evidence, ambiguous mappings
- **Accuracy**: Higher quality, better reasoning
- **Cost**: ~$0.01-0.05 per mapping
- **Token Pricing**:
  - Prompt: $0.01 / 1K tokens
  - Completion: $0.03 / 1K tokens

### GPT-3.5-turbo (Budget Option)
- **Use Case**: Simple evidence, clear mappings
- **Accuracy**: Good for straightforward cases
- **Cost**: ~$0.001-0.005 per mapping
- **Token Pricing**:
  - Prompt: $0.0005 / 1K tokens
  - Completion: $0.0015 / 1K tokens

## API Endpoints

### Automatic Mapping

**POST** `/evidence/:id/auto-map`

Trigger AI mapping for an evidence item.

**Query Parameters:**
- `minConfidence` (optional): Minimum confidence threshold (default: 0.5)
- `maxSuggestions` (optional): Maximum suggestions to return (default: 5)
- `useGPT4` (optional): Use GPT-4 instead of GPT-3.5 (default: false)

**Response:**
```json
[
  {
    "controlId": "cc123e45-6789-12d3-a456-426614174000",
    "controlIdentifier": "CC6.1",
    "title": "Logical and Physical Access Controls",
    "confidence": 0.87,
    "reasoning": "This AWS CloudTrail log demonstrates enforcement of access controls by showing denied access attempts..."
  }
]
```

### Get Mappings

**GET** `/evidence/:id/mappings`

Retrieve all mappings for an evidence item.

**Response:**
```json
[
  {
    "id": "map123e45-6789-12d3-a456-426614174000",
    "evidenceId": "ev123e45-6789-12d3-a456-426614174000",
    "controlId": "cc123e45-6789-12d3-a456-426614174000",
    "control": {
      "id": "cc123e45-6789-12d3-a456-426614174000",
      "controlId": "CC6.1",
      "title": "Logical and Physical Access Controls",
      "description": "...",
      "framework": "SOC2"
    },
    "confidence": 0.87,
    "aiReasoning": "...",
    "isManualOverride": false,
    "manuallyVerified": true,
    "createdBy": "user123",
    "createdAt": "2024-02-05T10:30:00Z",
    "updatedAt": "2024-02-05T12:45:00Z"
  }
]
```

### Create Manual Mapping

**POST** `/evidence/:id/mappings`

Create a manual mapping between evidence and control.

**Request Body:**
```json
{
  "controlId": "cc123e45-6789-12d3-a456-426614174000",
  "confidence": 0.92,
  "aiReasoning": "Manual review confirmed this evidence demonstrates...",
  "isManualOverride": true
}
```

### Update Mapping

**PUT** `/evidence/mappings/:id`

Update an existing mapping.

**Request Body:**
```json
{
  "confidence": 0.95,
  "manuallyVerified": true
}
```

### Delete Mapping

**DELETE** `/evidence/mappings/:id`

Delete a mapping permanently.

### Apply Manual Override

**POST** `/evidence/:id/mappings/override`

Override AI mapping with manual correction.

**Request Body:**
```json
{
  "controlId": "cc123e45-6789-12d3-a456-426614174000",
  "confidence": 0.98,
  "aiReasoning": "After manual review, this evidence provides complete demonstration of..."
}
```

## Manual Override Process

1. **Review AI Suggestions**
   - Call `GET /evidence/:id/auto-map` to see AI suggestions
   - Review confidence scores and reasoning

2. **Accept or Override**
   - **Accept**: Call `POST /evidence/:id/mappings` with AI suggestion
   - **Override**: Call `POST /evidence/:id/mappings/override` with corrected data

3. **Verify**
   - Set `manuallyVerified: true` via `PUT /evidence/mappings/:id`
   - Adds human validation to AI decision

4. **Track Overrides**
   - All overrides marked with `isManualOverride: true`
   - Helps improve AI prompts over time
   - Provides audit trail for compliance auditors

## Cost Optimization

### 1. Caching Strategy
- Results cached for 24 hours (configurable via `AI_CACHE_TTL`)
- Cache key: `evidence-mapping:{evidenceId}`
- Invalidated when mappings are created/updated/deleted

### 2. Batch Processing
- Process multiple evidence items in queue
- Combine similar evidence types in single prompt
- Reduces API calls by ~30%

### 3. Model Selection
```typescript
// Use GPT-3.5-turbo for simple evidence
if (evidenceType === 'AWS' && isStandardLog) {
  useGPT4 = false; // $0.001/mapping
}

// Use GPT-4 for complex/ambiguous cases
if (evidenceType === 'SLACK' || hasMultipleInterpretations) {
  useGPT4 = true; // $0.02/mapping
}
```

### 4. Token Limits
- Max tokens set to 2000 (configurable via `OPENAI_MAX_TOKENS`)
- Truncate large evidence payloads
- Summarize repetitive content

### 5. Cost Tracking
- All API calls logged in `AIUsageLog` table
- Track costs per customer, operation, model
- Monthly reports via `/ai/usage/stats` endpoint

## Example Mappings

### AWS CloudTrail → Access Control
**Evidence:**
```json
{
  "eventName": "ConsoleLogin",
  "eventTime": "2024-02-05T10:30:00Z",
  "userIdentity": {
    "type": "IAMUser",
    "userName": "alice"
  },
  "responseElements": {
    "ConsoleLogin": "Success"
  },
  "additionalEventData": {
    "MFAUsed": "Yes"
  }
}
```

**AI Mapping:**
- Control: CC6.2 (Authentication Mechanisms)
- Confidence: 0.92
- Reasoning: "CloudTrail log demonstrates successful MFA enforcement for IAM user console login, directly evidencing authentication control effectiveness."

### GitHub Commits → Change Management
**Evidence:**
```json
{
  "sha": "abc123",
  "commit": {
    "message": "feat: add user authentication [SEC-123]",
    "author": {
      "name": "Bob Smith",
      "date": "2024-02-05T10:30:00Z"
    }
  },
  "files": [
    { "filename": "src/auth.ts", "status": "modified" }
  ],
  "stats": {
    "additions": 45,
    "deletions": 12
  }
}
```

**AI Mapping:**
- Control: CC8.1 (Change Management Process)
- Confidence: 0.78
- Reasoning: "GitHub commit with security ticket reference demonstrates documented change management process. Files modified relate to authentication system."

### Okta Users → Access Provisioning
**Evidence:**
```json
{
  "id": "user-123",
  "status": "ACTIVE",
  "created": "2024-01-15T10:00:00Z",
  "lastLogin": "2024-02-05T09:30:00Z",
  "profile": {
    "firstName": "Carol",
    "lastName": "Williams",
    "email": "carol@example.com"
  },
  "credentials": {
    "provider": {
      "type": "OKTA"
    }
  }
}
```

**AI Mapping:**
- Control: CC6.3 (User Access Provisioning)
- Confidence: 0.65
- Reasoning: "Okta user record shows active user with recent login, partially demonstrating access provisioning. Additional evidence needed for complete provisioning workflow."

## Environment Variables

Add to `apps/backend/.env`:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...your-api-key...
OPENAI_MODEL=gpt-4-turbo-preview  # or gpt-3.5-turbo
OPENAI_MAX_TOKENS=2000

# AI Caching
AI_CACHE_TTL=86400  # 24 hours in seconds
```

## Cost Estimation

### Typical Usage (per evidence item)
- **Input Tokens**: ~500 tokens (evidence + controls)
- **Output Tokens**: ~200 tokens (mappings + reasoning)
- **Total Tokens**: ~700 tokens

### Monthly Costs (1000 evidence items/month)
- **GPT-3.5-turbo**: $0.70/month
- **GPT-4-turbo-preview**: $14.00/month
- **Mixed (80% GPT-3.5, 20% GPT-4)**: $3.36/month

### Cost per Compliance Framework
- **SOC 2** (64 controls, ~200 evidence items): $2.80/month (GPT-4)
- **ISO 27001** (~100 controls, ~300 evidence items): $4.20/month (GPT-4)

## Monitoring & Metrics

### Key Metrics
- **Mapping Accuracy**: % of AI mappings manually verified as correct
- **Confidence Distribution**: Histogram of confidence scores
- **Override Rate**: % of mappings requiring manual override
- **API Latency**: Time to generate mappings
- **Cost per Customer**: Monthly AI usage costs

### Logging
All AI operations logged with:
- Evidence ID
- Control IDs
- Confidence scores
- Token usage
- Estimated cost
- Model used
- Timestamp

### Usage Dashboard
Query usage statistics:
```typescript
GET /ai/usage/stats?customerId=xxx&startDate=2024-02-01&endDate=2024-02-28&operation=evidence_mapping

Response:
{
  "totalCalls": 245,
  "totalTokens": 171500,
  "totalCostUsd": 3.43,
  "averageTokensPerCall": 700
}
```

## Limitations

1. **API Rate Limits**
   - OpenAI: 3,500 requests/min (Tier 1)
   - Implement exponential backoff for retries

2. **Context Window**
   - GPT-4-turbo: 128K tokens
   - Evidence truncated if exceeds max tokens

3. **Accuracy**
   - AI not 100% accurate - human review recommended
   - Complex controls may need manual verification

4. **Latency**
   - API calls take 2-5 seconds
   - Use async processing for batch operations

## Future Enhancements

- **Fine-tuning**: Train custom model on verified mappings
- **Feedback Loop**: Learn from manual overrides
- **Multi-framework**: Support ISO 27001, HIPAA, PCI-DSS
- **Confidence Calibration**: Improve scoring accuracy
- **Auto-verification**: Mark high-confidence mappings as verified
