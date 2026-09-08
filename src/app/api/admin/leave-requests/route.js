import { okResponse, errorResponse } from '@/lib/utils/api-response';
import * as leaveRequestService from '@/services/leave-requests/leave-request.service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit') || 100;

    let data;

    if (role === 'leader') {
      data = await leaveRequestService.getAllLeaveRequests(Number(limit), Number(userId));
      if (status) {
        data = data.filter((request) => request.status === status || request.state_code === String(status).toLowerCase());
      }
    } else if (status) {
      data = await leaveRequestService.getLeaveRequestsByStatus(status);
    } else if (employeeId) {
      data = await leaveRequestService.getLeaveRequestsByEmployeeId(Number(employeeId));
    } else {
      data = await leaveRequestService.getAllLeaveRequests(Number(limit), role === 'leader' ? Number(userId) : null);
    }

    return Response.json(okResponse(data, { message: 'Novedades obtenidas correctamente' }));
  } catch (error) {
    console.error('Error en GET /api/admin/leave-requests:', error);
    return Response.json(errorResponse(error.message || 'Error interno', 500), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, id, status, reviewAction, role, userId, userName, observation } = body;

    if (action === 'review') {
      if (!id || !['approve', 'reject'].includes(reviewAction) || !['leader', 'hr'].includes(role)) {
        return Response.json(errorResponse('Datos de revisión inválidos', 400), { status: 400 });
      }
      const result = await leaveRequestService.reviewRequest({ id, action: reviewAction, role, userId, userName, observation });
      return Response.json(okResponse(result, { message: 'Revisión registrada correctamente' }));
    }

    if (action === 'update-status') {
      if (!id || !status) {
        return Response.json(errorResponse('ID y estado son requeridos', 400), { status: 400 });
      }
      const result = await leaveRequestService.updateStatus(id, status);
      return Response.json(okResponse(result, { message: 'Estado actualizado correctamente' }));
    }

    if (action === 'delete') {
      if (!id) {
        return Response.json(errorResponse('ID es requerido', 400), { status: 400 });
      }
      if (!['admin', 'hr', 'rrhh'].includes(String(role || '').toLowerCase())) {
        return Response.json(errorResponse('Solo administradores y RR. HH. pueden eliminar novedades', 403), { status: 403 });
      }
      const result = await leaveRequestService.deleteLeaveRequest(id);
      return Response.json(okResponse(result, { message: 'Novedad eliminada correctamente' }));
    }

    if (action === 'statistics') {
      const stats = await leaveRequestService.getStatistics({
        leaderUserId: role === 'leader' ? Number(userId) : null,
      });
      return Response.json(okResponse(stats, { message: 'Estadísticas obtenidas' }));
    }

    return Response.json(errorResponse('Acción no válida', 400), { status: 400 });
  } catch (error) {
    console.error('Error en POST /api/admin/leave-requests:', error);
    return Response.json(errorResponse(error.message || 'Error interno', 500), { status: 500 });
  }
}
