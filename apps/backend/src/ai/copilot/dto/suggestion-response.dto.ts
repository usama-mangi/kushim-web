import { ApiProperty } from '@nestjs/swagger';

export enum SuggestionPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum SuggestionType {
  CONTROL = 'CONTROL',
  INTEGRATION = 'INTEGRATION',
  POLICY = 'POLICY',
  EVIDENCE = 'EVIDENCE',
  GENERAL = 'GENERAL',
}

export class SuggestionDto {
  @ApiProperty({
    description: 'Suggestion title',
    example: '3 controls need attention this week',
  })
  title: string;

  @ApiProperty({
    description: 'Detailed description',
    example: 'CC1.2, CC6.1, and A1.2 have failed compliance checks',
  })
  description: string;

  @ApiProperty({
    description: 'Suggestion type',
    enum: SuggestionType,
    example: SuggestionType.CONTROL,
  })
  type: SuggestionType;

  @ApiProperty({
    description: 'Priority level',
    enum: SuggestionPriority,
    example: SuggestionPriority.HIGH,
  })
  priority: SuggestionPriority;

  @ApiProperty({
    description: 'Actionable recommendation',
    example: 'Review the failed controls and gather missing evidence',
    nullable: true,
  })
  action?: string;

  @ApiProperty({
    description: 'Related resource IDs',
    example: { controlIds: ['cc1-2', 'cc6-1'] },
    nullable: true,
  })
  metadata?: Record<string, any>;
}

export class SuggestionResponseDto {
  @ApiProperty({
    description: 'List of smart suggestions',
    type: [SuggestionDto],
  })
  suggestions: SuggestionDto[];

  @ApiProperty({
    description: 'Overall compliance health score',
    example: 0.85,
  })
  healthScore: number;

  @ApiProperty({
    description: 'When suggestions were generated',
    example: '2024-02-05T12:00:00Z',
  })
  generatedAt: Date;
}
