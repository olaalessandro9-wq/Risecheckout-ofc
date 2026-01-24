/**
 * SuccessThemeProvider
 * 
 * Provider de tema exclusivo para páginas de sucesso de pagamento.
 * Garante que PaymentSuccessPage use o tema escuro premium
 * e tenham acesso às variáveis CSS semânticas definidas em index.css.
 * 
 * @module theme-providers
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * @architectural-decision
 * Este componente padroniza o visual das páginas de confirmação
 * com o estilo dark premium do RiseCheckout.
 */

interface SuccessThemeProviderProps {
  children: React.ReactNode;
}

export function SuccessThemeProvider({ children }: SuccessThemeProviderProps) {
  return (
    <div 
      className="min-h-screen bg-[hsl(var(--success-bg))] flex items-center justify-center p-4"
      data-theme="success"
    >
      {children}
    </div>
  );
}
