import { query } from '@/lib/db/mysql';
import { errorResponse, okResponse } from '@/lib/utils/api-response';

export async function GET() {
  try {
    const roles = await query(
      'SELECT id, name, description FROM roles ORDER BY name ASC'
    );
    return Response.json(okResponse(roles));
  } catch (error) {
    console.error('Error al listar roles:', error);
    return Response.json(errorResponse('Error al listar roles', 500), { status: 500 });
  }
}