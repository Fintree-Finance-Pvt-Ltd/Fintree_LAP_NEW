import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropertyUsageAndOccupancyFields1980000000000
  implements MigrationInterface
{
  name = 'AddPropertyUsageAndOccupancyFields1980000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const profileColumns = [
      {
        name: 'property_usage_type',
        sql: `ALTER TABLE customer_profiles ADD COLUMN property_usage_type VARCHAR(80) NULL DEFAULT NULL`,
      },
      {
        name: 'premises_type',
        sql: `ALTER TABLE customer_profiles ADD COLUMN premises_type VARCHAR(80) NULL DEFAULT NULL`,
      },
      {
        name: 'occupied_by',
        sql: `ALTER TABLE customer_profiles ADD COLUMN occupied_by VARCHAR(150) NULL DEFAULT NULL`,
      },
      {
        name: 'construction_status',
        sql: `ALTER TABLE customer_profiles ADD COLUMN construction_status VARCHAR(80) NULL DEFAULT NULL`,
      },
    ];

    for (const col of profileColumns) {
      const exists = await queryRunner.hasColumn('customer_profiles', col.name);
      if (!exists) {
        await queryRunner.query(col.sql);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const profileCols = [
      'property_usage_type',
      'premises_type',
      'occupied_by',
      'construction_status',
    ];

    for (const col of profileCols) {
      const exists = await queryRunner.hasColumn('customer_profiles', col);
      if (exists) {
        await queryRunner.query(`ALTER TABLE customer_profiles DROP COLUMN ${col}`);
      }
    }
  }
}
