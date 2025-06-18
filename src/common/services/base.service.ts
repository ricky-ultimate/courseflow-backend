import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  BaseServiceInterface,
  PaginationOptions,
  PaginatedResult,
} from '../interfaces/base-service.interface';

export interface BaseServiceConfig<TInclude = unknown> {
  modelName: string;
  identifierField: string;
  uniqueFields?: string[];
  softDelete?: boolean;
  includeRelations?: TInclude;
  defaultOrderBy?: Record<string, 'asc' | 'desc'>;
}

// Type for Prisma model operations
type PrismaModelOperations = {
  create: (args: any) => Promise<any>;
  findMany: (args?: any) => Promise<any[]>;
  findUnique: (args: any) => Promise<any>;
  findFirst: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
  count: (args?: any) => Promise<number>;
};

@Injectable()
export abstract class BaseService<T, CreateDto, UpdateDto>
  implements BaseServiceInterface<T, CreateDto, UpdateDto>
{
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly config: BaseServiceConfig,
  ) {}

  protected getModel(): PrismaModelOperations {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return (this.prisma as any)[this.config.modelName] as PrismaModelOperations;
  }

  async create(dto: CreateDto): Promise<T> {
    await this.checkUniqueConstraints(dto as Record<string, any>);

    const processedData = await this.beforeCreate(dto);

    return this.getModel().create({
      data: processedData,
      include: this.config.includeRelations,
    }) as Promise<T>;
  }

  async findAll(
    options?: PaginationOptions,
  ): Promise<T[] | PaginatedResult<T>> {
    const where = this.getActiveFilter();

    if (options?.page && options?.limit) {
      return this.findPaginated(where, options);
    }

    return this.getModel().findMany({
      where,
      include: this.config.includeRelations,
      orderBy: this.getOrderBy(options),
    }) as Promise<T[]>;
  }

  async findOne(identifier: string): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const entity = await this.getModel().findUnique({
      where: {
        [this.config.identifierField]: identifier,
        ...this.getActiveFilter(),
      },
      include: this.config.includeRelations,
    });

    if (!entity) {
      throw new NotFoundException(`${this.config.modelName} not found`);
    }

    return entity as T;
  }

  async update(identifier: string, dto: UpdateDto): Promise<T> {
    await this.findOne(identifier);
    await this.checkUniqueConstraints(dto as Record<string, any>, identifier);

    const processedData = await this.beforeUpdate(dto, identifier);

    return this.getModel().update({
      where: { [this.config.identifierField]: identifier },
      data: processedData,
      include: this.config.includeRelations,
    }) as Promise<T>;
  }

  async remove(identifier: string): Promise<T> {
    await this.findOne(identifier);

    if (this.config.softDelete) {
      return this.getModel().update({
        where: { [this.config.identifierField]: identifier },
        data: { isActive: false },
        include: this.config.includeRelations,
      }) as Promise<T>;
    }

    return this.getModel().delete({
      where: { [this.config.identifierField]: identifier },
    }) as Promise<T>;
  }

  protected async beforeCreate(dto: CreateDto): Promise<Record<string, any>> {
    return Promise.resolve(dto as Record<string, any>);
  }

  protected async beforeUpdate(
    dto: UpdateDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _identifier: string,
  ): Promise<Record<string, any>> {
    return Promise.resolve(dto as Record<string, any>);
  }

  protected getActiveFilter(): Record<string, any> {
    return this.config.softDelete ? { isActive: true } : {};
  }

  protected getOrderBy(
    options?: PaginationOptions,
  ): Record<string, 'asc' | 'desc'> {
    if (options?.orderBy) {
      return { [options.orderBy]: options.orderDirection || 'asc' };
    }
    return this.config.defaultOrderBy || { createdAt: 'desc' };
  }

  private async findPaginated(
    where: Record<string, any>,
    options: PaginationOptions,
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.getModel().findMany({
        where,
        include: this.config.includeRelations,
        orderBy: this.getOrderBy(options),
        skip,
        take: limit,
      }),
      this.getModel().count({ where }),
    ]);

    return {
      data: data as T[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async checkUniqueConstraints(
    dto: Record<string, any>,
    excludeIdentifier?: string,
  ): Promise<void> {
    if (!this.config.uniqueFields?.length) return;

    for (const field of this.config.uniqueFields) {
      if (dto[field]) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const existing = await this.getModel().findFirst({
          where: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            [field]: dto[field],
            ...(excludeIdentifier && {
              [this.config.identifierField]: { not: excludeIdentifier },
            }),
          },
        });

        if (existing) {
          throw new ConflictException(`${field} already exists`);
        }
      }
    }
  }
}
