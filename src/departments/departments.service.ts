import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { BaseService } from '../common/services/base.service';
import { CsvService } from '../common/services/csv.service';
import {
  DepartmentCsvRowDto,
  BulkOperationResult,
  CsvValidationError,
} from '../common/dto/csv-bulk.dto';
import { Department } from '../generated/prisma';

@Injectable()
export class DepartmentsService extends BaseService<
  Department,
  CreateDepartmentDto,
  UpdateDepartmentDto
> {
  constructor(
    prisma: PrismaService,
    private readonly csvService: CsvService,
  ) {
    super(prisma, {
      modelName: 'department',
      identifierField: 'code',
      uniqueFields: ['code', 'name'],
      softDelete: true,
      defaultOrderBy: { name: 'asc' },
    });
  }

  async bulkCreateFromCsv(
    buffer: Buffer,
  ): Promise<BulkOperationResult<Department>> {
    const requiredHeaders = ['code', 'name'];

    const { data, errors } = await this.csvService.parseCsvFile(
      buffer,
      DepartmentCsvRowDto,
      requiredHeaders,
    );

    const created: Department[] = [];
    const allErrors: CsvValidationError[] = [...errors];

    if (data.length > 0) {
      try {
        await this.prisma.$transaction(async (tx) => {
          for (let i = 0; i < data.length; i++) {
            const departmentData = data[i];
            const rowNumber = i + 2;

            try {
              const existing = await tx.department.findUnique({
                where: { code: departmentData.code },
              });

              if (existing) {
                allErrors.push({
                  row: rowNumber,
                  field: 'code',
                  value: departmentData.code,
                  message: `Department with code '${departmentData.code}' already exists`,
                });
                continue;
              }

              const department = await tx.department.create({
                data: {
                  code: departmentData.code,
                  name: departmentData.name,
                },
              });

              created.push(department);
            } catch (error) {
              allErrors.push({
                row: rowNumber,
                field: 'general',
                value: departmentData,
                message: `Failed to create department: ${error instanceof Error ? error.message : 'Unknown error'}`,
              });
            }
          }

          if (allErrors.length > 0) {
            throw new Error('Validation errors found');
          }
        });
      } catch {
        created.length = 0;
      }
    }

    return this.csvService.createBulkResult(
      created,
      allErrors,
      data.length + errors.length,
    );
  }

  generateCsvTemplate(): string {
    const headers = ['code', 'name'];
    const sampleData = {
      code: 'CS',
      name: 'Computer Science',
    };

    return this.csvService.generateCsvTemplate(headers, sampleData);
  }
}
