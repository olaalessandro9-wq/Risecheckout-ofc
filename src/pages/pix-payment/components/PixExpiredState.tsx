/**
 * PixExpiredState - Estado de QR Code expirado
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Exibe mensagem de expiração e botão para gerar novo QR Code.
 * Usa design tokens semânticos para cores consistentes.
 * 
 * @module pix-payment/components
 */

import { Button } from "@/components/ui/button";

interface PixExpiredStateProps {
  onRegenerate: () => void;
}

export function PixExpiredState({ onRegenerate }: PixExpiredStateProps) {
  return (
    <div className="text-center space-y-4">
      <h2 className="text-2xl font-bold text-[hsl(var(--payment-text-dark))]">QR Code expirado</h2>
      <p className="text-[hsl(var(--payment-text-secondary))]">O tempo limite de 15 minutos foi atingido.</p>
      <Button onClick={onRegenerate} size="lg">
        Gerar novo QR Code
      </Button>
    </div>
  );
}
