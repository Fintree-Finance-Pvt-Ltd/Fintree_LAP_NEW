import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ApiExecutionLog } from './entities/api-execution-log.entity';

@Injectable()
export class AuditTelemetryService {
  private readonly logger = new Logger(AuditTelemetryService.name);

  constructor(
    @InjectRepository(ApiExecutionLog)
    private readonly repository: Repository<ApiExecutionLog>,
  ) {}

  record(entry: {
    method: string;
    endpoint: string;
    statusCode: number;
    latencyMs: number;
    requestId?: string;
    userId?: string | null;
    userName?: string | null;
    userEmail?: string | null;
    userRoles?: string | null;
  }) {
    const entity = this.repository.create({
      method: String(entry.method || 'UNKNOWN').toUpperCase().slice(0, 10),
      endpoint: this.normalizeEndpoint(entry.endpoint).slice(0, 500),
      statusCode: Number(entry.statusCode || 500),
      latencyMs: Math.max(0, Math.round(Number(entry.latencyMs || 0))),
      requestId: entry.requestId ? String(entry.requestId).slice(0, 80) : undefined,
      userId: entry.userId ? String(entry.userId).slice(0, 100) : undefined,
      userName: String(entry.userName || 'Anonymous').slice(0, 255),
      userEmail: entry.userEmail ? String(entry.userEmail).slice(0, 255) : undefined,
      userRoles: entry.userRoles ? String(entry.userRoles).slice(0, 500) : undefined,
    });

    // Logging must never delay or fail the customer-facing API response.
    void this.repository.save(entity).catch((error) => {
      this.logger.warn(`Unable to persist API telemetry: ${error?.message || error}`);
    });
  }

  private normalizeEndpoint(rawUrl: string) {
    const path = String(rawUrl || '/').split('?')[0];
    return path
      .replace(/\/[0-9]+(?=\/|$)/g, '/:id')
      .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}(?=\/|$)/gi, '/:id');
  }
}
