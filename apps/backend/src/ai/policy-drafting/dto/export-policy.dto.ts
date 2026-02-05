import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum ExportFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  MARKDOWN = 'markdown',
}

export class ExportPolicyDto {
  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    default: ExportFormat.PDF,
  })
  @IsEnum(ExportFormat)
  format: ExportFormat = ExportFormat.PDF;
}
