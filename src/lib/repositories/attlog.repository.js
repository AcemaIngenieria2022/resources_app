import { query } from '@/lib/db/mysql';

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

  return query(sql, params);
}

export async function findAttlogSummary({ fromDate = '', toDate = '', search = '', employeedIDs = [] } = {}) {
  const conditions = ['LOWER(a.diviceName) IN (?, ?)'];
  const params = ['interno', 'externo'];

  if (fromDate && toDate) {
    conditions.push('a.authDate BETWEEN ? AND ?');
    params.push(fromDate, toDate);
  } else if (fromDate) {
    conditions.push('a.authDate >= ?');
    params.push(fromDate);
  } else if (toDate) {
    conditions.push('a.authDate <= ?');
    params.push(toDate);
  }

  if (Array.isArray(employeedIDs) && employeedIDs.length > 0) {
    const placeholders = employeedIDs.map(() => '?').join(', ');
    conditions.push(`a.employeedID IN (${placeholders})`);
    params.push(...employeedIDs);
  }

  if (search) {
    conditions.push('e.personName LIKE ?');
    params.push(`%${search}%`);
  }

  const sql = `
    SELECT
      a.authDate,
      e.employeedID,
      e.personName,
      d.name AS department_name,
      p.name AS position_name,
      MIN(CASE WHEN UPPER(a.diviceName) = 'EXTERNO' THEN a.authDateTime END) AS first_entry,
      MAX(CASE WHEN UPPER(a.diviceName) = 'INTERNO' THEN a.authDateTime END) AS last_exit,
      COUNT(*) AS record_count,
      GROUP_CONCAT(CONCAT(TIME_FORMAT(a.authDateTime, '%H:%i'), '|', UPPER(a.diviceName)) ORDER BY a.authDateTime SEPARATOR '||') AS record_times
    FROM attlog a
    JOIN employees e ON e.employeedID = a.employeedID AND e.active = 1
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN positions p ON e.position_id = p.id
    WHERE ${conditions.join(' AND ')}
    GROUP BY a.authDate, a.employeedID
    ORDER BY a.authDate ASC, e.personName ASC
  `;

  return query(sql, params);
}

export default {
  findAttlog,
  findAttlogSummary,
};
