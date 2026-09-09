import { createContext, useContext } from 'react';

// Contexto adicional para compartir datos del usuario en componentes no autenticados.
const UserContext = createContext(null);

// Proveedor placeholder para mantener una estructura consistente con el resto de providers.
export const UserProvider = ({ children }) => {
  return <UserContext.Provider value={{ user: null }}>{children}</UserContext.Provider>;
};

export const useUserContext = () => useContext(UserContext);

export default UserContext;
