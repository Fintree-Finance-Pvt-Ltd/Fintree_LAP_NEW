const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'srv669.hstgr.io',
    port: 3306,
    user: 'u341672715_LAP_UAT',
    password: 'Fintree@2026',
    database: 'u341672715_LAP_UAT',
  });

  // 1. Add real-time live tracking columns to lap_attendance if not exist
  const [columns] = await conn.query('DESCRIBE lap_attendance');
  const colNames = columns.map(c => c.Field);

  if (!colNames.includes('current_latitude')) {
    await conn.query(`ALTER TABLE lap_attendance ADD COLUMN current_latitude DECIMAL(10, 7) NULL AFTER start_longitude;`);
  }
  if (!colNames.includes('current_longitude')) {
    await conn.query(`ALTER TABLE lap_attendance ADD COLUMN current_longitude DECIMAL(10, 7) NULL AFTER current_latitude;`);
  }
  if (!colNames.includes('current_location')) {
    await conn.query(`ALTER TABLE lap_attendance ADD COLUMN current_location VARCHAR(255) NULL AFTER current_longitude;`);
  }
  if (!colNames.includes('last_tracked_at')) {
    await conn.query(`ALTER TABLE lap_attendance ADD COLUMN last_tracked_at DATETIME(6) NULL AFTER current_location;`);
  }
  if (!colNames.includes('total_distance_km')) {
    await conn.query(`ALTER TABLE lap_attendance ADD COLUMN total_distance_km DECIMAL(8, 3) NULL DEFAULT 0.000 AFTER total_minutes;`);
  }

  // 2. Create lap_attendance_locations table for route breadcrumbs
  const sql = `
    CREATE TABLE IF NOT EXISTS lap_attendance_locations (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      attendance_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT UNSIGNED NOT NULL,
      latitude DECIMAL(10, 7) NOT NULL,
      longitude DECIMAL(10, 7) NOT NULL,
      accuracy FLOAT NULL,
      speed FLOAT NULL,
      heading FLOAT NULL,
      location_name VARCHAR(255) NULL,
      recorded_at DATETIME(6) NOT NULL,
      created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
      INDEX idx_att_loc_att_id (attendance_id, recorded_at),
      INDEX idx_att_loc_user_id (user_id, recorded_at),
      CONSTRAINT fk_att_loc_attendance FOREIGN KEY (attendance_id) REFERENCES lap_attendance(id) ON DELETE CASCADE,
      CONSTRAINT fk_att_loc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await conn.query(sql);
  console.log('✅ Table lap_attendance_locations created and lap_attendance updated successfully.');

  const [desc] = await conn.query('DESCRIBE lap_attendance_locations');
  console.table(desc);

  await conn.end();
}

run().catch(console.error);
