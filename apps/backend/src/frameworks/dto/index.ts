import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FrameworkResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  controlCount?: number;
}

export class FrameworkSectionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  frameworkId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  order: number;
}

export class ControlResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  frameworkId: string;

  @ApiPropertyOptional()
  sectionId?: string;

  @ApiProperty()
  controlId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  testProcedure: string;

  @ApiProperty()
  frequency: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  integrationType?: string;

  @ApiPropertyOptional()
  section?: FrameworkSectionResponseDto;
}

export class ControlMappingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sourceControl: ControlResponseDto;

  @ApiProperty()
  targetControl: ControlResponseDto;

  @ApiProperty()
  mappingType: string;

  @ApiPropertyOptional()
  notes?: string;
}

export class ActivateFrameworkDto {
  @ApiProperty({ description: 'Framework code (SOC2, ISO27001, HIPAA, PCIDSS)' })
  @IsString()
  frameworkCode: string;

  @ApiPropertyOptional({ description: 'Target compliance date' })
  @IsOptional()
  @IsDateString()
  targetDate?: string;
}

export class CustomerFrameworkResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  frameworkId: string;

  @ApiProperty()
  framework: FrameworkResponseDto;

  @ApiPropertyOptional()
  targetDate?: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  complianceScore?: number;
}
