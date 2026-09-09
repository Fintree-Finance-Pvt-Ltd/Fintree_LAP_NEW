import dataSource from '../src/database/database';

async function main() {
  await dataSource.initialize();
  console.log('Database connected successfully');

  const queryRunner = dataSource.createQueryRunner();

  const columnsToAdd = [
    { name: 'next_follow_up_date', sql: 'VARCHAR(30) NULL' },
    { name: 'follow_up_time', sql: 'VARCHAR(30) NULL' },
    { name: 'follow_up_notes', sql: 'TEXT NULL' },
    { name: 'follow_up_status', sql: "VARCHAR(50) NULL DEFAULT 'PENDING'" },
  ];

  for (const col of columnsToAdd) {
    const hasCol = await queryRunner.hasColumn('customer_profiles', col.name);
    if (!hasCol) {
      console.log(`Adding column ${col.name} to customer_profiles...`);
      await queryRunner.query(`ALTER TABLE customer_profiles ADD COLUMN ${col.name} ${col.sql}`);
      console.log(`Column ${col.name} added successfully.`);
    } else {
      console.log(`Column ${col.name} already exists in customer_profiles.`);
    }
  }

  // Also check if applications table needs next_follow_up_date for fast indexing
  const hasAppCol = await queryRunner.hasColumn('applications', 'next_follow_up_date');
  if (!hasAppCol) {
    console.log('Adding next_follow_up_date column to applications table...');
    await queryRunner.query('ALTER TABLE applications ADD COLUMN next_follow_up_date VARCHAR(30) NULL');
  }

  await queryRunner.release();
  await dataSource.destroy();
  console.log('Done!');
}

main().catch((err) => {
  console.error('Error adding columns:', err);
  process.exit(1);
});
