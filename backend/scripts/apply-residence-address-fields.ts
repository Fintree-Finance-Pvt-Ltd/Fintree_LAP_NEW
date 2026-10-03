import 'reflect-metadata';
import dataSource from '../src/database/database';

async function main() {
  await dataSource.initialize();
  console.log('Database connected.');

  const appColumns = [
    { name: 'residence_address_line1', sql: `ALTER TABLE applications ADD COLUMN residence_address_line1 VARCHAR(255) NULL DEFAULT NULL` },
    { name: 'residence_address_line2', sql: `ALTER TABLE applications ADD COLUMN residence_address_line2 VARCHAR(255) NULL DEFAULT NULL` },
    { name: 'residence_landmark', sql: `ALTER TABLE applications ADD COLUMN residence_landmark VARCHAR(150) NULL DEFAULT NULL` },
    { name: 'residence_city', sql: `ALTER TABLE applications ADD COLUMN residence_city VARCHAR(100) NULL DEFAULT NULL` },
    { name: 'residence_district', sql: `ALTER TABLE applications ADD COLUMN residence_district VARCHAR(100) NULL DEFAULT NULL` },
    { name: 'residence_state', sql: `ALTER TABLE applications ADD COLUMN residence_state VARCHAR(100) NULL DEFAULT NULL` },
    { name: 'residence_pincode', sql: `ALTER TABLE applications ADD COLUMN residence_pincode VARCHAR(10) NULL DEFAULT NULL` },
    { name: 'gram_panchayat_or_corporation', sql: `ALTER TABLE applications ADD COLUMN gram_panchayat_or_corporation VARCHAR(100) NULL DEFAULT NULL` },
    { name: 'residence_type', sql: `ALTER TABLE applications ADD COLUMN residence_type VARCHAR(50) NULL DEFAULT NULL` },
  ];

  for (const col of appColumns) {
    const hasColumn = await dataSource.query(`
      SELECT COUNT(*) as cnt 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'applications' 
        AND COLUMN_NAME = '${col.name}'
    `);
    if (Number(hasColumn[0]?.cnt || 0) === 0) {
      console.log(`Adding ${col.name} to applications table...`);
      await dataSource.query(col.sql);
      console.log(`Column ${col.name} added to applications.`);
    } else {
      console.log(`Column ${col.name} already exists in applications.`);
    }
  }

  const profileColumns = [
    { name: 'residence_address_line1', sql: `ALTER TABLE customer_profiles ADD COLUMN residence_address_line1 VARCHAR(255) NULL DEFAULT NULL` },
    { name: 'residence_address_line2', sql: `ALTER TABLE customer_profiles ADD COLUMN residence_address_line2 VARCHAR(255) NULL DEFAULT NULL` },
    { name: 'residence_landmark', sql: `ALTER TABLE customer_profiles ADD COLUMN residence_landmark VARCHAR(150) NULL DEFAULT NULL` },
    { name: 'residence_city', sql: `ALTER TABLE customer_profiles ADD COLUMN residence_city VARCHAR(100) NULL DEFAULT NULL` },
    { name: 'residence_district', sql: `ALTER TABLE customer_profiles ADD COLUMN residence_district VARCHAR(100) NULL DEFAULT NULL` },
    { name: 'residence_state', sql: `ALTER TABLE customer_profiles ADD COLUMN residence_state VARCHAR(100) NULL DEFAULT NULL` },
    { name: 'residence_pincode', sql: `ALTER TABLE customer_profiles ADD COLUMN residence_pincode VARCHAR(10) NULL DEFAULT NULL` },
    { name: 'gram_panchayat_or_corporation', sql: `ALTER TABLE customer_profiles ADD COLUMN gram_panchayat_or_corporation VARCHAR(100) NULL DEFAULT NULL` },
    { name: 'residence_type', sql: `ALTER TABLE customer_profiles ADD COLUMN residence_type VARCHAR(50) NULL DEFAULT NULL` },
  ];

  for (const col of profileColumns) {
    const hasColumn = await dataSource.query(`
      SELECT COUNT(*) as cnt 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'customer_profiles' 
        AND COLUMN_NAME = '${col.name}'
    `);
    if (Number(hasColumn[0]?.cnt || 0) === 0) {
      console.log(`Adding ${col.name} to customer_profiles table...`);
      await dataSource.query(col.sql);
      console.log(`Column ${col.name} added to customer_profiles.`);
    } else {
      console.log(`Column ${col.name} already exists in customer_profiles.`);
    }
  }

  await dataSource.destroy();
  console.log('All residence address columns applied successfully.');
}

main().catch((err) => {
  console.error('Error applying residence address columns:', err);
  process.exit(1);
});
