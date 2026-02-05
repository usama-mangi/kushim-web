# Swagger API - Quick Reference Card

## 🌐 URLs

| Resource | URL |
|----------|-----|
| **Swagger UI** | http://localhost:3001/api/docs |
| **OpenAPI JSON** | http://localhost:3001/api/docs-json |
| **API Base** | http://localhost:3001/api |

## 🔑 Authentication

```bash
# 1. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# 2. Copy accessToken from response
# 3. In Swagger UI, click "Authorize"
# 4. Enter: Bearer <token>
```

## 📋 Common Endpoints

### Auth
```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me
```

### Users
```
GET    /api/users/profile
PATCH  /api/users/profile
POST   /api/users/change-password
```

### Compliance
```
GET    /api/compliance/controls?page=1&limit=50
GET    /api/compliance/alerts
POST   /api/compliance/scan
```

### Integrations
```
GET    /api/integrations
POST   /api/integrations/aws/connect
GET    /api/integrations/aws/health
```

## 📊 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Server Error |

## 🛠️ Quick Commands

### Export OpenAPI Schema
```bash
curl http://localhost:3001/api/docs-json > api.json
```

### Generate TypeScript SDK
```bash
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3001/api/docs-json \
  -g typescript-axios \
  -o ./sdk
```

### Test with cURL
```bash
# Get controls
curl -X GET "http://localhost:3001/api/compliance/controls" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📚 Documentation

| File | Description |
|------|-------------|
| `docs/SWAGGER_QUICK_START.md` | Quick start guide |
| `docs/API_DOCUMENTATION.md` | Complete API reference |
| `README_SWAGGER.md` | Features overview |

## 🎯 API Tags

- `auth` - Authentication
- `users` - User management
- `compliance` - Compliance monitoring
- `evidence` - Evidence collection
- `integrations` - Integration management
- `integrations/aws` - AWS integration
- `integrations/github` - GitHub integration
- `integrations/okta` - Okta integration
- `health` - Health check

## 💡 Tips

1. Use **Filter** to search endpoints
2. Click **"Try it out"** to test
3. Token persists in browser
4. Check **Schemas** at bottom for data models
5. Copy as **cURL** for command-line testing

## 🚀 Start Using

1. `npm run dev` (in apps/backend)
2. Open http://localhost:3001/api/docs
3. Authorize with JWT token
4. Test endpoints!

---

**Need Help?** See full documentation in `docs/` folder
