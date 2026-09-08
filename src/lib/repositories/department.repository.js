import { query } from '@/lib/db/mysql';

export async function findAllDepartments(limit = 200) {
  return query(
    `
      SELECT
        id,
        name,
        description
      FROM departments
      ORDER BY id ASC
      LIMIT ?
    `,
    [Number(limit)]
  );
}

export async function findDepartmentById(id) {
  const rows = await query(
    `
      SELECT id, name, description
      FROM departments
      WHERE id = ?
      LIMIT 1
    `,
    [Number(id)]
  );

  return rows?.[0] ?? null;
}

export async function createDepartment({ name, description }) {
  const result = await query(
    `INSERT INTO departments (name, description) VALUES (?, ?)`,
    [name, description]
  );

  return { insertId: result.insertId };
}

export async function updateDepartment(id, { name, description }) {
  const result = await query(
    `UPDATE departments SET name = ?, description = ? WHERE id = ?`,
    [name, description, Number(id)]
  );

  return result;
}

export async function deleteDepartment(id) {
  const result = await query(`DELETE FROM departments WHERE id = ?`, [Number(id)]);
  return result;
}

export default {
  findAllDepartments,
  findDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
