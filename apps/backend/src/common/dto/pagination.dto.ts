import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export class PaginationDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
    minimum: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 50,
    minimum: 1,
    maximum: 100,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  totalPages: number;

  constructor(page: number, limit: number, total: number) {
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
  }
}

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (default: 1)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page (default: 50, max: 100)',
    example: 50,
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  limit?: number;
}
