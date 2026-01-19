/**
 * useMercadoPagoPaymentStatus - Hook para verificar status do pagamento
 * 
 * Single Responsibility: Polling de status via RPC.
 * @see RISE Protocol V3 - Zero console.log
 */

import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getOrderForPaymentRpc } from "@/lib/rpc/rpcProxy";
import type { PaymentStatus } from "../types";
import { createLogger } from "@/lib/logger";

const log = createLogger("MercadoPagoPaymentStatus");

interface UseMercadoPagoPaymentStatusProps {
  orderId: string | undefined;
  accessToken: string | undefined;
  currentStatus: PaymentStatus;
}

interface UseMercadoPagoPaymentStatusReturn {
  checkingPayment: boolean;
  checkPaymentStatus: () => Promise<{ paid: boolean }>;
}

export function useMercadoPagoPaymentStatus({
  orderId,
  accessToken,
  currentStatus
}: UseMercadoPagoPaymentStatusProps): UseMercadoPagoPaymentStatusReturn {
  const navigate = useNavigate();
  const [checkingPayment, setCheckingPayment] = useState(false);

  const checkPaymentStatus = useCallback(async (): Promise<{ paid: boolean }> => {
    if (!orderId) {
      log.warn("Sem orderId");
      return { paid: false };
    }

    setCheckingPayment(true);

    try {
      log.debug("Verificando status:", { orderId });
      
      const { data: order, error } = await getOrderForPaymentRpc(orderId, accessToken || '');
      
      log.debug("Status recebido:", { order, error });

      if (error) {
        log.error("Erro ao verificar status:", error);
        return { paid: false };
      }

      if (order?.status === "PAID" || order?.status === "paid") {
        toast.success("Pagamento confirmado!");
        return { paid: true };
      }

      return { paid: false };
    } catch (err: unknown) {
      log.error("Erro ao verificar status:", err);
      return { paid: false };
    } finally {
      setCheckingPayment(false);
    }
  }, [orderId, accessToken]);

  // Polling de status
  useEffect(() => {
    if (!orderId || currentStatus === "paid" || currentStatus === "expired") {
      return;
    }

    const interval = setInterval(async () => {
      const result = await checkPaymentStatus();
      if (result.paid) {
        clearInterval(interval);
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate(`/success/${orderId}`);
        }, 2000);
      }
    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(interval);
  }, [orderId, currentStatus, checkPaymentStatus, navigate]);

  return {
    checkingPayment,
    checkPaymentStatus
  };
}
