import { AppError } from '@/lib/errors/AppError';
import { okResponse, errorResponse } from '@/lib/utils/api-response';
import { registerUser } from '@/services/auth/auth.service';

export async function POST(request) {
  try {
    const body = await request.json();
    const user = await registerUser({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
    });

    return Response.json(okResponse(user), { status: 201 });
  } catch (error) {
    console.error('Register API error:', error);
    console.error(error?.stack ?? 'no stack');

    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }

    return Response.json(errorResponse('Error al registrar el usuario', 500), { status: 500 });
  }
}
