import { AppError } from '@/lib/errors/AppError';
import { okResponse, errorResponse } from '@/lib/utils/api-response';
import * as deptService from '@/services/admin/department.service';

// API para listar departamentos registrados en el sistema.
export async function GET() {
  try {
    const { departments, total } = await deptService.listDepartments({ limit: 500 });
    return Response.json(okResponse(departments, { total }));
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }
    return Response.json(errorResponse('Error al listar departamentos', 500), { status: 500 });
  }
}

// API para crear, actualizar o eliminar departamentos según la acción recibida desde el cliente.
export async function POST(request) {
  try {
    const body = await request.json();
    const action = body.action || 'add';

    if (action === 'add') {
      const res = await deptService.createDepartment(body);
      return Response.json(okResponse({ id: res.id }, { message: 'Departamento creado', status: 'success' }));
    }

    if (action === 'update') {
      await deptService.updateDepartment(body.id, body);
      return Response.json(okResponse(null, { message: 'Departamento actualizado', status: 'success' }));
    }

    if (action === 'delete') {
      await deptService.removeDepartment(body.id);
      return Response.json(okResponse(null, { message: 'Departamento eliminado', status: 'success' }));
    }

    return Response.json(errorResponse('Acción inválida', 400), { status: 400 });
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }
    return Response.json(errorResponse('Error en operación de departamentos', 500), { status: 500 });
  }
}
