import { IsBoolean, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMappingDto {
  @ApiProperty({
    description: 'Updated confidence score (0-1)',
    example: 0.92,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @ApiProperty({
    description: 'Updated AI reasoning',
    example: 'Updated reasoning based on additional context...',
    required: false,
  })
  @IsOptional()
  @IsString()
  aiReasoning?: string;

  @ApiProperty({
    description: 'Mark as manually verified',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  manuallyVerified?: boolean;

  @ApiProperty({
    description: 'Override AI mapping',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isManualOverride?: boolean;
}
