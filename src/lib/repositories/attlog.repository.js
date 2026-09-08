import { attlogQuery, query } from '@/lib/db/mysql';

export async function findAttlog({ limit = 'all', date = '', fromDate = '', toDate = '', search = '', device = '', employeedID = '' , sortBy = 'authDateTime', sortDir = 'desc' } = {}) {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('personName LIKE ?');
    params.push(`%${search}%`);
  }

  if (employeedID) {
    conditions.push('employeedID = ?');
    params.push(employeedID);
  }

  if (fromDate && toDate) {
    conditions.push('authDate BETWEEN ? AND ?');
    params.push(fromDate, toDate);
  } else if (fromDate) {
    conditions.push('authDate >= ?');
    params.push(fromDate);
  } else if (toDate) {
    conditions.push('authDate <= ?');
    params.push(toDate);
  } else if (date) {
    conditions.push('authDate = ?');
    params.push(date);
  }

  if (device && device !== 'all') {
    const normalizedDevice = String(device).trim().toLowerCase();
    const resolvedDevice = normalizedDevice === 'otros' || normalizedDevice === 'other' || normalizedDevice === 'otro' ? 'otros' : normalizedDevice;
    conditions.push('LOWER(diviceName) = ?');
    params.push(resolvedDevice);
  } else {
    conditions.push('LOWER(diviceName) IN (?, ?)');
    params.push('interno', 'externo');
  }

  let sql = `SELECT
      employeedID,
      authDateTime,
      authDate,
      authTime,
      diviceName,
      deviceSN,
      personName,
      post
    FROM attlog`;

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  const allowedSortColumns = {
    employeedID: 'employeedID',
    personName: 'personName',
    authDateTime: 'authDateTime',
    authDate: 'authDate',
    authTime: 'authTime',
    diviceName: 'diviceName',
    deviceSN: 'deviceSN',
  };

  const normalizedSortBy = String(sortBy || '').trim();
  const normalizedSortDir = String(sortDir || '').trim().toLowerCase();
  const sortColumn = allowedSortColumns[normalizedSortBy] || 'authDateTime';
  const sortDirection = normalizedSortDir === 'asc' ? 'ASC' : 'DESC';

  sql += ` ORDER BY ${sortColumn} ${sortDirection}`;

  if (limit !== 'all') {
    const numericLimit = Number(limit) || 100;
    sql += ' LIMIT ?';
    params.push(numericLimit);
  }

  return attlogQuery(sql, params);
}

export async function findAttlogSummary({ fromDate = '', toDate = '', search = '', employeedIDs = [] } = {}) {
  const conditions = ["LOWER(diviceName) IN (?, ?)"];
  const params = ['interno', 'externo'];

  if (fromDate && toDate) {
    conditions.push('authDate BETWEEN ? AND ?');
    params.push(fromDate, toDate);
  } else if (fromDate) {
    conditions.push('authDate >= ?');
    params.push(fromDate);
  } else if (toDate) {
    conditions.push('authDate <= ?');
    params.push(toDate);
  }

  if (Array.isArray(employeedIDs) && employeedIDs.length > 0) {
    const placeholders = employeedIDs.map(() => '?').join(', ');
    conditions.push(`employeedID IN (${placeholders})`);
    params.push(...employeedIDs);
  }

  if (search) {
    conditions.push('personName LIKE ?');
    params.push(`%${search}%`);
  }

  const sql = `
    SELECT
      authDate,
      employeedID,
      MAX(personName) AS personName,
      MIN(CASE WHEN UPPER(diviceName) = 'EXTERNO' THEN authDateTime END) AS first_entry,
      MAX(CASE WHEN UPPER(diviceName) = 'INTERNO' THEN authDateTime END) AS last_exit,
      COUNT(DISTINCT CONCAT(TIME_FORMAT(authDateTime, '%H:%i'), '|', UPPER(diviceName))) AS record_count,
      GROUP_CONCAT(DISTINCT CONCAT(TIME_FORMAT(authDateTime, '%H:%i'), '|', UPPER(diviceName)) ORDER BY authDateTime SEPARATOR '||') AS record_times
    FROM attlog
    WHERE ${conditions.join(' AND ')}
    GROUP BY authDate, employeedID
    ORDER BY authDate ASC, personName ASC
  `;

  const attendanceRows = await attlogQuery(sql, params);
  if (attendanceRows.length === 0) return [];

  const employeeIDs = [...new Set(attendanceRows.map((row) => row.employeedID))];
  const placeholders = employeeIDs.map(() => '?').join(', ');
  const employees = await query(`
    SELECT
      e.employeedID,
      e.personName,
      d.name AS department_name,
      p.name AS position_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN positions p ON e.position_id = p.id
    WHERE e.active = 1 AND e.employeedID IN (${placeholders})
  `, employeeIDs);
  const employeeByID = new Map(employees.map((employee) => [String(employee.employeedID), employee]));

  return attendanceRows
    .map((row) => ({ ...row, ...employeeByID.get(String(row.employeedID)) }))
    .filter((row) => employeeByID.has(String(row.employeedID)));
}

export default {
  findAttlog,
  findAttlogSummary,
};
