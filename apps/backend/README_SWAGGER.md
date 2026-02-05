# Kushim API - Swagger/OpenAPI Documentation

## Overview

The Kushim backend API is fully documented using **Swagger/OpenAPI 3.0** specification, providing interactive, self-documenting API endpoints.

## �� Access Points

| Environment | Swagger UI | OpenAPI JSON |
|-------------|-----------|--------------|
| **Local Development** | http://localhost:3001/api/docs | http://localhost:3001/api/docs-json |
| **Staging** | https://staging-api.kushim.io/api/docs | https://staging-api.kushim.io/api/docs-json |
| **Production** | https://api.kushim.io/api/docs | https://api.kushim.io/api/docs-json |

## 📚 Documentation Files

1. **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - Complete API reference guide
2. **[SWAGGER_QUICK_START.md](docs/SWAGGER_QUICK_START.md)** - Quick start guide for testing
3. **[SWAGGER_IMPLEMENTATION.md](SWAGGER_IMPLEMENTATION.md)** - Technical implementation details

## 🎯 Features

### Comprehensive Coverage
- ✅ **9 Controllers** fully documented
- ✅ **40+ Endpoints** with detailed descriptions
- ✅ **30+ DTOs** with property documentation
- ✅ **10 API Tags** for organized navigation
- ✅ **15+ Response Types** with examples

### Developer Experience
- ✅ **Interactive Testing** - "Try it out" on every endpoint
- ✅ **JWT Authentication** - Built-in auth with token persistence
- ✅ **Request Examples** - Pre-filled example data
- ✅ **Response Schemas** - Complete type definitions
- ✅ **Error Documentation** - All error codes and formats
- ✅ **Code Generation** - Export OpenAPI spec for SDK generation

### Security
- ✅ **Bearer Token Auth** - JWT authentication documented
- ✅ **Rate Limiting** - Limits documented per endpoint
- ✅ **Role-Based Access** - Admin endpoints clearly marked
- ✅ **Validation Rules** - Input constraints documented

## 🚀 Quick Start

### 1. Start the Backend
```bash
cd apps/backend
npm run dev
```

### 2. Open Swagger UI
Navigate to: http://localhost:3001/api/docs

### 3. Authenticate
1. Click **"Authorize"** button (top right)
2. Login to get JWT token:
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@kushim.io", "password": "admin123"}'
   ```
3. Copy the `accessToken` from response
4. Enter in Swagger UI: `Bearer <token>`
5. Click **"Authorize"**

### 4. Test Endpoints
- Expand any endpoint
- Click **"Try it out"**
- Fill parameters (if any)
- Click **"Execute"**
- View response

## 📖 API Modules

### Authentication (`/api/auth`)
User authentication, registration, and account management.

**Endpoints:**
- POST `/auth/login` - Login
- POST `/auth/register` - Register
- GET `/auth/me` - Get current user
- POST `/auth/verify-email` - Verify email
- POST `/auth/forgot-password` - Password reset request
- POST `/auth/reset-password` - Reset password
- POST `/auth/accept-invitation` - Accept invitation

### Users (`/api/users`)
User profile and organization user management.

**Endpoints:**
- GET `/users/profile` - Get profile
- PATCH `/users/profile` - Update profile
- POST `/users/change-password` - Change password
- POST `/users/invite` - Invite user (admin)
- GET `/users` - List users (admin)
- GET `/users/:id` - Get user (admin)
- DELETE `/users/:id` - Deactivate user (admin)

### Compliance (`/api/compliance`)
Compliance monitoring, controls, and reporting.

**Endpoints:**
- GET `/compliance/controls` - List controls (paginated)
- GET `/compliance/controls/:id` - Get control details
- GET `/compliance/alerts` - Recent alerts (paginated)
- GET `/compliance/trends` - Compliance trends
- POST `/compliance/scan` - Trigger scan

### Evidence (`/api/evidence`)
Evidence collection and verification.

**Endpoints:**
- GET `/evidence/control/:controlId` - Get evidence by control
- GET `/evidence/:id` - Get evidence by ID
- GET `/evidence/:id/verify` - Verify evidence integrity

### Integrations (`/api/integrations`)
Third-party integration management.

**Endpoints:**
- GET `/integrations` - List integrations
- POST `/integrations/:type/connect` - Connect integration
- DELETE `/integrations/type/:type` - Delete by type
- DELETE `/integrations/:id` - Delete by ID

**Supported Types:** aws, github, okta, jira, slack

### Integration-Specific Endpoints

#### AWS (`/api/integrations/aws`)
- GET `/integrations/aws/health`
- POST `/integrations/aws/evidence/iam`
- POST `/integrations/aws/evidence/s3`
- POST `/integrations/aws/evidence/cloudtrail`

#### GitHub (`/api/integrations/github`)
- GET `/integrations/github/repos`
- POST `/integrations/github/setup`
- GET `/integrations/github/health`
- POST `/integrations/github/evidence/branch-protection`
- POST `/integrations/github/evidence/commit-signing`
- POST `/integrations/github/evidence/security`

#### Okta (`/api/integrations/okta`)
- GET `/integrations/okta/health`
- POST `/integrations/okta/evidence/mfa`
- POST `/integrations/okta/evidence/user-access`
- POST `/integrations/okta/evidence/policy-compliance`

## 🛠️ Developer Tools

### Export OpenAPI Schema
```bash
curl http://localhost:3001/api/docs-json > kushim-api.json
```

### Generate Client SDK

**TypeScript/Axios:**
```bash
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3001/api/docs-json \
  -g typescript-axios \
  -o ./client-sdk
```

**Python:**
```bash
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3001/api/docs-json \
  -g python \
  -o ./python-client
```

**Other Languages:** javascript, java, go, ruby, php, etc.

### Import to Postman
1. In Postman, click **Import**
2. Enter URL: `http://localhost:3001/api/docs-json`
3. Click **Import**
4. All endpoints are now in Postman

### Use with Insomnia
1. In Insomnia, click **Create** > **Import From**
2. Select **URL**
3. Enter: `http://localhost:3001/api/docs-json`
4. Click **Fetch and Import**

## 📊 API Statistics

| Metric | Count |
|--------|-------|
| Total Endpoints | 40+ |
| Controllers | 9 |
| DTOs | 30+ |
| API Tags | 10 |
| Request DTOs | 15+ |
| Response DTOs | 15+ |
| Error Types | 5+ |

## 🔐 Authentication

All protected endpoints require JWT authentication:

```
Authorization: Bearer <your-jwt-token>
```

Get token from `/api/auth/login` or `/api/auth/register`.

**Token expires:** 24 hours (configurable)

## 📝 Response Format

### Success Response
```json
{
  "data": {...},
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## ⚡ Rate Limiting

| Endpoint Type | Limit |
|--------------|-------|
| Most endpoints | 100 req/min |
| Compliance scan | 10 req/min |
| Auth endpoints | 20 req/min |

Exceeded limits return `429 Too Many Requests`.

## 🎨 Customization

The Swagger UI is customized with:
- **Persistent authorization** - Token saved in browser
- **Filtering** - Search through endpoints
- **Custom styling** - Branded UI
- **Request duration** - See response times
- **Multiple environments** - Local, staging, production

## 📞 Support

- **Documentation**: See `docs/` folder
- **Issues**: Report on GitHub
- **API Status**: Check `/api` endpoint
- **Email**: support@kushim.io

## 🎓 Learning Resources

1. **[Quick Start Guide](docs/SWAGGER_QUICK_START.md)** - Get started in 5 minutes
2. **[Full API Reference](docs/API_DOCUMENTATION.md)** - Complete endpoint documentation
3. **[Swagger UI](http://localhost:3001/api/docs)** - Interactive testing
4. **[OpenAPI Spec](https://spec.openapis.org/oas/v3.0.0)** - Specification reference

## ✨ What's Documented

- ✅ All request/response schemas
- ✅ All HTTP methods and paths
- ✅ Authentication requirements
- ✅ Query parameters and validation
- ✅ Path parameters
- ✅ Request bodies
- ✅ Success responses (200, 201)
- ✅ Error responses (400, 401, 403, 404, 429, 500)
- ✅ Pagination parameters
- ✅ Example values
- ✅ Data types and formats
- ✅ Required vs optional fields
- ✅ Enum values
- ✅ Descriptions for all fields

## 🚦 Next Steps

1. **Explore the API**: Open http://localhost:3001/api/docs
2. **Read the guide**: Check `docs/SWAGGER_QUICK_START.md`
3. **Test endpoints**: Use "Try it out" feature
4. **Generate SDK**: Export OpenAPI spec and generate client
5. **Integrate**: Use in your frontend application

---

**The Kushim API is fully documented and ready to use!** 🎉
