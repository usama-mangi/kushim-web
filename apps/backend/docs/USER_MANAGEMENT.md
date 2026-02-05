# User Management System Documentation

## Overview

The Kushim user management system provides comprehensive authentication, authorization, and user lifecycle management.

## Key Features

- ✅ Email verification workflow
- ✅ Password reset functionality  
- ✅ User invitation system
- ✅ Role-based access control (RBAC)
- ✅ Multi-tenant user management
- ✅ Audit logging for all user actions

## Quick Start

### 1. Run Migration

```bash
cd apps/backend
npx prisma migrate dev --name add_user_management
```

### 2. Configure Environment

Add to `apps/backend/.env`:

```bash
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="Kushim <noreply@kushim.io>"
FRONTEND_URL="http://localhost:3000"
```

### 3. Test Endpoints

```bash
# Register new user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"John","lastName":"Doe"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new account | No |
| POST | `/auth/verify-email` | Verify email with token | No |
| POST | `/auth/login` | Login with credentials | No |
| POST | `/auth/resend-verification` | Resend verification email | No |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password with token | No |
| POST | `/auth/accept-invitation` | Accept user invitation | No |
| GET | `/auth/me` | Get current user | Yes |

### User Management

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/users/profile` | Get profile | Yes | No |
| PATCH | `/users/profile` | Update profile | Yes | No |
| POST | `/users/change-password` | Change password | Yes | No |
| POST | `/users/invite` | Invite user | Yes | Yes |
| GET | `/users` | List users | Yes | Yes |
| GET | `/users/:id` | Get user by ID | Yes | Yes |
| DELETE | `/users/:id` | Deactivate user | Yes | Yes |

## User Roles

- **ADMIN**: Full access to all features
- **USER**: Standard user access  
- **VIEWER**: Read-only access

## Database Schema Changes

### User Model Updates

```prisma
model User {
  // New fields added:
  emailVerified             Boolean   @default(false)
  emailVerificationToken    String?   @unique
  emailVerificationExpires  DateTime?
  resetPasswordToken        String?   @unique
  resetPasswordExpires      DateTime?
  lastLoginAt               DateTime?
  loginCount                Int       @default(0)
  isActive                  Boolean   @default(true)
  role                      UserRole  @default(USER)
}
```

### New Models

```prisma
model UserInvitation {
  id            String           @id @default(uuid())
  email         String
  role          UserRole         @default(USER)
  token         String           @unique
  status        InvitationStatus @default(PENDING)
  customerId    String
  invitedById   String
  expiresAt     DateTime
}

enum UserRole {
  ADMIN
  USER
  VIEWER
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  REVOKED
}
```

## Usage Examples

### Protecting Routes with RBAC

```typescript
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  
  @Get('users')
  @Roles(UserRole.ADMIN)
  getUsers() {
    // Only admins can access
  }
}
```

### Accessing User in Request

```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@Request() req) {
  const userId = req.user.sub;
  const customerId = req.user.customerId;
  const role = req.user.role;
  // ...
}
```

## Authentication Flows

### Registration Flow

1. User submits registration → Email sent with verification link
2. User clicks link → Email verified → JWT token returned
3. User can now access protected endpoints

### Password Reset Flow  

1. User requests reset → Email sent with reset link (1h expiry)
2. User clicks link → Submits new password
3. Password updated → User can login with new password

### Invitation Flow

1. Admin invites user → Email sent with invitation link (7 days expiry)
2. New user clicks link → Creates account with details
3. Account created with emailVerified=true → JWT token returned

## Security Features

- ✅ bcrypt password hashing (10 salt rounds)
- ✅ JWT tokens with 7-day expiry
- ✅ Email verification required for new accounts
- ✅ Rate limiting on auth endpoints (5 req/min)
- ✅ Multi-tenant data isolation
- ✅ Audit logging for all user actions
- ✅ Input validation with class-validator
- ✅ Soft delete for user deactivation

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- users.service.spec.ts

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

Test files created:
- `src/users/users.service.spec.ts`
- `src/auth/auth.service.spec.ts`
- `src/email/email.service.spec.ts`

## Troubleshooting

### Database Migration Failed

```bash
# Ensure PostgreSQL is running
docker-compose up postgres -d

# Reset database (dev only)
npx prisma migrate reset

# Re-run migration
npx prisma migrate dev
```

### Email Not Sending

1. Check SMTP credentials in `.env`
2. For Gmail: Use app-specific password
3. Check logs: `tail -f server.log`

### Permission Denied on Endpoint

1. Check JWT token is valid
2. Verify user role matches @Roles() decorator
3. Ensure both JwtAuthGuard and RolesGuard are applied

## Next Steps

1. Start database: `docker-compose up postgres -d`
2. Run migration: `npx prisma migrate dev`
3. Start backend: `npm run backend:dev`
4. Test endpoints with Swagger: `http://localhost:3001/api`

## API Documentation

Interactive API docs available at: `http://localhost:3001/api`

For detailed implementation guide, see the inline code documentation.
