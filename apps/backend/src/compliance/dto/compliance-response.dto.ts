import { ApiProperty } from '@nestjs/swagger';

export class ComplianceControlDto {
  @ApiProperty({
    description: 'Control ID',
    example: 'CC1.1',
  })
  id: string;

  @ApiProperty({
    description: 'Control name',
    example: 'Access Control Policy',
  })
  name: string;

  @ApiProperty({
    description: 'Control description',
    example: 'Ensure access to systems is controlled and monitored',
  })
  description: string;

  @ApiProperty({
    description: 'Control category',
    example: 'Access Control',
  })
  category: string;

  @ApiProperty({
    description: 'Compliance status',
    example: 'COMPLIANT',
    enum: ['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL', 'NOT_APPLICABLE'],
  })
  status: string;

  @ApiProperty({
    description: 'Last check timestamp',
    example: '2024-01-20T10:30:00.000Z',
  })
  lastChecked: Date;
}

export class ComplianceControlsResponseDto {
  @ApiProperty({
    description: 'Array of compliance controls',
    type: [ComplianceControlDto],
  })
  controls: ComplianceControlDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      page: 1,
      limit: 50,
      total: 150,
      totalPages: 3,
    },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ComplianceAlertDto {
  @ApiProperty({
    description: 'Alert ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Alert message',
    example: 'AWS IAM user without MFA detected',
  })
  message: string;

  @ApiProperty({
    description: 'Alert severity',
    example: 'HIGH',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  })
  severity: string;

  @ApiProperty({
    description: 'Control ID',
    example: 'CC6.1',
  })
  controlId: string;

  @ApiProperty({
    description: 'Alert timestamp',
    example: '2024-01-20T15:45:00.000Z',
  })
  createdAt: Date;
}

export class ComplianceAlertsResponseDto {
  @ApiProperty({
    description: 'Array of compliance alerts',
    type: [ComplianceAlertDto],
  })
  alerts: ComplianceAlertDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
    },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ComplianceTrendDto {
  @ApiProperty({
    description: 'Date of trend data',
    example: '2024-01-20',
  })
  date: string;

  @ApiProperty({
    description: 'Number of compliant controls',
    example: 120,
  })
  compliant: number;

  @ApiProperty({
    description: 'Number of non-compliant controls',
    example: 15,
  })
  nonCompliant: number;

  @ApiProperty({
    description: 'Overall compliance score',
    example: 88.9,
  })
  score: number;
}

export class ComplianceTrendsResponseDto {
  @ApiProperty({
    description: 'Array of trend data points',
    type: [ComplianceTrendDto],
  })
  trends: ComplianceTrendDto[];

  @ApiProperty({
    description: 'Number of days in trend',
    example: 7,
  })
  days: number;
}

export class ComplianceScanResponseDto {
  @ApiProperty({
    description: 'Success flag',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Status message',
    example: 'Compliance scan initiated',
  })
  message: string;
}

export class ComplianceControlDetailDto {
  @ApiProperty({
    description: 'Control ID',
    example: 'CC1.1',
  })
  id: string;

  @ApiProperty({
    description: 'Control name',
    example: 'Access Control Policy',
  })
  name: string;

  @ApiProperty({
    description: 'Control description',
    example: 'Ensure access to systems is controlled and monitored',
  })
  description: string;

  @ApiProperty({
    description: 'Control category',
    example: 'Access Control',
  })
  category: string;

  @ApiProperty({
    description: 'Compliance status',
    example: 'COMPLIANT',
    enum: ['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL', 'NOT_APPLICABLE'],
  })
  status: string;

  @ApiProperty({
    description: 'Last check timestamp',
    example: '2024-01-20T10:30:00.000Z',
  })
  lastChecked: Date;

  @ApiProperty({
    description: 'Associated evidence count',
    example: 12,
  })
  evidenceCount: number;

  @ApiProperty({
    description: 'Check history',
    example: [
      {
        timestamp: '2024-01-20T10:30:00.000Z',
        status: 'COMPLIANT',
      },
    ],
  })
  history: Array<{
    timestamp: Date;
    status: string;
  }>;
}
