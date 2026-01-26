/**
 * useMercadoPagoTimer - Hook para timer de expiração
 * 
 * Single Responsibility: Gerenciamento do countdown timer.
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import type { PaymentStatus } from "../types";

interface UseMercadoPagoTimerProps {
  expiresAt: React.MutableRefObject<number>;
  currentStatus: PaymentStatus;
  hasQrCode: boolean;
  onExpire: () => void;
}

interface UseMercadoPagoTimerReturn {
  timeRemaining: number;
  formatTime: (seconds: number) => string;
}

export function useMercadoPagoTimer({
  expiresAt,
  currentStatus,
  hasQrCode,
  onExpire
}: UseMercadoPagoTimerProps): UseMercadoPagoTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState<number>(900); // 15 minutos
  const hasShownExpiredToast = useRef(false);

  // Formatar tempo restante
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Timer de expiração
  useEffect(() => {
    if (currentStatus !== "waiting" || !hasQrCode) {
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt.current - now) / 1000));
      
      setTimeRemaining(remaining);
      
      if (remaining === 0 && !hasShownExpiredToast.current) {
        hasShownExpiredToast.current = true;
        toast.error("QR Code expirado. Gere um novo para continuar.");
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStatus, hasQrCode, expiresAt, onExpire]);

  // Reset do toast flag quando status muda
  useEffect(() => {
    if (currentStatus === "waiting") {
      hasShownExpiredToast.current = false;
    }
  }, [currentStatus]);

  return {
    timeRemaining,
    formatTime
  };
}
