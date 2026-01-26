/**
 * PixLoadingState - Estado de loading do pagamento PIX
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Responsabilidade ÚNICA: Exibir estado de carregamento durante geração do PIX
 * 
 * Design Tokens:
 * - --payment-bg: Fundo escuro da página
 * - --payment-text-primary: Texto branco para fundo escuro
 * 
 * @module pix-payment/components
 */

export function PixLoadingState() {
  return (
    <div className="min-h-screen bg-[hsl(var(--payment-bg))] flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--payment-text-primary))]" />
        <p className="text-[hsl(var(--payment-text-primary))]">Gerando código PIX...</p>
      </div>
    </div>
  );
}
