import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationDob1880000000000 implements MigrationInterface {
  name = 'AddApplicationDob1880000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('applications', 'dob');
    if (!hasColumn) {
      await queryRunner.query(
        `ALTER TABLE applications ADD COLUMN dob DATE NULL DEFAULT NULL`,
      );
    }
    await queryRunner.query(
      `UPDATE applications a
       INNER JOIN customer_profiles cp ON cp.application_id = a.id
       SET a.dob = cp.dob
       WHERE cp.dob IS NOT NULL AND a.dob IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('applications', 'dob');
    if (hasColumn) {
      await queryRunner.query(`ALTER TABLE applications DROP COLUMN dob`);
    }
  }
}
