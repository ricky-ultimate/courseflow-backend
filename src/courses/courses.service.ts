import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { BaseService } from '../common/services/base.service';
import { CsvService } from '../common/services/csv.service';
import {
  CourseCsvRowDto,
  BulkOperationResult,
  CsvValidationError,
} from '../common/dto/csv-bulk.dto';
import { Course, Level } from '../generated/prisma';

@Injectable()
export class CoursesService extends BaseService<
  Course,
  CreateCourseDto,
  UpdateCourseDto
> {
  constructor(
    prisma: PrismaService,
    private readonly csvService: CsvService,
  ) {
    super(prisma, {
      modelName: 'course',
      identifierField: 'code',
      uniqueFields: ['code'],
      softDelete: true,
      includeRelations: { department: true },
      defaultOrderBy: { code: 'asc' },
    });
  }

  async findByDepartment(departmentCode: string): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: { departmentCode, isActive: true },
      include: { department: true },
      orderBy: [{ level: 'asc' }, { code: 'asc' }],
    });
  }

  async findByLevel(level: Level): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: { level, isActive: true },
      include: { department: true },
      orderBy: { code: 'asc' },
    });
  }

  async bulkCreateFromCsv(
    buffer: Buffer,
  ): Promise<BulkOperationResult<Course>> {
    const requiredHeaders = [
      'code',
      'name',
      'level',
      'credits',
      'departmentCode',
    ];

    // Parse and validate CSV
    const { data, errors } = await this.csvService.parseCsvFile(
      buffer,
      CourseCsvRowDto,
      requiredHeaders,
    );

    const created: Course[] = [];
    const allErrors: CsvValidationError[] = [...errors];

    if (data.length > 0) {
      // Use transaction for atomicity
      try {
        await this.prisma.$transaction(async (tx) => {
          for (let i = 0; i < data.length; i++) {
            const courseData = data[i];
            const rowNumber = i + 2; // CSV row number

            try {
              // Check if course already exists
              const existingCourse = await tx.course.findUnique({
                where: { code: courseData.code },
              });

              if (existingCourse) {
                allErrors.push({
                  row: rowNumber,
                  field: 'code',
                  value: courseData.code,
                  message: `Course with code '${courseData.code}' already exists`,
                });
                continue;
              }

              // Check if department exists
              const department = await tx.department.findUnique({
                where: { code: courseData.departmentCode },
              });

              if (!department) {
                allErrors.push({
                  row: rowNumber,
                  field: 'departmentCode',
                  value: courseData.departmentCode,
                  message: `Department with code '${courseData.departmentCode}' does not exist`,
                });
                continue;
              }

              // Create course
              const course = await tx.course.create({
                data: {
                  code: courseData.code,
                  name: courseData.name,
                  level: courseData.level,
                  credits: courseData.credits,
                  departmentCode: courseData.departmentCode,
                },
                include: { department: true },
              });

              created.push(course);
            } catch (error) {
              allErrors.push({
                row: rowNumber,
                field: 'general',
                value: courseData,
                message: `Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`,
              });
            }
          }

          // If there are any errors, rollback the transaction
          if (allErrors.length > 0) {
            throw new Error('Validation errors found');
          }
        });
      } catch {
        // Transaction was rolled back due to errors
        created.length = 0; // Clear created array since transaction was rolled back
      }
    }

    return this.csvService.createBulkResult(
      created,
      allErrors,
      data.length + errors.length,
    );
  }

  generateCsvTemplate(): string {
    const headers = ['code', 'name', 'level', 'credits', 'departmentCode'];
    const sampleData = {
      code: 'CS101',
      name: 'Introduction to Programming',
      level: 'LEVEL_100',
      credits: '3',
      departmentCode: 'CS',
    };

    return this.csvService.generateCsvTemplate(headers, sampleData);
  }
}
