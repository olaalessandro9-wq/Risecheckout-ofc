/**
 * usePixPaymentStatus - Hook para verificar status de pagamento PIX
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Responsabilidade ÚNICA: Polling e verificação de status multi-gateway
 * 
 * Arquitetura:
 * - Single Responsibility: Apenas gerencia polling e verificação de status
 * - Multi-Gateway Support: Mercado Pago, Asaas, Stripe, PushinPay
 * - Uses publicApi.call() for BFF pattern compliance
 * - Zero direct database access (RISE V3 compliant)
 * 
 * @module pix-payment/hooks
 */

import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { publicApi } from "@/lib/api/public-client";
import { toast } from "sonner";
import { getOrderForPaymentRpc } from "@/lib/rpc/rpcProxy";
import { createLogger } from "@/lib/logger";
import type { GatewayType, PaymentStatus, OrderDataFromRpc } from "../types";

// RISE V3: UTMify removido daqui - agora centralizado em PaymentSuccessPage

const log = createLogger("UsePixPaymentStatus");

interface UsePixPaymentStatusProps {
  gateway: GatewayType | null;
  orderId: string | undefined;
  pixId: string;
  orderData: OrderDataFromRpc | null;
  accessToken: string | undefined;
  qrCode: string;
  timeRemaining: number;
}

interface UsePixPaymentStatusReturn {
  paymentStatus: PaymentStatus;
  checkingPayment: boolean;
  checkStatus: () => Promise<{ paid: boolean }>;
  setPaymentStatus: (status: PaymentStatus) => void;
}

export function usePixPaymentStatus({
  gateway,
  orderId,
  pixId,
  orderData,
  accessToken,
  qrCode,
  timeRemaining,
}: UsePixPaymentStatusProps): UsePixPaymentStatusReturn {
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("waiting");
  const [checkingPayment, setCheckingPayment] = useState(false);

  const checkStatus = useCallback(async (): Promise<{ paid: boolean }> => {
    if (!orderId) {
      log.info("Sem orderId para verificar");
      return { paid: false };
    }

    setCheckingPayment(true);

    try {
      log.info("Verificando status:", { gateway, orderId });
      
      // Para Mercado Pago, Asaas ou Stripe: usar RPC proxy
      if (gateway === 'mercadopago' || gateway === 'asaas' || gateway === 'stripe') {
        const { data: order, error } = await getOrderForPaymentRpc(orderId, accessToken || '');

        if (error) {
          log.error(`Erro ao consultar status (${gateway}):`, error);
          throw new Error("Erro ao verificar status do pagamento");
        }

        log.info(`Status do pedido (${gateway}):`, order);

        const orderRecord = order as Record<string, unknown> | null;
        const status = (orderRecord?.status as string)?.toUpperCase();
        
        if (status === "PAID" || status === "APPROVED") {
          setPaymentStatus("paid");
          toast.success("Pagamento confirmado!");
          
          setTimeout(() => {
            navigate(`/success/${orderId}`);
          }, 2000);
          
          return { paid: true };
        }
        
        return { paid: false };
      }
      
      // Para PushinPay: usar Edge Function
      if (!pixId) {
        log.info("Sem pixId para verificar (PushinPay)");
        return { paid: false };
      }

      const { data, error } = await publicApi.call<{ 
        ok?: boolean; 
        error?: string; 
        status?: { status: string } 
      }>("pushinpay-get-status", { orderId });
      
      log.info("Resposta do pushinpay-get-status:", { data, error });

      if (error) {
        log.error("Erro ao consultar status:", error);
        throw new Error(error.message || "Erro ao conectar com o servidor");
      }

      if (data && data.ok === false) {
        log.error("Resposta de erro do backend:", data);
        
        const msg = (data.error || "").toString().toLowerCase();
        
        if (msg.includes("could not be found") || msg.includes("não foi gerado") || msg.includes("not found") || msg.includes("pending")) {
          log.info("PIX não encontrado ou pendente");
          return { paid: false };
        }
        
        throw new Error(data.error || "Erro desconhecido ao verificar pagamento");
      }

      if (data?.status?.status === "paid") {
        setPaymentStatus("paid");
        toast.success("Pagamento confirmado!");
        
        // RISE V3: UTMify agora é disparado na PaymentSuccessPage (SSOT)
        // Não disparamos aqui para evitar duplicação
        
        setTimeout(() => {
          navigate(`/success/${orderId}`);
        }, 2000);
        
        return { paid: true };
      } else if (data?.status?.status === "expired" || data?.status?.status === "canceled") {
        setPaymentStatus("expired");
        return { paid: false };
      }
      
      return { paid: false };
    } catch (err: unknown) {
      log.error("Erro capturado:", err);
      throw err;
    } finally {
      setCheckingPayment(false);
    }
  }, [gateway, pixId, orderId, orderData, accessToken, navigate]);

  // Polling automático a cada 5 segundos
  useEffect(() => {
    if (paymentStatus !== "waiting" || !qrCode || timeRemaining <= 0) {
      return;
    }

    log.info("Iniciando polling automático");

    const initialTimeout = setTimeout(() => {
      checkStatus().catch(err => {
        log.error("Erro no polling inicial:", err);
      });
    }, 5000);

    const pollingInterval = setInterval(() => {
      checkStatus().catch(err => {
        log.error("Erro no polling:", err);
      });
    }, 5000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(pollingInterval);
      log.info("Polling parado");
    };
  }, [paymentStatus, qrCode, timeRemaining, checkStatus]);

  return { paymentStatus, checkingPayment, checkStatus, setPaymentStatus };
}
