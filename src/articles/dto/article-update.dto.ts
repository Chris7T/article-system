import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ArticleUpdateDto {
  @ApiProperty({ example: 'Updated Article Title', minLength: 3, maxLength: 200, required: false })
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must have at least 3 characters' })
  @MaxLength(200, { message: 'Title must have at most 200 characters' })
  title?: string;

  @ApiProperty({ example: 'Updated content of the article...', minLength: 10, required: false })
  @IsOptional()
  @IsString({ message: 'Content must be a string' })
  @MinLength(10, { message: 'Content must have at least 10 characters' })
  content?: string;
}

