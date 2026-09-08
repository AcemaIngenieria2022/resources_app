import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { query } from '@/lib/db/mysql';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const EXTENSIONS = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png' };
const attempts = new Map();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

function rateLimited(request) {
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  recent.push(now);
  attempts.set(key, recent);
  return recent.length > MAX_ATTEMPTS;
}

async function hasValidSignature(file) {
  const bytes = new Uint8Array(await file.arrayBuffer()).subarray(0, 8);
  if (file.type === 'application/pdf') return String.fromCharCode(...bytes) === '%PDF-';
  if (file.type === 'image/png') return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export async function POST(request) {
  if (rateLimited(request)) return Response.json({ error: 'Demasiadas solicitudes. Intenta nuevamente en un minuto.' }, { status: 429 });
  let savedPath;

  try {
    const form = await request.formData();
    const documentNumber = String(form.get('identification_id') || '').trim();
    const leaveClass = String(form.get('leave_class') || '').trim();
    const permissionType = String(form.get('permission_type') || '').trim();
    const startDate = String(form.get('start_date') || '').trim() || null;
    const endDate = String(form.get('end_date') || '').trim() || null;
    const permissionDate = String(form.get('permission_date') || '').trim() || null;
    const startTime = String(form.get('start_time') || '').trim() || null;
    const endTime = String(form.get('end_time') || '').trim() || null;
    const reason = String(form.get('reason') || '').trim();
    const calculatedTotalDays = permissionType === 'days' && startDate && endDate
      ? (new Date(`${endDate}T00:00:00Z`) - new Date(`${startDate}T00:00:00Z`)) / 86400000 + 1
      : null;
    const calculatedTotalHours = permissionType === 'hours' && startTime && endTime
      ? (new Date(`1970-01-01T${endTime}:00Z`) - new Date(`1970-01-01T${startTime}:00Z`)) / 3600000
      : null;
    const phone = String(form.get('phone') || '').trim();
    const email = String(form.get('email') || '').trim();
    const file = form.get('attachment');

    if (!/^\d{4,20}$/.test(documentNumber) || !/^\d{7,15}$/.test(phone) || !leaveClass || !reason || !['days', 'hours'].includes(permissionType) || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Completa los campos obligatorios correctamente.' }, { status: 400 });
    }
    if (permissionType === 'days' && (!startDate || !endDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < startDate || !Number.isFinite(calculatedTotalDays) || calculatedTotalDays <= 0)) {
      return Response.json({ error: 'Indica correctamente el rango de fechas.' }, { status: 400 });
    }
    if (permissionType === 'hours' && (!permissionDate || !/^\d{4}-\d{2}-\d{2}$/.test(permissionDate) || !startTime || !endTime || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime) || endTime <= startTime || !Number.isFinite(calculatedTotalHours) || calculatedTotalHours <= 0)) {
      return Response.json({ error: 'Indica correctamente la fecha y el horario.' }, { status: 400 });
    }
    if (file !== null && !(file instanceof File)) {
      return Response.json({ error: 'El documento soporte no es válido.' }, { status: 400 });
    }
    if (file instanceof File && (file.size > MAX_FILE_SIZE || file.size > 0 && (!ALLOWED_TYPES.has(file.type) || !(await hasValidSignature(file))))) {
      return Response.json({ error: 'El archivo debe ser PDF, JPG o PNG y pesar máximo 5 MB.' }, { status: 400 });
    }

    const employees = await query(`
                  SELECT e.id, e.personName, d.name AS department_name, p.name AS position_name, assigned_leader.id AS leader_id,
              leader_employee.personName AS leader_name
                  FROM employee_documents ed
                  INNER JOIN employees e ON e.id = ed.employee_id
              LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN positions p ON p.id = e.position_id
      LEFT JOIN leader_employees le ON le.employee_id = e.id AND le.active = 1
      LEFT JOIN leaders assigned_leader ON assigned_leader.id = le.leader_id
      LEFT JOIN employees leader_employee ON leader_employee.id = assigned_leader.employee_id
                  WHERE ed.document_number = ? AND e.active = 1
      LIMIT 1
    `, [documentNumber]);
    const employee = employees[0];
    if (!employee) return Response.json({ error: 'El colaborador no pudo ser validado.' }, { status: 404 });
    if (!employee.leader_id) return Response.json({ error: 'El colaborador no tiene un jefe directo asignado.' }, { status: 409 });

    let storedName = null;
    if (file instanceof File && file.size > 0) {
      const directory = path.join(process.cwd(), 'storage', 'uploads', 'permisos');
      await fs.mkdir(directory, { recursive: true });
      storedName = `${randomUUID()}${EXTENSIONS[file.type]}`;
      savedPath = path.join(directory, storedName);
      await fs.writeFile(savedPath, Buffer.from(await file.arrayBuffer()));
    }

    const result = await query(`
      INSERT INTO leave_requests
        (employee_id, form_full_name, form_email, identification_id, form_position,
         form_phone, direct_supervisor, leave_class, permission_type, start_date,
        end_date, permission_date, total_days, total_hours, start_time, end_time, reason,
         attachment_url, leader_id, state_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT id FROM state WHERE code = 'created' LIMIT 1), 'Pending')
    `, [employee.id, employee.personName, email, documentNumber, employee.position_name || 'Sin cargo', phone, employee.leader_name || null, leaveClass, permissionType, startDate, endDate, permissionDate, calculatedTotalDays, calculatedTotalHours, startTime, endTime, reason, storedName, employee.leader_id || null]);

    return Response.json({ data: { id: result.insertId }, message: 'Novedad registrada correctamente.' }, { status: 201 });
  } catch (error) {
    if (savedPath) await fs.unlink(savedPath).catch(() => {});
    console.error('Error en POST /api/leave-requests/public:', error);
    return Response.json({ error: 'No fue posible registrar la novedad.' }, { status: 500 });
  }
}
