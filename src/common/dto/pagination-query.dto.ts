import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Cursor for pagination (ID of the last item from previous page)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  cursor?: string;
}

