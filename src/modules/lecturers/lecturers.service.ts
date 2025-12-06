import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateLecturerDto } from './dto/create-lecturer.dto';
import { UpdateLecturerDto } from './dto/update-lecturer.dto';
import { BaseService } from '../../common/services/base.service';
import { LecturerRepository } from './repositories/lecturer.repository';
import { Lecturer } from '../../generated/prisma';

@Injectable()
export class LecturersService extends BaseService<
  Lecturer,
  CreateLecturerDto,
  UpdateLecturerDto
> {
  constructor(
    prisma: PrismaService,
    private readonly lecturerRepository: LecturerRepository,
  ) {
    super(prisma, {
      modelName: 'lecturer',
      identifierField: 'id',
      uniqueFields: ['email'],
      softDelete: true,
      includeRelations: { department: true },
      defaultOrderBy: { name: 'asc' },
    });
  }

  async findByDepartment(departmentCode: string): Promise<Lecturer[]> {
    return this.lecturerRepository.findByDepartment(departmentCode);
  }

  async searchByName(searchTerm: string): Promise<Lecturer[]> {
    return this.lecturerRepository.searchByName(searchTerm);
  }

  protected async beforeCreate(
    dto: CreateLecturerDto,
  ): Promise<Record<string, any>> {
    const department = await this.prisma.department.findUnique({
      where: { code: dto.departmentCode },
    });

    if (!department) {
      throw new ConflictException(
        `Department with code '${dto.departmentCode}' does not exist`,
      );
    }
    return dto as Record<string, any>;
  }
}
