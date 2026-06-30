import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    return next.handle().pipe(map((payload) => ({
      success: true,
      message: payload?.message ?? 'Operation completed successfully',
      data: payload?.data ?? payload,
      meta: payload?.meta ?? null,
      requestId: request.requestId
    })));
  }
}
