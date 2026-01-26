/**
 * usePixPaymentStatus - Hook para verificar status de pagamento PIX
 * 
 * MIGRATED: Uses api.publicCall() instead of supabase.functions.invoke()
 * 
 * Responsabilidade ÚNICA: Polling e verificação de status multi-gateway
 */

import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { publicApi } from "@/lib/api/public-client";
import { toast } from "sonner";
import { getOrderForPaymentRpc } from "@/lib/rpc/rpcProxy";
import { sendUTMifyConversion, formatDateForUTMify } from "@/lib/utmify-helper";
import { createLogger } from "@/lib/logger";
import type { GatewayType, PaymentStatus, OrderDataFromRpc } from "../types";

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
        
        // Enviar conversão UTMify
        if (orderData) {
          const productsArray = orderData.product ? [{
            id: orderData.product.id,
            name: orderData.product.name,
            priceInCents: orderData.amount_cents || 0,
            quantity: 1
          }] : [];
          
          const productId = orderData.product?.id || orderData.product_id || null;
          
          log.info("Enviando conversão UTMify:", productId, productsArray);
          
          sendUTMifyConversion(
            orderData.vendor_id,
            {
              orderId: orderId,
              paymentMethod: "pix",
              status: "paid",
              createdAt: formatDateForUTMify(orderData.created_at || new Date()),
              approvedDate: formatDateForUTMify(new Date()),
              refundedAt: null,
              customer: {
                name: orderData.customer_name || "",
                email: orderData.customer_email || "",
                phone: orderData.customer_phone || null,
                document: orderData.customer_document || null,
                country: "BR",
                ip: "0.0.0.0"
              },
              products: productsArray,
              trackingParameters: orderData.tracking_parameters || {},
              totalPriceInCents: orderData.amount_cents || 0,
              commission: {
                totalPriceInCents: orderData.amount_cents || 0,
                gatewayFeeInCents: 0,
                userCommissionInCents: orderData.amount_cents || 0,
                currency: "BRL"
              },
              isTest: false
            },
            "purchase_approved",
            productId
          ).catch(err => {
            log.error("Não foi possível atualizar status UTMify:", err);
          });
        }
        
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
