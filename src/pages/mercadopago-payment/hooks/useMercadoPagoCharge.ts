/**
 * useMercadoPagoCharge - Hook para criar pagamento PIX via MercadoPago
 * 
 * Single Responsibility: Criação de pagamento via Edge Function.
 * 
 * @version 3.0.0 - RISE Protocol V3 - Zero console.log
 */

import { useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import type { MercadoPagoOrderData, CreatePaymentResult } from "../types";

const log = createLogger("MPCharge");

interface UseMercadoPagoChargeProps {
  orderId: string | undefined;
}

interface UseMercadoPagoChargeReturn {
  qrCode: string;
  qrCodeBase64: string;
  paymentId: string;
  loading: boolean;
  expiresAt: React.MutableRefObject<number>;
  createPayment: (orderData: MercadoPagoOrderData) => Promise<CreatePaymentResult>;
  resetCharge: () => void;
}

interface MercadoPagoPaymentResponse {
  success: boolean;
  data?: {
    paymentId: string;
    pix?: {
      qrCode?: string;
      qrCodeBase64?: string;
    };
  };
  error?: string;
}

export function useMercadoPagoCharge({
  orderId
}: UseMercadoPagoChargeProps): UseMercadoPagoChargeReturn {
  const [qrCode, setQrCode] = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [loading, setLoading] = useState(false);
  const expiresAt = useRef<number>(0);

  const resetCharge = useCallback(() => {
    setQrCode("");
    setQrCodeBase64("");
    setPaymentId("");
    expiresAt.current = 0;
  }, []);

  const createPayment = useCallback(async (orderData: MercadoPagoOrderData): Promise<CreatePaymentResult> => {
    if (!orderId) {
      return { success: false, error: "ID do pedido não fornecido" };
    }

    setLoading(true);

    try {
      log.debug("Criando pagamento:", { orderId, amount: orderData.amount_cents / 100 });

      const { data, error } = await api.publicCall<MercadoPagoPaymentResponse>("mercadopago-create-payment", { 
        orderId,
        amount: orderData.amount_cents / 100,
        payerEmail: orderData.customer_email,
        payerName: orderData.customer_name,
        paymentMethod: orderData.payment_method || 'pix'
      });

      if (error) {
        log.error("Erro:", error);
        throw new Error(error.message || "Erro ao criar pagamento");
      }

      if (!data?.success) {
        log.error("Resposta não OK:", data);
        throw new Error(data?.error || "Erro ao criar pagamento");
      }

      if (!data?.data?.paymentId) {
        throw new Error("Dados do pagamento não retornados");
      }

      const paymentData = data.data;
      log.info("✅ Pagamento criado:", paymentData);
      
      setPaymentId(paymentData.paymentId.toString());
      
      if (paymentData.pix) {
        setQrCode(paymentData.pix.qrCode || "");
        setQrCodeBase64(paymentData.pix.qrCodeBase64 || "");
      }
      
      // Expiração em 15 minutos
      expiresAt.current = Date.now() + 15 * 60 * 1000;
      
      toast.success("QR Code gerado com sucesso!");
      
      return {
        success: true,
        paymentId: paymentData.paymentId.toString(),
        qrCode: paymentData.pix?.qrCode,
        qrCodeBase64: paymentData.pix?.qrCodeBase64
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao gerar QR Code";
      log.error("❌ Erro:", errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  return {
    qrCode,
    qrCodeBase64,
    paymentId,
    loading,
    expiresAt,
    createPayment,
    resetCharge
  };
}
