import { ApiProperty } from '@nestjs/swagger';
import { MessageResponseDto } from './message-response.dto';

export class ConversationResponseDto {
  @ApiProperty({
    description: 'Unique conversation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Customer ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  customerId: string;

  @ApiProperty({
    description: 'User ID who created the conversation',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  userId: string;

  @ApiProperty({
    description: 'Conversation title',
    example: 'Help with CC1.2 control',
  })
  title: string;

  @ApiProperty({
    description: 'Conversation status',
    enum: ['ACTIVE', 'ARCHIVED'],
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: 'When the conversation was created',
    example: '2024-02-05T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the conversation was last updated',
    example: '2024-02-05T12:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Timestamp of the last message',
    example: '2024-02-05T12:00:00Z',
    nullable: true,
  })
  lastMessageAt: Date | null;

  @ApiProperty({
    description: 'Number of messages in the conversation',
    example: 5,
  })
  messageCount: number;

  @ApiProperty({
    description: 'Conversation messages (only included when fetching single conversation)',
    type: [MessageResponseDto],
    required: false,
  })
  messages?: MessageResponseDto[];
}
