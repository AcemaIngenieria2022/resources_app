import { AppError } from '@/lib/errors/AppError';
import { okResponse, errorResponse } from '@/lib/utils/api-response';
import * as posService from '@/services/admin/position.service';

// GET: obtiene la lista de cargos disponibles para la administración.
export async function GET() {
  try {
    const { positions, total } = await posService.listPositions({ limit: 500 });
    return Response.json(okResponse(positions, { total }));
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }
    return Response.json(errorResponse('Error al listar cargos', 500), { status: 500 });
  }
}

// POST: ejecuta las acciones add, update y delete para mantener los cargos del sistema.
export async function POST(request) {
  try {
    const body = await request.json();
    const action = body.action || 'add';

    if (action === 'add') {
      const res = await posService.createPosition(body);
      return Response.json(okResponse({ id: res.id }, { message: 'Cargo creado', status: 'success' }));
    }

    if (action === 'update') {
      await posService.updatePosition(body.id, body);
      return Response.json(okResponse(null, { message: 'Cargo actualizado', status: 'success' }));
    }

    if (action === 'delete') {
      await posService.removePosition(body.id);
      return Response.json(okResponse(null, { message: 'Cargo eliminado', status: 'success' }));
    }

    return Response.json(errorResponse('Acción inválida', 400), { status: 400 });
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }
    return Response.json(errorResponse('Error en operación de cargos', 500), { status: 500 });
  }
}
