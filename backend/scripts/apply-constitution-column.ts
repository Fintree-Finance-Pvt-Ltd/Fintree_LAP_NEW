import 'reflect-metadata';
import dataSource from '../src/database/database';

async function main() {
  await dataSource.initialize();
  console.log('Database connected.');

  // 1. applications.constitution
  const hasAppConstitution = await dataSource.query(`
    SELECT COUNT(*) as cnt 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'applications' 
      AND COLUMN_NAME = 'constitution'
  `);

  if (Number(hasAppConstitution[0]?.cnt || 0) === 0) {
    console.log('Adding constitution column to applications table...');
    await dataSource.query(`
      ALTER TABLE applications 
      ADD COLUMN constitution ENUM('PROPRIETORSHIP', 'PARTNERSHIP', 'PVT_LTD', 'LLP', 'INDIVIDUAL') NULL DEFAULT NULL AFTER customer_type
    `);
    console.log('Column constitution added to applications successfully.');
  } else {
    console.log('Column constitution already exists in applications.');
  }

  // 2. customer_profiles.constitution
  const hasProfileConstitution = await dataSource.query(`
    SELECT COUNT(*) as cnt 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'customer_profiles' 
      AND COLUMN_NAME = 'constitution'
  `);

  if (Number(hasProfileConstitution[0]?.cnt || 0) === 0) {
    console.log('Adding constitution column to customer_profiles table...');
    await dataSource.query(`
      ALTER TABLE customer_profiles 
      ADD COLUMN constitution ENUM('PROPRIETORSHIP', 'PARTNERSHIP', 'PVT_LTD', 'LLP', 'INDIVIDUAL') NULL DEFAULT NULL AFTER customer_type
    `);
    console.log('Column constitution added to customer_profiles successfully.');
  } else {
    console.log('Column constitution already exists in customer_profiles.');
  }

  console.log('Syncing existing constitution values...');
  const result = await dataSource.query(`
    UPDATE applications a
    INNER JOIN customer_profiles cp ON cp.application_id = a.id
    SET a.constitution = cp.constitution
    WHERE cp.constitution IS NOT NULL AND a.constitution IS NULL
  `);
  console.log('Sync completed:', result);

  await dataSource.destroy();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
