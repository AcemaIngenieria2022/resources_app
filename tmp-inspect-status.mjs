import mysql from 'mysql2/promise';
import { databaseConfig } from './src/config/database.js';

const pool = mysql.createPool({
  host: databaseConfig.host,
  port: Number(databaseConfig.port),
  user: databaseConfig.user,
  password: databaseConfig.password,
  database: databaseConfig.name,
});

try {
  const [cols] = await pool.query('SHOW COLUMNS FROM users');
  console.log('USERS_COLUMNS', cols.map((c) => c.Field).join(', '));

  const [rows] = await pool.query('SELECT id, email, role, status, active FROM users LIMIT 5');
  console.log('USERS_SAMPLE', rows);

  const [statusTables] = await pool.query("SHOW TABLES LIKE 'user_statuses'");
  console.log('STATUS_TABLE_EXISTS', statusTables.length > 0);
} catch (err) {
  console.error('ERROR', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
