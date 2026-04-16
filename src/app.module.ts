import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { appConfig, databaseConfig, validationSchema } from './config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from './modules/users/users.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { CoursesModule } from './modules/courses/courses.module';
import { PrismaModule } from './modules/database/prisma.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { HealthModule } from './modules/health/health.module';
import { RolesGuard } from './common/guards/roles.guard';
import { HodDepartmentGuard } from './common/guards/hod-department.guard';
import { AcademicSessionsModule } from './modules/academic-sessions/academic-sessions.module';
import { ExamsModule } from './modules/exams/exams.module';
import { CourseAliasesModule } from './modules/course-aliases/course-aliases.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      validationSchema,
      validationOptions: { allowUnknown: true, abortEarly: true },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('app.security.rateLimitTtl')!,
          limit: configService.get<number>('app.security.rateLimitMax')!,
        },
      ],
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    DepartmentsModule,
    CoursesModule,
    PrismaModule,
    SchedulesModule,
    ComplaintsModule,
    HealthModule,
    AcademicSessionsModule,
    ExamsModule,
    CourseAliasesModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: HodDepartmentGuard },
  ],
})
export class AppModule {}
