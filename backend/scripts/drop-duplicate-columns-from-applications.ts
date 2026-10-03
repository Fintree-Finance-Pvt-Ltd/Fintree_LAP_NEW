import 'reflect-metadata';
import dataSource from '../src/database/database';

async function main() {
  await dataSource.initialize();
  console.log('Database connected.');

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
    const check = await dataSource.query(`
      SELECT COUNT(*) as cnt 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'applications' 
        AND COLUMN_NAME = ?
    `, [col]);

    if (Number(check[0]?.cnt || 0) > 0) {
      console.log(`Dropping duplicate column applications.${col}...`);
      await dataSource.query(`ALTER TABLE \`applications\` DROP COLUMN \`${col}\``);
      console.log(`Column applications.${col} dropped.`);
    } else {
      console.log(`Column applications.${col} already not present.`);
    }
  }

  await dataSource.destroy();
  console.log('Finished dropping duplicate columns from applications table.');
}

main().catch((err) => {
  console.error('Error dropping duplicate columns:', err);
  process.exit(1);
});
