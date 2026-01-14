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
    <div className="mb-8 p-4 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-700 mb-2">
        Faltam <strong>{formatTime(timeRemaining)}</strong> minutos para o pagamento expirar...
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gray-900 h-full transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
