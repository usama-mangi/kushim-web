# Swagger API Documentation - Quick Start Guide

## 🚀 Access the Documentation

**Development Server:** http://localhost:3001/api/docs

## 🔑 Authentication

### Step 1: Get a JWT Token

**Option A: Register a new account**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Option B: Login with existing account**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

Response will include an `accessToken`:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### Step 2: Authorize in Swagger UI

1. Open http://localhost:3001/api/docs
2. Click the **"Authorize"** button (🔓 icon) at the top right
3. In the popup, enter: `Bearer <your-access-token>`
4. Click **"Authorize"** then **"Close"**
5. The 🔓 icon changes to 🔒 indicating you're authenticated

### Step 3: Test Protected Endpoints

1. Find any endpoint with a 🔒 icon (protected)
2. Click to expand it
3. Click **"Try it out"**
4. Fill in parameters (if any)
5. Click **"Execute"**
6. View the response below

## 📋 Common Workflows

### Test Authentication Flow

1. **POST** `/api/auth/register` - Create account
2. **GET** `/api/auth/me` - Verify authentication works
3. **PATCH** `/api/users/profile` - Update your profile

### Test Compliance Monitoring

1. **GET** `/api/compliance/controls` - List all controls
2. **GET** `/api/compliance/alerts` - Check recent alerts
3. **POST** `/api/compliance/scan` - Trigger a new scan
4. **GET** `/api/compliance/trends?days=7` - View 7-day trends

### Test Integrations

1. **GET** `/api/integrations` - List configured integrations
2. **POST** `/api/integrations/aws/connect` - Connect AWS
3. **GET** `/api/integrations/aws/health` - Check health
4. **POST** `/api/integrations/aws/evidence/iam` - Collect evidence

### Test Evidence Collection

1. **GET** `/api/evidence/control/CC6.1` - Get evidence for control
2. **GET** `/api/evidence/{id}` - Get specific evidence
3. **GET** `/api/evidence/{id}/verify` - Verify evidence integrity

## 🎯 Key Features

### Filter Endpoints
Use the **Filter** box at the top to search for specific endpoints or tags.

### Try It Out
Every endpoint has a **"Try it out"** button to test directly in the UI.

### Schema Models
Scroll down to see all request/response schemas with examples.

### Copy cURL
After executing a request, click **"Copy as cURL"** to get the command.

### Download Spec
Download the OpenAPI JSON spec from: http://localhost:3001/api/docs-json

## 🏷️ API Tags (Modules)

- **auth** - Authentication and registration
- **users** - User management and profiles
- **compliance** - Compliance controls and monitoring
- **evidence** - Evidence collection and verification
- **integrations** - Integration management
- **integrations/aws** - AWS-specific endpoints
- **integrations/github** - GitHub-specific endpoints
- **integrations/okta** - Okta-specific endpoints
- **health** - Health check endpoints

## 📊 Response Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation error)
- **401** - Unauthorized (not authenticated)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **429** - Too Many Requests (rate limited)
- **500** - Internal Server Error

## 💡 Tips

1. **Persistence**: Your JWT token is saved in the browser (if enabled in settings)
2. **Validation**: Request bodies show validation rules in the schema
3. **Examples**: Click on schemas to see example values
4. **Errors**: Check response schemas for error formats
5. **Pagination**: Most list endpoints support `page` and `limit` query params

## 🔧 Troubleshooting

### "Unauthorized" Error
- Make sure you clicked "Authorize" and entered a valid token
- Token format must be: `Bearer <token>` (with space)
- Login again if your token expired

### "Not Found" Error
- Check that the backend server is running
- Verify the endpoint path is correct
- Ensure you're using the right HTTP method (GET, POST, etc.)

### "Validation Failed" Error
- Check required fields are filled
- Verify data types match schema
- Look at example values in the schema

## 📚 Additional Resources

- **Full API Guide**: See `docs/API_DOCUMENTATION.md`
- **OpenAPI JSON**: http://localhost:3001/api/docs-json
- **Server Status**: http://localhost:3001/api

## 🎉 You're Ready!

Start exploring the API with Swagger UI. All endpoints are documented with examples, schemas, and "Try it out" functionality.

Happy testing! 🚀
