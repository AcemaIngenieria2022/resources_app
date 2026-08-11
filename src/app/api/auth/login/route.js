import { AppError } from '@/lib/errors/AppError';
import { okResponse, errorResponse } from '@/lib/utils/api-response';
import { loginUser } from '@/services/auth/auth.service';

export async function POST(request) {
  try {
    const body = await request.json();
    const user = await loginUser({
      email: body.email,
      password: body.password,
    });

    return Response.json(okResponse(user));
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }

    console.error('LOGIN ERROR:', error);
    return Response.json(errorResponse('Error al iniciar sesión', 500), { status: 500 });
  }
}
