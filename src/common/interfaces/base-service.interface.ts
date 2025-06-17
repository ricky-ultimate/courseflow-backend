export interface BaseService<T, CreateDto, UpdateDto> {
  create(dto: CreateDto): Promise<T>;
  findAll(): Promise<T[]>;
  findOne(id: string): Promise<T>;
  update(id: string, dto: UpdateDto): Promise<T>;
  remove(id: string): Promise<T>;
}
