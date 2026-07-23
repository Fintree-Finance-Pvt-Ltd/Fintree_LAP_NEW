import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuditTelemetryService } from '../../modules/audit/audit-telemetry.service';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  constructor(private readonly telemetry: AuditTelemetryService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    req.requestId = req.headers['x-request-id'] ?? randomUUID();
    res.setHeader('X-Request-ID', req.requestId);
    const startedAt = process.hrtime.bigint();
    let failureStatusCode: number | undefined;
    return next.handle().pipe(
      catchError((error) => {
        failureStatusCode = Number(error?.status || error?.statusCode || error?.response?.statusCode || 500);
        return throwError(() => error);
      }),
      finalize(() => {
        const latencyMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const user = req.user || {};
        const userId = user.id || user.userId || user.sub || null;
        const userName =
          user.name ||
          user.fullName ||
          user.username ||
          user.email ||
          'Anonymous';
        const userEmail = user.email || null;
        const userRoles = Array.isArray(user.roles)
          ? user.roles.join(',')
          : user.role || null;
        this.telemetry.record({
          method: req.method,
          endpoint: req.route?.path
            ? `${req.baseUrl || ''}${req.route.path}`
            : req.originalUrl || req.url,
          statusCode: failureStatusCode || res.statusCode,
          latencyMs,
          requestId: req.requestId,
          userId,
          userName,
          userEmail,
          userRoles,
        });
      }),
    );
  }
}
