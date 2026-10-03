import 'reflect-metadata';
import dataSource from '../src/database/database';

async function main() {
  await dataSource.initialize();
  console.log('Database connected.');

  const hasColumn = await dataSource.query(`
    SELECT COUNT(*) as cnt 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'contact_persons' 
      AND COLUMN_NAME = 'reference_type'
  `);

  if (Number(hasColumn[0]?.cnt || 0) === 0) {
    console.log('Adding reference_type column to contact_persons table...');
    await dataSource.query(`
      ALTER TABLE contact_persons 
      ADD COLUMN reference_type VARCHAR(80) NULL DEFAULT NULL AFTER mobile
    `);
    console.log('Column reference_type added to contact_persons.');
  } else {
    console.log('Column reference_type already exists in contact_persons.');
  }

  await dataSource.destroy();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Error applying reference_type column:', err);
  process.exit(1);
});
