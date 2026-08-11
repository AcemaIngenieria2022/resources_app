import { AppError } from '@/lib/errors/AppError';
import { okResponse, errorResponse } from '@/lib/utils/api-response';
import { listEmployees } from '@/services/employees/employee.service';

export async function GET() {
  try {
    const { employees, total } = await listEmployees({ limit: 50 });

    return Response.json(
      okResponse(employees, {
        total,
        source: 'mysql',
      })
    );
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }

    return Response.json(errorResponse('Error al consultar empleados', 500), { status: 500 });
  }
}
