import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const userId = user?.id || 'anonymous';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsed = Date.now() - now;
          const logLevel = elapsed > 1000 ? 'warn' : 'log';
          const message = `${method} ${url} - ${elapsed}ms [${userId}]`;

          if (logLevel === 'warn') {
            this.logger.warn(message);
          } else {
            this.logger.log(message);
          }
        },
        error: (error) => {
          const elapsed = Date.now() - now;
          const status = error?.status || 500;
          this.logger.error(
            `${method} ${url} - ${status} - ${elapsed}ms [${userId}]`,
            error?.stack,
          );
        },
      }),
    );
  }
}
