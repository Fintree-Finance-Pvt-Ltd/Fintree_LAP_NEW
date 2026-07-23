import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiAuditReportService } from './api-audit-report.service';
import { AuditTelemetryService } from './audit-telemetry.service';
import { ApiExecutionLog } from './entities/api-execution-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApiExecutionLog])],
  providers: [AuditTelemetryService, ApiAuditReportService],
  exports: [AuditTelemetryService, ApiAuditReportService],
})
export class AuditModule {}
