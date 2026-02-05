import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import {
  IsStrongPassword,
  IsSafeString,
  IsSecureEmail,
} from '../decorators/validators';

/**
 * Example DTO showing usage of security validation decorators
 */
export class CreateUserDto {
  @IsSecureEmail()
  email: string;

  @IsStrongPassword()
  password: string;

  @IsSafeString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsSafeString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  bio?: string;
}

export class UpdateUserDto {
  @IsSecureEmail()
  @IsOptional()
  email?: string;

  @IsSafeString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  firstName?: string;

  @IsSafeString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  bio?: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsStrongPassword()
  newPassword: string;
}
