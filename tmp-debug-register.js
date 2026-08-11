import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: 'thirdpartydb',
});

async function inspect() {
  try {
    const [users] = await pool.query("SHOW COLUMNS FROM users");
    console.log('users columns:', users.map(r => ({Field: r.Field, Type: r.Type, Null: r.Null, Default: r.Default})));
    const [roles] = await pool.query("SHOW COLUMNS FROM roles");
    console.log('roles columns:', roles.map(r => ({Field: r.Field, Type: r.Type, Null: r.Null, Default: r.Default})));
    const [userRoles] = await pool.query("SHOW COLUMNS FROM user_roles");
    console.log('user_roles columns:', userRoles.map(r => ({Field: r.Field, Type: r.Type, Null: r.Null, Default: r.Default})));
    const [res] = await pool.query("SELECT * FROM roles LIMIT 10");
    console.log('roles rows:', res);
    const [res2] = await pool.query("SELECT * FROM user_roles LIMIT 10");
    console.log('user_roles rows:', res2);
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

inspect();
