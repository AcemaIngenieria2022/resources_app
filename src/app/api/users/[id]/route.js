import { AppError } from '@/lib/errors/AppError';
import { okResponse, errorResponse } from '@/lib/utils/api-response';
import { updateUserAccount } from '@/services/users/user.service';

export async function PATCH(request, context) {
  try {
    const body = await request.json();
    const params = await context.params;
    const id = params.id;
    const updatedUser = await updateUserAccount(id, {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
      status: body.status,
    });

    return Response.json(okResponse(updatedUser));
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }

    return Response.json(errorResponse('Error al actualizar el usuario', 500), { status: 500 });
  }
}
