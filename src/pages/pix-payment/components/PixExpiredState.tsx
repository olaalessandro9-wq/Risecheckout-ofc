/**
 * PixExpiredState - Estado de QR Code expirado
 */

import { Button } from "@/components/ui/button";

interface PixExpiredStateProps {
  onRegenerate: () => void;
}

export function PixExpiredState({ onRegenerate }: PixExpiredStateProps) {
  return (
    <div className="text-center space-y-4">
      <h2 className="text-2xl font-bold text-[hsl(var(--payment-card-text-primary))]">QR Code expirado</h2>
      <p className="text-[hsl(var(--payment-card-text-secondary))]">O tempo limite de 15 minutos foi atingido.</p>
      <Button onClick={onRegenerate} size="lg">
        Gerar novo QR Code
      </Button>
    </div>
  );
}
