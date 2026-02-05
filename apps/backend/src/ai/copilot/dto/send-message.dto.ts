import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'The message content from the user',
    example: 'What is the status of CC1.2 control?',
    maxLength: 4000,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(4000)
  message: string;
}
