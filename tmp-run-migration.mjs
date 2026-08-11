import fs from 'fs/promises';
import mysql from 'mysql2/promise';
import { databaseConfig } from './src/config/database.js';

const sql = await fs.readFile('./db/migrations/003_add_user_statuses.sql', 'utf8');
const pool = mysql.createPool({
  host: databaseConfig.host,
  port: Number(databaseConfig.port),
  user: databaseConfig.user,
  password: databaseConfig.password,
  database: databaseConfig.name,
  multipleStatements: true,
});

try {
  const [result] = await pool.query(sql);
  console.log('Migration executed successfully.');
  console.log(result);
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
} finally {
  await pool.end();
}
