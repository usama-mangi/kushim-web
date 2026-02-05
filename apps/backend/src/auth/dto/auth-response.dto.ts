import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  accessToken: string;

  @ApiProperty({
    description: 'User information',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
    },
  })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    customerId: string;
  };
}

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Success message',
    example:
      'Registration successful. Please check your email to verify your account.',
  })
  message: string;

  @ApiProperty({
    description: 'User email',
    example: 'newuser@example.com',
  })
  email: string;
}

export class VerifyEmailResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Email verified successfully',
  })
  message: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password reset email sent',
  })
  message: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password reset successful',
  })
  message: string;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'User role',
    example: 'USER',
    enum: ['USER', 'ADMIN'],
  })
  role: string;

  @ApiProperty({
    description: 'Customer/Organization ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  customerId: string;

  @ApiProperty({
    description: 'Email verification status',
    example: true,
  })
  emailVerified: boolean;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Invalid credentials',
  })
  message: string;

  @ApiProperty({
    description: 'Error type',
    example: 'Bad Request',
  })
  error: string;
}
