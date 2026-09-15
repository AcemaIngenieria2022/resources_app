import { query } from '@/lib/db/mysql';
import { okResponse, errorResponse } from '@/lib/utils/api-response';

export async function GET() {
  try {
    const rows = await query(
      `SELECT code, name
       FROM vacation_payment_types
       WHERE active = 1
       ORDER BY id ASC`
    );

    return Response.json(okResponse(rows, { message: 'Tipos de pago de vacaciones obtenidos correctamente' }));
  } catch (error) {
    console.error('Error en GET /api/vacation-payment-types:', error);
    return Response.json(errorResponse('Error al obtener los tipos de pago de vacaciones', 500), { status: 500 });
  }
}
