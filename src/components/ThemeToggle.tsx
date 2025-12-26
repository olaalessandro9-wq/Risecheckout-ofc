import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/providers/theme';
import { cn } from '@/lib/utils';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <button
      aria-label="Alternar tema"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300",
        "border border-border",
        isDark ? "bg-muted" : "bg-muted/60"
      )}
      title={isDark ? 'Ir para tema claro' : 'Ir para tema escuro'}
    >
      {/* Track icons */}
      <span className="absolute left-1.5 flex h-5 w-5 items-center justify-center">
        <Sun className={cn(
          "h-3.5 w-3.5 transition-opacity duration-200",
          isDark ? "opacity-40 text-muted-foreground" : "opacity-0"
        )} />
      </span>
      <span className="absolute right-1.5 flex h-5 w-5 items-center justify-center">
        <Moon className={cn(
          "h-3.5 w-3.5 transition-opacity duration-200",
          isDark ? "opacity-0" : "opacity-40 text-muted-foreground"
        )} />
      </span>
      
      {/* Sliding indicator */}
      <span
        className={cn(
          "absolute flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-sm transition-transform duration-300",
          isDark ? "translate-x-7" : "translate-x-1"
        )}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500" />
        )}
      </span>
    </button>
  );
}
