import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFamilyMembersTable1950000000000 implements MigrationInterface {
  name = 'CreateFamilyMembersTable1950000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('family_members');
    if (!tableExists) {
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS family_members (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          application_id BIGINT UNSIGNED NOT NULL,
          name VARCHAR(140) NOT NULL,
          relation VARCHAR(50) NOT NULL,
          age INT NULL,
          occupation VARCHAR(120) NULL,
          income DECIMAL(15,2) NULL,
          created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
          updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          CONSTRAINT FK_family_members_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      await queryRunner.query(`CREATE INDEX IDX_family_members_application_id ON family_members (application_id)`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('family_members');
    if (tableExists) {
      await queryRunner.query(`DROP TABLE IF EXISTS family_members`);
    }
  }
}
