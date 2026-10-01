import 'reflect-metadata';
import dataSource from '../src/database/database';

async function main() {
  await dataSource.initialize();
  console.log('Database connected.');

  // 1. applications.customer_type
  const checkCustomerType = await dataSource.query(`
    SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'applications' AND COLUMN_NAME = 'customer_type'
  `);
  if (Number(checkCustomerType[0]?.cnt || 0) === 0) {
    console.log('Adding customer_type to applications...');
    await dataSource.query(`
      ALTER TABLE applications 
      ADD COLUMN customer_type ENUM('INDIVIDUAL', 'PROPRIETORSHIP', 'PARTNERSHIP', 'COMPANY') NULL DEFAULT NULL AFTER application_number
    `);
  }

  // 2. applications.marital_status
  const checkMaritalStatus = await dataSource.query(`
    SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'applications' AND COLUMN_NAME = 'marital_status'
  `);
  if (Number(checkMaritalStatus[0]?.cnt || 0) === 0) {
    console.log('Adding marital_status to applications...');
    await dataSource.query(`
      ALTER TABLE applications 
      ADD COLUMN marital_status ENUM('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED') NULL DEFAULT NULL AFTER gender
    `);
  }

  // 3. applications.nationality
  const checkAppNationality = await dataSource.query(`
    SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'applications' AND COLUMN_NAME = 'nationality'
  `);
  if (Number(checkAppNationality[0]?.cnt || 0) === 0) {
    console.log('Adding nationality to applications...');
    await dataSource.query(`
      ALTER TABLE applications 
      ADD COLUMN nationality VARCHAR(50) NULL DEFAULT 'INDIAN' AFTER marital_status
    `);
  }

  // 4. customer_profiles.nationality
  const checkProfileNationality = await dataSource.query(`
    SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_profiles' AND COLUMN_NAME = 'nationality'
  `);
  if (Number(checkProfileNationality[0]?.cnt || 0) === 0) {
    console.log('Adding nationality to customer_profiles...');
    await dataSource.query(`
      ALTER TABLE customer_profiles 
      ADD COLUMN nationality VARCHAR(50) NULL DEFAULT 'INDIAN' AFTER marital_status
    `);
  }

  await dataSource.query(`
    UPDATE applications a
    INNER JOIN customer_profiles cp ON cp.application_id = a.id
    SET 
      a.customer_type = COALESCE(a.customer_type, cp.customer_type),
      a.marital_status = COALESCE(a.marital_status, cp.marital_status)
  `);

  console.log('Columns applied & synced successfully.');
  await dataSource.destroy();
}

main().catch((err) => {
  console.error('Error applying columns:', err);
  process.exit(1);
});
