import 'reflect-metadata';
import dataSource from '../src/database/database';

async function main() {
  await dataSource.initialize();
  console.log('Database connected.');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  const profileColumns = [
    {
      name: 'property_usage_type',
      sql: `ALTER TABLE customer_profiles ADD COLUMN property_usage_type VARCHAR(80) NULL DEFAULT NULL`,
    },
    {
      name: 'premises_type',
      sql: `ALTER TABLE customer_profiles ADD COLUMN premises_type VARCHAR(80) NULL DEFAULT NULL`,
    },
    {
      name: 'occupied_by',
      sql: `ALTER TABLE customer_profiles ADD COLUMN occupied_by VARCHAR(150) NULL DEFAULT NULL`,
    },
    {
      name: 'construction_status',
      sql: `ALTER TABLE customer_profiles ADD COLUMN construction_status VARCHAR(80) NULL DEFAULT NULL`,
    },
  ];

  for (const col of profileColumns) {
    const exists = await queryRunner.hasColumn('customer_profiles', col.name);
    if (!exists) {
      console.log(`Adding column ${col.name} to customer_profiles...`);
      await queryRunner.query(col.sql);
      console.log(`Column ${col.name} added successfully.`);
    } else {
      console.log(`Column ${col.name} already exists in customer_profiles.`);
    }
  }

  await queryRunner.release();
  await dataSource.destroy();
  console.log('Done applying property usage and occupancy fields.');
}

main().catch((err) => {
  console.error('Error applying property usage and occupancy fields:', err);
  process.exit(1);
});
