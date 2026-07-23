import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApiExecutionLogs1830000000000 implements MigrationInterface {
  name = 'CreateApiExecutionLogs1830000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS api_execution_logs (
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
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS api_execution_logs');
  }
}
