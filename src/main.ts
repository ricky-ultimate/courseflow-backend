import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const apiPrefix = configService.get<string>('app.apiPrefix');
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
    //console.log(`API prefix set to: /${apiPrefix}`);
  }

  const corsOrigin = configService.get<string>('app.security.corsOrigin');
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const enableSwagger = configService.get<boolean>(
    'app.features.enableSwagger',
  );
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
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  const port =
    configService.get<number>('app.port') || process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  const environment =
    configService.get<string>('app.environment') || 'development';
  console.log(`Application is running on port ${port} in ${environment} mode`);

  if (apiPrefix) {
    console.log(`API endpoints available at: /${apiPrefix}`);
    if (enableSwagger) {
      console.log(`Swagger documentation available at: /${apiPrefix}/docs`);
    }
  }

  console.log(`Health check available at: /${apiPrefix}/health`);
  console.log(`Simple health check available at: /${apiPrefix}/health/simple`);
}
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
