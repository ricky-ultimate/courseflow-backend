import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: unknown): ApiResponse<T> => {
        if (data === null || data === undefined) {
          return { success: true, message: 'Request processed successfully' };
        }

        if (typeof data === 'object' && !Array.isArray(data)) {
          const obj = data as Record<string, unknown>;

          if ('data' in obj && 'total' in obj && 'page' in obj) {
            return { success: true, ...(obj as object) } as ApiResponse<T>;
          }

          if ('success' in obj && ('data' in obj || 'message' in obj)) {
            return data as ApiResponse<T>;
          }
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
