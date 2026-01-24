/**
 * PixInstructions - Instruções de pagamento PIX
 */

export function PixInstructions() {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-[hsl(var(--payment-card-text-primary))]">Para realizar o pagamento:</h3>
      <ol className="space-y-3 text-[hsl(var(--payment-card-text-secondary))]">
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-[hsl(var(--payment-card-bg-muted))] rounded-full flex items-center justify-center text-sm font-bold">
            1
          </span>
          <span>Abra o aplicativo do seu banco.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-[hsl(var(--payment-card-bg-muted))] rounded-full flex items-center justify-center text-sm font-bold">
            2
          </span>
          <span>
            Escolha a opção PIX e cole o código ou use a câmera do celular para pagar com QR Code.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-[hsl(var(--payment-card-bg-muted))] rounded-full flex items-center justify-center text-sm font-bold">
            3
          </span>
          <span>Confirme as informações e finalize o pagamento.</span>
        </li>
      </ol>
    </div>
  );
}
