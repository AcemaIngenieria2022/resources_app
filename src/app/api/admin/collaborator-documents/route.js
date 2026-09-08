import { AppError } from '@/lib/errors/AppError';
import { okResponse, errorResponse } from '@/lib/utils/api-response';
import * as docService from '@/services/collaborators/collaborator-document.service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (employeeId) {
      const documents = await docService.getDocumentsByEmployeeId(employeeId);
      return Response.json(okResponse(documents));
    }

    const { documents, total } = await docService.listCollaboratorDocuments({ limit: 500 });
    return Response.json(okResponse(documents, { total }));
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }
    return Response.json(errorResponse('Error al listar documentos', 500), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const action = body.action || 'add';

    if (action === 'add') {
      const res = await docService.addCollaboratorDocument({
        employee_id: body.employee_id,
        document_number: body.document_number,
      });
      return Response.json(okResponse({ id: res.id }, { message: 'Documento agregado', status: 'success' }));
    }

    if (action === 'update') {
      await docService.editCollaboratorDocument(body.id, {
        document_number: body.document_number,
      });
      return Response.json(okResponse(null, { message: 'Documento actualizado', status: 'success' }));
    }

    if (action === 'delete') {
      await docService.removeCollaboratorDocument(body.id);
      return Response.json(okResponse(null, { message: 'Documento eliminado', status: 'success' }));
    }

    return Response.json(errorResponse('Acción inválida', 400), { status: 400 });
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }
    return Response.json(errorResponse('Error en operación de documentos', 500), { status: 500 });
  }
}
