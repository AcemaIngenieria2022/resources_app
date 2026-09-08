import { AppError } from '@/lib/errors/AppError';
import { createUser, findUsers, updateUser, findUserById, updateUserPassword } from '@/lib/repositories/user.repository';
import passwordUtils from '@/lib/security/password';

export async function listUsers({ limit = 200, search = '', role = '' } = {}) {
  try {
    const users = await findUsers({ limit, search, role });
    return { users };
  } catch (error) {
    throw new AppError('No se pudo obtener la lista de usuarios', 500);
  }
}

export async function createUserAccount(userData) {
  try {
    const user = await createUser(userData);
    if (userData.employeeId !== undefined) {
      await updateUser(user.id, { employeeId: userData.employeeId });
    }
    return user;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('No se pudo crear el usuario', 500);
  }
}

export async function updateUserAccount(id, userData) {
  try {
    const existing = await findUserById(id);
    if (!existing) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const result = await updateUser(id, userData);
    return result;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('No se pudo actualizar el usuario', 500);
  }
}

export async function changeUserPassword(id, oldPassword, newPassword) {
  try {
    const existing = await findUserById(id);
    if (!existing) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const valid = passwordUtils.verifyPassword(oldPassword, existing.password);
    if (!valid) {
      throw new AppError('Contraseña actual incorrecta', 403);
    }

    const result = await updateUserPassword(id, newPassword);
    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('No se pudo cambiar la contraseña', 500);
  }
}

export async function resetUserPassword(id, newPassword) {
  try {
    const existing = await findUserById(id);
    if (!existing) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const result = await updateUserPassword(id, newPassword);
    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('No se pudo restablecer la contraseña', 500);
  }
}

export const userService = {
  listUsers,
  updateUserAccount,
  changeUserPassword,
  resetUserPassword,
};

export default userService;
