# Kushim API Documentation

Complete API documentation for the Kushim Compliance Automation Platform.

## Overview

The Kushim API provides comprehensive endpoints for managing compliance automation, integrations, evidence collection, and user management. All endpoints are documented using OpenAPI/Swagger specification.

## Base URL

- **Local Development:** `http://localhost:3001/api`
- **Staging:** `https://staging-api.kushim.io/api`
- **Production:** `https://api.kushim.io/api`

## Interactive Documentation

Access the interactive Swagger UI documentation at:

- **Local:** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
- **OpenAPI JSON:** [http://localhost:3001/api/docs-json](http://localhost:3001/api/docs-json)

## Authentication

Most endpoints require JWT authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

1. **Register** a new account: `POST /api/auth/register`
2. **Login** with credentials: `POST /api/auth/login`
3. Use the returned `accessToken` in subsequent requests

### Example Login Request

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "YourPassword123"
  }'
```

### Example Response

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "customerId": "550e8400-e29b-41d4-a716-446655440001"
  }
}
```

## API Modules

### Authentication (`/api/auth`)

Manage user authentication and account lifecycle.

**Endpoints:**
- `POST /auth/login` - Login with email and password
- `POST /auth/register` - Register a new account
- `POST /auth/verify-email` - Verify email with token
- `POST /auth/resend-verification` - Resend verification email
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/accept-invitation` - Accept user invitation
- `GET /auth/me` - Get current user (requires auth)

### Users (`/api/users`)

Manage user profiles and organization users.

**Endpoints:**
- `GET /users/profile` - Get current user profile
- `PATCH /users/profile` - Update current user profile
- `POST /users/change-password` - Change password
- `POST /users/invite` - Invite a new user (admin only)
- `GET /users` - List all users (admin only)
- `GET /users/:id` - Get user by ID (admin only)
- `DELETE /users/:id` - Deactivate user (admin only)

### Compliance (`/api/compliance`)

Monitor compliance controls, alerts, and trends.

**Endpoints:**
- `GET /compliance/controls` - List all compliance controls (paginated)
- `GET /compliance/controls/:id` - Get control details
- `GET /compliance/alerts` - Get recent compliance alerts (paginated)
- `GET /compliance/trends` - Get compliance score trends
- `POST /compliance/scan` - Trigger compliance scan

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `days` (optional): Number of days for trends (default: 7, max: 90)

### Evidence (`/api/evidence`)

Retrieve and verify compliance evidence.

**Endpoints:**
- `GET /evidence/control/:controlId` - Get evidence by control
- `GET /evidence/:id` - Get evidence by ID
- `GET /evidence/:id/verify` - Verify evidence integrity

### Integrations (`/api/integrations`)

Manage third-party integrations.

**Endpoints:**
- `GET /integrations` - List all integrations
- `POST /integrations/:type/connect` - Connect an integration
- `DELETE /integrations/type/:type` - Delete integration by type
- `DELETE /integrations/:id` - Delete integration by ID

**Supported Integration Types:**
- `aws` - Amazon Web Services
- `github` - GitHub
- `okta` - Okta Identity Management
- `jira` - Jira Project Management
- `slack` - Slack Notifications

### AWS Integration (`/api/integrations/aws`)

**Endpoints:**
- `GET /integrations/aws/health` - Get AWS integration health
- `POST /integrations/aws/evidence/iam` - Collect IAM evidence
- `POST /integrations/aws/evidence/s3` - Collect S3 evidence
- `POST /integrations/aws/evidence/cloudtrail` - Collect CloudTrail evidence

### GitHub Integration (`/api/integrations/github`)

**Endpoints:**
- `GET /integrations/github/repos` - List accessible repositories
- `POST /integrations/github/setup` - Complete GitHub setup
- `GET /integrations/github/health` - Get GitHub integration health
- `POST /integrations/github/evidence/branch-protection` - Collect branch protection evidence
- `POST /integrations/github/evidence/commit-signing` - Collect commit signing evidence
- `POST /integrations/github/evidence/security` - Collect security evidence

### Okta Integration (`/api/integrations/okta`)

**Endpoints:**
- `GET /integrations/okta/health` - Get Okta integration health
- `POST /integrations/okta/evidence/mfa` - Collect MFA enforcement evidence
- `POST /integrations/okta/evidence/user-access` - Collect user access evidence
- `POST /integrations/okta/evidence/policy-compliance` - Collect policy compliance evidence

## Error Responses

All endpoints return standardized error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Not authenticated or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Default:** 100 requests per minute per user
- **Compliance Scan:** 10 requests per minute per user

When rate limit is exceeded, you'll receive a `429 Too Many Requests` response.

## Pagination

List endpoints support pagination with query parameters:

```
GET /api/compliance/controls?page=1&limit=50
```

**Response Format:**
```json
{
  "controls": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

## Examples

### Complete Authentication Flow

```bash
# 1. Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123",
    "firstName": "Jane",
    "lastName": "Smith"
  }'

# 2. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123"
  }'

# 3. Get current user (use token from login)
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Connect AWS Integration

```bash
curl -X POST http://localhost:3001/api/integrations/aws/connect \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "accessKeyId": "AKIA...",
      "secretAccessKey": "secret...",
      "region": "us-east-1"
    }
  }'
```

### Trigger Compliance Scan

```bash
curl -X POST http://localhost:3001/api/compliance/scan \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Compliance Controls

```bash
curl -X GET "http://localhost:3001/api/compliance/controls?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Testing with Swagger UI

1. Navigate to [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
2. Click "Authorize" button at the top
3. Enter your JWT token with `Bearer ` prefix
4. Click "Authorize" then "Close"
5. Expand any endpoint and click "Try it out"
6. Fill in parameters and click "Execute"

## Export OpenAPI Schema

Download the complete OpenAPI 3.0 specification:

```bash
curl http://localhost:3001/api/docs-json > kushim-api-spec.json
```

## SDK Generation

Use the OpenAPI specification to generate client SDKs:

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:3001/api/docs-json \
  -g typescript-axios \
  -o ./client-sdk

# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:3001/api/docs-json \
  -g python \
  -o ./python-client
```

## Support

For API support and questions:
- Email: support@kushim.io
- Documentation: https://kushim.io/docs
- Status: https://status.kushim.io
