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
    
    // Notify Electron of theme change
    if (window.electron?.sendThemeChange) {
      window.electron.sendThemeChange(theme);
    }
  }, [theme]);

  const updateTheme = (newTheme) => {
    setSettingsTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setSettingsTheme(newTheme);
    
    // Notify Electron immediately
    if (window.electron?.sendThemeChange) {
      window.electron.sendThemeChange(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, settingsTheme, updateTheme, toggleTheme }}>
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
