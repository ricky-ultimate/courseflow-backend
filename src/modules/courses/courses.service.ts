import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseFilterDto } from './dto/course-filter.dto';
import { BaseService } from '../../common/services/base.service';
import { CsvService } from '../../common/services/csv.service';
import { CourseRepository } from './repositories/course.repository';
import {
  CourseCsvRowDto,
  BulkOperationResult,
  CsvValidationError,
  FileBulkResult,
  MultiFileBulkOperationResult,
} from '../../common/dto/csv-bulk.dto';
import { College, Course, Level, Role, Semester } from '../../generated/prisma';
import { PaginatedResult } from '../../common/interfaces/base-service.interface';

export interface CourseWithAliasWarnings extends Course {
  aliasWarnings?: string[];
}

interface TrackedCourseRow {
  fileName: string;
  rowNumber: number;
  data: CourseCsvRowDto;
}

@Injectable()
export class CoursesService extends BaseService<
  Course,
  CreateCourseDto,
  UpdateCourseDto
> {
  constructor(
    prisma: PrismaService,
    private readonly csvService: CsvService,
    private readonly courseRepository: CourseRepository,
  ) {
    super(prisma, {
      modelName: 'course',
      identifierField: 'code',
      uniqueFields: ['code'],
      softDelete: true,
      includeRelations: {
        department: true,
        lecturer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            departmentCode: true,
          },
        },
      },
      defaultOrderBy: { code: 'asc' },
    });
  }

  async create(dto: CreateCourseDto): Promise<CourseWithAliasWarnings> {
    const { aliasOf, ...courseData } = dto;
    const course = await super.create(courseData as CreateCourseDto);

    if (!aliasOf?.length) return course;

    const warnings = await this.linkAliases(course.code, aliasOf);

    return warnings.length ? { ...course, aliasWarnings: warnings } : course;
  }

  async findAll(
    query: CourseFilterDto = {},
  ): Promise<Course[] | PaginatedResult<Course>> {
    const andConditions: Record<string, any>[] = [];

    if (this.config.softDelete) andConditions.push({ isActive: true });
    if (query.departmentCode) {
      if (query.includeGeneral) {
        andConditions.push({
          OR: [{ departmentCode: query.departmentCode }, { isGeneral: true }],
        });
      } else {
        andConditions.push({ departmentCode: query.departmentCode });
      }
    } else if (query.isGeneral !== undefined) {
      andConditions.push({ isGeneral: query.isGeneral });
    }
    if (query.level) andConditions.push({ level: query.level });
    if (query.semester) andConditions.push({ semester: query.semester });
    if (query.lecturerId) andConditions.push({ lecturerId: query.lecturerId });

    if (query.minCredits !== undefined || query.maxCredits !== undefined) {
      const creditFilter: Record<string, any> = {};
      if (query.minCredits !== undefined) creditFilter.gte = query.minCredits;
      if (query.maxCredits !== undefined) creditFilter.lte = query.maxCredits;
      andConditions.push({ credits: creditFilter });
    }

    if (query.searchTerm) {
      andConditions.push({
        OR: [
          { name: { contains: query.searchTerm, mode: 'insensitive' } },
          { code: { contains: query.searchTerm, mode: 'insensitive' } },
          {
            lecturer: {
              name: { contains: query.searchTerm, mode: 'insensitive' },
            },
          },
        ],
      });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    if (query.page && query.limit) return this.findPaginated(where, query);

    return this.getModel().findMany({
      where,
      include: this.config.includeRelations,
      orderBy: this.getOrderBy(query),
    }) as Promise<Course[]>;
  }

  protected async beforeCreate(
    dto: CreateCourseDto,
  ): Promise<Record<string, any>> {
    const department = await this.prisma.department.findUnique({
      where: { code: dto.departmentCode },
    });
    if (!department) {
      throw new NotFoundException(
        `Department with code '${dto.departmentCode}' not found`,
      );
    }

    if (dto.lecturerId) {
      const lecturer = await this.prisma.user.findUnique({
        where: { id: dto.lecturerId, isActive: true },
      });
      if (!lecturer) {
        throw new NotFoundException(
          `Lecturer with id '${dto.lecturerId}' not found`,
        );
      }
      if (lecturer.role !== Role.LECTURER && lecturer.role !== Role.HOD) {
        throw new NotFoundException(
          `User '${dto.lecturerId}' is not a lecturer`,
        );
      }
    }

    return dto as Record<string, any>;
  }

  protected async beforeUpdate(
    dto: UpdateCourseDto,
    identifier: string,
  ): Promise<Record<string, any>> {
    const course = await this.prisma.course.findUnique({
      where: { code: identifier },
    });

    if (course?.isLocked && dto.isLocked !== false) {
      throw new ForbiddenException(
        'Cannot modify locked university courses. Unlock the course first.',
      );
    }

    if (dto.departmentCode) {
      const department = await this.prisma.department.findUnique({
        where: { code: dto.departmentCode },
      });
      if (!department) {
        throw new NotFoundException(
          `Department with code '${dto.departmentCode}' not found`,
        );
      }
    }

    if (dto.lecturerId) {
      const lecturer = await this.prisma.user.findUnique({
        where: { id: dto.lecturerId, isActive: true },
      });
      if (!lecturer) {
        throw new NotFoundException(
          `Lecturer with id '${dto.lecturerId}' not found`,
        );
      }
      if (lecturer.role !== Role.LECTURER && lecturer.role !== Role.HOD) {
        throw new NotFoundException(
          `User '${dto.lecturerId}' is not a lecturer`,
        );
      }
    }

    return dto as Record<string, any>;
  }

  async remove(identifier: string): Promise<Course> {
    const course = await this.prisma.course.findUnique({
      where: { code: identifier },
    });
    if (course?.isLocked) {
      throw new ForbiddenException(
        'Cannot delete locked university courses (e.g. GST, PIF).',
      );
    }
    return super.remove(identifier);
  }

  async bulkCreateFromCsv(
    buffer: Buffer,
    collegeScope?: College,
  ): Promise<BulkOperationResult<Course>> {
    const requiredHeaders = [
      'code',
      'name',
      'level',
      'semester',
      'credits',
      'departmentCode',
    ];

    const { data, errors } = await this.csvService.parseCsvFile(
      buffer,
      CourseCsvRowDto,
      requiredHeaders,
    );
    const allErrors: CsvValidationError[] = [...errors];

    if (data.length === 0) {
      return this.csvService.createBulkResult([], allErrors, errors.length);
    }

    if (collegeScope) {
      const deptCodes = [...new Set(data.map((r) => r.departmentCode))];
      const depts = await this.prisma.department.findMany({
        where: { code: { in: deptCodes } },
        select: { code: true, college: true },
      });
      const deptCollegeMap = new Map(depts.map((d) => [d.code, d.college]));

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const deptCollege = deptCollegeMap.get(row.departmentCode);
        if (deptCollege && deptCollege !== collegeScope) {
          allErrors.push({
            row: i + 2,
            field: 'departmentCode',
            value: row.departmentCode,
            message: `Department '${row.departmentCode}' does not belong to your college (${collegeScope})`,
          });
        }
      }

      const errorRows = new Set(allErrors.map((e) => e.row));
      const filteredData = data.filter((_, i) => !errorRows.has(i + 2));

      if (filteredData.length === 0) {
        return this.csvService.createBulkResult(
          [],
          allErrors,
          data.length + errors.length,
        );
      }
    }

    const codeToAliasMap = new Map<string, string[]>();
    for (const row of data) {
      if (row.aliasOfCodes?.trim()) {
        const codes = row.aliasOfCodes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (codes.length) codeToAliasMap.set(row.code, codes);
      }
    }

    const lecturerEmails = [
      ...new Set(
        data
          .map((r) => r.lecturerEmail?.trim().toLowerCase())
          .filter((email): email is string => !!email),
      ),
    ];
    const lecturers = lecturerEmails.length
      ? await this.prisma.user.findMany({
          where: {
            email: { in: lecturerEmails, mode: 'insensitive' },
            role: { in: [Role.LECTURER, Role.HOD] },
            isActive: true,
          },
          select: { email: true, id: true },
        })
      : [];

    const emailToIdMap = new Map(
      lecturers.map((l) => [l.email.toLowerCase(), l.id]),
    );

    const rowsForRepo: Array<{
      code: string;
      name: string;
      level: Level;
      semester: Semester;
      credits: number;
      departmentCode: string;
      lecturerId?: string;
    }> = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const requestedEmail = row.lecturerEmail?.trim();

      if (!requestedEmail) {
        rowsForRepo.push({
          code: row.code,
          name: row.name,
          level: row.level,
          semester: row.semester,
          credits: row.credits,
          departmentCode: row.departmentCode,
        });
        continue;
      }

      const lecturerId = emailToIdMap.get(requestedEmail.toLowerCase());

      if (!lecturerId) {
        allErrors.push({
          row: i + 2,
          field: 'lecturerEmail',
          value: row.lecturerEmail,
          message: `Lecturer with email '${row.lecturerEmail}' not found or is not a lecturer.`,
        });
      } else {
        rowsForRepo.push({
          code: row.code,
          name: row.name,
          level: row.level,
          semester: row.semester,
          credits: row.credits,
          departmentCode: row.departmentCode,
          lecturerId,
        });
      }
    }

    if (rowsForRepo.length === 0) {
      return this.csvService.createBulkResult(
        [],
        allErrors,
        data.length + errors.length,
      );
    }

    const { created, errors: repositoryErrors } =
      await this.courseRepository.bulkCreateWithValidation(rowsForRepo);

    for (const repoError of repositoryErrors) {
      const originalRow = data.find(
        (d) => d.code === rowsForRepo[repoError.index].code,
      );
      allErrors.push({
        row: 0,
        field: 'general',
        value: originalRow ? originalRow.code : 'Unknown',
        message: repoError.error,
      });
    }

    const aliasWarnings: string[] = [];
    for (const course of created) {
      const targets = codeToAliasMap.get(course.code) ?? [];
      if (targets.length) {
        const warnings = await this.linkAliases(course.code, targets);
        aliasWarnings.push(...warnings);
      }
    }

    return this.csvService.createBulkResult(
      created,
      allErrors,
      data.length + errors.length,
      aliasWarnings,
    );
  }

  async bulkCreateFromMultipleCsv(
    files: Array<{ originalName: string; buffer: Buffer }>,
    collegeScope?: College,
  ): Promise<MultiFileBulkOperationResult<Course>> {
    const requiredHeaders = [
      'code',
      'name',
      'level',
      'semester',
      'credits',
      'departmentCode',
    ];

    const fileErrors = new Map<string, CsvValidationError[]>();
    const fileTotalRows = new Map<string, number>();

    const parseOutcomes = await Promise.allSettled(
      files.map((file) =>
        this.csvService.parseCsvFile(
          file.buffer,
          CourseCsvRowDto,
          requiredHeaders,
        ),
      ),
    );

    const trackedRows: TrackedCourseRow[] = [];

    files.forEach((file, index) => {
      fileErrors.set(file.originalName, []);
      const outcome = parseOutcomes[index];

      if (outcome.status === 'rejected') {
        fileTotalRows.set(file.originalName, 0);
        const reason: unknown = outcome.reason;
        fileErrors.get(file.originalName)!.push({
          row: 0,
          field: 'file',
          value: file.originalName,
          message:
            reason instanceof Error
              ? reason.message
              : 'Failed to parse CSV file',
        });
        return;
      }

      const { data, errors } = outcome.value;
      fileErrors.get(file.originalName)!.push(...errors);
      fileTotalRows.set(file.originalName, data.length + errors.length);

      data.forEach((row, rowIndex) => {
        trackedRows.push({
          fileName: file.originalName,
          rowNumber: rowIndex + 2,
          data: row,
        });
      });
    });

    let scopedRows = trackedRows;

    if (collegeScope) {
      const deptCodes = [
        ...new Set(trackedRows.map((row) => row.data.departmentCode)),
      ];
      const depts = deptCodes.length
        ? await this.prisma.department.findMany({
            where: { code: { in: deptCodes } },
            select: { code: true, college: true },
          })
        : [];
      const deptCollegeMap = new Map(depts.map((d) => [d.code, d.college]));

      scopedRows = trackedRows.filter((row) => {
        const deptCollege = deptCollegeMap.get(row.data.departmentCode);
        if (deptCollege && deptCollege !== collegeScope) {
          fileErrors.get(row.fileName)!.push({
            row: row.rowNumber,
            field: 'departmentCode',
            value: row.data.departmentCode,
            message: `Department '${row.data.departmentCode}' does not belong to your college (${collegeScope})`,
          });
          return false;
        }
        return true;
      });
    }

    const codeOccurrences = new Map<string, TrackedCourseRow[]>();
    for (const row of scopedRows) {
      const occurrences = codeOccurrences.get(row.data.code) ?? [];
      occurrences.push(row);
      codeOccurrences.set(row.data.code, occurrences);
    }

    const dedupedRows: TrackedCourseRow[] = [];
    for (const occurrences of codeOccurrences.values()) {
      const [first, ...duplicates] = occurrences;
      dedupedRows.push(first);
      for (const duplicate of duplicates) {
        fileErrors.get(duplicate.fileName)!.push({
          row: duplicate.rowNumber,
          field: 'code',
          value: duplicate.data.code,
          message: `Course code '${duplicate.data.code}' also appears in '${first.fileName}' (row ${first.rowNumber}). Duplicate skipped.`,
        });
      }
    }

    const lecturerEmails = [
      ...new Set(
        dedupedRows
          .map((row) => row.data.lecturerEmail?.trim().toLowerCase())
          .filter((email): email is string => !!email),
      ),
    ];
    const lecturers = lecturerEmails.length
      ? await this.prisma.user.findMany({
          where: {
            email: { in: lecturerEmails, mode: 'insensitive' },
            role: { in: [Role.LECTURER, Role.HOD] },
            isActive: true,
          },
          select: { email: true, id: true },
        })
      : [];
    const emailToIdMap = new Map(
      lecturers.map((lecturer) => [lecturer.email.toLowerCase(), lecturer.id]),
    );

    const rowsForRepo: Array<{
      code: string;
      name: string;
      level: Level;
      semester: Semester;
      credits: number;
      departmentCode: string;
      lecturerId?: string;
    }> = [];
    const rowByCode = new Map<string, TrackedCourseRow>();

    for (const row of dedupedRows) {
      const requestedEmail = row.data.lecturerEmail?.trim();

      if (!requestedEmail) {
        rowsForRepo.push({
          code: row.data.code,
          name: row.data.name,
          level: row.data.level,
          semester: row.data.semester,
          credits: row.data.credits,
          departmentCode: row.data.departmentCode,
        });
        rowByCode.set(row.data.code, row);
        continue;
      }

      const lecturerId = emailToIdMap.get(requestedEmail.toLowerCase());

      if (!lecturerId) {
        fileErrors.get(row.fileName)!.push({
          row: row.rowNumber,
          field: 'lecturerEmail',
          value: row.data.lecturerEmail,
          message: `Lecturer with email '${row.data.lecturerEmail}' not found or is not a lecturer.`,
        });
        continue;
      }

      rowsForRepo.push({
        code: row.data.code,
        name: row.data.name,
        level: row.data.level,
        semester: row.data.semester,
        credits: row.data.credits,
        departmentCode: row.data.departmentCode,
        lecturerId,
      });
      rowByCode.set(row.data.code, row);
    }

    const { created, errors: repositoryErrors } = rowsForRepo.length
      ? await this.courseRepository.bulkCreateWithValidation(rowsForRepo)
      : { created: [], errors: [] };

    const createdByFile = new Map<string, Course[]>();
    for (const file of files) createdByFile.set(file.originalName, []);

    for (const course of created) {
      const meta = rowByCode.get(course.code);
      if (meta) createdByFile.get(meta.fileName)!.push(course);
    }

    for (const repoError of repositoryErrors) {
      const failedRow = rowsForRepo[repoError.index];
      const meta = rowByCode.get(failedRow.code);
      const fileName = meta?.fileName ?? files[0].originalName;
      fileErrors.get(fileName)!.push({
        row: meta?.rowNumber ?? 0,
        field: 'general',
        value: failedRow.code,
        message: repoError.error,
      });
    }

    const aliasWarningsByFile = new Map<string, string[]>();
    for (const file of files) aliasWarningsByFile.set(file.originalName, []);

    for (const [fileName, courses] of createdByFile) {
      for (const course of courses) {
        const sourceRow = rowByCode.get(course.code);
        const aliasCodes = sourceRow?.data.aliasOfCodes?.trim()
          ? sourceRow.data.aliasOfCodes
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
        if (aliasCodes.length) {
          const warnings = await this.linkAliases(course.code, aliasCodes);
          aliasWarningsByFile.get(fileName)!.push(...warnings);
        }
      }
    }

    const fileResults: FileBulkResult<Course>[] = files.map((file) => {
      const fileName = file.originalName;
      return {
        fileName,
        result: this.csvService.createBulkResult(
          createdByFile.get(fileName) ?? [],
          fileErrors.get(fileName) ?? [],
          fileTotalRows.get(fileName) ?? 0,
          aliasWarningsByFile.get(fileName),
        ),
      };
    });

    const summary = fileResults.reduce(
      (acc, file) => ({
        totalFiles: acc.totalFiles,
        totalRows: acc.totalRows + file.result.summary.totalRows,
        successCount: acc.successCount + file.result.summary.successCount,
        errorCount: acc.errorCount + file.result.summary.errorCount,
      }),
      {
        totalFiles: files.length,
        totalRows: 0,
        successCount: 0,
        errorCount: 0,
      },
    );

    return {
      success: summary.errorCount === 0,
      files: fileResults,
      summary,
    };
  }

  generateCsvTemplate(): string {
    const headers = [
      'code',
      'name',
      'level',
      'semester',
      'credits',
      'departmentCode',
      'lecturerEmail',
      'aliasOfCodes',
    ];
    const sampleData = {
      code: 'CSC101',
      name: 'Introduction to Programming',
      level: 'LEVEL_100',
      semester: 'FIRST',
      credits: '3',
      departmentCode: 'CSC',
      lecturerEmail: 'lecturer@university.edu',
      aliasOfCodes: '',
    };
    return this.csvService.generateCsvTemplate(headers, sampleData);
  }

  async findWithoutSchedules(): Promise<Course[]> {
    return this.courseRepository.findWithoutSchedules();
  }

  async getCourseStats() {
    return this.courseRepository.getCourseStats();
  }

  async findUniversityCoursesWithoutSchedules(): Promise<Course[]> {
    return this.courseRepository.findUniversityCoursesWithoutSchedules();
  }

  private async linkAliases(
    courseCode: string,
    targets: string[],
  ): Promise<string[]> {
    const warnings: string[] = [];

    for (const targetCode of targets) {
      if (targetCode === courseCode) {
        warnings.push(`${targetCode}: a course cannot alias itself`);
        continue;
      }

      const target = await this.prisma.course.findUnique({
        where: { code: targetCode },
      });

      if (!target) {
        warnings.push(`${targetCode}: course not found, link skipped`);
        continue;
      }

      const existing = await this.prisma.courseAlias.findFirst({
        where: {
          OR: [
            { primaryCode: courseCode, aliasCode: targetCode },
            { primaryCode: targetCode, aliasCode: courseCode },
          ],
        },
      });

      if (existing) {
        warnings.push(`${targetCode}: alias relationship already exists`);
        continue;
      }

      await this.prisma.courseAlias.create({
        data: { primaryCode: courseCode, aliasCode: targetCode },
      });
    }

    return warnings;
  }
}
