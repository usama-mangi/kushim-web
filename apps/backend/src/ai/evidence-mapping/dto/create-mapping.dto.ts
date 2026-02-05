import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMappingDto {
  @ApiProperty({
    description: 'Control ID to map evidence to',
    example: 'cc123e45-6789-12d3-a456-426614174000',
  })
  @IsString()
  controlId: string;

  @ApiProperty({
    description: 'Confidence score (0-1)',
    example: 0.85,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiProperty({
    description: 'AI reasoning for the mapping',
    example: 'This AWS CloudTrail log provides evidence of access control...',
  })
  @IsString()
  aiReasoning: string;

  @ApiProperty({
    description: 'Whether this is a manual override',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isManualOverride?: boolean;

  @ApiProperty({
    description: 'ID of user creating the mapping',
    example: 'user123e45-6789-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdBy?: string;
}
