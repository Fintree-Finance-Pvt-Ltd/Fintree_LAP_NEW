import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaritalStatusCustomerTypeNationality1900000000000
  implements MigrationInterface
{
  name = 'AddMaritalStatusCustomerTypeNationality1900000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. applications.customer_type
    const hasAppCustomerType = await queryRunner.hasColumn(
      'applications',
      'customer_type',
    );
    if (!hasAppCustomerType) {
      await queryRunner.query(
        `ALTER TABLE applications ADD COLUMN customer_type ENUM('INDIVIDUAL', 'PROPRIETORSHIP', 'PARTNERSHIP', 'COMPANY') NULL DEFAULT NULL AFTER application_number`,
      );
    }

    // 2. applications.marital_status
    const hasAppMaritalStatus = await queryRunner.hasColumn(
      'applications',
      'marital_status',
    );
    if (!hasAppMaritalStatus) {
      await queryRunner.query(
        `ALTER TABLE applications ADD COLUMN marital_status ENUM('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED') NULL DEFAULT NULL AFTER gender`,
      );
    }

    // 3. applications.nationality
    const hasAppNationality = await queryRunner.hasColumn(
      'applications',
      'nationality',
    );
    if (!hasAppNationality) {
      await queryRunner.query(
        `ALTER TABLE applications ADD COLUMN nationality VARCHAR(50) NULL DEFAULT 'INDIAN' AFTER marital_status`,
      );
    }

    // 4. customer_profiles.nationality
    const hasProfileNationality = await queryRunner.hasColumn(
      'customer_profiles',
      'nationality',
    );
    if (!hasProfileNationality) {
      await queryRunner.query(
        `ALTER TABLE customer_profiles ADD COLUMN nationality VARCHAR(50) NULL DEFAULT 'INDIAN' AFTER marital_status`,
      );
    }

    // Sync existing values from customer_profiles to applications
    await queryRunner.query(`
      UPDATE applications a
      INNER JOIN customer_profiles cp ON cp.application_id = a.id
      SET 
        a.customer_type = COALESCE(a.customer_type, cp.customer_type),
        a.marital_status = COALESCE(a.marital_status, cp.marital_status)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('applications', 'nationality')) {
      await queryRunner.query(`ALTER TABLE applications DROP COLUMN nationality`);
    }
    if (await queryRunner.hasColumn('applications', 'marital_status')) {
      await queryRunner.query(`ALTER TABLE applications DROP COLUMN marital_status`);
    }
    if (await queryRunner.hasColumn('applications', 'customer_type')) {
      await queryRunner.query(`ALTER TABLE applications DROP COLUMN customer_type`);
    }
    if (await queryRunner.hasColumn('customer_profiles', 'nationality')) {
      await queryRunner.query(`ALTER TABLE customer_profiles DROP COLUMN nationality`);
    }
  }
}
