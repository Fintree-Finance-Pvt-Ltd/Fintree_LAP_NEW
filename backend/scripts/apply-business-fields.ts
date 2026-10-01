import 'reflect-metadata';
import dataSource from '../src/database/database';

async function main() {
  await dataSource.initialize();
  console.log('Database connected.');

  const appCols = [
    { name: 'nature_of_business', sql: `ALTER TABLE applications ADD COLUMN nature_of_business VARCHAR(150) NULL DEFAULT NULL` },
    { name: 'business_vintage', sql: `ALTER TABLE applications ADD COLUMN business_vintage VARCHAR(80) NULL DEFAULT NULL` },
    { name: 'business_address', sql: `ALTER TABLE applications ADD COLUMN business_address TEXT NULL DEFAULT NULL` },
    { name: 'udyam_number', sql: `ALTER TABLE applications ADD COLUMN udyam_number VARCHAR(50) NULL DEFAULT NULL` },
    { name: 'monthly_income', sql: `ALTER TABLE applications ADD COLUMN monthly_income DECIMAL(15,2) NULL DEFAULT NULL` },
    { name: 'monthly_sales', sql: `ALTER TABLE applications ADD COLUMN monthly_sales DECIMAL(15,2) NULL DEFAULT NULL` },
    { name: 'monthly_profit', sql: `ALTER TABLE applications ADD COLUMN monthly_profit DECIMAL(15,2) NULL DEFAULT NULL` },
  ];

  for (const col of appCols) {
    const res = await dataSource.query(`
      SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'applications' AND COLUMN_NAME = '${col.name}'
    `);
    if (Number(res[0]?.cnt || 0) === 0) {
      console.log(`Adding ${col.name} to applications...`);
      await dataSource.query(col.sql);
      console.log(`Added ${col.name} to applications.`);
    } else {
      console.log(`Column ${col.name} already exists in applications.`);
    }
  }

  const profileCols = [
    { name: 'nature_of_business', sql: `ALTER TABLE customer_profiles ADD COLUMN nature_of_business VARCHAR(150) NULL DEFAULT NULL` },
    { name: 'business_vintage', sql: `ALTER TABLE customer_profiles ADD COLUMN business_vintage VARCHAR(80) NULL DEFAULT NULL` },
    { name: 'business_address', sql: `ALTER TABLE customer_profiles ADD COLUMN business_address TEXT NULL DEFAULT NULL` },
    { name: 'udyam_number', sql: `ALTER TABLE customer_profiles ADD COLUMN udyam_number VARCHAR(50) NULL DEFAULT NULL` },
    { name: 'monthly_sales', sql: `ALTER TABLE customer_profiles ADD COLUMN monthly_sales DECIMAL(15,2) NULL DEFAULT NULL` },
    { name: 'monthly_profit', sql: `ALTER TABLE customer_profiles ADD COLUMN monthly_profit DECIMAL(15,2) NULL DEFAULT NULL` },
  ];

  for (const col of profileCols) {
    const res = await dataSource.query(`
      SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_profiles' AND COLUMN_NAME = '${col.name}'
    `);
    if (Number(res[0]?.cnt || 0) === 0) {
      console.log(`Adding ${col.name} to customer_profiles...`);
      await dataSource.query(col.sql);
      console.log(`Added ${col.name} to customer_profiles.`);
    } else {
      console.log(`Column ${col.name} already exists in customer_profiles.`);
    }
  }

  console.log('All business fields successfully ensured in DB.');
  await dataSource.destroy();
}

main().catch((err) => {
  console.error('Error applying fields:', err);
  process.exit(1);
});
