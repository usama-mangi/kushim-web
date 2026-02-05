import { ApiProperty } from '@nestjs/swagger';

export class EvidenceDto {
  @ApiProperty({
    description: 'Evidence ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Control ID this evidence relates to',
    example: 'CC6.1',
  })
  controlId: string;

  @ApiProperty({
    description: 'Evidence type',
    example: 'AWS_IAM_CONFIG',
    enum: [
      'AWS_IAM_CONFIG',
      'AWS_S3_CONFIG',
      'GITHUB_BRANCH_PROTECTION',
      'OKTA_USER_LIST',
      'JIRA_TICKET',
    ],
  })
  type: string;

  @ApiProperty({
    description: 'Evidence data (JSON)',
    example: {
      users: 15,
      mfaEnabled: 12,
      compliance: 'PARTIAL',
    },
  })
  data: any;

  @ApiProperty({
    description: 'Evidence collection timestamp',
    example: '2024-01-20T10:30:00.000Z',
  })
  collectedAt: Date;

  @ApiProperty({
    description: 'Hash for immutability verification',
    example: 'a3f5d8c9b2e1...',
  })
  hash: string;

  @ApiProperty({
    description: 'Verification status',
    example: true,
  })
  verified: boolean;
}

export class EvidenceListResponseDto {
  @ApiProperty({
    description: 'Array of evidence records',
    type: [EvidenceDto],
  })
  evidence: EvidenceDto[];

  @ApiProperty({
    description: 'Total count',
    example: 45,
  })
  total: number;
}

export class VerifyEvidenceResponseDto {
  @ApiProperty({
    description: 'Verification status',
    example: true,
  })
  verified: boolean;

  @ApiProperty({
    description: 'Verification message',
    example: 'Evidence integrity verified successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Hash matches',
    example: true,
  })
  hashMatches: boolean;
}
