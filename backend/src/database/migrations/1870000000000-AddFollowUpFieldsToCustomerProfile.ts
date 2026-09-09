import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFollowUpFieldsToCustomerProfile1870000000000 implements MigrationInterface {
  name = 'AddFollowUpFieldsToCustomerProfile1870000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('customer_profiles');
    if (!hasTable) return;

    const columns: TableColumn[] = [
      new TableColumn({
        name: 'next_follow_up_date',
        type: 'varchar',
        length: '30',
        isNullable: true,
      }),
      new TableColumn({
        name: 'follow_up_time',
        type: 'varchar',
        length: '30',
        isNullable: true,
      }),
      new TableColumn({
        name: 'follow_up_notes',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'follow_up_status',
        type: 'varchar',
        length: '50',
        default: "'PENDING'",
        isNullable: true,
      }),
    ];

    for (const column of columns) {
      if (!(await queryRunner.hasColumn('customer_profiles', column.name))) {
        await queryRunner.addColumn('customer_profiles', column);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('customer_profiles');
    if (!hasTable) return;

    const columnNames = [
      'next_follow_up_date',
      'follow_up_time',
      'follow_up_notes',
      'follow_up_status',
    ];

    for (const columnName of columnNames) {
      if (await queryRunner.hasColumn('customer_profiles', columnName)) {
        await queryRunner.dropColumn('customer_profiles', columnName);
      }
    }
  }
}
