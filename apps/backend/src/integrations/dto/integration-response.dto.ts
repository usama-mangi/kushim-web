import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IntegrationDto {
  @ApiProperty({
    description: 'Integration ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Integration type',
    example: 'AWS',
    enum: ['AWS', 'GITHUB', 'OKTA', 'JIRA', 'SLACK'],
  })
  type: string;

  @ApiProperty({
    description: 'Integration status',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'ERROR'],
  })
  status: string;

  @ApiProperty({
    description: 'Connection timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  connectedAt: Date;

  @ApiPropertyOptional({
    description: 'Last sync timestamp',
    example: '2024-01-20T15:45:00.000Z',
  })
  lastSyncAt?: Date;
}

export class IntegrationListResponseDto {
  @ApiProperty({
    description: 'Array of integrations',
    type: [IntegrationDto],
  })
  integrations: IntegrationDto[];

  @ApiProperty({
    description: 'Total count',
    example: 5,
  })
  total: number;
}

export class ConnectIntegrationDto {
  @ApiProperty({
    description: 'Integration configuration (varies by type)',
    example: {
      accessKeyId: 'AKIA...',
      secretAccessKey: 'secret...',
      region: 'us-east-1',
    },
  })
  config: Record<string, any>;
}

export class ConnectIntegrationResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Integration connected successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Integration ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Integration type',
    example: 'AWS',
  })
  type: string;
}

export class DeleteIntegrationResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Integration deleted successfully',
  })
  message: string;
}

export class HealthScoreDto {
  @ApiProperty({
    description: 'Integration name',
    example: 'aws',
  })
  integration: string;

  @ApiProperty({
    description: 'Health score (0-100)',
    example: 95,
    minimum: 0,
    maximum: 100,
  })
  healthScore: number;

  @ApiProperty({
    description: 'Circuit breaker status',
    example: {
      state: 'CLOSED',
      failureCount: 0,
      lastFailure: null,
    },
  })
  circuitBreaker: {
    state: string;
    failureCount: number;
    lastFailure: Date | null;
  };

  @ApiProperty({
    description: 'Timestamp',
    example: '2024-01-20T10:30:00.000Z',
  })
  timestamp: Date;
}

export class EvidenceCollectionResponseDto {
  @ApiProperty({
    description: 'Success flag',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Number of evidence records collected',
    example: 15,
  })
  count: number;

  @ApiProperty({
    description: 'Evidence type',
    example: 'IAM_CONFIG',
  })
  type: string;
}
