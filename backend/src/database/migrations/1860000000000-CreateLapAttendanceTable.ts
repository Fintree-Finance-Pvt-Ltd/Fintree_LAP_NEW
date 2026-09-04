import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateLapAttendanceTable1860000000000 implements MigrationInterface {
  name = 'CreateLapAttendanceTable1860000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('lap_attendance');
    if (!hasTable) {
      await queryRunner.createTable(
        new Table({
          name: 'lap_attendance',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              unsigned: true,
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'user_id',
              type: 'bigint',
              unsigned: true,
              isNullable: false,
            },
            {
              name: 'date',
              type: 'varchar',
              length: '10',
              isNullable: false,
              comment: 'Format: YYYY-MM-DD',
            },
            {
              name: 'start_time',
              type: 'datetime',
              precision: 6,
              isNullable: false,
            },
            {
              name: 'start_location',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'start_latitude',
              type: 'decimal',
              precision: 10,
              scale: 7,
              isNullable: true,
            },
            {
              name: 'start_longitude',
              type: 'decimal',
              precision: 10,
              scale: 7,
              isNullable: true,
            },
            {
              name: 'end_time',
              type: 'datetime',
              precision: 6,
              isNullable: true,
            },
            {
              name: 'end_location',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'end_latitude',
              type: 'decimal',
              precision: 10,
              scale: 7,
              isNullable: true,
            },
            {
              name: 'end_longitude',
              type: 'decimal',
              precision: 10,
              scale: 7,
              isNullable: true,
            },
            {
              name: 'total_hours',
              type: 'varchar',
              length: '50',
              isNullable: true,
            },
            {
              name: 'total_minutes',
              type: 'int',
              unsigned: true,
              isNullable: true,
            },
            {
              name: 'status',
              type: 'varchar',
              length: '40',
              default: "'IN_PROGRESS'",
            },
            {
              name: 'created_at',
              type: 'datetime',
              precision: 6,
              default: 'CURRENT_TIMESTAMP(6)',
            },
            {
              name: 'updated_at',
              type: 'datetime',
              precision: 6,
              default: 'CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)',
            },
            {
              name: 'created_by',
              type: 'bigint',
              unsigned: true,
              isNullable: true,
            },
            {
              name: 'updated_by',
              type: 'bigint',
              unsigned: true,
              isNullable: true,
            },
          ],
        }),
        true,
      );

      await queryRunner.createIndices('lap_attendance', [
        new TableIndex({
          name: 'idx_lap_attendance_user_date',
          columnNames: ['user_id', 'date'],
        }),
        new TableIndex({
          name: 'idx_lap_attendance_date',
          columnNames: ['date'],
        }),
      ]);

      const hasUsersTable = await queryRunner.hasTable('users');
      if (hasUsersTable) {
        await queryRunner.createForeignKey(
          'lap_attendance',
          new TableForeignKey({
            name: 'fk_lap_attendance_user_id',
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('lap_attendance');
    if (hasTable) {
      await queryRunner.dropTable('lap_attendance');
    }
  }
}
