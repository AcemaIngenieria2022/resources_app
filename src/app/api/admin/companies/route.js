import { AppError } from '@/lib/errors/AppError';
import { okResponse, errorResponse } from '@/lib/utils/api-response';
import * as companyService from '@/services/admin/company.service';

export async function GET() {
  try {
    const { companies, total } = await companyService.listCompanies({ limit: 500 });
    return Response.json(okResponse(companies, { total }));
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }
    return Response.json(errorResponse('Error al listar empresas', 500), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const action = body.action || 'add';

    if (action === 'add') {
      const result = await companyService.createCompany(body);
      return Response.json(okResponse({ id: result.id }, { message: 'Empresa creada', status: 'success' }));
    }

    if (action === 'update') {
      await companyService.updateCompany(body.id, body);
      return Response.json(okResponse(null, { message: 'Empresa actualizada', status: 'success' }));
    }

    if (action === 'delete') {
      await companyService.removeCompany(body.id);
      return Response.json(okResponse(null, { message: 'Empresa eliminada', status: 'success' }));
    }

    return Response.json(errorResponse('Acción inválida', 400), { status: 400 });
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }
    return Response.json(errorResponse('Error en operación de empresas', 500), { status: 500 });
  }
}
