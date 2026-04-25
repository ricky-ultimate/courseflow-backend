import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../../generated/prisma';

interface HttpExceptionResponse {
  message?: string | string[];
  error?: string;
  errorCode?: string;
}

interface ErrorResponse {
  success: boolean;
  statusCode: number;
  errorCode: string;
  timestamp: string;
  path: string;
  method: string;
  message: string[];
  stack?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as HttpExceptionResponse;
        message = responseObj.message ?? responseObj.error ?? exception.message;
        errorCode =
          responseObj.errorCode ?? this.getErrorCodeFromStatus(status);
      } else {
        message = String(exceptionResponse);
        errorCode = this.getErrorCodeFromStatus(status);
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      message = prismaError.message;
      errorCode = prismaError.code;
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided';
      errorCode = 'VALIDATION_ERROR';
    }

    const isDevelopment =
      this.configService.get<string>('app.nodeEnv') === 'development';

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode: status,
      errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: Array.isArray(message) ? message : [message],
      ...(isDevelopment && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    this.logger.error(
      `${request.method} ${request.url} - ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json(errorResponse);
  }

  private handlePrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
    code: string;
  } {
    switch (exception.code) {
      case 'P2002': {
        const field = exception.meta?.target as string[] | undefined;
        return {
          status: HttpStatus.CONFLICT,
          message: field
            ? `A record with this ${field.join(', ')} already exists`
            : 'A record with this information already exists',
          code: 'RECORD_EXISTS',
        };
      }
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          code: 'RECORD_NOT_FOUND',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Foreign key constraint failed',
          code: 'FOREIGN_KEY_ERROR',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database operation failed',
          code: 'DATABASE_ERROR',
        };
    }
  }

  private getErrorCodeFromStatus(status: number): string {
    const statusCodes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
    };

    return statusCodes[status] ?? 'INTERNAL_SERVER_ERROR';
  }
}
