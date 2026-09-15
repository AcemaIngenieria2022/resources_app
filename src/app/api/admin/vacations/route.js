import { okResponse, errorResponse } from '@/lib/utils/api-response';
import { query } from '@/lib/db/mysql';

function mapPaymentType(value) {
  const labels = {
    time: 'Tiempo completo',
    money: 'Compensación monetaria',
    time_money: 'Tiempo y compensación monetaria',
  };

  return labels[value] || 'No registrado';
}

export async function GET() {
  try {
    const employees = await query(`
      SELECT
        e.id,
        e.personName,
        e.employeedID AS identification_id,
        e.hire_date,
        d.name AS department_name,
        c.name AS company_name,
        p.name AS position_name,
        le.leader_id
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN company c ON c.id = e.company_id
      LEFT JOIN positions p ON p.id = e.position_id
      LEFT JOIN leader_employees le ON le.employee_id = e.id AND le.active = 1
      WHERE e.active = 1
      ORDER BY e.personName ASC
    `);

    // Mantiene la tabla central sincronizada con las solicitudes y novedades nuevas.
    await query(`
      INSERT INTO vacations (
        employee_id, source_type, source_id, leave_class, request_type,
        vacation_payment_type, start_date, end_date, total_days, state_id,
        approval_flow, leader_approved, hr_approved, completed_at
      )
      SELECT
        lr.employee_id, 'leave_request', lr.id, lr.leave_class, lr.permission_type,
        lr.vacation_payment_type, lr.start_date, lr.end_date, lr.total_days, lr.state_id,
        'workflow',
        CASE WHEN st.code IN ('leader_approved', 'hr_pending', 'hr_approved', 'completed') THEN 1 ELSE 0 END,
        CASE WHEN st.code IN ('hr_approved', 'completed') THEN 1 ELSE 0 END,
        CASE WHEN st.code = 'completed' THEN lr.created_at ELSE NULL END
      FROM leave_requests lr
      INNER JOIN state st ON st.id = lr.state_id
      WHERE lr.leave_class = 'Vacaciones'
        AND lr.start_date IS NOT NULL
        AND lr.end_date IS NOT NULL
      ON DUPLICATE KEY UPDATE
        employee_id = VALUES(employee_id),
        request_type = VALUES(request_type),
        vacation_payment_type = VALUES(vacation_payment_type),
        start_date = VALUES(start_date),
        end_date = VALUES(end_date),
        total_days = VALUES(total_days),
        state_id = VALUES(state_id),
        leader_approved = VALUES(leader_approved),
        hr_approved = VALUES(hr_approved),
        completed_at = VALUES(completed_at)
    `);

    await query(`
      INSERT INTO vacations (
        employee_id, source_type, source_id, leave_class, request_type,
        start_date, end_date, total_days, approval_flow,
        leader_approved, hr_approved, completed_at
      )
      SELECT
        r.employee_id, 'manual_record', r.id, 'Vacaciones',
        CASE WHEN r.start_time IS NOT NULL THEN 'hours' ELSE 'days' END,
        r.absence_date, r.absence_date, 1, 'direct', 1, 1, r.created_at
      FROM employee_absence_records r
      WHERE LOWER(TRIM(r.reason)) = 'vacaciones'
      ON DUPLICATE KEY UPDATE
        employee_id = VALUES(employee_id),
        start_date = VALUES(start_date),
        end_date = VALUES(end_date),
        total_days = VALUES(total_days)
    `);

    await query(`
      INSERT INTO vacations (
        employee_id, source_type, source_id, leave_class, request_type,
        start_date, end_date, total_days, approval_flow,
        leader_approved, hr_approved, completed_at
      )
      SELECT
        s.employee_id, 'manual_series', s.id, 'Vacaciones', 'days',
        s.start_date, s.end_date, DATEDIFF(s.end_date, s.start_date) + 1,
        'direct', 1, 1, s.created_at
      FROM absence_series s
      WHERE LOWER(TRIM(s.reason)) = 'vacaciones'
      ON DUPLICATE KEY UPDATE
        employee_id = VALUES(employee_id),
        start_date = VALUES(start_date),
        end_date = VALUES(end_date),
        total_days = VALUES(total_days)
    `);

    const vacationRecords = await query(`
      SELECT
        v.id,
        v.employee_id,
        v.leave_class,
        v.request_type AS permission_type,
        v.vacation_payment_type,
        v.start_date,
        v.end_date,
        v.total_days,
        v.state_id,
        v.approval_flow,
        v.leader_approved,
        v.leader_approved_at,
        v.leader_approved_by_name,
        v.hr_approved,
        v.hr_approved_at,
        v.hr_approved_by_name,
        v.all_flows_approved,
        v.completed_at,
        v.source_type AS source,
        st.code AS state_code,
        st.name AS state_name
      FROM vacations v
      LEFT JOIN state st ON st.id = v.state_id
      WHERE v.leave_class = 'Vacaciones'
      ORDER BY v.start_date DESC, v.created_at DESC
    `);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const normalizedEmployees = employees.map((employee) => {
      const hireDate = employee.hire_date ? new Date(`${employee.hire_date}T00:00:00`) : null;
      const vacationWindow = vacationRecords.filter((request) => Number(request.employee_id) === Number(employee.id));
      const activeVacation = vacationWindow.find((request) => {
        const start = request.start_date ? new Date(`${request.start_date}T00:00:00`) : null;
        const end = request.end_date ? new Date(`${request.end_date}T00:00:00`) : null;
        if (!start || !end) return false;
        const isRejected = ['leader_rejected', 'hr_rejected', 'cancelled', 'expired'].includes(request.state_code);
        return !isRejected && Number(request.all_flows_approved) === 1 && today >= start && today <= end;
      });

      // El reinicio ocurre al día siguiente de end_date, porque el último día todavía cuenta como vacaciones.
      const latestFinishedVacation = vacationWindow
        .filter((request) => (
          request.end_date &&
          !['leader_rejected', 'hr_rejected', 'cancelled', 'expired'].includes(request.state_code) &&
          Number(request.all_flows_approved) === 1 &&
          new Date(`${request.end_date}T00:00:00`) < today
        ))
        .sort((first, second) => String(second.end_date).localeCompare(String(first.end_date)))[0];
      const accrualStart = latestFinishedVacation?.end_date
        ? new Date(`${latestFinishedVacation.end_date}T00:00:00`)
        : hireDate;
      const eligibleDate = accrualStart ? new Date(accrualStart) : null;
      if (eligibleDate) eligibleDate.setFullYear(eligibleDate.getFullYear() + 1);
      const remainingDays = activeVacation
        ? 0
        : eligibleDate
          ? Math.max(0, Math.ceil((eligibleDate - today) / (1000 * 60 * 60 * 24)))
          : 0;

      return {
        ...employee,
        vacation_payment_type: activeVacation?.vacation_payment_type || null,
        currentVacation: activeVacation || null,
        finalisedVacations: vacationWindow,
        vacationStatus: activeVacation
          ? 'En vacaciones'
          : vacationWindow.some((request) => Number(request.all_flows_approved) === 1 && request.start_date && new Date(`${request.start_date}T00:00:00`) > today)
            ? 'Vacaciones programadas'
            : (eligibleDate && today >= eligibleDate ? 'Con derecho a vacaciones' : 'Sin derecho aún'),
        vacationDaysAvailable: remainingDays,
        vacationEligibilityDate: eligibleDate ? eligibleDate.toISOString().slice(0, 10) : null,
      };
    });

    const finalisedVacations = vacationRecords
      .filter((request) => {
        if (Number(request.all_flows_approved) !== 1 || !request.end_date) return false;

        const endDate = new Date(`${request.end_date}T00:00:00`);
        return endDate < today;
      })
      .map((request) => ({
      ...request,
      payment_label: mapPaymentType(request.vacation_payment_type),
      employee_name: employees.find((employee) => Number(employee.id) === Number(request.employee_id))?.personName || 'Empleado',
      identification_id: employees.find((employee) => Number(employee.id) === Number(request.employee_id))?.identification_id || 'N/A',
      company_name: employees.find((employee) => Number(employee.id) === Number(request.employee_id))?.company_name || 'Sin empresa',
      department_name: employees.find((employee) => Number(employee.id) === Number(request.employee_id))?.department_name || 'Sin departamento',
      is_active: (() => {
        if (!request.start_date || !request.end_date) return false;
        const today = new Date();
        const start = new Date(`${request.start_date}T00:00:00`);
        const end = new Date(`${request.end_date}T23:59:59`);
        return today >= start && today <= end;
      })(),
      }));

    const scheduledVacations = vacationRecords
      .filter((request) => {
        if (Number(request.all_flows_approved) !== 1 || !request.start_date) return false;
        const startDate = new Date(`${request.start_date}T00:00:00`);
        return startDate > today;
      })
      .map((request) => ({
        ...request,
        payment_label: mapPaymentType(request.vacation_payment_type),
        employee_name: employees.find((employee) => Number(employee.id) === Number(request.employee_id))?.personName || 'Empleado',
        identification_id: employees.find((employee) => Number(employee.id) === Number(request.employee_id))?.identification_id || 'N/A',
        company_name: employees.find((employee) => Number(employee.id) === Number(request.employee_id))?.company_name || 'Sin empresa',
      }));

    const activeVacations = normalizedEmployees.filter((employee) => employee.currentVacation).length;
    const byPaymentType = {
      time: finalisedVacations.filter((request) => request.vacation_payment_type === 'time').length,
      money: finalisedVacations.filter((request) => request.vacation_payment_type === 'money').length,
      time_money: finalisedVacations.filter((request) => request.vacation_payment_type === 'time_money').length,
    };

    return Response.json(okResponse({
      employees: normalizedEmployees,
      scheduledVacations,
      finalisedVacations,
      summary: {
        totalEmployees: employees.length,
        activeVacations,
        totalFinalisedVacations: finalisedVacations.length,
        byPaymentType,
      },
    }, { message: 'Vacaciones obtenidas correctamente' }));
  } catch (error) {
    console.error('Error en GET /api/admin/vacations:', error);
    return Response.json(errorResponse('Error al obtener las vacaciones', 500), { status: 500 });
  }
}
