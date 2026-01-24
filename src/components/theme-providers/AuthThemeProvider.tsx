/**
 * AuthThemeProvider
 * 
 * Provider de tema exclusivo para páginas de autenticação.
 * Garante que Auth, Cadastro, RecuperarSenha, etc. usem o tema escuro
 * e tenham acesso às variáveis CSS semânticas definidas em index.css.
 * 
 * @module theme-providers
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * @architectural-decision
 * Este componente resolve o conflito entre o tema claro padrão do app
 * e o tema escuro das páginas de autenticação.
 */

interface AuthThemeProviderProps {
  children: React.ReactNode;
}

export function AuthThemeProvider({ children }: AuthThemeProviderProps) {
  return (
    <div 
      className="dark min-h-screen w-full bg-[hsl(var(--auth-bg))] text-[hsl(var(--auth-text-secondary))] overflow-hidden relative"
      data-theme="auth"
    >
      {children}
    </div>
  );
}
