import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropertyDetailsFields1970000000000
  implements MigrationInterface
{
  name = 'AddPropertyDetailsFields1970000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const profileColumns = [
      {
        name: 'property_owner_name',
        sql: `ALTER TABLE customer_profiles ADD COLUMN property_owner_name VARCHAR(180) NULL DEFAULT NULL`,
      },
      {
        name: 'relationship_with_applicant',
        sql: `ALTER TABLE customer_profiles ADD COLUMN relationship_with_applicant VARCHAR(80) NULL DEFAULT NULL`,
      },
      {
        name: 'plot_size',
        sql: `ALTER TABLE customer_profiles ADD COLUMN plot_size VARCHAR(80) NULL DEFAULT NULL`,
      },
      {
        name: 'area_sq_ft',
        sql: `ALTER TABLE customer_profiles ADD COLUMN area_sq_ft VARCHAR(80) NULL DEFAULT NULL`,
      },
      {
        name: 'government_value',
        sql: `ALTER TABLE customer_profiles ADD COLUMN government_value DECIMAL(15,2) NULL DEFAULT NULL`,
      },
      {
        name: 'type_of_structure',
        sql: `ALTER TABLE customer_profiles ADD COLUMN type_of_structure VARCHAR(80) NULL DEFAULT NULL`,
      },
      {
        name: 'plot_demarcated',
        sql: `ALTER TABLE customer_profiles ADD COLUMN plot_demarcated VARCHAR(20) NULL DEFAULT NULL`,
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
      'property_owner_name',
      'relationship_with_applicant',
      'plot_size',
      'area_sq_ft',
      'government_value',
      'type_of_structure',
      'plot_demarcated',
    ];

    for (const col of profileCols) {
      const exists = await queryRunner.hasColumn('customer_profiles', col);
      if (exists) {
        await queryRunner.query(`ALTER TABLE customer_profiles DROP COLUMN ${col}`);
      }
    }
  }
}
