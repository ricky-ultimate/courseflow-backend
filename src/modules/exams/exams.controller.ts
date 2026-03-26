import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { GenerateExamTimetableDto } from './dto/generate-exam-timetable.dto';
import { BaseController } from '../../common/controllers/base.controller';
import { CrudRoles } from '../../common/decorators/crud-roles.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipHodGuard } from '../../common/decorators/skip-hod-guard.decorator';
import { ExamSchedule, Role } from '../../generated/prisma';
import { PaginationOptions } from '../../common/interfaces/base-service.interface';
import {
  ApiCreateExam,
  ApiGetExams,
  ApiGetExamById,
  ApiUpdateExam,
  ApiDeleteExam,
  ApiGenerateExamTimetable,
} from './decorators/exam-api.decorator';

@ApiTags('Exams')
@Controller('exams')
@CrudRoles({
  create: [Role.ADMIN],
  read: [],
  update: [Role.ADMIN],
  delete: [Role.ADMIN],
})
export class ExamsController extends BaseController<
  ExamSchedule,
  CreateExamDto,
  UpdateExamDto
> {
  constructor(private readonly examsService: ExamsService) {
    super(examsService);
  }

  @Post('generate')
  @Roles(Role.ADMIN)
  @SkipHodGuard()
  @ApiGenerateExamTimetable()
  generate(@Body() dto: GenerateExamTimetableDto) {
    return this.examsService.generateExamTimetable(dto);
  }

  @Post()
  @ApiCreateExam()
  create(@Body() createDto: CreateExamDto) {
    return this.examsService.create(createDto);
  }

  @Get()
  @ApiGetExams()
  findAll(@Query() query?: PaginationOptions) {
    return this.examsService.findAll(query);
  }

  @Get(':id')
  @ApiGetExamById()
  findOne(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateExam()
  update(@Param('id') id: string, @Body() updateDto: UpdateExamDto) {
    return this.examsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiDeleteExam()
  remove(@Param('id') id: string) {
    return this.examsService.remove(id);
  }
}
