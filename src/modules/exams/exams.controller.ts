import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma';

@ApiTags('Exams')
@ApiBearerAuth('JWT-auth')
@Controller('exams')
@UseGuards(RolesGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Schedule a new exam' })
  @ApiResponse({ status: 201, description: 'Exam scheduled successfully' })
  @ApiResponse({ status: 409, description: 'Conflict (Venue/College/Time)' })
  create(@Body() createExamDto: CreateExamDto) {
    return this.examsService.create(createExamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all scheduled exams' })
  findAll() {
    return this.examsService.findAll();
  }
}
