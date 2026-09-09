import { query } from '@/lib/db/mysql';
import { AppError } from '@/lib/errors/AppError';
import passwordUtils from '@/lib/security/password';

// Repositorio para las operaciones de usuarios, estados, roles y actualización de credenciales.

const STATUS_NAMES = ['active', 'suspended', 'disabled'];

const normalizeStatus = (value) => {
  if (value === true || value === 1 || value === '1') return 'active';
  if (value === false || value === 0 || value === '0') return 'disabled';
  if (!value) return 'active';

  const normalized = String(value).toLowerCase();
  if (normalized === 'inactive') return 'disabled';
  if (STATUS_NAMES.includes(normalized)) return normalized;
  return 'active';
};

async function getStatusIdByName(name) {
  if (!name) {
    return null;
  }

  try {
    const rows = await query(
      `
        SELECT id
        FROM user_statuses
        WHERE name = ?
        LIMIT 1
      `,
      [String(name).toLowerCase()]
    );
    return rows?.[0]?.id ?? null;
  } catch (error) {
    if (error?.errno === 1146 || /Table '.*user_statuses' doesn't exist/.test(error?.message || '')) {
      return null;
    }
    throw error;
  }
}

async function selectUserColumns(columnList, whereClause, params) {
  return query(
    `
      SELECT ${columnList}
      FROM users
      ${whereClause}
    `,
    params
  );
}

async function selectUserByEmail(email) {
  try {
    const rows = await selectUserColumns(
      'users.id, users.email, users.password, users.role, roles.description AS role_description, users.first_name, users.last_name, COALESCE(us.name, users.status) AS status, users.status_id, users.created_at',
      'LEFT JOIN user_statuses us ON users.status_id = us.id LEFT JOIN roles ON roles.name = users.role WHERE users.email = ? LIMIT 1',
      [email]
    );

    const row = rows?.[0] ?? null;
    return row ? { ...row, status: row.status || normalizeStatus(row.active) } : null;
  } catch (error) {
    if (
      error?.errno === 1054 ||
      error?.errno === 1146 ||
      /Unknown column 'status'/.test(error?.message || '') ||
      /Unknown column 'active'/.test(error?.message || '') ||
      /Table '.*user_statuses' doesn't exist/.test(error?.message || '')
    ) {
      const rows = await selectUserColumns(
        'users.id, users.email, users.password, users.role, users.first_name, users.last_name, status, created_at',
        'WHERE users.email = ? LIMIT 1',
        [email]
      );
      const row = rows?.[0] ?? null;
      return row ? { ...row, status: row.status || normalizeStatus(row.active) } : null;
    }
    throw error;
  }
}

export async function findUserByEmail(email) {
  return selectUserByEmail(email);
}

export async function findAllUsers(limit = 100) {
  return query(
    `
      SELECT id, email, role, first_name, last_name, created_at
      FROM users
      ORDER BY id ASC
      LIMIT ?
    `,
    [Number(limit)]
  );
}

export async function findUsers({ limit = 100, search = '', role = '' } = {}) {
  const conditions = [];
  const params = [];

  if (search) {
    const term = `%${search}%`;
    conditions.push('(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)');
    params.push(term, term, term);
  }

  if (role) {
    conditions.push('role = ?');
    params.push(role);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const rows = await query(
      `
        SELECT users.id, users.email, users.role, users.first_name, users.last_name,
          e.id AS employee_id, e.employeedID, e.personName AS employee_name,
          COALESCE(us.name, users.status) AS status, users.status_id, users.created_at
        FROM users
        LEFT JOIN user_statuses us ON users.status_id = us.id
        LEFT JOIN employees e ON e.user_id = users.id
        ${whereClause}
        ORDER BY users.id ASC
        LIMIT ?
      `,
      [...params, Number(limit)]
    );
      return rows.map((row) => ({
        ...row,
        status: row.status || normalizeStatus(row.active),
      }));
  } catch (error) {
    if (
      error?.errno === 1054 ||
      error?.errno === 1146 ||
      /Unknown column 'status'/.test(error?.message || '') ||
      /Unknown column 'active'/.test(error?.message || '') ||
      /Table '.*user_statuses' doesn't exist/.test(error?.message || '')
    ) {
      const rows = await query(
        `
          SELECT id, email, role, first_name, last_name, created_at
          FROM users
          ${whereClause}
          ORDER BY id ASC
          LIMIT ?
        `,
        [...params, Number(limit)]
      );
      return rows.map((row) => ({
        ...row,
        status: row.status || normalizeStatus(row.active),
      }));
    }
    throw error;
  }
}

export async function updateUser(id, fields = {}) {
  const sets = [];
  const params = [];

  if (fields.email !== undefined) {
    sets.push('email = ?');
    params.push(fields.email);
  }
  if (fields.firstName !== undefined) {
    sets.push('first_name = ?');
    params.push(fields.firstName);
  }
  if (fields.lastName !== undefined) {
    sets.push('last_name = ?');
    params.push(fields.lastName);
  }
  if (fields.role !== undefined) {
    sets.push('role = ?');
    params.push(fields.role);
  }
  if (fields.status !== undefined) {
    const statusId = await getStatusIdByName(fields.status);
    sets.push('status = ?');
    params.push(fields.status);
    if (statusId !== null) {
      sets.push('status_id = ?');
      params.push(statusId);
    }
  } else if (fields.active !== undefined) {
    sets.push('active = ?');
    params.push(Number(fields.active));
  }

  if (fields.employeeId !== undefined) {
    const employeeId = fields.employeeId ? Number(fields.employeeId) : null;
    if (employeeId !== null) {
      const employeeRows = await query('SELECT id FROM employees WHERE id = ? LIMIT 1', [employeeId]);
      if (!employeeRows?.length) throw new AppError('Empleado no encontrado', 404);
      const linkedRows = await query('SELECT id FROM employees WHERE id = ? AND user_id IS NOT NULL AND user_id <> ? LIMIT 1', [employeeId, Number(id)]);
      if (linkedRows?.length) throw new AppError('El empleado ya está relacionado con otro usuario', 409);
    }
    await query('UPDATE employees SET user_id = NULL WHERE user_id = ?', [Number(id)]);
    if (employeeId !== null) {
      await query('UPDATE employees SET user_id = ? WHERE id = ?', [Number(id), employeeId]);
    }
  }

  if (!sets.length) {
    return findUserById(id);
  }

  await query(
    `
      UPDATE users
      SET ${sets.join(', ')}
      WHERE id = ?
    `,
    [...params, Number(id)]
  );

  return findUserById(id);
}

export async function countUsers() {
  const rows = await query('SELECT COUNT(*) AS total FROM users');
  return Number(rows?.[0]?.total ?? 0);
}

export async function findUserById(id) {
  try {
    const rows = await query(
      `
        SELECT users.id, users.email, users.password, users.role, users.first_name, users.last_name,
          COALESCE(us.name, users.status) AS status, users.status_id, users.active, users.created_at
        FROM users
        LEFT JOIN user_statuses us ON users.status_id = us.id
        WHERE users.id = ?
        LIMIT 1
      `,
      [Number(id)]
    );

    const row = rows?.[0] ?? null;
    return row ? { ...row, status: row.status || normalizeStatus(row.active) } : null;
  } catch (error) {
    if (
      error?.errno === 1054 ||
      error?.errno === 1146 ||
      /Unknown column 'status'/.test(error?.message || '') ||
      /Unknown column 'active'/.test(error?.message || '') ||
      /Table '.*user_statuses' doesn't exist/.test(error?.message || '')
    ) {
      const rows = await query(
        `
          SELECT id, email, role, first_name, last_name, created_at
          FROM users
          WHERE id = ?
          LIMIT 1
        `,
        [Number(id)]
      );
      const row = rows?.[0] ?? null;
      return row ? { ...row, status: row.status || normalizeStatus(row.active) } : null;
    }
    throw error;
  }
}

export async function updateUserRole(id, role) {
  await query(
    `
      UPDATE users
      SET role = ?
      WHERE id = ?
    `,
    [role, Number(id)]
  );

  return findUserById(id);
}

export async function deleteUser(id) {
  await query('DELETE FROM users WHERE id = ?', [Number(id)]);
}

export async function updateUserPassword(id, newPassword) {
  const passwordHash = passwordUtils.hashPassword(newPassword);
  await query(
    `
      UPDATE users
      SET password = ?
      WHERE id = ?
    `,
    [passwordHash, Number(id)]
  );

  return findUserById(id);
}

export async function createUser({ email, password, role = 'user', firstName = '', lastName = '', status = 'active' }) {
  if (!email) {
    throw new AppError('El email es obligatorio', 400);
  }
  if (!password) {
    throw new AppError('La contraseña es obligatoria', 400);
  }

  const passwordHash = passwordUtils.hashPassword(password);
  const statusId = await getStatusIdByName(status);

  try {
    const columns = ['email', 'password', 'role', 'first_name', 'last_name', 'status'];
    const placeholders = ['?', '?', '?', '?', '?', '?'];
    const values = [email, passwordHash, role, firstName, lastName, status];

    if (statusId !== null) {
      columns.push('status_id');
      placeholders.push('?');
      values.push(statusId);
    }

    const result = await query(
      `
        INSERT INTO users (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
      `,
      values
    );

    return {
      id: result.insertId,
      email,
      role,
      firstName,
      lastName,
      status,
    };
  } catch (error) {
    if (error?.errno === 1054 || /Unknown column 'status'/.test(error?.message || '') || /Unknown column 'status_id'/.test(error?.message || '')) {
      const result = await query(
        `
          INSERT INTO users (email, password, role, first_name, last_name)
          VALUES (?, ?, ?, ?, ?)
        `,
        [email, passwordHash, role, firstName, lastName]
      );

      return {
        id: result.insertId,
        email,
        role,
        firstName,
        lastName,
        status,
      };
    }

    if (error?.errno === 1062 || /Duplicate entry/.test(error?.message || '')) {
      throw new AppError('Ya existe un usuario con ese email', 409);
    }

    throw error;
  }
}

export async function getRoleIdByName(name) {
  const rows = await query(
    `
      SELECT id
      FROM roles
      WHERE name = ?
      LIMIT 1
    `,
    [name]
  );

  return rows?.[0]?.id ?? null;
}

export async function assignRoleToUser(userId, roleId) {
  await query(
    `
      INSERT INTO user_roles (user_id, role_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP()
    `,
    [userId, roleId]
  );
}
