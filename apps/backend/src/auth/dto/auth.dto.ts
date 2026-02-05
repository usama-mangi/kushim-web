import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecureP@ssw0rd',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(1)
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'newuser@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'SecureP@ssw0rd123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;
}

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token from email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResendVerificationDto {
  @ApiProperty({
    description: 'Email address to resend verification to',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address for password reset',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token from email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'New password (minimum 8 characters)',
    example: 'NewSecureP@ssw0rd123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class AcceptInvitationDto {
  @ApiProperty({
    description: 'Invitation token from email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'SecureP@ssw0rd123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'Jane',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Smith',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}
