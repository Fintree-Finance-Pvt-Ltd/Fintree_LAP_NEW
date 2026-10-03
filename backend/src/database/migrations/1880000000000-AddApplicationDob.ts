import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationDob1880000000000 implements MigrationInterface {
  name = 'AddApplicationDob1880000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // DOB is properly stored in customer_profiles table.
    // If applications.dob exists from older migration runs, remove it.
    const hasColumn = await queryRunner.hasColumn('applications', 'dob');
    if (hasColumn) {
      await queryRunner.query(`ALTER TABLE applications DROP COLUMN dob`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op
  }
}
