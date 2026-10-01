import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationGender1890000000000 implements MigrationInterface {
  name = 'AddApplicationGender1890000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('applications', 'gender');
    if (!hasColumn) {
      await queryRunner.query(
        `ALTER TABLE applications ADD COLUMN gender ENUM('MALE', 'FEMALE', 'OTHER') NULL DEFAULT NULL AFTER dob`,
      );
    }
    await queryRunner.query(
      `UPDATE applications a
       INNER JOIN customer_profiles cp ON cp.application_id = a.id
       SET a.gender = cp.gender
       WHERE cp.gender IS NOT NULL AND a.gender IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('applications', 'gender');
    if (hasColumn) {
      await queryRunner.query(`ALTER TABLE applications DROP COLUMN gender`);
    }
  }
}
