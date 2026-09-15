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
    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/microsoft/session', { cache: 'no-store' });
        const payload = await response.json();
        if (response.ok && payload?.authenticated) {
          setUser(payload.user);
          window.localStorage.setItem('authUser', JSON.stringify(payload.user));
          setHydrated(true);
          return;
        }

        const stored = window.localStorage.getItem('authUser');
        setUser(stored ? JSON.parse(stored) : null);
      } catch (error) {
        console.error('Error loading auth session', error);
        try {
          const stored = window.localStorage.getItem('authUser');
          setUser(stored ? JSON.parse(stored) : null);
        } catch {
          setUser(null);
        }
      } finally {
        setHydrated(true);
      }
    };

    void loadSession();
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
    void fetch('/api/auth/microsoft/logout', { method: 'POST' }).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hydrated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);

export default AuthContext;
