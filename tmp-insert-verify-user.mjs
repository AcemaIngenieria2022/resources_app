import mysql from 'mysql2/promise';
import { databaseConfig } from './src/config/database.js';
import { hashPassword, verifyPassword } from './src/lib/security/password.js';

const pool = mysql.createPool({
  host: databaseConfig.host,
  port: Number(databaseConfig.port),
  user: databaseConfig.user,
  password: databaseConfig.password,
  database: databaseConfig.name,
});

const testEmail = 'test-login@example.com';
const testPassword = 'secret123';

(async () => {
  try {
    // delete if exists
    await pool.query('DELETE FROM users WHERE email = ?', [testEmail]);
    const hashed = hashPassword(testPassword);
    const [res] = await pool.query('INSERT INTO users (email, password, role, first_name, last_name, status) VALUES (?, ?, ?, ?, ?, ?) ', [testEmail, hashed, 'user', 'Test', 'Login', 'active']);
    console.log('Inserted user id', res.insertId);

    const [rows] = await pool.query('SELECT id, email, password FROM users WHERE email = ? LIMIT 1', [testEmail]);
    console.log('Retrieved', rows.length, 'rows');
    const user = rows[0];
    const ok = verifyPassword(testPassword, user.password);
    console.log('Password verify result:', ok);

    // try wrong password
    console.log('Wrong password verify:', verifyPassword('wrongpass', user.password));
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
