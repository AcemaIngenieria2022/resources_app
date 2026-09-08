import { query } from '@/lib/db/mysql';

export async function findAllEmployees(limit = 50) {
  return query(
    `
      SELECT
        e.id,
        e.employeedID,
        e.personName,
        e.department_id,
        e.position_id,
        e.role_id,
        e.user_id,
        le.leader_id,
        e.active,
        e.created_at,
        d.name AS department_name,
        p.name AS position_name,
        r.description AS role_name,
        assigned_leader_employee.personName AS leader_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN roles r ON e.role_id = r.id
      LEFT JOIN leader_employees le ON le.employee_id = e.id AND le.active = 1
      LEFT JOIN leaders assigned_leader ON assigned_leader.id = le.leader_id
      LEFT JOIN employees assigned_leader_employee ON assigned_leader_employee.id = assigned_leader.employee_id
      ORDER BY e.id ASC
      LIMIT ?
    `,
    [Number(limit)]
  );
}

export async function findEmployeeById(id) {
  const rows = await query(
    `
      SELECT
        e.id,
        e.employeedID,
        e.personName,
        e.department_id,
        e.position_id,
        e.role_id,
        e.user_id,
        le.leader_id,
        e.active,
        e.created_at,
        d.name AS department_name,
        p.name AS position_name,
        r.description AS role_name,
        assigned_leader_employee.personName AS leader_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN roles r ON e.role_id = r.id
      LEFT JOIN leader_employees le ON le.employee_id = e.id AND le.active = 1
      LEFT JOIN leaders assigned_leader ON assigned_leader.id = le.leader_id
      LEFT JOIN employees assigned_leader_employee ON assigned_leader_employee.id = assigned_leader.employee_id
      WHERE e.id = ?
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

export async function createEmployee({ employeedID, personName, department_id, position_id, role_id, user_id, active }) {
  const result = await query(
    `INSERT INTO employees (employeedID, personName, department_id, position_id, role_id, user_id, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [employeedID, personName, department_id || null, position_id || null, role_id || null, user_id || null, active ? 1 : 0]
  );
  return { insertId: result.insertId };
}

export async function updateEmployee(id, { personName, department_id, position_id, role_id, user_id, active }) {
  const result = await query(
    `UPDATE employees SET personName = ?, department_id = ?, position_id = ?, role_id = ?, user_id = ?, active = ? WHERE id = ?`,
    [personName, department_id || null, position_id || null, role_id || null, user_id || null, active ? 1 : 0, Number(id)]
  );
  return result;
}

export async function deleteEmployee(id) {
  const result = await query(`DELETE FROM employees WHERE id = ?`, [Number(id)]);
  return result;
}

export async function findEmployeesByDepartment(dept_id) {
  return query(
    `
      SELECT
        e.id,
        e.employeedID,
        e.personName,
        e.department_id,
        e.position_id,
        e.active,
        e.created_at,
        d.name AS department_name,
        p.name AS position_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE e.department_id = ?
      ORDER BY e.id ASC
    `,
    [Number(dept_id)]
  );
}

export async function findEmployeesByPosition(pos_id) {
  return query(
    `
      SELECT
        e.id,
        e.employeedID,
        e.personName,
        e.department_id,
        e.position_id,
        e.active,
        e.created_at,
        d.name AS department_name,
        p.name AS position_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE e.position_id = ?
      ORDER BY e.id ASC
    `,
    [Number(pos_id)]
  );
}
