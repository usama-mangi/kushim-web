import { ApiProperty } from '@nestjs/swagger';
import { Framework } from '@prisma/client';

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

  @ApiProperty({ enum: Framework })
  framework: Framework;

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
