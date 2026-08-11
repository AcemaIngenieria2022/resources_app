import mysql from 'mysql2/promise';
import { databaseConfig } from '@/config/database';

const pool = mysql.createPool({
  host: databaseConfig.host,
  port: Number(databaseConfig.port),
  user: databaseConfig.user,
  password: databaseConfig.password,
  database: databaseConfig.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: false,
  dateStrings: true,
});

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function testConnection() {
  const [rows] = await pool.query('SELECT 1 AS ok');
  return rows[0];
}

export default pool;
