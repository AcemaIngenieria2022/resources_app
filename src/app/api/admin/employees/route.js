import { AppError } from '@/lib/errors/AppError';
import { okResponse, errorResponse } from '@/lib/utils/api-response';
import * as empService from '@/services/employees/employee.service';

export async function GET() {
  try {
    const { employees, total } = await empService.listEmployees({ limit: 500 });
    return Response.json(okResponse(employees, { total }));
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }
    return Response.json(errorResponse('Error al listar empleados', 500), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const action = body.action || 'add';

    if (action === 'add') {
      const res = await empService.addEmployee({
        employeedID: body.employeedID,
        personName: body.personName,
        department_id: body.department_id,
        position_id: body.position_id,
        role_id: body.role_id,
        user_id: body.user_id,
        active: body.active !== false,
      });
      return Response.json(okResponse({ id: res.id }, { message: 'Empleado creado', status: 'success' }));
    }

    if (action === 'update') {
      await empService.editEmployee(body.id, {
        personName: body.personName,
        department_id: body.department_id,
        position_id: body.position_id,
        role_id: body.role_id,
        user_id: body.user_id,
        active: body.active,
      });
      return Response.json(okResponse(null, { message: 'Empleado actualizado', status: 'success' }));
    }

    if (action === 'delete') {
      await empService.removeEmployee(body.id);
      return Response.json(okResponse(null, { message: 'Empleado eliminado', status: 'success' }));
    }

    return Response.json(errorResponse('Acción inválida', 400), { status: 400 });
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }
    return Response.json(errorResponse('Error en operación de empleados', 500), { status: 500 });
  }
}
