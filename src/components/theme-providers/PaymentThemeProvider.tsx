/**
 * PaymentThemeProvider
 * 
 * Provider de tema exclusivo para páginas de pagamento (PIX, Boleto, etc).
 * Garante que PixPaymentPage, MercadoPagoPaymentPage usem o tema escuro
 * e tenham acesso às variáveis CSS semânticas definidas em index.css.
 * 
 * @module theme-providers
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * @architectural-decision
 * Este componente padroniza o visual das páginas de pagamento com
 * fundo escuro e card branco central.
 */

interface PaymentThemeProviderProps {
  children: React.ReactNode;
}

export function PaymentThemeProvider({ children }: PaymentThemeProviderProps) {
  return (
    <div 
      className="min-h-screen bg-[hsl(var(--payment-bg))]"
      data-theme="payment"
    >
      {children}
    </div>
  );
}
