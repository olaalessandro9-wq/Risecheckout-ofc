/**
 * PixInstructions - Instruções de pagamento PIX
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Exibe as instruções passo a passo para realizar o pagamento PIX.
 * Usa design tokens semânticos para garantir visibilidade adequada
 * do texto dentro do card branco.
 * 
 * @module pix-payment/components
 */

export function PixInstructions() {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-[hsl(var(--payment-text-dark))]">Para realizar o pagamento:</h3>
      <ol className="space-y-3 text-[hsl(var(--payment-text-secondary))]">
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-[hsl(var(--payment-card-muted))] rounded-full flex items-center justify-center text-sm font-bold text-[hsl(var(--payment-text-dark))]">
            1
          </span>
          <span>Abra o aplicativo do seu banco.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-[hsl(var(--payment-card-muted))] rounded-full flex items-center justify-center text-sm font-bold text-[hsl(var(--payment-text-dark))]">
            2
          </span>
          <span>
            Escolha a opção PIX e cole o código ou use a câmera do celular para pagar com QR Code.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-[hsl(var(--payment-card-muted))] rounded-full flex items-center justify-center text-sm font-bold text-[hsl(var(--payment-text-dark))]">
            3
          </span>
          <span>Confirme as informações e finalize o pagamento.</span>
        </li>
      </ol>
    </div>
  );
}
