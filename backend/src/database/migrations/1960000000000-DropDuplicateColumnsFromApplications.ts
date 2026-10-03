import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropDuplicateColumnsFromApplications1960000000000
  implements MigrationInterface
{
  name = 'DropDuplicateColumnsFromApplications1960000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const duplicateColumns = [
      'customer_type',
      'constitution',
      'dob',
      'gender',
      'marital_status',
      'nationality',
      'nature_of_business',
      'business_vintage',
      'business_address',
      'udyam_number',
      'monthly_income',
      'monthly_sales',
      'monthly_profit',
      'residence_address_line1',
      'residence_address_line2',
      'residence_landmark',
      'residence_city',
      'residence_district',
      'residence_state',
      'residence_pincode',
      'gram_panchayat_or_corporation',
      'residence_type',
    ];

    for (const col of duplicateColumns) {
      const exists = await queryRunner.hasColumn('applications', col);
      if (exists) {
        await queryRunner.query(`ALTER TABLE \`applications\` DROP COLUMN \`${col}\``);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // These columns are permanently centralized in customer_profiles
  }
}
