import { AppError } from '@/lib/errors/AppError';
import {
  createUser,
  assignRoleToUser,
  findUserByEmail,
  getRoleIdByName,
} from '@/lib/repositories/user.repository';
import passwordUtils from '@/lib/security/password';

export async function loginUser({ email, password }) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new AppError('Credenciales inválidas', 401);
  }

  const status = user.status || (user.active === 1 || user.active === true ? 'active' : 'disabled');
  if (status !== 'active') {
    throw new AppError('Usuario inactivo', 403);
  }

  const isPasswordValid = passwordUtils.verifyPassword(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Credenciales inválidas', 401);
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
  };
}

export async function registerUser({ email, password, firstName = '', lastName = '', role = 'user' }) {
  const existing = await findUserByEmail(email);

  if (existing) {
    throw new AppError('El correo ya está registrado', 409);
  }

  const allowedRoles = ['admin', 'hr', 'supervisor', 'approver', 'user'];

  if (!allowedRoles.includes(role)) {
    throw new AppError('Rol inválido', 400);
  }

  const user = await createUser({
    email,
    password,
    role,
    firstName,
    lastName,
  });

  const roleId = await getRoleIdByName('user');

  if (roleId) {
    await assignRoleToUser(user.id, roleId);
  }

  return user;
}

export const authService = {
  loginUser,
  registerUser,
};

export default authService;
