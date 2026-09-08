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
 * Obtiene los datos del resumen de asistencia para una fecha
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @returns {Promise<Array>} Array de objetos con datos del resumen
 */
async function getSummaryData(date) {
  let connection;
  try {
    connection = await getConnection();

    const sql = `
      SELECT
        e.id,
        e.employeedID,
        e.personName,
        d.name AS department_name,
        p.name AS position_name,
        external_first.first_entry,
        internal_last.last_exit,
        IFNULL(record_summary.record_count, 0) AS record_count,
        record_summary.record_times,
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
      LEFT JOIN (
        SELECT employeedID, MIN(authDateTime) AS first_entry
        FROM attlog
        WHERE authDate = ? AND UPPER(diviceName) = 'EXTERNO'
        GROUP BY employeedID
      ) external_first ON external_first.employeedID = e.employeedID
      LEFT JOIN (
        SELECT employeedID, MAX(authDateTime) AS last_exit
        FROM attlog
        WHERE authDate = ? AND UPPER(diviceName) = 'INTERNO'
        GROUP BY employeedID
      ) internal_last ON internal_last.employeedID = e.employeedID
      LEFT JOIN (
        SELECT employeedID,
          COUNT(*) AS record_count,
          GROUP_CONCAT(CONCAT(TIME_FORMAT(authDateTime, '%H:%i'), '|', UPPER(diviceName)) ORDER BY authDateTime SEPARATOR '||') AS record_times
        FROM attlog
        WHERE authDate = ?
        GROUP BY employeedID
      ) record_summary ON record_summary.employeedID = e.employeedID
      WHERE e.active = 1
      ORDER BY e.personName ASC
    `;

    const [rows] = await connection.execute(sql, [date, date, date, date, date, date, date]);
    return rows || [];
  } catch (error) {
    console.error('❌ Error al obtener datos del resumen:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Verifica que la conexión a la BD es correcta
 */
async function testConnection() {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute('SELECT 1 as connected');
    console.log('✅ Conexión a base de datos exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = {
  getConnection,
  getSummaryData,
  testConnection,
};
