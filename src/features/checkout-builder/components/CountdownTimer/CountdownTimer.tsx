import { useState, useEffect } from 'react';
import { AlarmClock } from 'lucide-react';

/**
 * CountdownTimer - Componente "Burro" de UI
 * 
 * Responsabilidade: Apenas renderizar um cronômetro regressivo.
 * NÃO conhece sobre: layout, posicionamento, preview mode, portal, etc.
 * 
 * Princípio aplicado: Separação de Responsabilidades (Vibe Coding)
 */

export interface CountdownTimerProps {
  // Configurações de tempo
  initialMinutes: number;
  initialSeconds: number;
  
  // Configurações visuais
  backgroundColor: string;
  textColor: string;
  activeText: string;
  finishedText: string;
  
  // Eventos
  onClick?: () => void;
  
  // Classes adicionais (para drag-and-drop, etc.)
  className?: string;
}

export const CountdownTimer = ({
  initialMinutes,
  initialSeconds,
  backgroundColor,
  textColor,
  activeText,
  finishedText,
  onClick,
  className = '',
}: CountdownTimerProps) => {
  // Estado interno: contagem do tempo
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60 + initialSeconds);
  const [isFinished, setIsFinished] = useState(false);

  // Efeito: gerenciar a contagem regressiva
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsFinished(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Cálculo de minutos e segundos para exibição
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Renderização: APENAS a UI do cronômetro
  // SEM lógica de posicionamento (fixed, sticky, portal, etc.)
  return (
    <div
      // Adicionado 'rounded-lg' para bordas arredondadas
      className={`w-full px-6 py-4 lg:py-5 flex items-center justify-center gap-3 shadow-md rounded-lg ${className}`}
      onClick={onClick}
      style={{ 
        backgroundColor, 
        color: textColor,
        minHeight: '72px',
        maxWidth: '100%',
      }}
    >
      {/* Tempo */}
      <span className="text-3xl lg:text-4xl font-bold tabular-nums flex-shrink-0">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>

      {/* Ícone */}
      <AlarmClock className="w-6 h-6 lg:w-7 lg:h-7 flex-shrink-0" style={{ color: textColor }} />

      {/* Texto */}
      {(isFinished ? finishedText : activeText) && (
        <span className="text-base lg:text-lg font-medium flex-1 min-w-0 break-words">
          {isFinished ? finishedText : activeText}
        </span>
      )}
    </div>
  );
};
