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
      AND COLUMN_NAME = 'gender'
  `);

  if (Number(hasColumn[0]?.cnt || 0) === 0) {
    console.log('Adding gender column to applications table...');
    await dataSource.query(`
      ALTER TABLE applications 
      ADD COLUMN gender ENUM('MALE', 'FEMALE', 'OTHER') NULL DEFAULT NULL AFTER dob
    `);
    console.log('Column gender added successfully.');
  } else {
    console.log('Column gender already exists in applications table.');
  }

  console.log('Syncing existing gender from customer_profiles to applications...');
  const result = await dataSource.query(`
    UPDATE applications a
    INNER JOIN customer_profiles cp ON cp.application_id = a.id
    SET a.gender = cp.gender
    WHERE cp.gender IS NOT NULL AND a.gender IS NULL
  `);
  console.log('Sync completed:', result);

  await dataSource.destroy();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Error applying gender column:', err);
  process.exit(1);
});
