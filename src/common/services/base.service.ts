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

export interface BaseServiceConfig {
  modelName: string;
  identifierField: string;
  uniqueFields?: string[];
  softDelete?: boolean;
  includeRelations?: any;
  defaultOrderBy?: { [key: string]: 'asc' | 'desc' };
}

@Injectable()
export abstract class BaseService<T, CreateDto, UpdateDto>
  implements BaseServiceInterface<T, CreateDto, UpdateDto>
{
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly config: BaseServiceConfig,
  ) {}

  async create(dto: CreateDto): Promise<T> {
    await this.checkUniqueConstraints(dto);

    const processedData = await this.beforeCreate(dto);

    return (this.prisma as any)[this.config.modelName].create({
      data: processedData,
      include: this.config.includeRelations,
    });
  }

  async findAll(
    options?: PaginationOptions,
  ): Promise<T[] | PaginatedResult<T>> {
    const where = this.getActiveFilter();

    if (options?.page && options?.limit) {
      return this.findPaginated(where, options);
    }

    return (this.prisma as any)[this.config.modelName].findMany({
      where,
      include: this.config.includeRelations,
      orderBy: this.getOrderBy(options),
    });
  }

  async findOne(identifier: string): Promise<T> {
    const entity = await (this.prisma as any)[this.config.modelName].findUnique(
      {
        where: {
          [this.config.identifierField]: identifier,
          ...this.getActiveFilter(),
        },
        include: this.config.includeRelations,
      },
    );

    if (!entity) {
      throw new NotFoundException(`${this.config.modelName} not found`);
    }

    return entity;
  }

  async update(identifier: string, dto: UpdateDto): Promise<T> {
    await this.findOne(identifier);
    await this.checkUniqueConstraints(dto, identifier);

    const processedData = await this.beforeUpdate(dto, identifier);

    return (this.prisma as any)[this.config.modelName].update({
      where: { [this.config.identifierField]: identifier },
      data: processedData,
      include: this.config.includeRelations,
    });
  }

  async remove(identifier: string): Promise<T> {
    await this.findOne(identifier);

    if (this.config.softDelete) {
      return (this.prisma as any)[this.config.modelName].update({
        where: { [this.config.identifierField]: identifier },
        data: { isActive: false },
        include: this.config.includeRelations,
      });
    }

    return (this.prisma as any)[this.config.modelName].delete({
      where: { [this.config.identifierField]: identifier },
    });
  }

  protected async beforeCreate(dto: CreateDto): Promise<any> {
    return dto;
  }

  protected async beforeUpdate(
    dto: UpdateDto,
    identifier: string,
  ): Promise<any> {
    return dto;
  }

  protected getActiveFilter(): any {
    return this.config.softDelete ? { isActive: true } : {};
  }

  protected getOrderBy(options?: PaginationOptions): any {
    if (options?.orderBy) {
      return { [options.orderBy]: options.orderDirection || 'asc' };
    }
    return this.config.defaultOrderBy || { createdAt: 'desc' };
  }

  private async findPaginated(
    where: any,
    options: PaginationOptions,
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      (this.prisma as any)[this.config.modelName].findMany({
        where,
        include: this.config.includeRelations,
        orderBy: this.getOrderBy(options),
        skip,
        take: limit,
      }),
      (this.prisma as any)[this.config.modelName].count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async checkUniqueConstraints(
    dto: any,
    excludeIdentifier?: string,
  ): Promise<void> {
    if (!this.config.uniqueFields?.length) return;

    for (const field of this.config.uniqueFields) {
      if (dto[field]) {
        const existing = await (this.prisma as any)[
          this.config.modelName
        ].findFirst({
          where: {
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
