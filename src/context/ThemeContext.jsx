import { createContext, useContext } from 'react';

const ThemeContext = createContext('light');

export const ThemeProvider = ({ children }) => {
  return <ThemeContext.Provider value="light">{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => useContext(ThemeContext);

export default ThemeContext;
