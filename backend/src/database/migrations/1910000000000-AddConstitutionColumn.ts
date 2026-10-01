import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConstitutionColumn1910000000000
  implements MigrationInterface
{
  name = 'AddConstitutionColumn1910000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. applications.constitution
    const hasAppConstitution = await queryRunner.hasColumn(
      'applications',
      'constitution',
    );
    if (!hasAppConstitution) {
      await queryRunner.query(
        `ALTER TABLE applications ADD COLUMN constitution ENUM('PROPRIETORSHIP', 'PARTNERSHIP', 'PVT_LTD', 'LLP', 'INDIVIDUAL') NULL DEFAULT NULL AFTER customer_type`,
      );
    }

    // 2. customer_profiles.constitution
    const hasProfileConstitution = await queryRunner.hasColumn(
      'customer_profiles',
      'constitution',
    );
    if (!hasProfileConstitution) {
      await queryRunner.query(
        `ALTER TABLE customer_profiles ADD COLUMN constitution ENUM('PROPRIETORSHIP', 'PARTNERSHIP', 'PVT_LTD', 'LLP', 'INDIVIDUAL') NULL DEFAULT NULL AFTER customer_type`,
      );
    }

    // Sync existing values from customer_profiles to applications
    await queryRunner.query(`
      UPDATE applications a
      INNER JOIN customer_profiles cp ON cp.application_id = a.id
      SET 
        a.constitution = COALESCE(a.constitution, cp.constitution)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasAppConstitution = await queryRunner.hasColumn(
      'applications',
      'constitution',
    );
    if (hasAppConstitution) {
      await queryRunner.query(
        `ALTER TABLE applications DROP COLUMN constitution`,
      );
    }

    const hasProfileConstitution = await queryRunner.hasColumn(
      'customer_profiles',
      'constitution',
    );
    if (hasProfileConstitution) {
      await queryRunner.query(
        `ALTER TABLE customer_profiles DROP COLUMN constitution`,
      );
    }
  }
}
