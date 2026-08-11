import { PERMISSIONS } from '@/lib/constants/permissions';

export const hasPermission = (user, permission) => {
  const allowed = user?.permissions ?? [];
  return allowed.includes(permission) || allowed.includes(PERMISSIONS.READ_USERS);
};

export default hasPermission;
