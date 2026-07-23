import 'reflect-metadata';
import database from '../src/database/database';
import { ApiAuditReportService } from '../src/modules/audit/api-audit-report.service';
import { ApiExecutionLog } from '../src/modules/audit/entities/api-execution-log.entity';

async function generate() {
  await database.initialize();
  try {
    const service = new ApiAuditReportService(database.getRepository(ApiExecutionLog));
    const result = await service.generateReport();
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await database.destroy();
  }
}

generate().catch((error) => {
  console.error('API audit generation failed:', error?.message || error);
  process.exitCode = 1;
});
