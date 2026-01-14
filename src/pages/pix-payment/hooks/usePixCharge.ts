/**
 * usePixCharge - Hook para criar cobrança PIX via PushinPay
 * 
 * Responsabilidade ÚNICA: Criar cobrança PIX e gerenciar QR code
 */

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { OrderDataFromRpc, PixNavigationState } from "../types";

interface UsePixChargeReturn {
  qrCode: string;
  qrCodeImageBase64: string | null;
  pixId: string;
  loading: boolean;
  createCharge: () => Promise<void>;
  setQrCode: (qrCode: string) => void;
  setQrCodeImageBase64: (base64: string | null) => void;
  expiresAt: React.MutableRefObject<number>;
}

export function usePixCharge(
  orderId: string | undefined,
  orderData: OrderDataFromRpc | null,
  navState: PixNavigationState | null
): UsePixChargeReturn {
  const [qrCode, setQrCode] = useState("");
  const [qrCodeImageBase64, setQrCodeImageBase64] = useState<string | null>(null);
  const [pixId, setPixId] = useState("");
  const [loading, setLoading] = useState(true);
  
  const expiresAt = useRef<number>(0);

  const createCharge = useCallback(async () => {
    // Se já tem QR code (veio do Mercado Pago/Asaas/Stripe), não criar novamente
    if (qrCode) {
      console.log("[usePixCharge] QR code já existe, não criando novo");
      return;
    }
    
    if (!orderId || !orderData) {
      console.log("[usePixCharge] Aguardando dados:", { orderId, orderData: !!orderData });
      return;
    }

    setLoading(true);

    try {
      console.log("[usePixCharge] Criando cobrança PIX via PushinPay:", { 
        orderId, 
        valueInCents: orderData.amount_cents,
      });

      const { data, error } = await supabase.functions.invoke("pushinpay-create-pix", {
        body: { orderId, valueInCents: orderData.amount_cents },
      });

      console.log("[usePixCharge] Resposta da Edge Function:", { data, error });

      if (error) {
        console.error("[usePixCharge] Erro da Edge Function:", error);
        throw new Error(error.message || "Erro ao criar cobrança PIX");
      }

      if (!data?.ok) {
        console.error("[usePixCharge] Resposta não OK:", data);
        throw new Error(data?.error || "Erro ao criar cobrança PIX");
      }

      if (!data?.pix) {
        console.error("[usePixCharge] Sem dados do PIX:", data);
        throw new Error("Dados do PIX não retornados");
      }

      const { pix } = data;
      console.log("[usePixCharge] PIX criado com sucesso:", pix);
      
      setPixId(pix.id || pix.pix_id || "");
      setQrCode(pix.qr_code || pix.qrcode || pix.emv || "");
      
      // Definir expiração em 15 minutos
      expiresAt.current = Date.now() + 15 * 60 * 1000;
      
      setLoading(false);
      toast.success("QR Code gerado com sucesso!");
    } catch (err: unknown) {
      console.error("[usePixCharge] Erro ao criar PIX:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao gerar QR Code");
      setLoading(false);
    }
  }, [orderId, orderData, qrCode]);

  return { 
    qrCode, 
    qrCodeImageBase64, 
    pixId, 
    loading, 
    createCharge,
    setQrCode,
    setQrCodeImageBase64,
    expiresAt
  };
}
