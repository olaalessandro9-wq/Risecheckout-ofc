/**
 * useMercadoPagoPaymentStatus - Hook para verificar status do pagamento
 * 
 * Single Responsibility: Polling de status via RPC.
 * RISE Protocol V2 Compliant (~80 linhas).
 */

import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getOrderForPaymentRpc } from "@/lib/rpc/rpcProxy";
import type { PaymentStatus } from "../types";

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
      console.log("[useMercadoPagoPaymentStatus] ⚠️ Sem orderId");
      return { paid: false };
    }

    setCheckingPayment(true);

    try {
      console.log("[useMercadoPagoPaymentStatus] 🔍 Verificando status:", { orderId });
      
      const { data: order, error } = await getOrderForPaymentRpc(orderId, accessToken || '');
      
      console.log("[useMercadoPagoPaymentStatus] 📡 Status:", { order, error });

      if (error) {
        console.error("[useMercadoPagoPaymentStatus] ❌ Erro:", error);
        return { paid: false };
      }

      if (order?.status === "PAID" || order?.status === "paid") {
        toast.success("Pagamento confirmado!");
        return { paid: true };
      }

      return { paid: false };
    } catch (err: unknown) {
      console.error("[useMercadoPagoPaymentStatus] ❌ Erro:", err);
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
