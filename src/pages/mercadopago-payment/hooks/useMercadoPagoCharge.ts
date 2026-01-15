/**
 * useMercadoPagoCharge - Hook para criar pagamento PIX via MercadoPago
 * 
 * Single Responsibility: Criação de pagamento via Edge Function.
 * RISE Protocol V2 Compliant (~90 linhas).
 */

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MercadoPagoOrderData, CreatePaymentResult } from "../types";

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
      console.log("[useMercadoPagoCharge] Criando pagamento:", { 
        orderId, 
        amount: orderData.amount_cents / 100 
      });

      const { data, error } = await supabase.functions.invoke("mercadopago-create-payment", {
        body: { 
          orderId,
          amount: orderData.amount_cents / 100,
          payerEmail: orderData.customer_email,
          payerName: orderData.customer_name,
          paymentMethod: orderData.payment_method || 'pix'
        },
      });

      if (error) {
        console.error("[useMercadoPagoCharge] Erro:", error);
        throw new Error(error.message || "Erro ao criar pagamento");
      }

      if (!data?.success) {
        console.error("[useMercadoPagoCharge] Resposta não OK:", data);
        throw new Error(data?.error || "Erro ao criar pagamento");
      }

      if (!data?.data?.paymentId) {
        throw new Error("Dados do pagamento não retornados");
      }

      const paymentData = data.data;
      console.log("[useMercadoPagoCharge] ✅ Pagamento criado:", paymentData);
      
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
      console.error("[useMercadoPagoCharge] ❌ Erro:", errorMessage);
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
