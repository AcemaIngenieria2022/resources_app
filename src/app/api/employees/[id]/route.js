import { AppError } from '@/lib/errors/AppError';
import { okResponse, errorResponse } from '@/lib/utils/api-response';
import { getEmployeeById } from '@/services/employees/employee.service';

export async function GET(request, context) {
  try {
    const params = await context.params;
    const employee = await getEmployeeById(params.id);

    return Response.json(okResponse(employee));
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }

    return Response.json(errorResponse('Error al consultar el empleado', 500), { status: 500 });
  }
}
