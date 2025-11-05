export class PaginationMetaDto {
  cursor?: string;
  hasMore: boolean;
}

export class PaginationResponseDto<T> {
  data: T[];
  meta: PaginationMetaDto;
}

