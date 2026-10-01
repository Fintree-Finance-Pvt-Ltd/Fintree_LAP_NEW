import 'reflect-metadata';
import dataSource from '../src/database/database';

async function main() {
  await dataSource.initialize();
  console.log('Database connected.');

  const hasColumn = await dataSource.query(`
    SELECT COUNT(*) as cnt 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'applications' 
      AND COLUMN_NAME = 'dob'
  `);

  if (Number(hasColumn[0]?.cnt || 0) === 0) {
    console.log('Adding dob column to applications table...');
    await dataSource.query(`
      ALTER TABLE applications 
      ADD COLUMN dob DATE NULL DEFAULT NULL AFTER pan_verified
    `);
    console.log('Column dob added successfully.');
  } else {
    console.log('Column dob already exists in applications table.');
  }

  console.log('Syncing existing dob from customer_profiles to applications...');
  const result = await dataSource.query(`
    UPDATE applications a
    INNER JOIN customer_profiles cp ON cp.application_id = a.id
    SET a.dob = cp.dob
    WHERE cp.dob IS NOT NULL AND a.dob IS NULL
  `);
  console.log('Sync completed:', result);

  await dataSource.destroy();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Error applying dob column:', err);
  process.exit(1);
});
