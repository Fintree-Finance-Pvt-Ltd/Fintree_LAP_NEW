import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResidenceAddressFields1930000000000
  implements MigrationInterface
{
  name = 'AddResidenceAddressFields1930000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Customer profiles table additions
    const profileColumns = [
      { name: 'residence_address_line1', sql: `ALTER TABLE customer_profiles ADD COLUMN residence_address_line1 VARCHAR(255) NULL DEFAULT NULL` },
      { name: 'residence_address_line2', sql: `ALTER TABLE customer_profiles ADD COLUMN residence_address_line2 VARCHAR(255) NULL DEFAULT NULL` },
      { name: 'residence_landmark', sql: `ALTER TABLE customer_profiles ADD COLUMN residence_landmark VARCHAR(150) NULL DEFAULT NULL` },
      { name: 'residence_city', sql: `ALTER TABLE customer_profiles ADD COLUMN residence_city VARCHAR(100) NULL DEFAULT NULL` },
      { name: 'residence_district', sql: `ALTER TABLE customer_profiles ADD COLUMN residence_district VARCHAR(100) NULL DEFAULT NULL` },
      { name: 'residence_state', sql: `ALTER TABLE customer_profiles ADD COLUMN residence_state VARCHAR(100) NULL DEFAULT NULL` },
      { name: 'residence_pincode', sql: `ALTER TABLE customer_profiles ADD COLUMN residence_pincode VARCHAR(10) NULL DEFAULT NULL` },
      { name: 'gram_panchayat_or_corporation', sql: `ALTER TABLE customer_profiles ADD COLUMN gram_panchayat_or_corporation VARCHAR(100) NULL DEFAULT NULL` },
      { name: 'residence_type', sql: `ALTER TABLE customer_profiles ADD COLUMN residence_type VARCHAR(50) NULL DEFAULT NULL` },
    ];

    for (const col of profileColumns) {
      const exists = await queryRunner.hasColumn('customer_profiles', col.name);
      if (!exists) {
        await queryRunner.query(col.sql);
      }
    }

    // 2. Clean up duplicate columns from applications if present
    const cols = [
      'residence_address_line1',
      'residence_address_line2',
      'residence_landmark',
      'residence_city',
      'residence_district',
      'residence_state',
      'residence_pincode',
      'gram_panchayat_or_corporation',
      'residence_type',
    ];

    for (const col of cols) {
      const existsInApp = await queryRunner.hasColumn('applications', col);
      if (existsInApp) {
        await queryRunner.query(`ALTER TABLE applications DROP COLUMN ${col}`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const cols = [
      'residence_address_line1',
      'residence_address_line2',
      'residence_landmark',
      'residence_city',
      'residence_district',
      'residence_state',
      'residence_pincode',
      'gram_panchayat_or_corporation',
      'residence_type',
    ];

    for (const col of cols) {
      const existsInProfile = await queryRunner.hasColumn('customer_profiles', col);
      if (existsInProfile) {
        await queryRunner.query(`ALTER TABLE customer_profiles DROP COLUMN ${col}`);
      }
    }
  }
}
