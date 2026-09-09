import { useAuthContext } from '@/context/AuthContext';

// Hook reutilizable para consumir el contexto de autenticación con una propiedad booleana extra.
export const useAuth = () => {
  const auth = useAuthContext();
  return {
    ...auth,
    isAuthenticated: !!auth?.user,
  };
};

export default useAuth;
