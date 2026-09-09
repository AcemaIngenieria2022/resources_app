// Pool y helpers de conexión para acceder a la base de datos principal y a la base de attlog.
import mysql from 'mysql2/promise';
import { attlogDatabaseConfig, databaseConfig } from '@/config/database';

function createPool(config) {
  return mysql.createPool({
    host: config.host,
    port: Number(config.port),
    user: config.user,
    password: config.password,
    database: config.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: false,
    dateStrings: true,
  });
}

const pool = createPool(databaseConfig);
const attlogPool = createPool(attlogDatabaseConfig);

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function attlogQuery(sql, params = []) {
  const [rows] = await attlogPool.execute(sql, params);
  return rows;
}

export async function testConnection() {
  const [rows] = await pool.query('SELECT 1 AS ok');
  return rows[0];
}

export async function testAttlogConnection() {
  const [rows] = await attlogPool.query('SELECT 1 AS ok');
  return rows[0];
}

export default pool;
