import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConstitutionColumn1910000000000
  implements MigrationInterface
{
  name = 'AddConstitutionColumn1910000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // customer_profiles.constitution
    const hasProfileConstitution = await queryRunner.hasColumn(
      'customer_profiles',
      'constitution',
    );
    if (!hasProfileConstitution) {
      await queryRunner.query(
        `ALTER TABLE customer_profiles ADD COLUMN constitution ENUM('PROPRIETORSHIP', 'PARTNERSHIP', 'PVT_LTD', 'LLP', 'INDIVIDUAL') NULL DEFAULT NULL AFTER customer_type`,
      );
    }

    // Clean up duplicate column from applications if present
    const hasAppConstitution = await queryRunner.hasColumn(
      'applications',
      'constitution',
    );
    if (hasAppConstitution) {
      await queryRunner.query(
        `ALTER TABLE applications DROP COLUMN constitution`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
