import 'reflect-metadata';
import dataSource from '../src/database/database';

async function main() {
  await dataSource.initialize();
  console.log('Database connected.');

  const hasTable = await dataSource.query(`
    SELECT COUNT(*) as cnt 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'family_members'
  `);

  if (Number(hasTable[0]?.cnt || 0) === 0) {
    console.log('Creating family_members table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS family_members (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        application_id BIGINT UNSIGNED NOT NULL,
        name VARCHAR(140) NOT NULL,
        relation VARCHAR(50) NOT NULL,
        age INT NULL,
        occupation VARCHAR(120) NULL,
        income DECIMAL(15,2) NULL,
        created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT FK_family_members_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await dataSource.query(`CREATE INDEX IDX_family_members_application_id ON family_members (application_id)`);
    console.log('Table family_members created successfully.');
  } else {
    console.log('Table family_members already exists.');
  }

  await dataSource.destroy();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Error applying family_members table:', err);
  process.exit(1);
});
