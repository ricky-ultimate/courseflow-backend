import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../modules/database/prisma.service';
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

type PrismaModelOperations = {
  create: (args: unknown) => Promise<unknown>;
  findMany: (args?: unknown) => Promise<unknown[]>;
  findUnique: (args: unknown) => Promise<unknown>;
  findFirst: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
  count: (args?: unknown) => Promise<number>;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 1000;

@Injectable()
export abstract class BaseService<T, CreateDto, UpdateDto>
  implements BaseServiceInterface<T, CreateDto, UpdateDto>
{
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly config: BaseServiceConfig,
  ) {}

  protected getModel(): PrismaModelOperations {
    return (this.prisma as unknown as Record<string, PrismaModelOperations>)[
      this.config.modelName
    ];
  }

  async create(dto: CreateDto): Promise<T> {
    await this.checkUniqueConstraints(dto as Record<string, unknown>);
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

    if (options?.page !== undefined && options?.limit !== undefined) {
      return this.findPaginated(where, options);
    }

    return this.getModel().findMany({
      where,
      include: this.config.includeRelations,
      orderBy: this.getOrderBy(options),
    }) as Promise<T[]>;
  }

  async findOne(identifier: string): Promise<T> {
    const entity = await this.getModel().findUnique({
      where: {
        [this.config.identifierField]: identifier,
        ...this.getActiveFilter(),
      },
      include: this.config.includeRelations,
    });

    if (!entity) {
      throw new NotFoundException(
        `${this.config.modelName} '${identifier}' not found`,
      );
    }

    return entity as T;
  }

  async update(identifier: string, dto: UpdateDto): Promise<T> {
    await this.findOne(identifier);
    await this.checkUniqueConstraints(
      dto as Record<string, unknown>,
      identifier,
    );
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

  protected async beforeCreate(
    dto: CreateDto,
  ): Promise<Record<string, unknown>> {
    return Promise.resolve(dto as Record<string, unknown>);
  }

  protected async beforeUpdate(
    dto: UpdateDto,
    _identifier: string,
  ): Promise<Record<string, unknown>> {
    return Promise.resolve(dto as Record<string, unknown>);
  }

  protected getActiveFilter(): Record<string, unknown> {
    return this.config.softDelete ? { isActive: true } : {};
  }

  protected getOrderBy(
    options?: PaginationOptions,
  ): Record<string, 'asc' | 'desc'> {
    if (options?.orderBy) {
      return { [options.orderBy]: options.orderDirection ?? 'asc' };
    }
    return this.config.defaultOrderBy ?? { createdAt: 'desc' };
  }

  protected async findPaginated(
    where: Record<string, unknown>,
    options: PaginationOptions,
  ): Promise<PaginatedResult<T>> {
    const page = Math.max(1, options.page ?? DEFAULT_PAGE);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, options.limit ?? DEFAULT_LIMIT),
    );
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
    dto: Record<string, unknown>,
    excludeIdentifier?: string,
  ): Promise<void> {
    if (!this.config.uniqueFields?.length) return;

    for (const field of this.config.uniqueFields) {
      if (dto[field] !== undefined && dto[field] !== null) {
        const existing = await this.getModel().findFirst({
          where: {
            [field]: dto[field],
            ...(excludeIdentifier && {
              [this.config.identifierField]: { not: excludeIdentifier },
            }),
          },
        });

        if (existing) {
          throw new ConflictException(
            `A record with this ${field} already exists`,
          );
        }
      }
    }
  }
}
