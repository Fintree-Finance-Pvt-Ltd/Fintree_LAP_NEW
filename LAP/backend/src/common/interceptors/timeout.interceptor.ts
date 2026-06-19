import { CallHandler, ExecutionContext, Injectable, NestInterceptor, RequestTimeoutException } from '@nestjs/common';
import { timeout, catchError, throwError } from 'rxjs';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(timeout(30000), catchError((error) => error.name === 'TimeoutError' ? throwError(() => new RequestTimeoutException()) : throwError(() => error)));
  }
}
