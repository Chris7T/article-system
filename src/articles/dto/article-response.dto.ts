import { Expose, Transform } from 'class-transformer';

export class ArticleResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  content: string;

  @Expose()
  @Transform(({ obj }) => {
    if (obj.author && typeof obj.author === 'object') {
      return obj.author.id || null;
    }
    return obj.authorId || null;
  })
  author_id: string;

  @Expose()
  @Transform(({ obj }) => {
    if (obj.author && typeof obj.author === 'object') {
      return obj.author.name || null;
    }
    return null;
  })
  author_name: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

