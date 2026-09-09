"use client";

import { createContext, useContext, useEffect, useState } from 'react';

// Contexto principal para compartir el estado autenticado dentro de la aplicación.
const AuthContext = createContext(null);

// Proveedor que persiste el usuario autenticado en localStorage y expone el estado de hidratación.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState();
  const [hydrated, setHydrated] = useState(false);

  // Carga el usuario guardado al montar el provider para sincronizar el estado con el almacenamiento local.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('authUser');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading auth user from storage', error);
      setUser(null);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Guarda la sesión actual en memoria y persistencia local para reutilizarla en recargas.
  const login = (userData) => {
    setUser(userData);
    window.localStorage.setItem('authUser', JSON.stringify(userData));
  };

  // Elimina el usuario activo de la sesión y del almacenamiento local.
  const logout = () => {
    setUser(null);
    window.localStorage.removeItem('authUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hydrated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);

export default AuthContext;
