import pool from '@/lib/db/mysql';
import { errorResponse, okResponse } from '@/lib/utils/api-response';

// Normaliza una fecha recibida desde el cliente para evitar inconsistencias de formato.
function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return formatDate(date) === value ? date : null;
}

// Convierte un objeto Date a un string ISO-8601 compatible con la base de datos.
function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

// Valida y deja en formato hh:mm las horas recibidas desde el formulario.
function parseTime(value) {
  return /^\d{2}:\d{2}$/.test(value || '') ? value : null;
}

// Genera la lista de fechas de una serie según el rango y la configuración de días seleccionados.
function getDates(startDate, endDate, weekday = null) {
  const dates = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const mondayBasedDay = (current.getUTCDay() + 6) % 7;
    if (weekday === null || mondayBasedDay === weekday) dates.push(formatDate(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

// Crea una nueva novedad manual o derivada de una serie desde el panel de administración.
export async function POST(request) {
  const connection = await pool.getConnection();

  try {
    const body = await request.json();
    const employeeId = Number(body.employee_id);
    const type = ['series', 'hours'].includes(body.type) ? body.type : 'single';
    const weekday = type === 'series' && body.schedule === 'weekday' ? Number(body.weekday) : null;
    const reason = String(body.reason || '').trim();
    const notes = String(body.notes || '').trim();
    const startTime = type === 'hours' ? parseTime(body.start_time) : null;
    const endTime = type === 'hours' ? parseTime(body.end_time) : null;
    const startDate = parseDate(body.start_date);
    const endDate = parseDate(type === 'single' ? body.start_date : (body.end_date || body.start_date));

    if (!employeeId || !reason || !startDate || !endDate) {
      return Response.json(errorResponse('Colaborador, motivo y fechas son requeridos', 400), { status: 400 });
    }
    if (type === 'hours' && (!startTime || !endTime || endTime <= startTime)) {
      return Response.json(errorResponse('Las horas son requeridas y la hora final debe ser posterior a la inicial', 400), { status: 400 });
    }
    if (endDate < startDate) {
      return Response.json(errorResponse('La fecha final no puede ser anterior a la inicial', 400), { status: 400 });
    }

    if (type === 'series' && body.schedule === 'weekday' && !Number.isInteger(weekday)) {
      return Response.json(errorResponse('Selecciona el día específico de la serie', 400), { status: 400 });
    }
    const dates = getDates(startDate, endDate, weekday);
    if (type === 'series' && dates.length === 0) {
      return Response.json(errorResponse('El rango no contiene fechas del día seleccionado', 400), { status: 400 });
    }
    if (type === 'series' && dates.length > 366) {
      return Response.json(errorResponse('La serie no puede superar 366 días', 400), { status: 400 });
    }

    await connection.beginTransaction();
    const [employees] = await connection.execute(
      'SELECT id FROM employees WHERE id = ? AND active = 1 LIMIT 1',
      [employeeId]
    );
    if (employees.length === 0) {
      await connection.rollback();
      return Response.json(errorResponse('El colaborador no existe o está inactivo', 404), { status: 404 });
    }

    if (type === 'single' || type === 'hours') {
      await connection.execute(
        `INSERT INTO employee_absence_records (employee_id, absence_date, reason, notes, start_time, end_time)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [employeeId, formatDate(startDate), reason, notes || null, startTime, endTime]
      );
    } else {
      await connection.execute(
        `INSERT INTO absence_series (employee_id, start_date, end_date, weekday, reason, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [employeeId, formatDate(startDate), formatDate(endDate), weekday, reason, notes || null]
      );
    }

    await connection.commit();
    return Response.json(okResponse(null, { message: 'Novedad registrada', status: 'success' }));
  } catch (error) {
    await connection.rollback();
    console.error('Error al registrar novedad:', error);
    return Response.json(errorResponse('No se pudo registrar la novedad', 500), { status: 500 });
  } finally {
    connection.release();
  }
}

// Lista las novedades activas para cargar la pantalla de administración y separar las canceladas.
export async function GET() {
  try {
    const [manualSingles] = await pool.query(`
      SELECT
        r.id,
        r.employee_id,
        e.personName,
        e.employeedID,
        d.name AS department_name,
        r.absence_date,
        r.reason,
        r.notes,
        CASE WHEN r.start_time IS NOT NULL THEN 'hours' ELSE 'single' END AS type,
        r.start_time,
        r.end_time,
        NULL AS series_id,
        NULL AS weekday,
        r.absence_date AS start_date,
        r.absence_date AS end_date,
        'manual' AS source
      FROM employee_absence_records r
      INNER JOIN employees e ON e.id = r.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE NOT EXISTS (
        SELECT 1 FROM absence_series s
        WHERE s.employee_id = r.employee_id
          AND r.absence_date BETWEEN s.start_date AND s.end_date
          AND s.reason = r.reason
      )
    `);

    const [manualSeries] = await pool.query(`
      SELECT
        s.id,
        s.employee_id,
        e.personName,
        e.employeedID,
        d.name AS department_name,
        NULL AS absence_date,
        s.reason,
        s.notes,
        'series' AS type,
        NULL AS start_time,
        NULL AS end_time,
        s.id AS series_id,
        s.weekday,
        s.start_date,
        s.end_date,
        'manual' AS source
      FROM absence_series s
      INNER JOIN employees e ON e.id = s.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
    `);

    const [completedLeaveRequests] = await pool.query(`
      SELECT
        lr.id,
        lr.employee_id,
        e.personName,
        e.employeedID,
        d.name AS department_name,
        lr.permission_date AS absence_date,
        lr.leave_class AS reason,
        NULL AS notes,
        CASE WHEN lr.permission_type = 'hours' THEN 'hours' ELSE 'series' END AS type,
        lr.start_time,
        lr.end_time,
        NULL AS series_id,
        NULL AS weekday,
        lr.start_date,
        lr.end_date,
        'leave_request' AS source
      FROM leave_requests lr
      INNER JOIN employees e ON e.id = lr.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      INNER JOIN state st ON st.id = lr.state_id
      WHERE st.code = 'completed'
        AND lr.status <> 'Cancelled'
    `);

    const rows = [...manualSingles, ...manualSeries, ...completedLeaveRequests]
      .sort((a, b) => {
        const aKey = a.start_date || a.absence_date || '';
        const bKey = b.start_date || b.absence_date || '';

        if (aKey === bKey) {
          return String(b.id).localeCompare(String(a.id));
        }

        return bKey.localeCompare(aKey);
      });

    return Response.json(okResponse(rows));
  } catch (error) {
    console.error('Error al listar novedades:', error);
    return Response.json(errorResponse('No se pudieron cargar las novedades', 500), { status: 500 });
  }
}

// Actualiza una novedad existente, incluyendo las que provienen de leave requests.
export async function PUT(request) {
  const connection = await pool.getConnection();

  try {
    const body = await request.json();
    const source = String(body.source || 'manual');
    const id = Number(body.id);
    const employeeId = Number(body.employee_id);
    const type = ['series', 'hours'].includes(body.type) ? body.type : 'single';
    const weekday = type === 'series' && body.schedule === 'weekday' ? Number(body.weekday) : null;
    const reason = String(body.reason || '').trim();
    const notes = String(body.notes || '').trim();
    const startTime = type === 'hours' ? parseTime(body.start_time) : null;
    const endTime = type === 'hours' ? parseTime(body.end_time) : null;
    const startDate = parseDate(body.start_date || body.absence_date);
    const endDate = parseDate(type === 'single' ? (body.start_date || body.absence_date) : (body.end_date || body.start_date || body.absence_date));

    if (!id || !employeeId || !reason || !startDate || !endDate) {
      return Response.json(errorResponse('Colaborador, fechas y motivo son requeridos', 400), { status: 400 });
    }
    if (type === 'hours' && (!startTime || !endTime || endTime <= startTime)) {
      return Response.json(errorResponse('Las horas son requeridas y la hora final debe ser posterior a la inicial', 400), { status: 400 });
    }
    if (endDate < startDate) {
      return Response.json(errorResponse('La fecha final no puede ser anterior a la inicial', 400), { status: 400 });
    }

    if (type === 'series' && body.schedule === 'weekday' && !Number.isInteger(weekday)) {
      return Response.json(errorResponse('Selecciona el día específico de la serie', 400), { status: 400 });
    }
    const dates = getDates(startDate, endDate, weekday);
    if (type === 'series' && dates.length === 0) {
      return Response.json(errorResponse('El rango no contiene fechas del día seleccionado', 400), { status: 400 });
    }
    if (type === 'series' && dates.length > 366) {
      return Response.json(errorResponse('La serie no puede superar 366 días', 400), { status: 400 });
    }

    await connection.beginTransaction();
    const [employees] = await connection.execute(
      'SELECT id FROM employees WHERE id = ? AND active = 1 LIMIT 1',
      [employeeId]
    );
    if (employees.length === 0) {
      await connection.rollback();
      return Response.json(errorResponse('El colaborador no existe o está inactivo', 404), { status: 404 });
    }

    if (source === 'leave_request') {
      const [existingRows] = await connection.execute(
        `SELECT id, employee_id, permission_type, start_date, end_date, permission_date, reason, start_time, end_time
         FROM leave_requests
         WHERE id = ? LIMIT 1`,
        [id]
      );

      if (existingRows.length === 0) {
        await connection.rollback();
        return Response.json(errorResponse('Novedad no encontrada', 404), { status: 404 });
      }

      const permissionType = type === 'hours' ? 'hours' : 'days';
      const nextStartDate = type === 'hours' ? null : formatDate(startDate);
      const nextEndDate = type === 'hours' ? null : formatDate(endDate);
      const nextPermissionDate = type === 'hours' ? formatDate(startDate) : null;
      const totalDays = type === 'hours' ? null : Math.max(1, Math.round(((endDate.getTime() - startDate.getTime()) / 86400000) + 1));
      const totalHours = type === 'hours' ? Number((Number(endTime.substring(0, 2)) + Number(endTime.substring(3, 5)) / 60 - (Number(startTime.substring(0, 2)) + Number(startTime.substring(3, 5)) / 60)).toFixed(2)) : null;

      await connection.execute(
        `UPDATE leave_requests
         SET employee_id = ?,
             permission_type = ?,
             start_date = ?,
             end_date = ?,
             permission_date = ?,
             total_days = ?,
             total_hours = ?,
             start_time = ?,
             end_time = ?,
             reason = ?
         WHERE id = ?`,
        [employeeId, permissionType, nextStartDate, nextEndDate, nextPermissionDate, totalDays, totalHours, startTime, endTime, reason, id]
      );

      await connection.commit();
      return Response.json(okResponse(null, { message: 'Novedad actualizada', status: 'success' }));
    }

    if (body.series_id) {
      await connection.execute(
        'DELETE FROM employee_absence_records WHERE employee_id = ? AND absence_date BETWEEN ? AND ? AND reason = ?',
        [Number(body.original_employee_id || body.employee_id), body.original_start_date, body.original_end_date, body.original_reason || body.reason]
      );
      await connection.execute('DELETE FROM absence_series WHERE id = ?', [Number(body.series_id)]);
    } else {
      await connection.execute('DELETE FROM employee_absence_records WHERE id = ?', [id]);
    }

    if (type === 'series') {
      await connection.execute(
        `INSERT INTO absence_series (employee_id, start_date, end_date, weekday, reason, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [employeeId, formatDate(startDate), formatDate(endDate), weekday, reason, notes || null]
      );
    } else {
      await connection.execute(
        `INSERT INTO employee_absence_records (employee_id, absence_date, reason, notes, start_time, end_time)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [employeeId, formatDate(startDate), reason, notes || null, startTime, endTime]
      );
    }

    await connection.commit();
    return Response.json(okResponse(null, { message: 'Novedad actualizada', status: 'success' }));
  } catch (error) {
    await connection.rollback();
    console.error('Error al editar novedad:', error);
    return Response.json(errorResponse('No se pudo editar la novedad', 500), { status: 500 });
  } finally {
    connection.release();
  }
}

// Elimina o cancela una novedad según el origen y la acción pedida por el cliente.
export async function DELETE(request) {
  const connection = await pool.getConnection();

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    const seriesId = Number(searchParams.get('series_id'));
    const source = String(searchParams.get('source') || 'manual');
    const action = String(searchParams.get('action') || 'delete');
    if (!id && !seriesId) return Response.json(errorResponse('ID es requerido', 400), { status: 400 });

    await connection.beginTransaction();
    let result;
    if (source === 'leave_request') {
      if (action === 'cancel') {
        const [existingRows] = await connection.execute(
          `SELECT id, state_id
           FROM leave_requests
           WHERE id = ? LIMIT 1`,
          [id]
        );

        if (existingRows.length === 0) {
          await connection.rollback();
          return Response.json(errorResponse('Novedad no encontrada', 404), { status: 404 });
        }

        const [existingCancelledState] = await connection.execute(
          `SELECT id
           FROM state
           WHERE code = 'cancelled'
           LIMIT 1`
        );

        let cancelledStateId = existingCancelledState?.[0]?.id;

        if (!cancelledStateId) {
          await connection.execute(
            `INSERT INTO state (code, name, active)
             VALUES ('cancelled', 'Cancelada', 1)
             ON DUPLICATE KEY UPDATE name = VALUES(name), active = 1`
          );

          const [createdCancelledState] = await connection.execute(
            `SELECT id
             FROM state
             WHERE code = 'cancelled'
             LIMIT 1`
          );
          cancelledStateId = createdCancelledState?.[0]?.id;
        }

        if (!cancelledStateId) {
          await connection.rollback();
          return Response.json(errorResponse('No se pudo crear el estado cancelled', 500), { status: 500 });
        }

        [result] = await connection.execute(
          `UPDATE leave_requests
           SET state_id = ?,
               status = 'Cancelled',
               rejected_at = NOW()
           WHERE id = ?`,
          [cancelledStateId, id]
        );
      } else {
        [result] = await connection.execute('DELETE FROM leave_requests WHERE id = ?', [id]);
      }
    } else if (seriesId) {
      const [series] = await connection.execute(
        'SELECT employee_id, start_date, end_date, reason FROM absence_series WHERE id = ? LIMIT 1',
        [seriesId]
      );
      if (series.length === 0) {
        await connection.rollback();
        return Response.json(errorResponse('Novedad no encontrada', 404), { status: 404 });
      }
      await connection.execute(
        'DELETE FROM employee_absence_records WHERE employee_id = ? AND absence_date BETWEEN ? AND ? AND reason = ?',
        [series[0].employee_id, series[0].start_date, series[0].end_date, series[0].reason]
      );
      [result] = await connection.execute('DELETE FROM absence_series WHERE id = ?', [seriesId]);
    } else {
      [result] = await connection.execute('DELETE FROM employee_absence_records WHERE id = ?', [id]);
    }
    if (!result.affectedRows) {
      await connection.rollback();
      return Response.json(errorResponse('Novedad no encontrada', 404), { status: 404 });
    }
    await connection.commit();
    return Response.json(okResponse(null, { message: 'Novedad eliminada', status: 'success' }));
  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar novedad:', error);
    return Response.json(errorResponse('No se pudo eliminar la novedad', 500), { status: 500 });
  } finally {
    connection.release();
  }
}