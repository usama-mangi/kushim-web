import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, IsArray } from 'class-validator';

export class GeneratePolicyDto {
  @ApiProperty({
    description: 'Policy template ID to generate from',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  templateId: string;

  @ApiProperty({
    description: 'Customization data for policy generation',
    example: {
      companyName: 'Acme Inc',
      industry: 'FinTech',
      companySize: '50-100',
      techStack: ['AWS', 'Node.js', 'PostgreSQL'],
      dataTypes: ['PII', 'Financial'],
      regions: ['US', 'EU'],
    },
  })
  @IsObject()
  customizationData: Record<string, any>;

  @ApiProperty({
    description: 'Optional additional instructions for AI',
    required: false,
  })
  @IsOptional()
  @IsString()
  additionalInstructions?: string;

  @ApiProperty({
    description: 'Source IDs to reference for context',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sourceIds?: string[];
}
