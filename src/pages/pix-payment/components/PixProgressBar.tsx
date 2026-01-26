/**
 * PixProgressBar - Barra de progresso com tempo restante
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Exibe o tempo restante para o pagamento expirar e uma barra visual
 * de progresso. Usa design tokens semânticos para cores consistentes.
 * 
 * @module pix-payment/components
 */

interface PixProgressBarProps {
  timeRemaining: number;
  progressPercentage: number;
  formatTime: (seconds: number) => string;
}

export function PixProgressBar({ timeRemaining, progressPercentage, formatTime }: PixProgressBarProps) {
  return (
    <div className="mb-8 p-4 bg-[hsl(var(--payment-card-muted))] rounded-lg">
      <p className="text-sm text-[hsl(var(--payment-text-secondary))] mb-2">
        Faltam <strong className="text-[hsl(var(--payment-text-dark))]">{formatTime(timeRemaining)}</strong> minutos para o pagamento expirar...
      </p>
      <div className="w-full bg-[hsl(var(--payment-progress-bg))] rounded-full h-2 overflow-hidden">
        <div
          className="bg-[hsl(var(--payment-progress-fill))] h-full transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
