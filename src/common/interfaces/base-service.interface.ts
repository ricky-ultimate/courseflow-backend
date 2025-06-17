export interface BaseServiceInterface<T, CreateDto, UpdateDto> {
  create(dto: CreateDto): Promise<T>;
  findAll(options?: PaginationOptions): Promise<T[] | PaginatedResult<T>>;
  findOne(identifier: string): Promise<T>;
  update(identifier: string, dto: UpdateDto): Promise<T>;
  remove(identifier: string): Promise<T>;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
