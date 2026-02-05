import { ApiProperty } from '@nestjs/swagger';

export class ReviewResultDto {
  @ApiProperty({
    description: 'Compliance score (0-100)',
    example: 85,
  })
  score: number;

  @ApiProperty({
    description: 'Completeness assessment',
    example: 'The policy covers all required sections.',
  })
  completeness: string;

  @ApiProperty({
    description: 'List of identified gaps',
    type: [String],
    example: [
      'Missing incident response timeline details',
      'Vendor risk assessment criteria not specified',
    ],
  })
  gaps: string[];

  @ApiProperty({
    description: 'List of improvement suggestions',
    type: [String],
    example: [
      'Add specific examples of acceptable use cases',
      'Include more granular access control levels',
    ],
  })
  suggestions: string[];

  @ApiProperty({
    description: 'Consistency check results',
    type: [String],
    example: ['Password requirements consistent across sections'],
  })
  consistencyIssues: string[];
}
