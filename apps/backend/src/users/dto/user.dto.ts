import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

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
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({
    description: 'User role',
    example: 'USER',
    enum: UserRole,
    default: 'USER',
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  lastName?: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'CurrentP@ssw0rd123',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'New password (minimum 8 characters)',
    example: 'NewP@ssw0rd123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class InviteUserDto {
  @ApiProperty({
    description: 'Email address to invite',
    example: 'newuser@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Role to assign to the invited user',
    example: 'USER',
    enum: UserRole,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
