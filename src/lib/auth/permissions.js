import { PERMISSIONS } from '@/lib/constants/permissions';

// Evalúa si el usuario actual tiene un permiso específico o el permiso base de lectura.
export const hasPermission = (user, permission) => {
  const allowed = user?.permissions ?? [];
  return allowed.includes(permission) || allowed.includes(PERMISSIONS.READ_USERS);
};

export default hasPermission;
