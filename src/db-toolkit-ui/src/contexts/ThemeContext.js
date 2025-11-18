import { createContext, useContext, useEffect, useState } from 'react';
import { settingsAPI } from '../services/api';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [settingsTheme, setSettingsTheme] = useState('auto');

  useEffect(() => {
    // Load theme from settings
    settingsAPI.get().then(response => {
      setSettingsTheme(response.data.theme);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (settingsTheme === 'auto') {
      // Detect OS theme preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setTheme(mediaQuery.matches ? 'dark' : 'light');

      // Listen for OS theme changes
      const handler = (e) => setTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);

      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setTheme(settingsTheme);
    }
  }, [settingsTheme]);

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const updateTheme = (newTheme) => {
    setSettingsTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, settingsTheme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
