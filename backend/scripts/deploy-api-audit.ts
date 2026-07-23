import 'reflect-metadata';
import database from '../src/database/database';

async function deploy() {
  await database.initialize();
  try {
    await database.query(`CREATE TABLE IF NOT EXISTS api_execution_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      method VARCHAR(10) NOT NULL,
      endpoint VARCHAR(500) NOT NULL,
      statusCode SMALLINT UNSIGNED NOT NULL,
      latencyMs INT UNSIGNED NOT NULL,
      requestId VARCHAR(80) NULL,
      created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      PRIMARY KEY (id),
      INDEX idx_api_execution_logs_created_at (created_at),
      INDEX idx_api_execution_logs_endpoint (method, endpoint),
      INDEX idx_api_execution_logs_status (statusCode)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    console.log('API audit telemetry table is ready.');
  } finally {
    await database.destroy();
  }
}

deploy().catch((error) => {
  console.error('API audit deployment failed:', error?.message || error);
  process.exitCode = 1;
});
