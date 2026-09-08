import * as leaveRequestRepository from '@/lib/repositories/leave-request.repository';
import { AppError } from '@/lib/errors/AppError';
import { reviewLeaveRequest } from '@/lib/repositories/leave-request.repository';

export async function getAllLeaveRequests(limit = 100, leaderUserId = null) {
  try {
    const leaveRequests = await leaveRequestRepository.findAllLeaveRequests(limit, leaderUserId);
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

export async function reviewRequest({ id, action, role, userId, userName, observation }) {
  const result = await reviewLeaveRequest({ id, action, role, userId, userName, observation });
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

export async function getStatistics({ leaderUserId = null } = {}) {
  try {
    const count = leaderUserId
      ? (status) => leaveRequestRepository.countLeaveRequestsByLeader(leaderUserId, status)
      : (status) => leaveRequestRepository.countLeaveRequestsByStatus(status);
    const total = leaderUserId
      ? await leaveRequestRepository.countLeaveRequestsByLeader(leaderUserId)
      : await leaveRequestRepository.countLeaveRequests();
    const pending = await count('Pending');
    const approved = await count('Approved');
    const rejected = await count('Rejected');
    const expired = await count('Expired');

    return {
      total,
      pending,
      approved,
      rejected,
      expired,
      cancelled: total - pending - approved - rejected - expired,
    };
  } catch (error) {
    throw new AppError('Error al obtener estadísticas', 500);
  }
}
