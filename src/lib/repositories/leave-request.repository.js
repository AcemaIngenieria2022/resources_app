import { query } from '@/lib/db/mysql';

let rejectionObservationColumn;

async function hasRejectionObservationColumn() {
  if (rejectionObservationColumn === undefined) {
    const rows = await query(
      `SELECT COUNT(*) AS total
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'leave_requests'
         AND column_name = 'rejection_observation'`
    );
    rejectionObservationColumn = Number(rows?.[0]?.total || 0) > 0;
  }
  return rejectionObservationColumn;
}

async function rejectionObservationSelect() {
  return (await hasRejectionObservationColumn())
    ? 'lr.rejection_observation'
    : 'NULL AS rejection_observation';
}

async function traceabilitySelect() {
  const columns = await getTraceabilityColumns();
  return [
    columns.has('leader_approved_at') ? 'lr.leader_approved_at' : 'NULL AS leader_approved_at',
    columns.has('leader_approved_by_name') ? 'lr.leader_approved_by_name' : 'NULL AS leader_approved_by_name',
    columns.has('completed_at') ? 'lr.completed_at' : 'NULL AS completed_at',
    columns.has('completed_by_name') ? 'lr.completed_by_name' : 'NULL AS completed_by_name',
  ].join(',\n        ');
}

async function getTraceabilityColumns() {
  const rows = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'leave_requests'
       AND column_name IN ('leader_approved_at', 'leader_approved_by_name', 'completed_at', 'completed_by_name')`
  );
  return new Set(rows.map((row) => row.column_name));
}

export async function findAllLeaveRequests(limit = 100, leaderUserId = null) {
  const rejectionObservation = await rejectionObservationSelect();
  const traceability = await traceabilitySelect();
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
            lr.reason,
            lr.attachment_url,
        lr.status,
        lr.created_at,
        ${traceability},
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
        ${rejectionObservation},
        e.employeedID
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN leaders leader ON leader.id = lr.leader_id
      LEFT JOIN employees leader_employee ON leader_employee.id = leader.employee_id
      LEFT JOIN state request_state ON request_state.id = lr.state_id
      ${leaderUserId ? 'WHERE leader_employee.user_id = ?' : ''}
      ORDER BY lr.created_at DESC
      LIMIT ?
    `,
    leaderUserId ? [Number(leaderUserId), Number(limit)] : [Number(limit)]
  );
}

export async function findLeaveRequestById(id) {
  const rejectionObservation = await rejectionObservationSelect();
  const traceability = await traceabilitySelect();
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
        lr.reason,
        lr.attachment_url,
        lr.status,
        lr.created_at,
        ${traceability},
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
        ${rejectionObservation},
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
  const rejectionObservation = await rejectionObservationSelect();
  const traceability = await traceabilitySelect();
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
        lr.reason,
        lr.attachment_url,
        lr.status,
        lr.created_at,
        ${traceability},
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
        ${rejectionObservation},
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
  const rejectionObservation = await rejectionObservationSelect();
  const traceability = await traceabilitySelect();
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
        lr.reason,
        lr.attachment_url,
        lr.status,
        lr.created_at,
        ${traceability},
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
        ${rejectionObservation},
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

export async function reviewLeaveRequest({ id, action, role, userId, userName, observation }) {
  const rows = await query(
    `SELECT lr.id, lr.leader_id, s.code AS state_code
     FROM leave_requests lr
     LEFT JOIN state s ON s.id = lr.state_id
     WHERE lr.id = ? LIMIT 1`,
    [Number(id)]
  );
  const request = rows?.[0];
  if (!request) return { error: 'Novedad no encontrada', status: 404 };

  if (role === 'leader') {
    const assignedLeader = await query(
      `SELECT 1
       FROM leaders l
       INNER JOIN employees leader_employee ON leader_employee.id = l.employee_id
       WHERE l.id = ? AND leader_employee.user_id = ?
       LIMIT 1`,
      [request.leader_id, Number(userId)]
    );
    if (!assignedLeader.length) return { error: 'No tienes permiso para revisar esta novedad', status: 403 };
  }

  if (action === 'reject' && !String(observation || '').trim()) {
    return { error: 'La observación es obligatoria al rechazar una novedad', status: 400 };
  }

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
  const traceabilityColumns = await getTraceabilityColumns();
  const traceabilityUpdates = [];
  const traceabilityParams = [];
  if (traceabilityColumns.has('leader_approved_at')) {
    traceabilityUpdates.push('leader_approved_at = CASE WHEN ? THEN NOW() ELSE leader_approved_at END');
    traceabilityParams.push(role === 'leader' && action === 'approve');
  }
  if (traceabilityColumns.has('leader_approved_by_name')) {
    traceabilityUpdates.push('leader_approved_by_name = CASE WHEN ? THEN ? ELSE leader_approved_by_name END');
    traceabilityParams.push(role === 'leader' && action === 'approve', userName || null);
  }
  if (traceabilityColumns.has('completed_at')) {
    traceabilityUpdates.push('completed_at = CASE WHEN ? THEN NOW() ELSE completed_at END');
    traceabilityParams.push(role === 'hr' && action === 'approve');
  }
  if (traceabilityColumns.has('completed_by_name')) {
    traceabilityUpdates.push('completed_by_name = CASE WHEN ? THEN ? ELSE completed_by_name END');
    traceabilityParams.push(role === 'hr' && action === 'approve', userName || null);
  }
  await query(
    `UPDATE leave_requests
     SET state_id = (SELECT id FROM state WHERE code = ? LIMIT 1),
         status = ?,
         rejected_by_user_id = CASE WHEN ? THEN ? ELSE rejected_by_user_id END,
         rejected_by_name = CASE WHEN ? THEN ? ELSE rejected_by_name END,
         rejected_by_role = CASE WHEN ? THEN ? ELSE rejected_by_role END,
         rejected_at = CASE WHEN ? THEN NOW() ELSE rejected_at END
            ,rejection_observation = CASE WHEN ? THEN ? ELSE rejection_observation END,
            leader_approved_at = CASE WHEN ? THEN NOW() ELSE leader_approved_at END,
            leader_approved_by_name = CASE WHEN ? THEN ? ELSE leader_approved_by_name END,
                ${traceabilityUpdates.length ? `,${traceabilityUpdates.join(',\n         ')}` : ''}
     WHERE id = ?`,
              [transition.to, transition.legacy, isRejection, Number(userId) || null, isRejection, userName || null, isRejection, role, isRejection, isRejection, String(observation || '').trim() || null, ...traceabilityParams, Number(id)]
  );
  return { id: Number(id), state: transition.to, action, rejectedBy: isRejection ? userName : null, observation: isRejection ? String(observation).trim() : null };
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

export async function countLeaveRequestsByLeader(leaderUserId, status = null) {
  const statusClause = status ? 'AND lr.status = ?' : '';
  const params = status ? [Number(leaderUserId), status] : [Number(leaderUserId)];
  const rows = await query(
    `SELECT COUNT(*) AS total
     FROM leave_requests lr
     INNER JOIN leaders l ON l.id = lr.leader_id
     INNER JOIN employees leader_employee ON leader_employee.id = l.employee_id
     WHERE leader_employee.user_id = ? ${statusClause}`,
    params
  );
  return Number(rows?.[0]?.total ?? 0);
}
