/**
 * usePixTimer - Hook para gerenciar timer de expiração do PIX
 * 
 * Responsabilidade ÚNICA: Countdown de 15 minutos com lógica de visibilidade
 * 
 * Regras:
 * - Acima de 8 minutos: conta sempre
 * - Abaixo de 8 minutos: pausa quando página oculta
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import type { PaymentStatus } from "../types";

interface UsePixTimerProps {
  paymentStatus: PaymentStatus;
  onExpire?: () => void;
}

interface UsePixTimerReturn {
  timeRemaining: number;
  formatTime: (seconds: number) => string;
  progressPercentage: number;
  resetTimer: () => void;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
}

const INITIAL_TIME = 900; // 15 minutos
const VISIBILITY_THRESHOLD = 480; // 8 minutos

export function usePixTimer({ paymentStatus, onExpire }: UsePixTimerProps): UsePixTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(INITIAL_TIME);
  const hasShownExpiredToast = useRef(false);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const resetTimer = useCallback(() => {
    setTimeRemaining(INITIAL_TIME);
    hasShownExpiredToast.current = false;
  }, []);

  const progressPercentage = (timeRemaining / INITIAL_TIME) * 100;

  // Countdown com lógica de visibilidade
  useEffect(() => {
    if (timeRemaining <= 0 || paymentStatus !== "waiting") return;

    let intervalRef: NodeJS.Timeout | null = null;

    const startCountdown = () => {
      if (intervalRef) return;
      
      intervalRef = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          
          if (newTime <= 0) {
            if (!hasShownExpiredToast.current) {
              toast.error("QR Code expirado!");
              hasShownExpiredToast.current = true;
            }
            onExpire?.();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    };

    const pauseCountdown = () => {
      if (intervalRef) {
        clearInterval(intervalRef);
        intervalRef = null;
      }
    };

    const handleVisibilityChange = () => {
      // Só pausa se estiver ABAIXO de 8 minutos
      if (timeRemaining <= VISIBILITY_THRESHOLD) {
        if (document.hidden) {
          pauseCountdown();
        } else {
          if (timeRemaining > 0 && paymentStatus === "waiting") {
            startCountdown();
          }
        }
      }
    };

    // Iniciar contador baseado na visibilidade
    if (timeRemaining > VISIBILITY_THRESHOLD) {
      startCountdown();
    } else {
      if (!document.hidden) {
        startCountdown();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      pauseCountdown();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [timeRemaining, paymentStatus, onExpire]);

  return { 
    timeRemaining, 
    formatTime, 
    progressPercentage, 
    resetTimer,
    setTimeRemaining
  };
}
