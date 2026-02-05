import { ApiProperty } from '@nestjs/swagger';

export class ControlSuggestion {
  @ApiProperty({
    description: 'Control ID',
    example: 'cc123e45-6789-12d3-a456-426614174000',
  })
  controlId: string;

  @ApiProperty({
    description: 'Control identifier (e.g., CC1.1)',
    example: 'CC1.1',
  })
  controlIdentifier: string;

  @ApiProperty({
    description: 'Control title',
    example: 'Code of Conduct',
  })
  title: string;

  @ApiProperty({
    description: 'Confidence score (0-1)',
    example: 0.87,
  })
  confidence: number;

  @ApiProperty({
    description: 'AI reasoning for the suggestion',
    example: 'This evidence demonstrates compliance with organizational code of conduct policies...',
  })
  reasoning: string;
}

export class MappingResponseDto {
  @ApiProperty({
    description: 'Mapping ID',
    example: 'map123e45-6789-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Evidence ID',
    example: 'ev123e45-6789-12d3-a456-426614174000',
  })
  evidenceId: string;

  @ApiProperty({
    description: 'Control ID',
    example: 'cc123e45-6789-12d3-a456-426614174000',
  })
  controlId: string;

  @ApiProperty({
    description: 'Control details',
  })
  control: {
    id: string;
    controlId: string;
    title: string;
    description: string;
    framework: string;
  };

  @ApiProperty({
    description: 'Confidence score (0-1)',
    example: 0.85,
  })
  confidence: number;

  @ApiProperty({
    description: 'AI reasoning',
    example: 'This AWS CloudTrail log provides evidence of access control...',
  })
  aiReasoning: string;

  @ApiProperty({
    description: 'Whether this is a manual override',
    example: false,
  })
  isManualOverride: boolean;

  @ApiProperty({
    description: 'Whether this mapping was manually verified',
    example: true,
  })
  manuallyVerified: boolean;

  @ApiProperty({
    description: 'Created by user ID',
    example: 'user123e45-6789-12d3-a456-426614174000',
    nullable: true,
  })
  createdBy: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-02-05T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-02-05T12:45:00Z',
  })
  updatedAt: Date;
}
