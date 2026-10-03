import 'reflect-metadata';
import dataSource from '../src/database/database';

async function main() {
  await dataSource.initialize();
  console.log('Database connected.');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  const profileColumns = [
    {
      name: 'property_owner_name',
      sql: `ALTER TABLE customer_profiles ADD COLUMN property_owner_name VARCHAR(180) NULL DEFAULT NULL`,
    },
    {
      name: 'relationship_with_applicant',
      sql: `ALTER TABLE customer_profiles ADD COLUMN relationship_with_applicant VARCHAR(80) NULL DEFAULT NULL`,
    },
    {
      name: 'plot_size',
      sql: `ALTER TABLE customer_profiles ADD COLUMN plot_size VARCHAR(80) NULL DEFAULT NULL`,
    },
    {
      name: 'area_sq_ft',
      sql: `ALTER TABLE customer_profiles ADD COLUMN area_sq_ft VARCHAR(80) NULL DEFAULT NULL`,
    },
    {
      name: 'government_value',
      sql: `ALTER TABLE customer_profiles ADD COLUMN government_value DECIMAL(15,2) NULL DEFAULT NULL`,
    },
    {
      name: 'type_of_structure',
      sql: `ALTER TABLE customer_profiles ADD COLUMN type_of_structure VARCHAR(80) NULL DEFAULT NULL`,
    },
    {
      name: 'plot_demarcated',
      sql: `ALTER TABLE customer_profiles ADD COLUMN plot_demarcated VARCHAR(20) NULL DEFAULT NULL`,
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
  console.log('Done applying property details fields.');
}

main().catch((err) => {
  console.error('Error applying property details fields:', err);
  process.exit(1);
});
