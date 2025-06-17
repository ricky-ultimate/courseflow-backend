import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export abstract class BaseService<T> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: string,
  ) {}

  protected async findEntityOrThrow(
    where: any,
    errorMessage = 'Entity not found',
  ): Promise<T> {
    const entity = await (this.prisma as any)[this.modelName].findUnique({
      where,
    });

    if (!entity) {
      throw new NotFoundException(errorMessage);
    }

    return entity;
  }

  protected async softDelete(where: any): Promise<T> {
    return (this.prisma as any)[this.modelName].update({
      where,
      data: { isActive: false },
    });
  }
}
