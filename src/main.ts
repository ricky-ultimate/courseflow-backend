import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Set global API prefix
  const apiPrefix = configService.get<string>('app.apiPrefix');
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
    console.log(`API prefix set to: /${apiPrefix}`);
  }

  // Enable CORS
  const corsOrigin = configService.get<string>('app.security.corsOrigin');
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger setup (only if enabled)
  const enableSwagger = configService.get<boolean>('app.features.enableSwagger');
  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('CourseFlow API')
      .setDescription('University Course Management System API')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    // Swagger will be available at /api/docs (with prefix)
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
    console.log(`Swagger documentation available at: http://localhost:${configService.get('app.port')}/${apiPrefix}/docs`);
  }

  // Debug: Check if JWT secret is loaded
  const jwtSecret = configService.get<string>('app.jwt.secret');
  console.log('JWT Secret loaded:', jwtSecret ? 'Yes' : 'No');

  if (!jwtSecret) {
    console.error('JWT_SECRET is not set in environment variables!');
    process.exit(1);
  }

  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  if (apiPrefix) {
    console.log(`API endpoints available at: http://localhost:${port}/${apiPrefix}`);
  }
}
bootstrap();
