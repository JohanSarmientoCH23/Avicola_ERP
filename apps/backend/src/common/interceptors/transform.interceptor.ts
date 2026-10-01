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
  data: T;
  meta?: Record<string, any>;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && data._skipTransform) {
          return data;
        }

        const meta = data?.meta ? data.meta : undefined;
        const actualData = data?.data !== undefined ? data.data : data;

        return {
          success: true,
          data: actualData,
          ...(meta ? { meta } : {}),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
