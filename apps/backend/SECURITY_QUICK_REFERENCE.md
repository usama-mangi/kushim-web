# Security Quick Reference

Quick reference for using security features in the Kushim backend.

## Table of Contents

- [Validation Decorators](#validation-decorators)
- [Rate Limiting](#rate-limiting)
- [Audit Logging](#audit-logging)
- [Common Patterns](#common-patterns)

## Validation Decorators

### Import

```typescript
import {
  IsStrongPassword,
  IsSecureEmail,
  IsSafeString,
  IsUUID4,
  IsWhitelistedUrl,
  IsSecureJSON,
} from '@/common/decorators/validators';
```

### Usage in DTOs

```typescript
import { IsString, MinLength, MaxLength } from 'class-validator';
import { IsSecureEmail, IsStrongPassword, IsSafeString } from '@/common/decorators/validators';

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

### Available Validators

| Decorator | Purpose | Example |
|-----------|---------|---------|
| `@IsStrongPassword()` | Password with 12+ chars, upper, lower, number, special | `password123!ABC` |
| `@IsSecureEmail()` | Email with XSS/injection prevention | `user@example.com` |
| `@IsSafeString()` | Alphanumeric + basic punctuation only | `John O'Brien` |
| `@IsUUID4()` | UUID v4 format | `550e8400-e29b-41d4-a716-446655440000` |
| `@IsWhitelistedUrl(['domain.com'])` | HTTPS URLs from allowed domains | `https://api.domain.com` |
| `@IsSecureJSON(100)` | Valid JSON under size limit (KB) | `{ "key": "value" }` |

## Rate Limiting

### Using @nestjs/throttler (Global)

Applied automatically to all routes via `APP_GUARD`:

```typescript
// Default: 100 requests per minute
// Auth endpoints: 5 requests per minute
```

### Using Custom Rate Limit Guard

```typescript
import { UseGuards } from '@nestjs/common';
import { RateLimitGuard, RateLimit } from '@/common/guards/rate-limit.guard';

@Controller('auth')
export class AuthController {
  // Method-level rate limit
  @Post('login')
  @UseGuards(RateLimitGuard)
  @RateLimit({ points: 5, duration: 60 })
  async login() { ... }

  // Controller-level rate limit
  @Post('reset-password')
  @UseGuards(RateLimitGuard)
  @RateLimit({ points: 3, duration: 300 }) // 3 requests per 5 minutes
  async resetPassword() { ... }
}
```

### Rate Limit Configuration

```typescript
{
  points: number;    // Max requests allowed
  duration: number;  // Time window in seconds
  keyPrefix?: string; // Optional Redis key prefix
}
```

## Audit Logging

### Import

```typescript
import { AuditService, AuditAction, AuditSeverity } from '@/audit/audit.service';
```

### Inject in Service

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly auditService: AuditService,
  ) {}
}
```

### Common Patterns

#### 1. Log User Login

```typescript
await this.auditService.logLogin(
  userId,
  customerId,
  req.ip,
  req.headers['user-agent'],
  true // success
);
```

#### 2. Log Data Changes

```typescript
await this.auditService.logDataChange(
  AuditAction.USER_UPDATED,
  {
    userId,
    customerId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  },
  'User', // Entity type
  userId,  // Entity ID
  { changedFields: ['email', 'role'] }
);
```

#### 3. Log Security Events

```typescript
await this.auditService.logSecurityEvent(
  'Multiple failed login attempts',
  {
    userId,
    customerId,
    ipAddress: req.ip,
  },
  { attempts: 5, timeWindow: '1 hour' }
);
```

#### 4. Generic Audit Log

```typescript
await this.auditService.log(
  AuditAction.INTEGRATION_CONNECTED,
  {
    userId,
    customerId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  },
  { integrationType: 'AWS' },
  AuditSeverity.INFO
);
```

### Audit Actions

```typescript
enum AuditAction {
  USER_LOGIN,
  USER_LOGOUT,
  USER_CREATED,
  USER_UPDATED,
  USER_DELETED,
  PASSWORD_CHANGED,
  PASSWORD_RESET,
  INTEGRATION_CONNECTED,
  INTEGRATION_DISCONNECTED,
  COMPLIANCE_CHECK_RUN,
  EVIDENCE_COLLECTED,
  SECURITY_ALERT,
  DATA_EXPORT,
  // ... more
}
```

### Audit Severity Levels

```typescript
enum AuditSeverity {
  INFO,      // Normal operations
  WARNING,   // Potential issues
  ERROR,     // Errors occurred
  CRITICAL   // Security incidents
}
```

### Query Audit Logs

```typescript
const { logs, total } = await this.auditService.getAuditLogs(
  customerId,
  {
    userId: 'user-id',
    action: AuditAction.USER_LOGIN,
    severity: AuditSeverity.WARNING,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    limit: 100,
    offset: 0,
  }
);
```

### Detect Suspicious Activity

```typescript
const isSuspicious = await this.auditService.detectSuspiciousActivity(
  customerId,
  userId
);

if (isSuspicious) {
  // Trigger alerts, require 2FA, etc.
}
```

## Common Patterns

### Secure Endpoint Pattern

```typescript
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { RateLimitGuard, RateLimit } from '@/common/guards/rate-limit.guard';
import { AuditService, AuditAction } from '@/audit/audit.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @UseGuards(RateLimitGuard)
  @RateLimit({ points: 10, duration: 60 })
  async create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: Request,
  ) {
    const user = await this.userService.create(createUserDto);

    // Audit log
    await this.auditService.log(
      AuditAction.USER_CREATED,
      {
        userId: req.user?.id,
        customerId: req.user?.customerId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
      { newUserId: user.id, email: user.email },
    );

    return user;
  }
}
```

### Password Change Pattern

```typescript
@Post('change-password')
@UseGuards(AuthGuard('jwt'), RateLimitGuard)
@RateLimit({ points: 5, duration: 300 }) // 5 attempts per 5 minutes
async changePassword(
  @Body() changePasswordDto: ChangePasswordDto,
  @Req() req: Request,
) {
  const { currentPassword, newPassword } = changePasswordDto;
  const userId = req.user.id;
  const customerId = req.user.customerId;

  try {
    await this.authService.changePassword(userId, currentPassword, newPassword);

    // Log success
    await this.auditService.log(
      AuditAction.PASSWORD_CHANGED,
      {
        userId,
        customerId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
      { success: true },
    );

    return { message: 'Password changed successfully' };
  } catch (error) {
    // Log failure
    await this.auditService.log(
      AuditAction.PASSWORD_CHANGED,
      {
        userId,
        customerId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
      { success: false, error: error.message },
      AuditSeverity.WARNING,
    );

    throw error;
  }
}
```

### Data Export Pattern (Compliance-Critical)

```typescript
@Get('export')
@UseGuards(AuthGuard('jwt'), RateLimitGuard)
@RateLimit({ points: 2, duration: 3600 }) // 2 exports per hour
async exportData(
  @Query('format') format: string,
  @Req() req: Request,
) {
  const customerId = req.user.customerId;
  const userId = req.user.id;

  const data = await this.dataService.export(customerId, format);

  // IMPORTANT: Always audit data exports
  await this.auditService.log(
    AuditAction.DATA_EXPORT,
    {
      userId,
      customerId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
    {
      format,
      recordCount: data.length,
      timestamp: new Date(),
    },
    AuditSeverity.WARNING, // Data exports are security-sensitive
  );

  return data;
}
```

## Environment Variables

Required in `.env`:

```env
# Sessions
SESSION_SECRET=your-super-secret-key-min-32-chars

# CORS
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

## Testing

### Test Rate Limiting

```bash
# Send multiple rapid requests
for i in {1..10}; do curl http://localhost:3001/api/auth/login; done
```

### Test XSS Protection

```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "<script>alert(1)</script>"}'
```

### Test Validation

```bash
# Weak password should fail
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@test.com", "password": "weak"}'
```

## Performance Tips

1. **Audit Logging**: Runs async, doesn't block responses
2. **Rate Limiting**: Uses Redis for distributed rate limiting
3. **Validation**: Runs on every request, keep DTOs simple
4. **XSS Middleware**: Runs early in the chain, minimal overhead

## Troubleshooting

### Rate Limit Issues

Check Redis connection:
```bash
redis-cli ping
```

### Validation Not Working

Ensure ValidationPipe is global in `main.ts`:
```typescript
app.useGlobalPipes(new ValidationPipe({ ... }));
```

### Audit Logs Not Saving

Check database connection and run migrations:
```bash
npm run migrate
```

## See Also

- [SECURITY.md](./SECURITY.md) - Full security documentation
- [src/examples/auth-security-example.service.ts](./src/examples/auth-security-example.service.ts) - Complete examples
