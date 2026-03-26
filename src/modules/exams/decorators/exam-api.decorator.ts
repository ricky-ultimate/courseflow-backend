import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { College, Semester } from '../../../generated/prisma';
import {
  ApiStandardResponses,
  ApiAuthRequired,
  ApiNotFoundResponse,
} from '../../../common/decorators/base-api.decorator';

export const ApiGetExams = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all exams',
      description:
        'Retrieve all scheduled exams with course and venue details. Supports pagination.',
    }),
    ApiResponse({
      status: 200,
      description: 'Exams retrieved successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            courseCode: { type: 'string', example: 'CSC201' },
            date: { type: 'string', format: 'date-time' },
            startTime: { type: 'string', example: '09:00' },
            endTime: { type: 'string', example: '12:00' },
            venueId: { type: 'string', format: 'uuid' },
            studentCount: { type: 'number', example: 50 },
            targetCollege: {
              type: 'string',
              enum: Object.values(College),
              nullable: true,
            },
            invigilators: { type: 'string', example: 'Dr. Smith' },
            semester: { type: 'string', enum: Object.values(Semester) },
            course: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Intro to Java' },
                department: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Computer Science' },
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetExamById = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get exam by ID',
      description: 'Retrieve a specific exam schedule by its ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      format: 'uuid',
      description: 'Exam ID',
    }),
    ApiResponse({
      status: 200,
      description: 'Exam retrieved successfully',
    }),
    ApiNotFoundResponse('Exam'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiCreateExam = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Schedule a new exam',
      description:
        'Create a new exam schedule. Validates venue capacity, time conflicts, college separation rules, and CBT requirements.',
    }),
    ApiResponse({
      status: 201,
      description: 'Exam scheduled successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - CBT Rules violation or missing inputs',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: {
            type: 'string',
            example:
              'Course GST101 is CBT-based (100L/General). Must use an ICT venue.',
          },
          error: { type: 'string', example: 'Bad Request' },
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - Venue occupied or Capacity exceeded',
    }),
    ApiNotFoundResponse('Course, Venue, or Active Session'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiUpdateExam = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update exam schedule',
      description: 'Update exam details (re-validates all conflict rules)',
    }),
    ApiParam({ name: 'id', type: 'string', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Exam updated successfully',
    }),
    ApiNotFoundResponse('Exam'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiDeleteExam = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete exam',
      description: 'Remove an exam from the schedule',
    }),
    ApiParam({ name: 'id', type: 'string', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Exam deleted successfully',
    }),
    ApiNotFoundResponse('Exam'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGenerateExamTimetable = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Auto-generate exam timetable',
      description:
        'Generate exam schedules for all active courses in the given scope. ' +
        'Deletes previously generated exams for the same scope then creates new ones spread ' +
        'across the 3 weeks prior to session end. Supports filtering by department, level, and college.',
    }),
    ApiResponse({
      status: 201,
      description: 'Exam timetable generated successfully',
      schema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' },
          sessionName: { type: 'string', example: '2024/2025' },
          semester: { type: 'string', enum: Object.values(Semester) },
          departmentCode: { type: 'string', nullable: true },
          level: { type: 'string', nullable: true },
          college: { type: 'string', nullable: true },
          totalCourses: { type: 'number', example: 60 },
          scheduledExams: { type: 'number', example: 58 },
          skippedCourses: {
            type: 'array',
            items: { type: 'string' },
            description: 'Course codes that could not be scheduled',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'No active session found',
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetCoursesWithoutExams = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get courses without exam schedules',
      description:
        'Retrieve courses that have no exam scheduled in the active academic session',
    }),
    ApiResponse({
      status: 200,
      description: 'Courses without exams retrieved successfully',
      schema: {
        type: 'array',
        items: { type: 'object' },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );
