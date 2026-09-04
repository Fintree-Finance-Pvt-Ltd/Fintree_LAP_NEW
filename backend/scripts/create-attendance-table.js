const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'srv669.hstgr.io',
    port: 3306,
    user: 'u341672715_LAP_UAT',
    password: 'Fintree@2026',
    database: 'u341672715_LAP_UAT',
  });

  const sql = `
    CREATE TABLE IF NOT EXISTS lap_attendance (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      date VARCHAR(10) NOT NULL COMMENT 'Format: YYYY-MM-DD',
      start_time DATETIME(6) NOT NULL,
      start_location VARCHAR(255) NULL,
      start_latitude DECIMAL(10, 7) NULL,
      start_longitude DECIMAL(10, 7) NULL,
      end_time DATETIME(6) NULL,
      end_location VARCHAR(255) NULL,
      end_latitude DECIMAL(10, 7) NULL,
      end_longitude DECIMAL(10, 7) NULL,
      total_hours VARCHAR(50) NULL,
      total_minutes INT UNSIGNED NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'IN_PROGRESS',
      created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
      updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      created_by BIGINT UNSIGNED NULL,
      updated_by BIGINT UNSIGNED NULL,
      INDEX idx_lap_attendance_user_date (user_id, date),
      INDEX idx_lap_attendance_date (date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await conn.query(sql);
  console.log('✅ Table lap_attendance successfully created / verified.');

  const [columns] = await conn.query('DESCRIBE lap_attendance');
  console.log('Columns in lap_attendance:');
  console.table(columns);

  await conn.end();
}

run().catch(console.error);
