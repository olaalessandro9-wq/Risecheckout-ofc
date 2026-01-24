/**
 * LandingThemeProvider
 * 
 * Provider de tema exclusivo para a Landing Page.
 * Garante que todos os componentes da landing usem o tema escuro
 * e tenham acesso às variáveis CSS semânticas definidas em index.css.
 * 
 * @architectural-decision
 * Este componente resolve o conflito entre o tema claro padrão do app
 * e o tema escuro da landing page, garantindo que componentes como
 * Button com variant="outline" funcionem corretamente.
 */

interface LandingThemeProviderProps {
  children: React.ReactNode;
}

export function LandingThemeProvider({ children }: LandingThemeProviderProps) {
  return (
    <div 
      className="dark min-h-screen bg-[hsl(var(--landing-bg))] text-[hsl(var(--landing-text-primary))] overflow-x-hidden selection:bg-[hsl(var(--landing-accent)/0.3)] selection:text-white"
      data-theme="landing"
    >
      {children}
    </div>
  );
}
