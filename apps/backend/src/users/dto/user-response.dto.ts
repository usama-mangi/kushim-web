import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Email address',
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

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-20T15:45:00.000Z',
  })
  updatedAt: Date;
}

export class InviteUserResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'User invitation sent successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Invited user email',
    example: 'newuser@example.com',
  })
  email: string;
}

export class ChangePasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password changed successfully',
  })
  message: string;
}

export class UserListResponseDto {
  @ApiProperty({
    description: 'Array of users',
    type: [UserProfileResponseDto],
  })
  users: UserProfileResponseDto[];

  @ApiProperty({
    description: 'Total count of users',
    example: 15,
  })
  total: number;
}
