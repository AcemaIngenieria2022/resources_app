import { attlogQuery, query } from '@/lib/db/mysql';

// Repositorio encargado de construir el resumen diario de asistencia con ausencias, marcas y novedades aprobadas.
// Genera el resumen de asistencia del día, incluyendo ausencias manuales, series y solicitudes aprobadas.
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
    WHERE ${employeeConditions.join(' AND ')}
    ORDER BY e.personName ASC
  `, employeeParams);

  const approvedLeaveRequests = await query(`
    SELECT
      lr.employee_id,
      lr.leave_class,
      lr.permission_type,
      lr.start_date,
      lr.end_date,
      lr.permission_date,
      lr.start_time,
      lr.end_time
    FROM leave_requests lr
    INNER JOIN state st ON st.id = lr.state_id
    WHERE st.code = 'completed'
      AND (
        (lr.permission_type = 'hours' AND lr.permission_date = ?)
        OR (lr.permission_type = 'days' AND lr.start_date <= ? AND lr.end_date >= ?)
      )
  `, [date, date, date]);

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
      SUM(CASE WHEN UPPER(diviceName) = 'INTERNO' THEN 1 ELSE 0 END) AS internal_count,
      SUM(CASE WHEN UPPER(diviceName) = 'EXTERNO' THEN 1 ELSE 0 END) AS external_count,
      GROUP_CONCAT(CONCAT(TIME_FORMAT(authDateTime, '%H:%i'), '|', UPPER(diviceName)) ORDER BY authDateTime SEPARATOR '||') AS record_times
    FROM attlog
    WHERE ${attlogConditions.join(' AND ')}
    GROUP BY employeedID
  `, attlogParams);

  const attendanceByID = new Map(attendanceRows.map((row) => [String(row.employeedID), row]));

  const approvedLeaveRequestReasons = new Map();
  for (const request of approvedLeaveRequests) {
    const employeeId = Number(request.employee_id);
    const requestReason = request.permission_type === 'hours'
      ? `${request.leave_class || 'Novedad'} (${request.permission_date} ${request.start_time?.slice(0, 5)} - ${request.end_time?.slice(0, 5)})`
      : `${request.leave_class || 'Novedad'} (${request.start_date} a ${request.end_date})`;

    const currentReasons = approvedLeaveRequestReasons.get(employeeId) || [];
    currentReasons.push(requestReason);
    approvedLeaveRequestReasons.set(employeeId, currentReasons);
  }

  return employees.map((employee) => ({
    ...employee,
    absence_reason: [employee.absence_reason, ...(approvedLeaveRequestReasons.get(Number(employee.id)) || [])]
      .filter(Boolean)
      .join(', '),
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
