import { query } from '@/lib/db/mysql';

export async function findAllEmployees(limit = 50) {
  return query(
    `
      SELECT
        id,
        employeedID,
        personName,
        department_id,
        position_id,
        active,
        created_at
      FROM employees
      ORDER BY id ASC
      LIMIT ?
    `,
    [Number(limit)]
  );
}

export async function findEmployeeById(id) {
  const rows = await query(
    `
      SELECT
        id,
        employeedID,
        personName,
        department_id,
        position_id,
        active,
        created_at
      FROM employees
      WHERE id = ?
      LIMIT 1
    `,
    [Number(id)]
  );

  return rows?.[0] ?? null;
}

export async function countEmployees() {
  const rows = await query('SELECT COUNT(*) AS total FROM employees');
  return Number(rows?.[0]?.total ?? 0);
}
