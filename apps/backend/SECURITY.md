# Security Implementation Guide

This document outlines the comprehensive security measures implemented in the Kushim NestJS backend.

## Table of Contents

1. [Security Headers](#security-headers)
2. [CORS Configuration](#cors-configuration)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [XSS Protection](#xss-protection)
5. [Rate Limiting](#rate-limiting)
6. [Audit Logging](#audit-logging)
7. [Session Management](#session-management)
8. [Best Practices](#best-practices)

## Security Headers

### Helmet Integration

Helmet is configured in `src/main.ts` to set secure HTTP headers automatically:

```typescript
helmet({
  contentSecurityPolicy: { ... },
  hsts: { ... },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
})
```

### Content Security Policy (CSP)

Configured to prevent XSS attacks:

- `default-src 'self'` - Only allow resources from same origin
- `script-src 'self'` - Only allow scripts from same origin
- `object-src 'none'` - Disable plugins
- `frame-src 'none'` - Prevent clickjacking

### HTTP Strict Transport Security (HSTS)

Forces HTTPS connections for 1 year:

- Max age: 31536000 seconds (1 year)
- Include subdomains: true
- Preload: true

### Other Headers

- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin

## CORS Configuration

### Production vs Development

**Production:**
```typescript
origin: [process.env.FRONTEND_URL]
```

**Development:**
```typescript
origin: ['http://localhost:3000', 'http://localhost:3001']
```

### Settings

- **Credentials**: Enabled for cookie-based authentication
- **Methods**: GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization, X-Requested-With, Accept, Origin
- **Exposed Headers**: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- **Max Age**: 86400 seconds (24 hours)

### Configuration

Update `FRONTEND_URL` in `.env`:
```env
FRONTEND_URL=https://app.kushim.com
```

## Input Validation & Sanitization

### Global Validation Pipe

Configured in `src/main.ts`:

```typescript
new ValidationPipe({
  whitelist: true,              // Strip non-whitelisted properties
  transform: true,              // Auto-transform payloads to DTO types
  forbidNonWhitelisted: true,   // Throw error if non-whitelisted properties exist
  forbidUnknownValues: true,    // Throw error for unknown values
  transformOptions: {
    enableImplicitConversion: false  // Prevent type coercion exploits
  },
  disableErrorMessages: process.env.NODE_ENV === 'production'
})
```

### Custom Validation Decorators

Located in `src/common/decorators/validators.ts`:

#### @IsUUID4()
Validates UUID v4 format:
```typescript
@IsUUID4()
userId: string;
```

#### @IsSecureEmail()
Validates email with security checks:
```typescript
@IsSecureEmail()
email: string;
```

Prevents:
- Script injection in emails
- CRLF injection
- Path traversal

#### @IsStrongPassword()
Enforces strong password requirements:
```typescript
@IsStrongPassword()
password: string;
```

Requirements:
- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

#### @IsWhitelistedUrl()
Validates URLs against whitelist:
```typescript
@IsWhitelistedUrl(['kushim.com', 'api.kushim.com'])
callbackUrl: string;
```

Features:
- Only allows HTTPS
- Checks against domain whitelist
- Prevents javascript:, data:, vbscript: URLs

#### @IsSafeString()
Allows only alphanumeric + basic punctuation:
```typescript
@IsSafeString()
name: string;
```

#### @IsSecureJSON()
Validates JSON with size limit:
```typescript
@IsSecureJSON(100) // Max 100KB
metadata: any;
```

### SQL Injection Protection

Custom pipe in `src/common/pipes/validation.pipe.ts`:

```typescript
@UsePipes(new SqlInjectionPipe())
```

Detects and blocks:
- SQL keywords (UNION, SELECT, DROP, etc.)
- Comment sequences (--, /*, */)
- Stored procedure calls (xp_)

**Note:** Prisma ORM provides built-in SQL injection protection through parameterized queries.

## XSS Protection

### Middleware

XSS Protection Middleware (`src/common/middleware/xss-protection.middleware.ts`) automatically sanitizes:

- Request body
- Query parameters
- URL parameters

### Sanitization

Escapes dangerous characters:
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- `'` → `&#x27;`
- `/` → `&#x2F;`
- `&` → `&amp;`

Removes:
- `javascript:` protocol
- Event handlers (`onclick=`, `onerror=`, etc.)

### CSP Headers

Content Security Policy headers prevent inline script execution and restrict resource loading.

## Rate Limiting

### @nestjs/throttler Integration

Configured in `src/app.module.ts`:

```typescript
ThrottlerModule.forRoot([
  {
    name: 'default',
    ttl: 60000,    // 60 seconds
    limit: 100,    // 100 requests per minute
  },
  {
    name: 'auth',
    ttl: 60000,    // 60 seconds
    limit: 5,      // 5 requests per minute
  }
])
```

### Custom Rate Limit Guard

Located in `src/common/guards/rate-limit.guard.ts`:

Features:
- Per-user and per-customer limits
- Per-endpoint tracking
- Custom limits via decorator
- Redis-backed for distributed systems

### Usage

**Apply to specific endpoints:**
```typescript
@UseGuards(RateLimitGuard)
@RateLimit({ points: 10, duration: 60 })
@Post('login')
async login() { ... }
```

**Apply to entire controller:**
```typescript
@Controller('auth')
@RateLimit({ points: 5, duration: 60 })
export class AuthController { ... }
```

### Response Headers

Rate limit information included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Timestamp when limit resets

## Audit Logging

### AuditService

Located in `src/audit/audit.service.ts`:

### Supported Actions

```typescript
enum AuditAction {
  USER_LOGIN,
  USER_LOGOUT,
  USER_CREATED,
  USER_UPDATED,
  PASSWORD_CHANGED,
  INTEGRATION_CONNECTED,
  COMPLIANCE_CHECK_RUN,
  EVIDENCE_COLLECTED,
  SECURITY_ALERT,
  // ... and more
}
```

### Severity Levels

```typescript
enum AuditSeverity {
  INFO,
  WARNING,
  ERROR,
  CRITICAL
}
```

### Usage

**Basic logging:**
```typescript
await this.auditService.log(
  AuditAction.USER_LOGIN,
  {
    userId: user.id,
    customerId: user.customerId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  },
  { success: true },
  AuditSeverity.INFO
);
```

**Login tracking:**
```typescript
await this.auditService.logLogin(
  userId,
  customerId,
  ipAddress,
  userAgent,
  success
);
```

**Data changes:**
```typescript
await this.auditService.logDataChange(
  AuditAction.USER_UPDATED,
  context,
  'User',
  userId,
  { changedFields: ['email', 'role'] }
);
```

**Security events:**
```typescript
await this.auditService.logSecurityEvent(
  'Multiple failed login attempts',
  context,
  { attempts: 5 }
);
```

### Querying Audit Logs

```typescript
const { logs, total } = await this.auditService.getAuditLogs(
  customerId,
  {
    userId: 'user-id',
    action: AuditAction.USER_LOGIN,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    limit: 100,
    offset: 0
  }
);
```

### Suspicious Activity Detection

```typescript
const isSuspicious = await this.auditService.detectSuspiciousActivity(
  customerId,
  userId
);
```

Flags:
- More than 5 failed login attempts in 1 hour

### Database Schema

```prisma
model AuditLog {
  id         String        @id @default(uuid())
  action     String
  severity   AuditSeverity @default(INFO)
  userId     String?
  customerId String?
  ipAddress  String?
  userAgent  String?
  requestId  String?
  metadata   Json?
  createdAt  DateTime      @default(now())
}
```

## Session Management

### Configuration

Secure session settings in `src/config/security.config.ts`:

```typescript
session: {
  secret: process.env.SESSION_SECRET,
  name: 'kushim.sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,          // HTTPS only in production
    sameSite: 'strict',    // Prevent CSRF
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
}
```

### Cookie Security

- **httpOnly**: Prevents JavaScript access to cookies
- **secure**: HTTPS only (production)
- **sameSite**: 'strict' in production, 'lax' in development
- **maxAge**: 24-hour expiration

### Environment Variables

Required in `.env`:
```env
SESSION_SECRET=your-super-secret-key-min-32-chars
NODE_ENV=production
```

## Best Practices

### 1. Environment Variables

**Never commit secrets!**

Required variables:
```env
# Database
DATABASE_URL=postgresql://...

# Sessions
SESSION_SECRET=min-32-character-random-string

# Frontend
FRONTEND_URL=https://app.kushim.com

# Node Environment
NODE_ENV=production
```

### 2. Password Hashing

Always use bcrypt with proper cost factor:

```typescript
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
```

### 3. JWT Security

- Use short expiration times (15-30 minutes for access tokens)
- Use refresh tokens with longer expiration (7 days)
- Store refresh tokens in httpOnly cookies
- Implement token rotation
- Validate token signature and expiration

### 4. Input Validation

Always validate and sanitize user input:

```typescript
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsSecureEmail()
  email: string;

  @IsStrongPassword()
  password: string;

  @IsSafeString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;
}
```

### 5. Rate Limiting

Apply stricter limits to sensitive endpoints:

```typescript
@RateLimit({ points: 3, duration: 300 }) // 3 attempts per 5 minutes
@Post('reset-password')
async resetPassword() { ... }
```

### 6. Audit Logging

Log all sensitive operations:

```typescript
// Before performing sensitive operation
await this.auditService.log(
  AuditAction.PERMISSION_CHANGED,
  context,
  { user: userId, oldRole: 'user', newRole: 'admin' },
  AuditSeverity.WARNING
);
```

### 7. Error Handling

Don't leak sensitive information in errors:

```typescript
// ❌ Bad
throw new Error(`User ${email} not found in database`);

// ✅ Good
throw new UnauthorizedException('Invalid credentials');
```

### 8. HTTPS Enforcement

Always use HTTPS in production:

```typescript
if (process.env.NODE_ENV === 'production' && !req.secure) {
  return res.redirect(`https://${req.hostname}${req.url}`);
}
```

### 9. Database Security

- Use connection pooling limits
- Enable SSL for database connections
- Use read replicas for sensitive queries
- Implement row-level security
- Regular backups with encryption

### 10. Dependency Security

Regular security audits:

```bash
npm audit
npm audit fix
```

Use tools like:
- Snyk
- Dependabot
- npm audit

## Security Checklist

- [x] Helmet configured with CSP, HSTS, X-Frame-Options
- [x] CORS with whitelist
- [x] Input validation with class-validator
- [x] SQL injection protection (Prisma + validation)
- [x] XSS protection (middleware + CSP)
- [x] Rate limiting (global + per-endpoint)
- [x] Audit logging for all sensitive operations
- [x] Secure session management (httpOnly, secure, sameSite)
- [x] Password hashing with bcrypt
- [x] Custom validation decorators
- [ ] CSRF protection (implement if using cookie-based auth)
- [ ] Two-factor authentication
- [ ] API key management
- [ ] Secrets rotation
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Security incident response plan

## Testing Security Features

### 1. Test Rate Limiting

```bash
# Send 10 rapid requests
for i in {1..10}; do
  curl http://localhost:3001/api/auth/login
done
```

### 2. Test XSS Protection

```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "<script>alert(1)</script>"}'
```

Should sanitize to: `&lt;script&gt;alert(1)&lt;/script&gt;`

### 3. Test SQL Injection Protection

```bash
curl -X GET "http://localhost:3001/api/users?name=' OR '1'='1"
```

Should return validation error.

### 4. Test CORS

```bash
curl -H "Origin: http://malicious-site.com" \
  http://localhost:3001/api/users
```

Should be blocked in production.

### 5. Test Audit Logging

Check database after sensitive operations:

```sql
SELECT * FROM audit_logs
WHERE action = 'USER_LOGIN'
ORDER BY created_at DESC
LIMIT 10;
```

## Incident Response

### 1. Suspected Breach

1. Check audit logs for suspicious activity
2. Review recent failed login attempts
3. Check for unusual IP addresses or patterns
4. Disable compromised accounts
5. Force password reset for affected users
6. Review and rotate API keys
7. Check application logs for anomalies

### 2. DDoS Attack

1. Rate limiting should handle most attacks
2. Use CDN/WAF for additional protection (Cloudflare, AWS Shield)
3. Monitor server resources
4. Implement IP blacklisting if needed
5. Scale infrastructure if necessary

### 3. Data Leak

1. Identify what data was exposed
2. Review audit logs to find source
3. Patch vulnerability immediately
4. Notify affected users
5. Comply with breach notification laws (GDPR, etc.)
6. Update security measures

## Updates and Maintenance

### Regular Tasks

**Weekly:**
- Review audit logs for anomalies
- Check rate limit effectiveness
- Monitor failed login attempts

**Monthly:**
- Run security audits (`npm audit`)
- Update dependencies
- Review and rotate secrets
- Test backup restoration

**Quarterly:**
- Penetration testing
- Security training for team
- Review and update security policies
- Audit user permissions

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/helmet)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## Support

For security issues, contact: security@kushim.com

**Do not** disclose security vulnerabilities publicly.
