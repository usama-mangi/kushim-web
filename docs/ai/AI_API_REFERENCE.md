# AI API Reference

Complete reference for all AI endpoints in Kushim.

## Table of Contents

- [Evidence Mapping](#evidence-mapping)
- [Policy Drafting](#policy-drafting)
- [Compliance Copilot](#compliance-copilot)
- [AI Orchestrator](#ai-orchestrator)
- [AI Analytics](#ai-analytics)
- [Error Handling](#error-handling)

---

## Evidence Mapping

### Map Evidence to Control

Maps a single evidence item to appropriate SOC 2 control(s).

**Endpoint:** `POST /api/ai/evidence-mapping`

**Request:**
```json
{
  "evidenceId": "string (required)"
}
```

**Response:** `201 Created`
```json
{
  "id": "mapping-uuid",
  "evidenceId": "evidence-123",
  "controlId": "CC6.1",
  "confidence": 0.92,
  "reasoning": "Evidence demonstrates MFA enforcement which directly addresses CC6.1 requirements for logical and physical access controls",
  "isManuallyReviewed": false,
  "cost": 0.0023,
  "tokens": 450,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### Get Evidence Mapping

Retrieve an existing evidence mapping.

**Endpoint:** `GET /api/ai/evidence-mapping/:id`

**Response:** `200 OK`
```json
{
  "id": "mapping-uuid",
  "evidenceId": "evidence-123",
  "controlId": "CC6.1",
  "confidence": 0.92,
  "reasoning": "...",
  "isManuallyReviewed": true,
  "reviewedBy": "user-456",
  "reviewedAt": "2024-01-15T11:00:00Z"
}
```

---

### Approve Evidence Mapping

Mark an AI-generated mapping as manually reviewed.

**Endpoint:** `POST /api/ai/evidence-mapping/:id/approve`

**Response:** `200 OK`
```json
{
  "success": true,
  "mapping": { /* updated mapping */ }
}
```

---

### List Evidence Mappings

Get all mappings for a customer.

**Endpoint:** `GET /api/ai/evidence-mapping`

**Query Parameters:**
- `controlId` (optional) - Filter by control
- `minConfidence` (optional) - Minimum confidence score (0-1)
- `reviewStatus` (optional) - `reviewed` | `pending`
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 50)

**Response:** `200 OK`
```json
{
  "data": [
    { /* mapping object */ }
  ],
  "total": 150,
  "page": 1,
  "limit": 50,
  "hasMore": true
}
```

---

### Update Evidence Mapping

Update an existing mapping (change control, confidence, etc.).

**Endpoint:** `PUT /api/ai/evidence-mapping/:id`

**Request:**
```json
{
  "controlId": "CC6.2",
  "confidence": 0.95,
  "reasoning": "Updated reasoning",
  "isManuallyReviewed": true
}
```

**Response:** `200 OK`

---

## Policy Drafting

### Generate Policy

Generate a new compliance policy using AI.

**Endpoint:** `POST /api/ai/policy-drafting`

**Request:**
```json
{
  "policyType": "ACCESS_CONTROL | DATA_PROTECTION | INCIDENT_RESPONSE | CHANGE_MANAGEMENT | RISK_ASSESSMENT | VENDOR_MANAGEMENT | ASSET_MANAGEMENT | BUSINESS_CONTINUITY | ACCEPTABLE_USE | BACKUP_RECOVERY",
  "controlIds": ["CC6.1", "CC6.2"],
  "title": "string (optional)",
  "customInstructions": "string (optional)"
}
```

**Response:** `201 Created`
```json
{
  "id": "policy-uuid",
  "title": "Access Control Policy",
  "policyType": "ACCESS_CONTROL",
  "content": "# Access Control Policy\n\n## 1. Purpose...",
  "version": 1,
  "status": "DRAFT",
  "isAiGenerated": true,
  "soc2Alignment": 0.89,
  "controlsCovered": ["CC6.1", "CC6.2"],
  "cost": 0.142,
  "tokens": 3200,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### Get Policy

Retrieve a policy by ID.

**Endpoint:** `GET /api/ai/policy-drafting/:id`

**Response:** `200 OK`

---

### List Policies

Get all policies for a customer.

**Endpoint:** `GET /api/ai/policy-drafting`

**Query Parameters:**
- `policyType` (optional) - Filter by type
- `status` (optional) - Filter by status
- `isAiGenerated` (optional) - Filter AI-generated policies

**Response:** `200 OK`
```json
{
  "data": [
    { /* policy object */ }
  ],
  "total": 24
}
```

---

### Review Policy

Get AI-powered review of a policy.

**Endpoint:** `POST /api/ai/policy-drafting/:id/review`

**Response:** `200 OK`
```json
{
  "overallScore": 0.87,
  "completeness": 0.91,
  "clarity": 0.85,
  "soc2Alignment": 0.89,
  "suggestions": [
    {
      "section": "Access Termination",
      "issue": "Missing specific timeline",
      "suggestion": "Add explicit timeline (e.g., 'within 24 hours')",
      "priority": "high"
    }
  ],
  "strengths": [
    "Clear purpose and scope",
    "Well-defined roles and responsibilities"
  ],
  "weaknesses": [
    "Missing enforcement procedures",
    "No metrics for monitoring"
  ],
  "cost": 0.056,
  "tokens": 1200
}
```

---

### Update Policy

Update policy content or metadata.

**Endpoint:** `PUT /api/ai/policy-drafting/:id`

**Request:**
```json
{
  "content": "string (optional)",
  "title": "string (optional)",
  "status": "DRAFT | REVIEW | APPROVED | ARCHIVED (optional)"
}
```

**Response:** `200 OK`

---

### Export Policy

Export policy in various formats.

**Endpoint:** `POST /api/ai/policy-drafting/:id/export`

**Request:**
```json
{
  "format": "markdown | pdf | docx | html"
}
```

**Response:** `200 OK`
```json
{
  "format": "markdown",
  "content": "# Access Control Policy\n\n...",
  "filename": "access-control-policy-v1.md"
}
```

---

### Get Policy Templates

List available policy templates.

**Endpoint:** `GET /api/ai/policy-drafting/templates`

**Response:** `200 OK`
```json
{
  "templates": [
    {
      "id": "access-control",
      "name": "Access Control Policy",
      "description": "Defines procedures for granting, modifying, and revoking access",
      "controlsCovered": ["CC6.1", "CC6.2", "CC6.3"],
      "estimatedLength": 2500
    }
  ]
}
```

---

## Compliance Copilot

### Send Chat Message

Send a message to the Compliance Copilot.

**Endpoint:** `POST /api/ai/copilot/chat`

**Request:**
```json
{
  "message": "string (required)",
  "conversationId": "string (optional)"
}
```

**Response:** `200 OK`
```json
{
  "id": "message-uuid",
  "conversationId": "conversation-uuid",
  "message": "We have 12 pieces of evidence for access control, including...",
  "citations": [
    {
      "evidenceId": "evidence-123",
      "title": "IAM MFA Policy",
      "excerpt": "All users must enable multi-factor authentication...",
      "relevanceScore": 0.94,
      "controlId": "CC6.1"
    }
  ],
  "cost": 0.0048,
  "tokens": 890,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### List Conversations

Get all Copilot conversations for a customer.

**Endpoint:** `GET /api/ai/copilot/conversations`

**Response:** `200 OK`
```json
{
  "conversations": [
    {
      "id": "conversation-uuid",
      "title": "Access Control Questions",
      "messageCount": 8,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T11:30:00Z"
    }
  ]
}
```

---

### Get Conversation

Retrieve full conversation with all messages.

**Endpoint:** `GET /api/ai/copilot/conversations/:id`

**Response:** `200 OK`
```json
{
  "id": "conversation-uuid",
  "title": "Access Control Questions",
  "messages": [
    {
      "id": "msg-1",
      "role": "user",
      "content": "What evidence do we have for CC6.1?",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": "msg-2",
      "role": "assistant",
      "content": "We have 5 pieces of evidence...",
      "citations": [],
      "createdAt": "2024-01-15T10:00:05Z"
    }
  ]
}
```

---

### Delete Conversation

Delete a conversation and all its messages.

**Endpoint:** `DELETE /api/ai/copilot/conversations/:id`

**Response:** `204 No Content`

---

## AI Orchestrator

### Batch Map Evidence

Map multiple evidence items in a single operation.

**Endpoint:** `POST /api/ai/orchestrator/batch/map-evidence`

**Request:**
```json
{
  "evidenceIds": ["ev-1", "ev-2", "ev-3"],
  "concurrency": 5
}
```

**Response:** `200 OK`
```json
{
  "successful": 3,
  "failed": 0,
  "mappings": [
    { /* mapping object */ }
  ],
  "errors": [],
  "totalCost": 0.0069,
  "totalTokens": 1350,
  "duration": 4200
}
```

---

### Batch Generate Policies

Generate multiple policies in one operation.

**Endpoint:** `POST /api/ai/orchestrator/batch/generate-policies`

**Request:**
```json
{
  "policyRequests": [
    {
      "policyType": "ACCESS_CONTROL",
      "controlIds": ["CC6.1"],
      "title": "Access Control Policy"
    },
    {
      "policyType": "DATA_PROTECTION",
      "controlIds": ["CC6.7"],
      "title": "Data Protection Policy"
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "successful": 2,
  "failed": 0,
  "mappings": [
    { /* policy object */ }
  ],
  "errors": [],
  "totalCost": 0.284,
  "totalTokens": 6400,
  "duration": 35000
}
```

---

### Get AI Dashboard

Get unified dashboard data for all AI features.

**Endpoint:** `GET /api/ai/orchestrator/dashboard`

**Response:** `200 OK`
```json
{
  "usage": {
    "totalCost": 24.56,
    "totalTokens": 456000,
    "requestCount": 1234,
    "byFeature": {
      "evidence-mapping": {
        "cost": 2.34,
        "tokens": 45000,
        "requests": 987
      },
      "policy-drafting": {
        "cost": 4.22,
        "tokens": 98000,
        "requests": 28
      },
      "copilot": {
        "cost": 18.00,
        "tokens": 313000,
        "requests": 219
      }
    }
  },
  "performance": {
    "avgResponseTime": 2840,
    "cacheHitRate": 0.62,
    "errorRate": 0.012
  },
  "insights": {
    "topControls": [
      { "controlId": "CC6.1", "count": 45 }
    ],
    "popularPolicyTypes": [
      { "type": "ACCESS_CONTROL", "count": 12 }
    ],
    "commonQuestions": [
      { "question": "What is our compliance status?", "frequency": 23 }
    ]
  }
}
```

---

### Predict Monthly Costs

Get cost prediction based on usage trends.

**Endpoint:** `GET /api/ai/orchestrator/predict-costs`

**Response:** `200 OK`
```json
{
  "estimatedMonthlyCost": 32.45,
  "trend": "increasing",
  "breakdown": {
    "evidence-mapping": 3.20,
    "policy-drafting": 4.50,
    "copilot": 24.75
  }
}
```

---

## AI Analytics

### Get Usage Statistics

Detailed usage statistics for a time period.

**Endpoint:** `GET /api/ai/analytics/usage?days=30`

**Response:** `200 OK`
```json
{
  "period": "30 days",
  "totalRequests": 1234,
  "totalCost": 28.45,
  "totalTokens": 567000,
  "byFeature": {
    "evidence-mapping": {
      "requests": 987,
      "cost": 2.56,
      "tokens": 51000,
      "avgCostPerRequest": 0.0026,
      "avgTokensPerRequest": 52
    }
  },
  "byModel": {
    "gpt-3.5-turbo": {
      "requests": 1100,
      "cost": 12.34,
      "tokens": 450000
    },
    "gpt-4-turbo-preview": {
      "requests": 134,
      "cost": 16.11,
      "tokens": 117000
    }
  },
  "byDay": [
    {
      "date": "2024-01-15",
      "requests": 42,
      "cost": 1.23,
      "tokens": 18900
    }
  ]
}
```

---

### Get Cost Breakdown

Current month cost breakdown.

**Endpoint:** `GET /api/ai/analytics/costs`

**Response:** `200 OK`
```json
{
  "total": 24.56,
  "byFeature": {
    "evidence-mapping": 2.34,
    "policy-drafting": 4.22,
    "copilot": 18.00
  },
  "byModel": {
    "gpt-3.5-turbo": 10.12,
    "gpt-4-turbo-preview": 14.44
  },
  "projectedMonthly": 32.45,
  "vsLastMonth": {
    "absolute": 4.56,
    "percentage": 15.2
  }
}
```

---

### Get Performance Metrics

Performance metrics for last 24 hours.

**Endpoint:** `GET /api/ai/analytics/performance`

**Response:** `200 OK`
```json
{
  "avgResponseTime": 2840,
  "p50ResponseTime": 2100,
  "p95ResponseTime": 8500,
  "p99ResponseTime": 15000,
  "cacheHitRate": 0.62,
  "errorRate": 0.012,
  "throughput": 2.1
}
```

---

### Get ROI Metrics

ROI calculation for AI features.

**Endpoint:** `GET /api/ai/analytics/roi`

**Response:** `200 OK`
```json
{
  "timeSavedHours": 124.5,
  "costPerHour": 0.23,
  "policiesGenerated": 28,
  "avgPolicyGenerationTime": 4,
  "evidenceMapped": 987,
  "avgMappingTime": 0.5,
  "copilotQuestions": 219,
  "avgQuestionAnswerTime": 0.25
}
```

---

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      /* Additional context */
    }
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `OPENAI_API_ERROR` | 502 | OpenAI API failure |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `COST_LIMIT_EXCEEDED` | 402 | Customer cost limit reached |
| `EVIDENCE_NOT_FOUND` | 404 | Evidence item not found |
| `INVALID_POLICY_TYPE` | 400 | Invalid policy type |
| `UNAUTHORIZED` | 401 | Invalid or missing auth token |
| `FORBIDDEN` | 403 | Insufficient permissions |

### Example Error Responses

**Rate Limit Exceeded:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded: 60 requests per minute",
    "details": {
      "limit": 60,
      "remaining": 0,
      "resetAt": "2024-01-15T10:31:00Z"
    }
  }
}
```

**Cost Limit Exceeded:**
```json
{
  "error": {
    "code": "COST_LIMIT_EXCEEDED",
    "message": "Monthly cost limit of $100.00 exceeded",
    "details": {
      "limit": 100.00,
      "current": 102.34,
      "resetAt": "2024-02-01T00:00:00Z"
    }
  }
}
```

**OpenAI API Error:**
```json
{
  "error": {
    "code": "OPENAI_API_ERROR",
    "message": "OpenAI API request failed",
    "details": {
      "openaiError": "Rate limit exceeded",
      "retryAfter": 30
    }
  }
}
```

---

## Rate Limits

### Default Limits

- **Per minute**: 60 requests
- **Per hour**: 1000 requests
- **Per day**: 10,000 requests

### Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642248060
```

---

## Authentication

All endpoints require JWT authentication:

```bash
Authorization: Bearer <jwt_token>
```

Get JWT token from `/api/auth/login` endpoint.

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)

**Response:**
```json
{
  "data": [],
  "page": 1,
  "limit": 50,
  "total": 150,
  "hasMore": true
}
```

---

## Versioning

API version is included in URL: `/api/v1/ai/...`

Current version: **v1**
