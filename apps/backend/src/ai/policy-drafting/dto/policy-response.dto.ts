import { ApiProperty } from '@nestjs/swagger';
import { PolicyStatus } from '@prisma/client';

export class PolicyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  templateId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  version: number;

  @ApiProperty({ enum: PolicyStatus })
  status: PolicyStatus;

  @ApiProperty()
  createdBy: string;

  @ApiProperty({ nullable: true })
  reviewedBy: string | null;

  @ApiProperty({ nullable: true })
  approvedBy: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  reviewedAt: Date | null;

  @ApiProperty({ nullable: true })
  approvedAt: Date | null;

  @ApiProperty({ required: false })
  template?: {
    id: string;
    name: string;
    category: string;
  };
}
