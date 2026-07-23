import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserFieldsToApiExecutionLogs1840000000000
  implements MigrationInterface
{
  name = 'AddUserFieldsToApiExecutionLogs1840000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE api_execution_logs
        ADD COLUMN userId VARCHAR(100) NULL AFTER requestId,
        ADD COLUMN userName VARCHAR(255) NULL AFTER userId,
        ADD COLUMN userEmail VARCHAR(255) NULL AFTER userName,
        ADD COLUMN userRoles VARCHAR(500) NULL AFTER userEmail,
        ADD INDEX idx_api_execution_user_id (userId),
        ADD INDEX idx_api_execution_user_endpoint (userId, method, endpoint),
        ADD INDEX idx_api_execution_created_user (created_at, userId)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE api_execution_logs
        DROP INDEX idx_api_execution_created_user,
        DROP INDEX idx_api_execution_user_endpoint,
        DROP INDEX idx_api_execution_user_id,
        DROP COLUMN userRoles,
        DROP COLUMN userEmail,
        DROP COLUMN userName,
        DROP COLUMN userId
    `);
  }
}
