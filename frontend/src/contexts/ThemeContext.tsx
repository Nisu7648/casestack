import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'black' | 'white';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('casestack-theme');
    return (saved === 'white' ? 'white' : 'black') as Theme;
  });

  useEffect(() => {
    localStorage.setItem('casestack-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    // Apply theme colors to root
    if (theme === 'black') {
      document.documentElement.style.setProperty('--bg-primary', '#000000');
      document.documentElement.style.setProperty('--bg-secondary', '#0A0A0A');
      document.documentElement.style.setProperty('--bg-card', '#141414');
      document.documentElement.style.setProperty('--border-color', '#1F1F1F');
      document.documentElement.style.setProperty('--text-primary', '#FFFFFF');
      document.documentElement.style.setProperty('--text-secondary', '#A3A3A3');
      document.documentElement.style.setProperty('--text-tertiary', '#737373');
      document.documentElement.style.setProperty('--accent', '#FFFFFF');
    } else {
      document.documentElement.style.setProperty('--bg-primary', '#FFFFFF');
      document.documentElement.style.setProperty('--bg-secondary', '#FAFAFA');
      document.documentElement.style.setProperty('--bg-card', '#FFFFFF');
      document.documentElement.style.setProperty('--border-color', '#E5E5E5');
      document.documentElement.style.setProperty('--text-primary', '#000000');
      document.documentElement.style.setProperty('--text-secondary', '#525252');
      document.documentElement.style.setProperty('--text-tertiary', '#A3A3A3');
      document.documentElement.style.setProperty('--accent', '#000000');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'black' ? 'white' : 'black');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
