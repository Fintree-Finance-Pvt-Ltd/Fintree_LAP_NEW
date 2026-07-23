import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddCoApplicantKycAuditFields1820000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('kyc_verification_status');
    if (!table) return;

    for (const name of [
      'mobileApiRequest',
      'mobileApiResponse',
      'emailApiRequest',
      'emailApiResponse',
    ]) {
      if (!table.findColumnByName(name)) {
        await queryRunner.addColumn(
          table,
          new TableColumn({ name, type: 'longtext', isNullable: true }),
        );
      }
    }

    const refreshed = await queryRunner.getTable('kyc_verification_status');
    if (refreshed && !refreshed.indices.some((index) => index.name === 'uq_kyc_co_applicant_owner')) {
      await queryRunner.createIndex(
        refreshed,
        new TableIndex({
          name: 'uq_kyc_co_applicant_owner',
          columnNames: ['applicationId', 'ownerType', 'coApplicantId'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('kyc_verification_status');
    if (!table) return;
    const index = table.indices.find((item) => item.name === 'uq_kyc_co_applicant_owner');
    if (index) await queryRunner.dropIndex(table, index);
    for (const name of ['mobileApiRequest', 'mobileApiResponse', 'emailApiRequest', 'emailApiResponse']) {
      if ((await queryRunner.getTable('kyc_verification_status'))?.findColumnByName(name)) {
        await queryRunner.dropColumn('kyc_verification_status', name);
      }
    }
  }
}
