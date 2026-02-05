import { ApiProperty } from '@nestjs/swagger';

export class MessageMetadata {
  @ApiProperty({
    description: 'Referenced control IDs',
    example: ['CC1.2', 'CC6.1'],
    required: false,
  })
  controls?: string[];

  @ApiProperty({
    description: 'Referenced policy IDs',
    example: ['policy-123', 'policy-456'],
    required: false,
  })
  policies?: string[];

  @ApiProperty({
    description: 'Referenced evidence IDs',
    example: ['evidence-789'],
    required: false,
  })
  evidence?: string[];

  @ApiProperty({
    description: 'Additional context sources',
    required: false,
  })
  sources?: any[];
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Unique message ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  id: string;

  @ApiProperty({
    description: 'Conversation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  conversationId: string;

  @ApiProperty({
    description: 'Message role',
    enum: ['USER', 'ASSISTANT', 'SYSTEM'],
    example: 'ASSISTANT',
  })
  role: string;

  @ApiProperty({
    description: 'Message content',
    example: 'CC1.2 is about control environment and organizational structure...',
  })
  content: string;

  @ApiProperty({
    description: 'Message metadata (sources, references, etc.)',
    type: MessageMetadata,
    nullable: true,
  })
  metadata: MessageMetadata | null;

  @ApiProperty({
    description: 'Tokens used for this message',
    example: 150,
    nullable: true,
  })
  tokens: number | null;

  @ApiProperty({
    description: 'Cost in USD for this message',
    example: 0.0045,
    nullable: true,
  })
  cost: number | null;

  @ApiProperty({
    description: 'When the message was created',
    example: '2024-02-05T12:00:00Z',
  })
  createdAt: Date;
}
