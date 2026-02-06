/**
 * LegalThemeProvider
 * 
 * Provider de tema exclusivo para páginas legais (termos, políticas).
 * Garante que LegalHub e LegalPageLayout usem o tema escuro
 * e tenham acesso às variáveis CSS semânticas definidas em index.css.
 * 
 * @module theme-providers
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * @architectural-decision
 * Este componente cria uma BARREIRA OPACA entre o body (tema claro/escuro)
 * e o conteúdo das páginas legais, impedindo que o background do body
 * sangre através de qualquer backdrop-filter nos elementos filhos.
 * Segue o padrão exato de AuthThemeProvider, PaymentThemeProvider,
 * SuccessThemeProvider e OAuthThemeProvider.
 */

interface LegalThemeProviderProps {
  children: React.ReactNode;
}

export function LegalThemeProvider({ children }: LegalThemeProviderProps) {
  return (
    <div 
      className="min-h-screen w-full bg-[hsl(var(--legal-bg))] overflow-x-hidden"
      data-theme="legal"
    >
      {children}
    </div>
  );
}
