import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/providers/theme';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <button
      aria-label="Alternar tema"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground hover:opacity-80 transition"
      title={isDark ? 'Ir para tema claro' : 'Ir para tema escuro'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
