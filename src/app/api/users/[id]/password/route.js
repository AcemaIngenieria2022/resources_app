import { AppError } from '@/lib/errors/AppError';
import { okResponse, errorResponse } from '@/lib/utils/api-response';
import { changeUserPassword, resetUserPassword } from '@/services/users/user.service';

export async function PATCH(request, context) {
  try {
    const body = await request.json();
    const params = await context.params;
    const id = params.id;

    const { oldPassword, newPassword } = body || {};
    if (!newPassword) {
      throw new AppError('La nueva contraseña es obligatoria', 400);
    }

    let result;
    if (oldPassword) {
      result = await changeUserPassword(id, oldPassword, newPassword);
    } else {
      // Admin reset: require server admin token when configured
      const adminTokenHeader = request.headers.get('x-admin-token');
      const configured = process.env.ADMIN_TOKEN;
      if (configured && adminTokenHeader !== configured) {
        throw new AppError('No autorizado', 401);
      }

      result = await resetUserPassword(id, newPassword);
    }

    return Response.json(okResponse(result, { message: 'Contraseña actualizada' }));
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }

    return Response.json(errorResponse('Error al cambiar la contraseña', 500), { status: 500 });
  }
}
