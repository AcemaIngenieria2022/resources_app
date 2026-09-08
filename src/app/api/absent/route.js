import { NextResponse } from 'next/server';
import { query, attlogQuery } from '@/lib/db/mysql';

export async function GET(request) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ message: 'La fecha debe tener formato YYYY-MM-DD' }, { status: 400 });
  }

  try {
    const [employees, attendance] = await Promise.all([
      query(`
        SELECT e.id, e.employeedID, e.personName, d.name AS department_name,
               p.name AS position_name
        FROM employees e
        LEFT JOIN departments d ON d.id = e.department_id
        LEFT JOIN positions p ON p.id = e.position_id
        WHERE e.active = 1
        ORDER BY e.personName ASC
      `),
      attlogQuery(`
        SELECT DISTINCT employeedID
        FROM attlog
        WHERE authDate = ?
      `, [date]),
    ]);

    const presentIds = new Set(attendance.map((row) => String(row.employeedID)));
    const absent = employees
      .filter((employee) => !presentIds.has(String(employee.employeedID)))
      .map((employee) => ({ ...employee, absence_date: date }));

    return NextResponse.json(absent);
  } catch (error) {
    console.error('Failed to load absent employees:', error);
    return NextResponse.json(
      { message: 'No se pudieron cargar los ausentes', error: error?.message ?? '' },
      { status: 500 },
    );
  }
}