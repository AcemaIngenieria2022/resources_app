import { createContext, useContext } from 'react';

// Contexto de notificaciones para compartir mensajes, alertas o eventos globales.
const NotificationContext = createContext([]);

// Proveedor mínimo que expone el contexto de notificaciones a la aplicación.
export const NotificationProvider = ({ children }) => {
  return <NotificationContext.Provider value={[]}>{children}</NotificationContext.Provider>;
};

export const useNotificationContext = () => useContext(NotificationContext);

export default NotificationContext;
