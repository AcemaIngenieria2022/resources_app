import { attlogQuery, query } from '@/lib/db/mysql';

export async function findSummary({ date = '', search = '', device = 'all' } = {}) {
  if (!date) {
    return [];
  }

  const employeeConditions = ['e.active = 1'];
  const employeeParams = [date, date, date, date];

  if (search) {
    employeeConditions.push('e.personName LIKE ?');
    employeeParams.push(`%${search}%`);
  }

  const employees = await query(`
    SELECT
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
    WHERE ${employeeConditions.join(' AND ')}
    ORDER BY e.personName ASC
  `, employeeParams);

  const attlogConditions = ['authDate = ?'];
  const attlogParams = [date];
  if (device && device !== 'all') {
    attlogConditions.push('UPPER(diviceName) = ?');
    attlogParams.push(device.toUpperCase());
  }

  const attendanceRows = await attlogQuery(`
    SELECT
      employeedID,
      MIN(CASE WHEN UPPER(diviceName) = 'EXTERNO' THEN authDateTime END) AS first_entry,
      MAX(CASE WHEN UPPER(diviceName) = 'INTERNO' THEN authDateTime END) AS last_exit,
      COUNT(*) AS record_count,
      GROUP_CONCAT(CONCAT(TIME_FORMAT(authDateTime, '%H:%i'), '|', UPPER(diviceName)) ORDER BY authDateTime SEPARATOR '||') AS record_times
    FROM attlog
    WHERE ${attlogConditions.join(' AND ')}
    GROUP BY employeedID
  `, attlogParams);

  const attendanceByID = new Map(attendanceRows.map((row) => [String(row.employeedID), row]));
  return employees.map((employee) => ({
    ...employee,
    ...(attendanceByID.get(String(employee.employeedID)) || {
      first_entry: null,
      last_exit: null,
      record_count: 0,
      record_times: null,
    }),
  }));
}

export default {
  findSummary,
};
