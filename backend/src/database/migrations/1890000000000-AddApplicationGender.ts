import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationGender1890000000000 implements MigrationInterface {
  name = 'AddApplicationGender1890000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Gender is properly stored in customer_profiles table.
    // If applications.gender exists from older migration runs, remove it.
    const hasColumn = await queryRunner.hasColumn('applications', 'gender');
    if (hasColumn) {
      await queryRunner.query(`ALTER TABLE applications DROP COLUMN gender`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op
  }
}
