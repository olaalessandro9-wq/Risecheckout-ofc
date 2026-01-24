/**
 * PixProgressBar - Barra de progresso com tempo restante
 */

interface PixProgressBarProps {
  timeRemaining: number;
  progressPercentage: number;
  formatTime: (seconds: number) => string;
}

export function PixProgressBar({ timeRemaining, progressPercentage, formatTime }: PixProgressBarProps) {
  return (
    <div className="mb-8 p-4 bg-[hsl(var(--payment-card-bg-muted))] rounded-lg">
      <p className="text-sm text-[hsl(var(--payment-card-text-secondary))] mb-2">
        Faltam <strong>{formatTime(timeRemaining)}</strong> minutos para o pagamento expirar...
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
