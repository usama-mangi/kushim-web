import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { PolicyStatus } from '@prisma/client';

export class UpdatePolicyDto {
  @ApiProperty({
    description: 'Policy title',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Policy content in markdown',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description: 'Status of the policy',
    enum: PolicyStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(PolicyStatus)
  status?: PolicyStatus;

  @ApiProperty({
    description: 'Changes description for version history',
    required: false,
  })
  @IsOptional()
  @IsString()
  changes?: string;
}
