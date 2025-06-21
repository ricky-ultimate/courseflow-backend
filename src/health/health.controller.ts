import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service';
import {
  ApiHealthCheck,
  ApiSimpleHealthCheck,
  ApiDatabaseHealthCheck,
  ApiReadinessCheck,
  ApiLivenessCheck,
} from './decorators/health-api.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiHealthCheck()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      const memoryUsage = process.memoryUsage();

      return {
        status: 'ok',
        info: {
          database: { status: 'up' },
          memory_heap: {
            status: memoryUsage.heapUsed < 150 * 1024 * 1024 ? 'up' : 'down',
            used: memoryUsage.heapUsed,
            limit: 150 * 1024 * 1024,
          },
          memory_rss: {
            status: memoryUsage.rss < 150 * 1024 * 1024 ? 'up' : 'down',
            used: memoryUsage.rss,
            limit: 150 * 1024 * 1024,
          },
        },
        error: {},
        details: {
          database: { status: 'up' },
          memory_heap: {
            status: memoryUsage.heapUsed < 150 * 1024 * 1024 ? 'up' : 'down',
          },
          memory_rss: {
            status: memoryUsage.rss < 150 * 1024 * 1024 ? 'up' : 'down',
          },
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          error: {
            database: {
              status: 'down',
              message:
                error instanceof Error
                  ? error.message
                  : 'Database connection failed',
            },
          },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('simple')
  @ApiSimpleHealthCheck()
  simpleCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  @Get('database')
  @ApiDatabaseHealthCheck()
  async databaseCheck() {
    try {
      const startTime = Date.now();

      await this.prisma.$queryRaw`SELECT 1`;

      const responseTime = Date.now() - startTime;

      const [departmentCount, courseCount, scheduleCount, userCount] =
        await Promise.all([
          this.prisma.department.count({ where: { isActive: true } }),
          this.prisma.course.count({ where: { isActive: true } }),
          this.prisma.schedule.count(),
          this.prisma.user.count({ where: { isActive: true } }),
        ]);

      return {
        status: 'ok',
        database: {
          connected: true,
          responseTime,
          tables: {
            departments: departmentCount,
            courses: courseCount,
            schedules: scheduleCount,
            users: userCount,
          },
        },
      };
    } catch (error) {
      return {
        status: 'error',
        error:
          error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }

  @Get('readiness')
  @ApiReadinessCheck()
  async readinessCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ready',
        checks: {
          database: true,
          dependencies: true,
        },
      };
    } catch {
      throw new Error('Application not ready');
    }
  }

  @Get('liveness')
  @ApiLivenessCheck()
  livenessCheck() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
