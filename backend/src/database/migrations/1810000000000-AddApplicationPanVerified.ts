import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationPanVerified1810000000000 implements MigrationInterface {
  name = 'AddApplicationPanVerified1810000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE applications ADD COLUMN pan_verified TINYINT NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `UPDATE applications a
       INNER JOIN customer_profiles cp ON cp.application_id = a.id
       SET a.pan_verified = cp.pan_verified
       WHERE cp.pan_verified = 1`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE applications DROP COLUMN pan_verified`);
  }
}
