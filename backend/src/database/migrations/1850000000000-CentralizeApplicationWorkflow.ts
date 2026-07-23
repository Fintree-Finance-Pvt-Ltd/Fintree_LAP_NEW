import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class CentralizeApplicationWorkflow1850000000000
  implements MigrationInterface
{
  name = 'CentralizeApplicationWorkflow1850000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('workflow')) {
      await queryRunner.renameTable('workflow', 'application_workflows');
    }

    if (!(await queryRunner.hasTable('application_workflows'))) {
      throw new Error('Existing workflow table was not found');
    }

    await queryRunner.query(`
      ALTER TABLE application_workflows
        MODIFY current_stage VARCHAR(50) NOT NULL,
        MODIFY current_status VARCHAR(80) NOT NULL,
        MODIFY last_action VARCHAR(100) NULL
    `);

    await this.renameColumn(queryRunner, 'assigned_to', 'current_assigned_role');
    await this.renameColumn(queryRunner, 'current_owner', 'current_assigned_user_id');

    const columns: TableColumn[] = [
      new TableColumn({ name: 'previous_stage', type: 'varchar', length: '50', isNullable: true }),
      new TableColumn({ name: 'previous_status', type: 'varchar', length: '80', isNullable: true }),
      new TableColumn({ name: 'last_decision', type: 'varchar', length: '100', isNullable: true }),
      new TableColumn({ name: 'last_action_by', type: 'bigint', unsigned: true, isNullable: true }),
      new TableColumn({ name: 'last_action_by_name', type: 'varchar', length: '255', isNullable: true }),
      new TableColumn({ name: 'last_action_by_role', type: 'varchar', length: '100', isNullable: true }),
      new TableColumn({ name: 'last_action_at', type: 'datetime', precision: 6, isNullable: true }),
      new TableColumn({ name: 'rm_field_visit_required', type: 'tinyint', width: 1, default: 0 }),
      new TableColumn({ name: 'rm_field_visit_completed', type: 'tinyint', width: 1, default: 0 }),
      new TableColumn({ name: 'rm_geo_required', type: 'tinyint', width: 1, default: 0 }),
      new TableColumn({ name: 'rm_geo_completed', type: 'tinyint', width: 1, default: 0 }),
      new TableColumn({ name: 'valuation_field_visit_required', type: 'tinyint', width: 1, default: 0 }),
      new TableColumn({ name: 'valuation_field_visit_completed', type: 'tinyint', width: 1, default: 0 }),
      new TableColumn({ name: 'valuation_geo_required', type: 'tinyint', width: 1, default: 0 }),
      new TableColumn({ name: 'valuation_geo_completed', type: 'tinyint', width: 1, default: 0 }),
      new TableColumn({ name: 'is_terminal', type: 'tinyint', width: 1, default: 0 }),
      new TableColumn({ name: 'created_at', type: 'datetime', precision: 6, default: 'CURRENT_TIMESTAMP(6)' }),
    ];
    for (const column of columns) {
      if (!(await queryRunner.hasColumn('application_workflows', column.name))) {
        await queryRunner.addColumn('application_workflows', column);
      }
    }

    await this.addIndexes(queryRunner, 'application_workflows', [
      new TableIndex({ name: 'idx_application_workflows_stage', columnNames: ['current_stage'] }),
      new TableIndex({ name: 'idx_application_workflows_status', columnNames: ['current_status'] }),
      new TableIndex({ name: 'idx_application_workflows_assigned_role', columnNames: ['current_assigned_role'] }),
      new TableIndex({ name: 'idx_application_workflows_last_action_by', columnNames: ['last_action_by'] }),
      new TableIndex({ name: 'idx_application_workflows_updated_at', columnNames: ['updated_at'] }),
    ]);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS workflow_approval_logs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        application_id BIGINT UNSIGNED NOT NULL,
        workflow_id BIGINT UNSIGNED NULL,
        action VARCHAR(100) NOT NULL,
        decision VARCHAR(100) NULL,
        from_stage VARCHAR(50) NULL,
        from_status VARCHAR(80) NULL,
        to_stage VARCHAR(50) NOT NULL,
        to_status VARCHAR(80) NOT NULL,
        actor_user_id BIGINT UNSIGNED NULL,
        actor_name VARCHAR(255) NULL,
        actor_email VARCHAR(255) NULL,
        actor_role VARCHAR(100) NULL,
        assigned_to_role VARCHAR(100) NULL,
        assigned_to_user_id BIGINT UNSIGNED NULL,
        remarks TEXT NULL,
        payload LONGTEXT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        INDEX idx_workflow_approval_application (application_id),
        INDEX idx_workflow_approval_workflow (workflow_id),
        INDEX idx_workflow_approval_action (action),
        INDEX idx_workflow_approval_decision (decision),
        INDEX idx_workflow_approval_actor (actor_user_id),
        INDEX idx_workflow_approval_actor_role (actor_role),
        INDEX idx_workflow_approval_to_stage (to_stage),
        INDEX idx_workflow_approval_to_status (to_status),
        INDEX idx_workflow_approval_created (created_at),
        CONSTRAINT fk_workflow_approval_application
          FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
        CONSTRAINT fk_workflow_approval_workflow
          FOREIGN KEY (workflow_id) REFERENCES application_workflows(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const profileColumns = [
      new TableColumn({ name: 'current_workflow_stage', type: 'varchar', length: '50', isNullable: true }),
      new TableColumn({ name: 'current_workflow_status', type: 'varchar', length: '80', isNullable: true }),
      new TableColumn({ name: 'last_workflow_action', type: 'varchar', length: '100', isNullable: true }),
      new TableColumn({ name: 'last_workflow_updated_at', type: 'datetime', precision: 6, isNullable: true }),
    ];
    for (const column of profileColumns) {
      if (!(await queryRunner.hasColumn('customer_profiles', column.name))) {
        await queryRunner.addColumn('customer_profiles', column);
      }
    }

    await queryRunner.query(`
      ALTER TABLE applications
        MODIFY stage ENUM(
          'RM','BM','CM','CREDIT','CREDIT_MAKER','CREDIT_CHECKER','VALUATION','LEGAL',
          'OPS_MAKER','OPS_HEAD','OPS_CHECKER','SANCTION','AGREEMENT','DISBURSEMENT',
          'LMS','ACTIVE','COLLECTION','CLOSED'
        ) NOT NULL DEFAULT 'RM',
        MODIFY status ENUM(
          'DRAFT','LEAD_CREATED','IN_PROGRESS','SUBMITTED_TO_BM',
          'BM_PENDING','BM_QUERY','BM_APPROVED','BM_REJECTED',
          'CM_PENDING','CM_QUERY','CM_APPROVED','CM_REJECTED',
          'CREDIT_MAKER_PENDING','CREDIT_MAKER_QUERY','CREDIT_MAKER_RECOMMENDED','CREDIT_MAKER_REJECTED',
          'CREDIT_CHECKER_PENDING','CREDIT_CHECKER_QUERY','CREDIT_CHECKER_APPROVED','CREDIT_CHECKER_REJECTED',
          'CREDIT_PENDING','CREDIT_APPROVED','CREDIT_REJECTED',
          'VALUATION_PENDING','VALUATION_QUERY','VALUATION_APPROVED','VALUATION_REJECTED',
          'LEGAL_PENDING','LEGAL_QUERY','LEGAL_APPROVED','LEGAL_REJECTED',
          'OPS_MAKER_PENDING','OPS_MAKER_QUERY','OPS_MAKER_APPROVED','OPS_MAKER_REJECTED',
          'OPS_HEAD_PENDING','OPS_HEAD_QUERY','OPS_HEAD_APPROVED','OPS_HEAD_REJECTED',
          'OPS_CHECKER_PENDING','OPS_CHECKER_QUERY','OPS_CHECKER_APPROVED','OPS_CHECKER_REJECTED',
          'SANCTION_PENDING','SANCTION_APPROVED','SANCTION_REJECTED',
          'AGREEMENT_PENDING','AGREEMENT_COMPLETED','DOCUMENTATION_PENDING','DOCUMENTATION_COMPLETED',
          'DISBURSEMENT_PENDING','DISBURSED','DISBURSEMENT_REJECTED',
          'ACTIVE','LMS_ACTIVE','LMS_REPAYMENT_RUNNING','LMS_CLOSED',
          'COLLECTION_PENDING','COLLECTION_ACTIVE','COLLECTION_CLOSED','CLOSED','REJECTED'
        ) NOT NULL DEFAULT 'DRAFT'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('workflow_approval_logs', true);
    for (const name of ['last_workflow_updated_at', 'last_workflow_action', 'current_workflow_status', 'current_workflow_stage']) {
      if (await queryRunner.hasColumn('customer_profiles', name)) {
        await queryRunner.dropColumn('customer_profiles', name);
      }
    }
    if (await queryRunner.hasTable('application_workflows')) {
      await queryRunner.renameTable('application_workflows', 'workflow');
    }
  }

  private async renameColumn(queryRunner: QueryRunner, from: string, to: string) {
    if (await queryRunner.hasColumn('application_workflows', from)) {
      await queryRunner.renameColumn('application_workflows', from, to);
    }
  }

  private async addIndexes(queryRunner: QueryRunner, tableName: string, indexes: TableIndex[]) {
    const table = await queryRunner.getTable(tableName);
    for (const index of indexes) {
      if (!table?.indices.some((item) => item.name === index.name)) {
        await queryRunner.createIndex(tableName, index);
      }
    }
  }
}
