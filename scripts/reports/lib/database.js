/**
 * Servicio de base de datos para reportes
 */

const mysql = require('mysql2/promise');
const config = require('../config');

/**
 * Crea una conexión a la base de datos
 */
async function getConnection() {
  try {
    return await mysql.createConnection(config.database);
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    throw error;
  }
}

/**
 * Crea una conexión a la base remota que contiene las marcaciones attlog
 */
async function getAttlogConnection() {
  try {
    return await mysql.createConnection(config.attlogDatabase);
  } catch (error) {
    console.error('❌ Error al conectar a la base de attlog:', error.message);
    throw error;
  }
}

/**
 * Obtiene los datos del resumen de asistencia para una fecha
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @returns {Promise<Array>} Array de objetos con datos del resumen
 */
async function getSummaryData(date) {
  let connection;
  let attlogConnection;
  try {
    connection = await getConnection();
    attlogConnection = await getAttlogConnection();

    const employeeSql = `
      SELECT
        e.id,
        e.employeedID,
        e.personName,
        d.name AS department_name,
        p.name AS position_name,
        CONCAT_WS(', ',
          (SELECT GROUP_CONCAT(CONCAT(r.reason,
            CASE WHEN r.start_time IS NOT NULL AND r.end_time IS NOT NULL
              THEN CONCAT(' (', TIME_FORMAT(r.start_time, '%H:%i'), ' - ', TIME_FORMAT(r.end_time, '%H:%i'), ')')
              ELSE ''
            END) SEPARATOR ', ')
           FROM employee_absence_records r
           WHERE r.employee_id = e.id AND r.absence_date = ?),
          (SELECT GROUP_CONCAT(s.reason SEPARATOR ', ')
           FROM absence_series s
           WHERE s.employee_id = e.id
             AND s.start_date <= ?
             AND s.end_date >= ?
             AND (s.weekday IS NULL OR CAST(s.weekday AS UNSIGNED) = WEEKDAY(CAST(? AS DATE))))
        ) AS absence_reason
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE e.active = 1
      ORDER BY e.personName ASC
    `;

    const attlogSql = `
      SELECT
        employeedID,
        MIN(CASE WHEN UPPER(diviceName) = 'EXTERNO' THEN authDateTime END) AS first_entry,
        MAX(CASE WHEN UPPER(diviceName) = 'INTERNO' THEN authDateTime END) AS last_exit,
        COUNT(*) AS record_count,
        GROUP_CONCAT(CONCAT(TIME_FORMAT(authDateTime, '%H:%i'), '|', UPPER(diviceName)) ORDER BY authDateTime SEPARATOR '||') AS record_times
      FROM attlog
      WHERE authDate = ?
      GROUP BY employeedID
    `;

    const [[employees], [attendanceRows]] = await Promise.all([
      connection.execute(employeeSql, [date, date, date, date]),
      attlogConnection.execute(attlogSql, [date]),
    ]);
    const attendanceByID = new Map(attendanceRows.map((row) => [String(row.employeedID), row]));

    return (employees || []).map((employee) => ({
      ...employee,
      ...(attendanceByID.get(String(employee.employeedID)) || {
        first_entry: null,
        last_exit: null,
        record_count: 0,
        record_times: null,
      }),
    }));
  } catch (error) {
    console.error('❌ Error al obtener datos del resumen:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
    if (attlogConnection) {
      await attlogConnection.end();
    }
  }
}

/**
 * Verifica que la conexión a la BD es correcta
 */
async function testConnection() {
  let connection;
  let attlogConnection;
  try {
    connection = await getConnection();
    attlogConnection = await getAttlogConnection();
    const [rows] = await connection.execute('SELECT 1 as connected');
    await attlogConnection.execute('SELECT 1 as connected');
    console.log('✅ Conexiones a bases de datos principal y attlog exitosas');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
    if (attlogConnection) {
      await attlogConnection.end();
    }
  }
}

module.exports = {
  getConnection,
  getAttlogConnection,
  getSummaryData,
  testConnection,
};
