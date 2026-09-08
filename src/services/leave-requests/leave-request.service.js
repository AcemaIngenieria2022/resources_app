import * as leaveRequestRepository from '@/lib/repositories/leave-request.repository';
import { AppError } from '@/lib/errors/AppError';
import { reviewLeaveRequest } from '@/lib/repositories/leave-request.repository';

export async function getAllLeaveRequests(limit = 100) {
  try {
    const leaveRequests = await leaveRequestRepository.findAllLeaveRequests(limit);
    return leaveRequests;
  } catch (error) {
    throw new AppError('Error al obtener novedades', 500);
  }
}

export async function getLeaveRequestById(id) {
  try {
    const leaveRequest = await leaveRequestRepository.findLeaveRequestById(id);
    if (!leaveRequest) {
      throw new AppError('Novedad no encontrada', 404);
    }
    return leaveRequest;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error al obtener novedad', 500);
  }
}

export async function getLeaveRequestsByEmployeeId(employee_id) {
  try {
    const leaveRequests = await leaveRequestRepository.findLeaveRequestsByEmployeeId(employee_id);
    return leaveRequests;
  } catch (error) {
    throw new AppError('Error al obtener novedades del empleado', 500);
  }
}

export async function getLeaveRequestsByStatus(status) {
  try {
    const leaveRequests = await leaveRequestRepository.findLeaveRequestsByStatus(status);
    return leaveRequests;
  } catch (error) {
    throw new AppError('Error al obtener novedades por estado', 500);
  }
}

export async function updateStatus(id, status) {
  try {
    // Validar status válidos
    const validStatuses = ['Pending', 'Approved', 'Rejected', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Estado inválido', 400);
    }

    const leaveRequest = await leaveRequestRepository.findLeaveRequestById(id);
    if (!leaveRequest) {
      throw new AppError('Novedad no encontrada', 404);
    }

    await leaveRequestRepository.updateLeaveRequestStatus(id, status);
    return { id, status };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error al actualizar estado', 500);
  }
}

export async function reviewRequest({ id, action, role, userId, userName }) {
  const result = await reviewLeaveRequest({ id, action, role, userId, userName });
  if (result.error) throw new AppError(result.error, result.status);
  return result;
}

export async function deleteLeaveRequest(id) {
  try {
    const leaveRequest = await leaveRequestRepository.findLeaveRequestById(id);
    if (!leaveRequest) {
      throw new AppError('Novedad no encontrada', 404);
    }

    await leaveRequestRepository.deleteLeaveRequest(id);
    return { id };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error al eliminar novedad', 500);
  }
}

export async function getStatistics() {
  try {
    const total = await leaveRequestRepository.countLeaveRequests();
    const pending = await leaveRequestRepository.countLeaveRequestsByStatus('Pending');
    const approved = await leaveRequestRepository.countLeaveRequestsByStatus('Approved');
    const rejected = await leaveRequestRepository.countLeaveRequestsByStatus('Rejected');

    return {
      total,
      pending,
      approved,
      rejected,
      cancelled: total - pending - approved - rejected,
    };
  } catch (error) {
    throw new AppError('Error al obtener estadísticas', 500);
  }
}
