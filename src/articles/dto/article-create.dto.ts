import {
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class ArticleCreateDto {
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must have at least 3 characters' })
  @MaxLength(200, { message: 'Title must have at most 200 characters' })
  title: string;

  @IsNotEmpty({ message: 'Content is required' })
  @IsString({ message: 'Content must be a string' })
  @MinLength(10, { message: 'Content must have at least 10 characters' })
  content: string;
}

