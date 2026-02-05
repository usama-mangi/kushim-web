import { ApiProperty } from '@nestjs/swagger';

export class TemplateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  templateContent: string;

  @ApiProperty()
  variables: any;

  @ApiProperty({ required: false, nullable: true })
  frameworkId?: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({
    required: false,
    type: 'array',
    items: {
      type: 'object',
      properties: {
        controlId: { type: 'string' },
        title: { type: 'string' },
      },
    },
  })
  controls?: Array<{
    controlId: string;
    title: string;
  }>;
}
