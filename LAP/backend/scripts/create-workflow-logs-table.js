const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS workflow_logs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      application_id BIGINT UNSIGNED NOT NULL,
      action VARCHAR(80) NOT NULL,
      remarks TEXT NULL,
      created_by BIGINT UNSIGNED NULL,
      created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
      CONSTRAINT FK_workflow_logs_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    )`);
  } catch (error) {
    if (!/already exists/i.test(error.message)) throw error;
  }

  await conn.query('CREATE INDEX IF NOT EXISTS IDX_workflow_logs_application ON workflow_logs (application_id)');
  const [rows] = await conn.query("SHOW TABLES LIKE 'workflow_logs'");
  console.log(rows.length ? 'workflow_logs table ready' : 'workflow_logs table missing');
  await conn.end();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
