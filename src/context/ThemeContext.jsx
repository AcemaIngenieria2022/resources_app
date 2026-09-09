import { createContext, useContext } from 'react';

// Contexto para controlar el tema visual de la aplicación.
const ThemeContext = createContext('light');

// Proveedor actual de tema; en este punto se mantiene con valor fijo para conservar compatibilidad.
export const ThemeProvider = ({ children }) => {
  return <ThemeContext.Provider value="light">{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => useContext(ThemeContext);

export default ThemeContext;
