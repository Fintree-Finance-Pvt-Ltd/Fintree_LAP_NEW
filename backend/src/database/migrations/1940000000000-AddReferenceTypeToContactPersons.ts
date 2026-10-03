import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReferenceTypeToContactPersons1940000000000
  implements MigrationInterface
{
  name = 'AddReferenceTypeToContactPersons1940000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasColumn(
      'contact_persons',
      'reference_type',
    );
    if (!exists) {
      await queryRunner.query(
        `ALTER TABLE contact_persons ADD COLUMN reference_type VARCHAR(80) NULL DEFAULT NULL AFTER mobile`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasColumn(
      'contact_persons',
      'reference_type',
    );
    if (exists) {
      await queryRunner.query(
        `ALTER TABLE contact_persons DROP COLUMN reference_type`,
      );
    }
  }
}
