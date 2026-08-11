import { AppError } from '@/lib/errors/AppError';
import { okResponse, errorResponse } from '@/lib/utils/api-response';
import { createUserAccount, listUsers } from '@/services/users/user.service';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 100);
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';

    const { users } = await listUsers({ limit, search, role });

    return Response.json(okResponse(users, { total: users.length }));
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }

    return Response.json(errorResponse('Error al consultar usuarios', 500), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const newUser = await createUserAccount(body);

    return Response.json(okResponse(newUser, { message: 'Usuario creado correctamente' }), { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorResponse(error.message, error.status), { status: error.status });
    }

    return Response.json(errorResponse('Error al crear el usuario', 500), { status: 500 });
  }
}
