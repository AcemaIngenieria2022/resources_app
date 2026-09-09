import { query } from '@/lib/db/mysql';

// Repositorio para gestionar los documentos asociados a cada colaborador.
export async function findAllCollaboratorDocuments(limit = 50) {
  return query(
    `
      SELECT
        cd.id,
        cd.employee_id,
        cd.document_number,
        cd.created_at,
        e.personName,
        e.employeedID
      FROM employee_documents cd
      JOIN employees e ON cd.employee_id = e.id
      ORDER BY cd.created_at DESC
      LIMIT ?
    `,
    [Number(limit)]
  );
}

export async function findDocumentsByEmployeeId(employee_id) {
  return query(
    `
      SELECT
        cd.id,
        cd.employee_id,
        cd.document_number,
        cd.created_at,
        e.personName,
        e.employeedID
      FROM employee_documents cd
      JOIN employees e ON cd.employee_id = e.id
      WHERE cd.employee_id = ?
      ORDER BY cd.created_at DESC
    `,
    [Number(employee_id)]
  );
}

export async function findDocumentById(id) {
  const rows = await query(
    `
      SELECT
        cd.id,
        cd.employee_id,
        cd.document_number,
        cd.created_at,
        e.personName,
        e.employeedID
      FROM employee_documents cd
      JOIN employees e ON cd.employee_id = e.id
      WHERE cd.id = ?
      LIMIT 1
    `,
    [Number(id)]
  );

  return rows?.[0] ?? null;
}

export async function createCollaboratorDocument({ employee_id, document_number }) {
  const result = await query(
    `INSERT INTO employee_documents (employee_id, document_number, created_at)
     VALUES (?, ?, NOW())`,
    [Number(employee_id), document_number]
  );
  return { insertId: result.insertId };
}

export async function updateCollaboratorDocument(id, { document_number }) {
  const result = await query(
    `UPDATE employee_documents SET document_number = ? WHERE id = ?`,
    [document_number, Number(id)]
  );
  return result;
}

export async function deleteCollaboratorDocument(id) {
  const result = await query(
    `DELETE FROM employee_documents WHERE id = ?`,
    [Number(id)]
  );
  return result;
}

export async function countDocuments() {
  const rows = await query('SELECT COUNT(*) AS total FROM employee_documents');
  return Number(rows?.[0]?.total ?? 0);
}

export async function documentNumberExists(document_number, excludeId = null) {
  const rows = await query(
    `SELECT COUNT(*) AS total FROM employee_documents WHERE document_number = ? ${excludeId ? 'AND id != ?' : ''}`,
    excludeId ? [document_number, Number(excludeId)] : [document_number]
  );
  return Number(rows?.[0]?.total ?? 0) > 0;
}
