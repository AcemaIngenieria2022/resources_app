import pool from '@/lib/db/mysql';
import { errorResponse, okResponse } from '@/lib/utils/api-response';

// GET: sincroniza la tabla de líderes con los empleados que cumplen el rol requerido y devuelve la relación vigente.
export async function GET() {
  try {
    await pool.execute(`
      DELETE l
      FROM leaders l
      INNER JOIN employees e ON e.id = l.employee_id
      WHERE e.role_id <> 4
         OR e.role_id IS NULL
         OR e.active <> 1
    `);

    await pool.execute(`
      INSERT INTO leaders (employee_id, active)
      SELECT e.id, 1
      FROM employees e
      LEFT JOIN leaders l ON l.employee_id = e.id
      WHERE e.active = 1
        AND e.role_id = 4
        AND l.id IS NULL
    `);

    const [leaders] = await pool.execute(`
      SELECT l.id, l.employee_id, e.personName, e.employeedID, d.name AS department_name
      FROM leaders l
      INNER JOIN employees e ON e.id = l.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE l.active = 1
        AND e.active = 1
      ORDER BY e.personName ASC
    `);
    return Response.json(okResponse(leaders));
  } catch (error) {
    console.error('Error al listar líderes:', error);
    return Response.json(errorResponse('Error al listar líderes', 500), { status: 500 });
  }
}

// POST: asigna o limpia el líder de un colaborador según la acción recibida.
export async function POST(request) {
  const connection = await pool.getConnection();

  try {
    const { employee_id: employeeId, leader_id: leaderId } = await request.json();
    const normalizedEmployeeId = Number(employeeId);
    const normalizedLeaderId = Number(leaderId);

    if (!normalizedEmployeeId) {
      return Response.json(errorResponse('El colaborador es requerido', 400), { status: 400 });
    }

    await connection.beginTransaction();

    const [employees] = await connection.execute(
      'SELECT id FROM employees WHERE id = ? LIMIT 1',
      [normalizedEmployeeId]
    );
    if (employees.length === 0) {
      await connection.rollback();
      return Response.json(errorResponse('El colaborador no existe', 404), { status: 404 });
    }

    if (!normalizedLeaderId) {
      await connection.execute('DELETE FROM leader_employees WHERE employee_id = ?', [normalizedEmployeeId]);
    } else {
      const [leaders] = await connection.execute(
        `SELECT l.id, l.employee_id
         FROM leaders l
         INNER JOIN employees e ON e.id = l.employee_id
         WHERE l.id = ? AND l.active = 1 AND e.active = 1 AND e.role_id = 4
         LIMIT 1`,
        [normalizedLeaderId]
      );
      if (leaders.length === 0) {
        await connection.rollback();
        return Response.json(errorResponse('El líder no existe o está inactivo', 400), { status: 400 });
      }
      if (leaders[0].employee_id === normalizedEmployeeId) {
        await connection.rollback();
        return Response.json(errorResponse('Un colaborador no puede ser su propio líder', 400), { status: 400 });
      }

      await connection.execute('DELETE FROM leader_employees WHERE employee_id = ?', [normalizedEmployeeId]);
      await connection.execute(
        'INSERT INTO leader_employees (leader_id, employee_id, active) VALUES (?, ?, 1)',
        [normalizedLeaderId, normalizedEmployeeId]
      );
    }

    await connection.commit();
    return Response.json(okResponse(null, { message: 'Líder asignado', status: 'success' }));
  } catch (error) {
    await connection.rollback();
    console.error('Error al asignar líder:', error);
    return Response.json(errorResponse('Error al asignar líder', 500), { status: 500 });
  } finally {
    connection.release();
  }
}