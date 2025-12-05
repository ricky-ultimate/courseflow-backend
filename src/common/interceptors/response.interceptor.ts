import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data: T) => {
        // If the data is already a paginated response with 'data' and 'total'
        // Don't wrap it again, just ensure success field is present
        if (data && typeof data === 'object' && 'data' in data && 'total' in data) {
          return {
            success: true,
            ...data,
          } as any;
        }

        // For auth responses (login, register) that have user and access_token
        if (data && typeof data === 'object' && 'user' in data && 'access_token' in data) {
          return data as any;
        }

        // For array responses (like verification codes)
        if (Array.isArray(data)) {
          return data as any;
        }

        // Default wrapping for other responses
        return {
          success: true,
          data,
          message: 'Request processed successfully',
        };
      }),
    );
  }
}
