import { query } from '@/lib/db/mysql';

const attempts = new Map();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

function getClientKey(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function isRateLimited(key) {
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  recent.push(now);
  attempts.set(key, recent);
  return recent.length > MAX_ATTEMPTS;
}

export async function POST(request) {
  const key = getClientKey(request);
  if (isRateLimited(key)) {
    return Response.json({ error: 'Demasiados intentos. Intenta nuevamente en un minuto.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const documentNumber = String(body?.identification_id || '').trim();
    if (!/^[0-9A-Za-z.-]{4,50}$/.test(documentNumber)) {
      return Response.json({ error: 'Ingresa un número de documento válido.' }, { status: 400 });
    }

    const rows = await query(`
            SELECT e.id, e.personName, d.name AS department_name, p.name AS position_name,
              ed.document_number AS identification_id,
              u.email,
             assigned_leader.id AS leader_id,
              leader_employee.personName AS leader_name
      FROM employee_documents ed
      INNER JOIN employees e ON e.id = ed.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN positions p ON p.id = e.position_id
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN leader_employees le ON le.employee_id = e.id AND le.active = 1
      LEFT JOIN leaders assigned_leader ON assigned_leader.id = le.leader_id
      LEFT JOIN employees leader_employee ON leader_employee.id = assigned_leader.employee_id
      WHERE ed.document_number = ? AND e.active = 1
      LIMIT 1
    `, [documentNumber]);

    if (!rows[0]) return Response.json({ error: 'No encontramos un colaborador con ese documento.' }, { status: 404 });
    if (!rows[0].leader_id) return Response.json({ error: 'El colaborador no tiene un jefe directo asignado.' }, { status: 409 });
    return Response.json({ data: rows[0] });
  } catch (error) {
    console.error('Error en POST /api/employees/validate:', error);
    return Response.json({ error: 'No fue posible validar el documento.' }, { status: 500 });
  }
}
