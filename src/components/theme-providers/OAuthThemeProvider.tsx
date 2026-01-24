/**
 * OAuthThemeProvider
 * 
 * Provider de tema exclusivo para páginas OAuth (sucesso de conexão).
 * Garante que OAuthSuccess use o tema escuro com verde vibrante
 * e tenham acesso às variáveis CSS semânticas definidas em index.css.
 * 
 * @module theme-providers
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * @architectural-decision
 * Este componente padroniza o visual das páginas de callback OAuth
 * com feedback visual claro de sucesso.
 */

interface OAuthThemeProviderProps {
  children: React.ReactNode;
}

export function OAuthThemeProvider({ children }: OAuthThemeProviderProps) {
  return (
    <div 
      className="min-h-screen bg-[hsl(var(--success-bg))] flex items-center justify-center p-4"
      data-theme="oauth"
    >
      {children}
    </div>
  );
}
