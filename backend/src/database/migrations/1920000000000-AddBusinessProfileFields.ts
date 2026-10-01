import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBusinessProfileFields1920000000000
  implements MigrationInterface
{
  name = 'AddBusinessProfileFields1920000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Applications table additions
    const appColumns = [
      { name: 'nature_of_business', sql: `ALTER TABLE applications ADD COLUMN nature_of_business VARCHAR(150) NULL DEFAULT NULL` },
      { name: 'business_vintage', sql: `ALTER TABLE applications ADD COLUMN business_vintage VARCHAR(80) NULL DEFAULT NULL` },
      { name: 'business_address', sql: `ALTER TABLE applications ADD COLUMN business_address TEXT NULL DEFAULT NULL` },
      { name: 'udyam_number', sql: `ALTER TABLE applications ADD COLUMN udyam_number VARCHAR(50) NULL DEFAULT NULL` },
      { name: 'monthly_income', sql: `ALTER TABLE applications ADD COLUMN monthly_income DECIMAL(15,2) NULL DEFAULT NULL` },
      { name: 'monthly_sales', sql: `ALTER TABLE applications ADD COLUMN monthly_sales DECIMAL(15,2) NULL DEFAULT NULL` },
      { name: 'monthly_profit', sql: `ALTER TABLE applications ADD COLUMN monthly_profit DECIMAL(15,2) NULL DEFAULT NULL` },
    ];

    for (const col of appColumns) {
      const exists = await queryRunner.hasColumn('applications', col.name);
      if (!exists) {
        await queryRunner.query(col.sql);
      }
    }

    // 2. Customer profiles table additions
    const profileColumns = [
      { name: 'nature_of_business', sql: `ALTER TABLE customer_profiles ADD COLUMN nature_of_business VARCHAR(150) NULL DEFAULT NULL` },
      { name: 'business_vintage', sql: `ALTER TABLE customer_profiles ADD COLUMN business_vintage VARCHAR(80) NULL DEFAULT NULL` },
      { name: 'business_address', sql: `ALTER TABLE customer_profiles ADD COLUMN business_address TEXT NULL DEFAULT NULL` },
      { name: 'udyam_number', sql: `ALTER TABLE customer_profiles ADD COLUMN udyam_number VARCHAR(50) NULL DEFAULT NULL` },
      { name: 'monthly_sales', sql: `ALTER TABLE customer_profiles ADD COLUMN monthly_sales DECIMAL(15,2) NULL DEFAULT NULL` },
      { name: 'monthly_profit', sql: `ALTER TABLE customer_profiles ADD COLUMN monthly_profit DECIMAL(15,2) NULL DEFAULT NULL` },
    ];

    for (const col of profileColumns) {
      const exists = await queryRunner.hasColumn('customer_profiles', col.name);
      if (!exists) {
        await queryRunner.query(col.sql);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const appCols = ['nature_of_business', 'business_vintage', 'business_address', 'udyam_number', 'monthly_income', 'monthly_sales', 'monthly_profit'];
    for (const col of appCols) {
      const exists = await queryRunner.hasColumn('applications', col);
      if (exists) {
        await queryRunner.query(`ALTER TABLE applications DROP COLUMN ${col}`);
      }
    }

    const profileCols = ['nature_of_business', 'business_vintage', 'business_address', 'udyam_number', 'monthly_sales', 'monthly_profit'];
    for (const col of profileCols) {
      const exists = await queryRunner.hasColumn('customer_profiles', col);
      if (exists) {
        await queryRunner.query(`ALTER TABLE customer_profiles DROP COLUMN ${col}`);
      }
    }
  }
}
