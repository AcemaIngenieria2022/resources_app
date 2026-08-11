import { query } from '@/lib/db/mysql';

export async function findSummary({ date = '', search = '', device = 'all' } = {}) {
  if (!date) {
    return [];
  }

  const conditions = ['e.active = 1'];

  if (search) {
    conditions.push('e.personName LIKE ?');
  }

  const sql = `
    SELECT
      e.employeedID,
      e.personName,
      d.name AS department_name,
      p.name AS position_name,
      external_first.first_entry,
      internal_last.last_exit,
      IFNULL(record_summary.record_count, 0) AS record_count,
      record_summary.record_times
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
      ${device && device !== 'all' ? 'AND UPPER(diviceName) = ?' : ''}
      GROUP BY employeedID
    ) record_summary ON record_summary.employeedID = e.employeedID
    WHERE ${conditions.join(' AND ')}
    ORDER BY e.personName ASC
  `;

  const queryParams = [date, date, date];
  if (search) queryParams.push(`%${search}%`);
  if (device && device !== 'all') queryParams.push(device.toUpperCase());

  return query(sql, queryParams);
}

export default {
  findSummary,
};
