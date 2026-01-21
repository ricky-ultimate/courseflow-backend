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
      map((data: unknown) => {
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'total' in data
        ) {
          return {
            success: true,
            ...(data as object),
          } as unknown as Response<T>;
        }

        if (
          data &&
          typeof data === 'object' &&
          'user' in data &&
          'access_token' in data
        ) {
          return data as unknown as Response<T>;
        }

        if (Array.isArray(data)) {
          return {
            success: true,
            data: data as unknown as T,
            message: 'Request processed successfully',
          };
        }

        return {
          success: true,
          data: data as T,
          message: 'Request processed successfully',
        };
      }),
    );
  }
}
