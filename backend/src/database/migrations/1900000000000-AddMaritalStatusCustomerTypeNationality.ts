import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaritalStatusCustomerTypeNationality1900000000000
  implements MigrationInterface
{
  name = 'AddMaritalStatusCustomerTypeNationality1900000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // customer_profiles.nationality
    const hasProfileNationality = await queryRunner.hasColumn(
      'customer_profiles',
      'nationality',
    );
    if (!hasProfileNationality) {
      await queryRunner.query(
        `ALTER TABLE customer_profiles ADD COLUMN nationality VARCHAR(50) NULL DEFAULT 'INDIAN' AFTER marital_status`,
      );
    }

    // Clean up duplicate columns from applications if present
    if (await queryRunner.hasColumn('applications', 'nationality')) {
      await queryRunner.query(`ALTER TABLE applications DROP COLUMN nationality`);
    }
    if (await queryRunner.hasColumn('applications', 'marital_status')) {
      await queryRunner.query(`ALTER TABLE applications DROP COLUMN marital_status`);
    }
    if (await queryRunner.hasColumn('applications', 'customer_type')) {
      await queryRunner.query(`ALTER TABLE applications DROP COLUMN customer_type`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('customer_profiles', 'nationality')) {
      await queryRunner.query(`ALTER TABLE customer_profiles DROP COLUMN nationality`);
    }
  }
}
