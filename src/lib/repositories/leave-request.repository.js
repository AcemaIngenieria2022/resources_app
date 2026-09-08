import { query } from '@/lib/db/mysql';

export async function findAllLeaveRequests(limit = 100) {
  return query(
    `
      SELECT
        lr.id,
        lr.employee_id,
        lr.form_full_name,
        lr.form_email,
        lr.identification_id,
        lr.form_position,
        lr.form_phone,
        lr.direct_supervisor,
        lr.leave_class,
        lr.status,
        lr.created_at,
        lr.sharepoint_item_id,
        lr.leader_id,
        leader_employee.personName AS leader_name,
        lr.state_id,
        request_state.code AS state_code,
        request_state.name AS state_name,
        lr.rejected_by_user_id,
        lr.rejected_by_name,
        lr.rejected_by_role,
        lr.rejected_at,
        e.employeedID
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN leaders leader ON leader.id = lr.leader_id
      LEFT JOIN employees leader_employee ON leader_employee.id = leader.employee_id
      LEFT JOIN state request_state ON request_state.id = lr.state_id
      ORDER BY lr.created_at DESC
      LIMIT ?
    `,
    [Number(limit)]
  );
}

export async function findLeaveRequestById(id) {
  const rows = await query(
    `
      SELECT
        lr.id,
        lr.employee_id,
        lr.form_full_name,
        lr.form_email,
        lr.identification_id,
        lr.form_position,
        lr.form_phone,
        lr.direct_supervisor,
        lr.leave_class,
        lr.status,
        lr.created_at,
        lr.sharepoint_item_id,
        lr.leader_id,
        leader_employee.personName AS leader_name,
        lr.state_id,
        request_state.code AS state_code,
        request_state.name AS state_name,
        lr.rejected_by_user_id,
        lr.rejected_by_name,
        lr.rejected_by_role,
        lr.rejected_at,
        e.employeedID
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN leaders leader ON leader.id = lr.leader_id
      LEFT JOIN employees leader_employee ON leader_employee.id = leader.employee_id
      LEFT JOIN state request_state ON request_state.id = lr.state_id
      WHERE lr.id = ?
      LIMIT 1
    `,
    [Number(id)]
  );

  return rows?.[0] ?? null;
}

export async function findLeaveRequestsByEmployeeId(employee_id) {
  return query(
    `
      SELECT
        lr.id,
        lr.employee_id,
        lr.form_full_name,
        lr.form_email,
        lr.identification_id,
        lr.form_position,
        lr.form_phone,
        lr.direct_supervisor,
        lr.leave_class,
        lr.status,
        lr.created_at,
        lr.sharepoint_item_id,
        lr.leader_id,
        leader_employee.personName AS leader_name,
        lr.state_id,
        request_state.code AS state_code,
        request_state.name AS state_name,
        lr.rejected_by_user_id,
        lr.rejected_by_name,
        lr.rejected_by_role,
        lr.rejected_at,
        e.employeedID
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN leaders leader ON leader.id = lr.leader_id
      LEFT JOIN employees leader_employee ON leader_employee.id = leader.employee_id
      LEFT JOIN state request_state ON request_state.id = lr.state_id
      WHERE lr.employee_id = ?
      ORDER BY lr.created_at DESC
    `,
    [Number(employee_id)]
  );
}

export async function findLeaveRequestsByStatus(status) {
  return query(
    `
      SELECT
        lr.id,
        lr.employee_id,
        lr.form_full_name,
        lr.form_email,
        lr.identification_id,
        lr.form_position,
        lr.form_phone,
        lr.direct_supervisor,
        lr.leave_class,
        lr.status,
        lr.created_at,
        lr.sharepoint_item_id,
        lr.leader_id,
        leader_employee.personName AS leader_name,
        lr.state_id,
        request_state.code AS state_code,
        request_state.name AS state_name,
        lr.rejected_by_user_id,
        lr.rejected_by_name,
        lr.rejected_by_role,
        lr.rejected_at,
        e.employeedID
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN leaders leader ON leader.id = lr.leader_id
      LEFT JOIN employees leader_employee ON leader_employee.id = leader.employee_id
      LEFT JOIN state request_state ON request_state.id = lr.state_id
      WHERE lr.status = ?
      ORDER BY lr.created_at DESC
    `,
    [status]
  );
}

export async function updateLeaveRequestStatus(id, status) {
  const result = await query(
    `UPDATE leave_requests SET status = ? WHERE id = ?`,
    [status, Number(id)]
  );
  return result;
}

export async function reviewLeaveRequest({ id, action, role, userId, userName }) {
  const rows = await query(
    `SELECT lr.id, s.code AS state_code
     FROM leave_requests lr
     LEFT JOIN state s ON s.id = lr.state_id
     WHERE lr.id = ? LIMIT 1`,
    [Number(id)]
  );
  const request = rows?.[0];
  if (!request) return { error: 'Novedad no encontrada', status: 404 };

  const currentState = request.state_code || 'created';
  const transitions = {
    leader: {
      approve: { from: ['created', 'leader_pending'], to: 'hr_pending', legacy: 'Pending' },
      reject: { from: ['created', 'leader_pending'], to: 'leader_rejected', legacy: 'Rejected' },
    },
    hr: {
      approve: { from: ['hr_pending'], to: 'completed', legacy: 'Approved' },
      reject: { from: ['leader_approved', 'hr_pending'], to: 'hr_rejected', legacy: 'Rejected' },
    },
  };
  const transition = transitions[role]?.[action];
  if (!transition || !transition.from.includes(currentState)) {
    return { error: `No se puede ${action === 'approve' ? 'aprobar' : 'rechazar'} una solicitud en estado ${currentState}.`, status: 409 };
  }

  const isRejection = action === 'reject';
  await query(
    `UPDATE leave_requests
     SET state_id = (SELECT id FROM state WHERE code = ? LIMIT 1),
         status = ?,
         rejected_by_user_id = CASE WHEN ? THEN ? ELSE rejected_by_user_id END,
         rejected_by_name = CASE WHEN ? THEN ? ELSE rejected_by_name END,
         rejected_by_role = CASE WHEN ? THEN ? ELSE rejected_by_role END,
         rejected_at = CASE WHEN ? THEN NOW() ELSE rejected_at END
     WHERE id = ?`,
    [transition.to, transition.legacy, isRejection, Number(userId) || null, isRejection, userName || null, isRejection, role, isRejection, Number(id)]
  );
  return { id: Number(id), state: transition.to, action, rejectedBy: isRejection ? userName : null };
}

export async function deleteLeaveRequest(id) {
  const result = await query(
    `DELETE FROM leave_requests WHERE id = ?`,
    [Number(id)]
  );
  return result;
}

export async function countLeaveRequests() {
  const rows = await query('SELECT COUNT(*) AS total FROM leave_requests');
  return Number(rows?.[0]?.total ?? 0);
}

export async function countLeaveRequestsByStatus(status) {
  const rows = await query(
    'SELECT COUNT(*) AS total FROM leave_requests WHERE status = ?',
    [status]
  );
  return Number(rows?.[0]?.total ?? 0);
}
