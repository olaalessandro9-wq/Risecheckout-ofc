import * as React from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    // Inicializar tema do localStorage ou usar 'light' como padrão
    try {
      const stored = localStorage.getItem('theme');
      return (stored === 'dark' || stored === 'light') ? stored : 'light';
    } catch {
      return 'light';
    }
  });

  // Aplicar tema ao documentElement e salvar no localStorage
  React.useEffect(() => {
    try {
      // Remover ambas as classes e adicionar a correta
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      
      // Salvar no localStorage
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.warn('Theme apply error:', e);
    }
  }, [theme]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const value = React.useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    // Fallback seguro caso seja usado fora do provider
    return {
      theme: 'light' as Theme,
      setTheme: () => {},
    };
  }
  return context;
}
